import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';
import {
  ConnectMercadoLivreDto,
  ConnectShopeeDto,
  ConnectAmazonDto,
  ConnectWooCommerceDto,
} from './dto/connect-marketplace.dto';
import { QueryLogsDto } from './dto/query-logs.dto';

@ApiTags('integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as integrações do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de integrações retornada com sucesso' })
  findAll(@Request() req) {
    return this.integrationsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar integração por ID' })
  @ApiResponse({ status: 200, description: 'Integração encontrada' })
  @ApiResponse({ status: 404, description: 'Integração não encontrada' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.integrationsService.findOne(id, req.user.id);
  }

  @Post('mercado-livre/connect')
  @ApiOperation({ summary: 'Conectar Mercado Livre' })
  @ApiResponse({ status: 201, description: 'Integração conectada com sucesso' })
  @ApiResponse({ status: 409, description: 'Integração já conectada' })
  connectMercadoLivre(@Body() dto: ConnectMercadoLivreDto, @Request() req) {
    return this.integrationsService.connect('MERCADO_LIVRE', dto, req.user.id);
  }

  @Post('shopee/connect')
  @ApiOperation({ summary: 'Conectar Shopee' })
  @ApiResponse({ status: 201, description: 'Integração conectada com sucesso' })
  connectShopee(@Body() dto: ConnectShopeeDto, @Request() req) {
    return this.integrationsService.connect('SHOPEE', dto, req.user.id);
  }

  @Post('amazon/connect')
  @ApiOperation({ summary: 'Conectar Amazon' })
  @ApiResponse({ status: 201, description: 'Integração conectada com sucesso' })
  connectAmazon(@Body() dto: ConnectAmazonDto, @Request() req) {
    return this.integrationsService.connect('AMAZON', dto, req.user.id);
  }

  @Post('woocommerce/connect')
  @ApiOperation({ summary: 'Conectar WooCommerce' })
  @ApiResponse({ status: 201, description: 'Integração conectada com sucesso' })
  connectWooCommerce(@Body() dto: ConnectWooCommerceDto, @Request() req) {
    return this.integrationsService.connect('WOOCOMMERCE', dto, req.user.id);
  }

  @Post(':marketplace/disconnect')
  @ApiOperation({ summary: 'Desconectar marketplace' })
  @ApiResponse({ status: 200, description: 'Integração desconectada com sucesso' })
  @ApiResponse({ status: 404, description: 'Integração não encontrada' })
  disconnect(@Param('marketplace') marketplace: string, @Request() req) {
    return this.integrationsService.disconnect(marketplace, req.user.id);
  }

  @Get(':marketplace/status')
  @ApiOperation({ summary: 'Verificar status da integração' })
  @ApiResponse({ status: 200, description: 'Status retornado com sucesso' })
  getStatus(@Param('marketplace') marketplace: string, @Request() req) {
    return this.integrationsService.getStatus(marketplace, req.user.id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Buscar logs da integração' })
  @ApiResponse({ status: 200, description: 'Logs retornados com sucesso' })
  @ApiResponse({ status: 404, description: 'Integração não encontrada' })
  getLogs(
    @Param('id') id: string,
    @Query() query: QueryLogsDto,
    @Request() req,
  ) {
    return this.integrationsService.getLogs(id, req.user.id, query);
  }
}
