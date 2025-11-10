import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ============ MERCADO LIVRE ============
export class MercadoLivreAuthDto {
  @ApiProperty({ description: 'Client ID da aplicação Mercado Livre' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: 'Client Secret da aplicação Mercado Livre' })
  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @ApiProperty({ description: 'Redirect URI configurada', required: false })
  @IsUrl()
  @IsOptional()
  redirectUri?: string;
}

export class MercadoLivreCallbackDto {
  @ApiProperty({ description: 'Código de autorização retornado pelo ML' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'State para validação CSRF' })
  @IsString()
  @IsOptional()
  state?: string;
}

export class MercadoLivreTokenResponseDto {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

// ============ SHOPEE ============
export class ShopeeAuthDto {
  @ApiProperty({ description: 'Partner ID fornecido pela Shopee' })
  @IsString()
  @IsNotEmpty()
  partnerId: string;

  @ApiProperty({ description: 'Partner Key fornecido pela Shopee' })
  @IsString()
  @IsNotEmpty()
  partnerKey: string;

  @ApiProperty({ description: 'Shop ID da loja na Shopee' })
  @IsString()
  @IsNotEmpty()
  shopId: string;
}

export class ShopeeSignatureDto {
  partnerId: string;
  partnerKey: string;
  path: string;
  timestamp: number;
}

export class ShopeeAuthResponseDto {
  shop_id: number;
  shop_name: string;
  region: string;
  status: string;
}

// ============ WOOCOMMERCE ============
export class WooCommerceAuthDto {
  @ApiProperty({ description: 'URL completa da loja WooCommerce' })
  @IsUrl()
  @IsNotEmpty()
  storeUrl: string;

  @ApiProperty({ description: 'Consumer Key da API REST' })
  @IsString()
  @IsNotEmpty()
  consumerKey: string;

  @ApiProperty({ description: 'Consumer Secret da API REST' })
  @IsString()
  @IsNotEmpty()
  consumerSecret: string;
}

export class WooCommerceTestResponseDto {
  version: string;
  name: string;
  description: string;
  url: string;
  store_email: string;
}

// ============ AMAZON SP-API ============
export class AmazonAuthDto {
  @ApiProperty({ description: 'LWA Client ID' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: 'LWA Client Secret' })
  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @ApiProperty({ description: 'Refresh Token obtido da Amazon' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiProperty({ description: 'AWS Role ARN para SP-API' })
  @IsString()
  @IsNotEmpty()
  roleArn: string;

  @ApiProperty({ description: 'Seller ID / Merchant ID', required: false })
  @IsString()
  @IsOptional()
  sellerId?: string;
}

export class AmazonLWATokenResponseDto {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export class AmazonMarketplaceParticipationDto {
  marketplace: {
    id: string;
    name: string;
    countryCode: string;
  };
  participation: {
    isParticipating: boolean;
    hasSuspendedListings: boolean;
  };
}

// ============ WEBHOOK CONFIGURATION ============
export class WebhookConfigDto {
  @ApiProperty({ description: 'URL do webhook para receber eventos' })
  @IsUrl()
  @IsNotEmpty()
  webhookUrl: string;

  @ApiProperty({ description: 'Secret para validação de assinatura', required: false })
  @IsString()
  @IsOptional()
  webhookSecret?: string;
}

export class WebhookRegistrationResponseDto {
  webhookUrl: string;
  webhookSecret: string;
  verificationToken?: string;
  marketplace: string;
  status: string;
}

// ============ TEST CONNECTION ============
export class TestConnectionResponseDto {
  @ApiProperty({ description: 'Sucesso da conexão' })
  success: boolean;

  @ApiProperty({ description: 'Mensagem de status' })
  message: string;

  @ApiProperty({ description: 'Dados retornados pela API', required: false })
  data?: any;

  @ApiProperty({ description: 'Timestamp do teste' })
  timestamp: Date;

  @ApiProperty({ description: 'Tempo de resposta em ms', required: false })
  responseTime?: number;
}

// ============ SAVE CREDENTIALS ============
export class SaveCredentialsDto {
  @ApiProperty({ description: 'Marketplace' })
  @IsString()
  @IsNotEmpty()
  marketplace: string;

  @ApiProperty({ description: 'Credenciais em JSON' })
  @IsNotEmpty()
  credentials: any;
}
