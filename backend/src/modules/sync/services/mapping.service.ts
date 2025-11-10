import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Marketplace } from '@prisma/client';
import {
  ProductMappingDto,
  CategoryMappingDto,
} from '../dto/sync.dto';

@Injectable()
export class MappingService {
  private logger = new Logger(MappingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cria/atualiza mapeamento de produto para marketplace
   */
  async upsertProductMapping(
    productId: string,
    marketplace: Marketplace,
    data: ProductMappingDto,
  ) {
    this.logger.log(`Upserting product mapping for ${productId} on ${marketplace}`);

    return this.prisma.productMapping.upsert({
      where: {
        productId_marketplace: {
          productId,
          marketplace,
        },
      },
      create: {
        productId,
        marketplace,
        externalCategoryId: data.externalCategoryId,
        attributeMapping: data.attributeMapping || {},
        priceAdjustment: data.priceAdjustment || 0,
        autoSync: data.autoSync ?? true,
        syncStock: data.syncStock ?? true,
        syncPrice: data.syncPrice ?? true,
      },
      update: {
        externalCategoryId: data.externalCategoryId,
        attributeMapping: data.attributeMapping,
        priceAdjustment: data.priceAdjustment,
        autoSync: data.autoSync,
        syncStock: data.syncStock,
        syncPrice: data.syncPrice,
      },
    });
  }

  /**
   * Busca mapeamento de produto
   */
  async getProductMapping(productId: string, marketplace: Marketplace) {
    return this.prisma.productMapping.findUnique({
      where: {
        productId_marketplace: {
          productId,
          marketplace,
        },
      },
      include: {
        product: true,
      },
    });
  }

  /**
   * Lista todos os mapeamentos de um produto
   */
  async getProductMappings(productId: string) {
    return this.prisma.productMapping.findMany({
      where: { productId },
      include: {
        product: true,
      },
    });
  }

  /**
   * Lista mapeamentos por marketplace
   */
  async getMarketplaceMappings(marketplace: Marketplace) {
    return this.prisma.productMapping.findMany({
      where: { marketplace },
      include: {
        product: true,
      },
    });
  }

  /**
   * Deleta mapeamento de produto
   */
  async deleteProductMapping(productId: string, marketplace: Marketplace) {
    return this.prisma.productMapping.delete({
      where: {
        productId_marketplace: {
          productId,
          marketplace,
        },
      },
    });
  }

  /**
   * Cria/atualiza mapeamento de categoria
   */
  async upsertCategoryMapping(
    localCategoryId: string,
    marketplace: Marketplace,
    data: CategoryMappingDto,
  ) {
    this.logger.log(`Upserting category mapping for ${localCategoryId} on ${marketplace}`);

    return this.prisma.categoryMapping.upsert({
      where: {
        localCategoryId_marketplace: {
          localCategoryId,
          marketplace,
        },
      },
      create: {
        localCategoryId,
        marketplace,
        externalCategoryId: data.externalCategoryId,
        externalCategoryName: data.externalCategoryName,
        attributesSchema: data.attributesSchema || {},
        attributeMapping: data.attributeMapping || {},
      },
      update: {
        externalCategoryId: data.externalCategoryId,
        externalCategoryName: data.externalCategoryName,
        attributesSchema: data.attributesSchema,
        attributeMapping: data.attributeMapping,
      },
    });
  }

  /**
   * Busca mapeamento de categoria
   */
  async getCategoryMapping(localCategoryId: string, marketplace: Marketplace) {
    return this.prisma.categoryMapping.findUnique({
      where: {
        localCategoryId_marketplace: {
          localCategoryId,
          marketplace,
        },
      },
    });
  }

  /**
   * Lista mapeamentos de categoria por marketplace
   */
  async getCategoryMappings(marketplace: Marketplace) {
    return this.prisma.categoryMapping.findMany({
      where: { marketplace },
    });
  }

  /**
   * Deleta mapeamento de categoria
   */
  async deleteCategoryMapping(localCategoryId: string, marketplace: Marketplace) {
    return this.prisma.categoryMapping.delete({
      where: {
        localCategoryId_marketplace: {
          localCategoryId,
          marketplace,
        },
      },
    });
  }

  /**
   * Busca regras de preço ativas para um marketplace
   */
  async getPriceRules(marketplace?: Marketplace) {
    return this.prisma.priceRule.findMany({
      where: {
        enabled: true,
        ...(marketplace && { marketplace }),
      },
      orderBy: {
        priority: 'asc',
      },
    });
  }

  /**
   * Cria regra de preço
   */
  async createPriceRule(data: {
    name: string;
    marketplace?: Marketplace;
    formula: any;
    conditions?: any;
    priority?: number;
  }) {
    return this.prisma.priceRule.create({
      data: {
        name: data.name,
        marketplace: data.marketplace,
        formula: data.formula,
        conditions: data.conditions,
        priority: data.priority || 0,
        enabled: true,
      },
    });
  }

  /**
   * Atualiza regra de preço
   */
  async updatePriceRule(
    ruleId: string,
    data: {
      name?: string;
      formula?: any;
      conditions?: any;
      priority?: number;
      enabled?: boolean;
    },
  ) {
    return this.prisma.priceRule.update({
      where: { id: ruleId },
      data,
    });
  }

  /**
   * Deleta regra de preço
   */
  async deletePriceRule(ruleId: string) {
    return this.prisma.priceRule.delete({
      where: { id: ruleId },
    });
  }

  /**
   * Aplica ajustes de preço baseado em mapeamentos e regras
   */
  async calculateAdjustedPrice(
    productId: string,
    marketplace: Marketplace,
    basePrice: number,
  ): Promise<number> {
    // Busca mapeamento do produto
    const mapping = await this.getProductMapping(productId, marketplace);

    let adjustedPrice = basePrice;

    // Aplica ajuste do mapeamento
    if (mapping && mapping.priceAdjustment) {
      adjustedPrice += mapping.priceAdjustment;
    }

    // Busca regras de preço aplicáveis
    const rules = await this.getPriceRules(marketplace);

    for (const rule of rules) {
      // Verifica condições
      if (rule.conditions && !this.evaluateConditions(rule.conditions, { productId, basePrice })) {
        continue;
      }

      // Aplica fórmula
      adjustedPrice = this.applyPriceFormula(adjustedPrice, rule.formula);
    }

    return Math.max(0, adjustedPrice); // Nunca retorna preço negativo
  }

  /**
   * Avalia condições de uma regra
   */
  private evaluateConditions(conditions: any, context: any): boolean {
    // Exemplo: { minPrice: 100, maxPrice: 500 }
    if (conditions.minPrice && context.basePrice < conditions.minPrice) {
      return false;
    }

    if (conditions.maxPrice && context.basePrice > conditions.maxPrice) {
      return false;
    }

    return true;
  }

  /**
   * Aplica fórmula de preço
   */
  private applyPriceFormula(currentPrice: number, formula: any): number {
    // Exemplos de fórmulas:
    // { type: 'markup', value: 20 } -> 20% de markup
    // { type: 'fixed', value: 10 } -> adiciona R$ 10
    // { type: 'percentage', value: 15 } -> adiciona 15%

    switch (formula.type) {
      case 'markup':
        return currentPrice * (1 + formula.value / 100);

      case 'fixed':
        return currentPrice + formula.value;

      case 'percentage':
        return currentPrice * (1 + formula.value / 100);

      default:
        return currentPrice;
    }
  }

  /**
   * Busca produtos sem mapeamento para um marketplace
   */
  async getUnmappedProducts(marketplace: Marketplace, limit = 50) {
    const products = await this.prisma.product.findMany({
      where: {
        active: true,
        productMappings: {
          none: {
            marketplace,
          },
        },
      },
      take: limit,
    });

    return products;
  }

  /**
   * Estatísticas de mapeamento
   */
  async getMappingStats(marketplace: Marketplace) {
    const [
      totalProducts,
      mappedProducts,
      totalCategories,
      mappedCategories,
      activeRules,
    ] = await Promise.all([
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.productMapping.count({ where: { marketplace } }),
      // Assumindo que existe tabela Category (não está no schema atual)
      0, // this.prisma.category.count()
      this.prisma.categoryMapping.count({ where: { marketplace } }),
      this.prisma.priceRule.count({ where: { marketplace, enabled: true } }),
    ]);

    return {
      products: {
        total: totalProducts,
        mapped: mappedProducts,
        unmapped: totalProducts - mappedProducts,
        percentage: totalProducts > 0 ? (mappedProducts / totalProducts) * 100 : 0,
      },
      categories: {
        total: totalCategories,
        mapped: mappedCategories,
        unmapped: totalCategories - mappedCategories,
        percentage: totalCategories > 0 ? (mappedCategories / totalCategories) * 100 : 0,
      },
      priceRules: activeRules,
    };
  }
}
