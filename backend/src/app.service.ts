import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): object {
    return {
      status: 'ok',
      message: 'ERP Backend API está funcionando',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
