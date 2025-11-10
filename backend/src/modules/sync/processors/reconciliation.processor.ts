import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReconciliationService } from '../services/reconciliation.service';
import { SyncJobStatus, Marketplace } from '@prisma/client';

@Processor('reconciliation')
export class ReconciliationProcessor {
  private logger = new Logger(ReconciliationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private reconciliationService: ReconciliationService,
  ) {}

  @Process('reconcile')
  async handleReconciliation(job: Job) {
    const { jobId, marketplace, accountId, options } = job.data;

    this.logger.log(`Processing reconciliation job ${jobId} for ${marketplace}`);

    try {
      await this.updateJobStatus(jobId, SyncJobStatus.PROCESSING);

      // Executa reconciliação
      const report = await this.reconciliationService.reconcile(
        marketplace,
        accountId,
        options.options,
      );

      // Salva relatório no meta do job
      await this.prisma.syncJob.update({
        where: { id: jobId },
        data: {
          meta: {
            ...options,
            report,
          },
        },
      });

      await this.updateJobStatus(jobId, SyncJobStatus.COMPLETED, {
        processedItems: report.totalChecked,
        failedItems: report.summary.critical,
        totalItems: report.totalChecked,
      });

      this.logger.log(
        `Reconciliation job ${jobId} completed: ${report.differences.length} differences found`,
      );

      return report;
    } catch (error) {
      this.logger.error(`Reconciliation job ${jobId} failed:`, error);

      await this.updateJobStatus(jobId, SyncJobStatus.FAILED, {
        error: (error as Error).message,
      });

      throw error;
    }
  }

  private async updateJobStatus(jobId: string, status: SyncJobStatus, data?: any) {
    const updateData: any = { status };

    if (status === SyncJobStatus.PROCESSING) {
      updateData.startedAt = new Date();
    }

    if (status === SyncJobStatus.COMPLETED || status === SyncJobStatus.FAILED) {
      updateData.finishedAt = new Date();
    }

    if (data) {
      Object.assign(updateData, data);
    }

    return this.prisma.syncJob.update({
      where: { id: jobId },
      data: updateData,
    });
  }
}
