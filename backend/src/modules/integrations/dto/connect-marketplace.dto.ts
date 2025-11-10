import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export enum Marketplace {
  MERCADO_LIVRE = 'MERCADO_LIVRE',
  SHOPEE = 'SHOPEE',
  AMAZON = 'AMAZON',
  WOOCOMMERCE = 'WOOCOMMERCE',
}

export class ConnectMercadoLivreDto {
  @ApiProperty({ example: 'APP_ID_FROM_ML' })
  @IsString()
  @IsNotEmpty()
  appId: string;

  @ApiProperty({ example: 'SECRET_KEY_FROM_ML' })
  @IsString()
  @IsNotEmpty()
  secretKey: string;

  @ApiProperty({ example: 'https://your-domain.com/callback', required: false })
  @IsString()
  @IsOptional()
  redirectUri?: string;
}

export class ConnectShopeeDto {
  @ApiProperty({ example: 'PARTNER_ID_FROM_SHOPEE' })
  @IsString()
  @IsNotEmpty()
  partnerId: string;

  @ApiProperty({ example: 'PARTNER_KEY_FROM_SHOPEE' })
  @IsString()
  @IsNotEmpty()
  partnerKey: string;

  @ApiProperty({ example: '12345', required: false })
  @IsString()
  @IsOptional()
  shopId?: string;
}

export class ConnectAmazonDto {
  @ApiProperty({ example: 'CLIENT_ID_FROM_AMAZON' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ example: 'CLIENT_SECRET_FROM_AMAZON' })
  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @ApiProperty({ example: 'SELLER_ID' })
  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @ApiProperty({ example: 'us-east-1', required: false })
  @IsString()
  @IsOptional()
  region?: string;
}

export class ConnectWooCommerceDto {
  @ApiProperty({ example: 'https://your-store.com' })
  @IsString()
  @IsNotEmpty()
  storeUrl: string;

  @ApiProperty({ example: 'ck_xxxxxxxxxxxxx' })
  @IsString()
  @IsNotEmpty()
  consumerKey: string;

  @ApiProperty({ example: 'cs_xxxxxxxxxxxxx' })
  @IsString()
  @IsNotEmpty()
  consumerSecret: string;
}

export class OAuthCallbackDto {
  @ApiProperty({ example: 'AUTHORIZATION_CODE_FROM_OAUTH' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'random_state_string', required: false })
  @IsString()
  @IsOptional()
  state?: string;
}
