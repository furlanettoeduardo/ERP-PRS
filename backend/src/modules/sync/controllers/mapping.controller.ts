import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MappingService } from '../services/mapping.service';
import { Marketplace } from '@prisma/client';
import { ProductMappingDto, CategoryMappingDto } from '../dto/sync.dto';

@ApiTags('Mappings')
@ApiBearerAuth()
@Controller('sync/mappings')
@UseGuards(JwtAuthGuard)
export class MappingController {
  constructor(private mappingService: MappingService) {}

  /**
   * PRODUCT MAPPINGS
   */

  @Post('products/:productId/:marketplace')
  @ApiOperation({ summary: 'Cria/atualiza mapeamento de produto' })
  async upsertProductMapping(
    @Param('productId') productId: string,
    @Param('marketplace') marketplace: Marketplace,
    @Body() dto: ProductMappingDto,
  ) {
    return this.mappingService.upsertProductMapping(productId, marketplace, dto);
  }

  @Get('products/:productId/:marketplace')
  @ApiOperation({ summary: 'Busca mapeamento de produto' })
  async getProductMapping(
    @Param('productId') productId: string,
    @Param('marketplace') marketplace: Marketplace,
  ) {
    return this.mappingService.getProductMapping(productId, marketplace);
  }

  @Get('products/:productId')
  @ApiOperation({ summary: 'Lista todos os mapeamentos de um produto' })
  async getProductMappings(@Param('productId') productId: string) {
    return this.mappingService.getProductMappings(productId);
  }

  @Get('products')
  @ApiOperation({ summary: 'Lista mapeamentos por marketplace' })
  async getMarketplaceMappings(@Query('marketplace') marketplace: Marketplace) {
    return this.mappingService.getMarketplaceMappings(marketplace);
  }

  @Delete('products/:productId/:marketplace')
  @ApiOperation({ summary: 'Deleta mapeamento de produto' })
  async deleteProductMapping(
    @Param('productId') productId: string,
    @Param('marketplace') marketplace: Marketplace,
  ) {
    return this.mappingService.deleteProductMapping(productId, marketplace);
  }

  /**
   * CATEGORY MAPPINGS
   */

  @Post('categories/:categoryId/:marketplace')
  @ApiOperation({ summary: 'Cria/atualiza mapeamento de categoria' })
  async upsertCategoryMapping(
    @Param('categoryId') categoryId: string,
    @Param('marketplace') marketplace: Marketplace,
    @Body() dto: CategoryMappingDto,
  ) {
    return this.mappingService.upsertCategoryMapping(categoryId, marketplace, dto);
  }

  @Get('categories/:categoryId/:marketplace')
  @ApiOperation({ summary: 'Busca mapeamento de categoria' })
  async getCategoryMapping(
    @Param('categoryId') categoryId: string,
    @Param('marketplace') marketplace: Marketplace,
  ) {
    return this.mappingService.getCategoryMapping(categoryId, marketplace);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lista mapeamentos de categoria por marketplace' })
  async getCategoryMappings(@Query('marketplace') marketplace: Marketplace) {
    return this.mappingService.getCategoryMappings(marketplace);
  }

  @Delete('categories/:categoryId/:marketplace')
  @ApiOperation({ summary: 'Deleta mapeamento de categoria' })
  async deleteCategoryMapping(
    @Param('categoryId') categoryId: string,
    @Param('marketplace') marketplace: Marketplace,
  ) {
    return this.mappingService.deleteCategoryMapping(categoryId, marketplace);
  }

  /**
   * PRICE RULES
   */

  @Get('price-rules')
  @ApiOperation({ summary: 'Lista regras de preço' })
  async getPriceRules(@Query('marketplace') marketplace?: Marketplace) {
    return this.mappingService.getPriceRules(marketplace);
  }

  @Post('price-rules')
  @ApiOperation({ summary: 'Cria regra de preço' })
  async createPriceRule(
    @Body()
    data: {
      name: string;
      marketplace?: Marketplace;
      formula: any;
      conditions?: any;
      priority?: number;
    },
  ) {
    return this.mappingService.createPriceRule(data);
  }

  @Put('price-rules/:ruleId')
  @ApiOperation({ summary: 'Atualiza regra de preço' })
  async updatePriceRule(
    @Param('ruleId') ruleId: string,
    @Body()
    data: {
      name?: string;
      formula?: any;
      conditions?: any;
      priority?: number;
      enabled?: boolean;
    },
  ) {
    return this.mappingService.updatePriceRule(ruleId, data);
  }

  @Delete('price-rules/:ruleId')
  @ApiOperation({ summary: 'Deleta regra de preço' })
  async deletePriceRule(@Param('ruleId') ruleId: string) {
    return this.mappingService.deletePriceRule(ruleId);
  }

  /**
   * STATS / UTILITIES
   */

  @Get('stats/:marketplace')
  @ApiOperation({ summary: 'Estatísticas de mapeamento por marketplace' })
  async getMappingStats(@Param('marketplace') marketplace: Marketplace) {
    return this.mappingService.getMappingStats(marketplace);
  }

  @Get('unmapped-products/:marketplace')
  @ApiOperation({ summary: 'Lista produtos sem mapeamento' })
  async getUnmappedProducts(
    @Param('marketplace') marketplace: Marketplace,
    @Query('limit') limit?: string,
  ) {
    return this.mappingService.getUnmappedProducts(
      marketplace,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post('calculate-price/:productId/:marketplace')
  @ApiOperation({ summary: 'Calcula preço ajustado com regras' })
  async calculateAdjustedPrice(
    @Param('productId') productId: string,
    @Param('marketplace') marketplace: Marketplace,
    @Body() data: { basePrice: number },
  ) {
    const adjustedPrice = await this.mappingService.calculateAdjustedPrice(
      productId,
      marketplace,
      data.basePrice,
    );

    return {
      productId,
      marketplace,
      basePrice: data.basePrice,
      adjustedPrice,
      difference: adjustedPrice - data.basePrice,
      percentageDiff: ((adjustedPrice - data.basePrice) / data.basePrice) * 100,
    };
  }
}
