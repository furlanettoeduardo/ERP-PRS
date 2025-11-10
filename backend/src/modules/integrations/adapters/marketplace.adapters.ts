import { Injectable, BadRequestException } from '@nestjs/common';
import { EncryptionService } from '../encryption.service';

export interface MarketplaceAdapter {
  connect(credentials: any, userId: string): Promise<any>;
  disconnect(integrationId: string): Promise<void>;
  refreshToken(integrationId: string): Promise<any>;
  testConnection(integrationId: string): Promise<boolean>;
}

@Injectable()
export class MercadoLivreAdapter implements MarketplaceAdapter {
  constructor(private readonly encryptionService: EncryptionService) {}

  async connect(credentials: any, userId: string): Promise<any> {
    // Mock - Em produção, fazer OAuth2 real com Mercado Livre
    const { appId, secretKey, redirectUri } = credentials;

    if (!appId || !secretKey) {
      throw new BadRequestException('App ID e Secret Key são obrigatórios');
    }

    // Simula geração de auth URL para OAuth
    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${appId}&redirect_uri=${redirectUri}`;

    // Mock: simula token de acesso
    const mockAccessToken = `ML_ACCESS_${Date.now()}`;
    const mockRefreshToken = `ML_REFRESH_${Date.now()}`;

    return {
      authUrl,
      accessToken: this.encryptionService.encrypt(mockAccessToken),
      refreshToken: this.encryptionService.encrypt(mockRefreshToken),
      expiresAt: this.encryptionService.calculateExpiresAt(21600), // 6 horas
      sellerId: 'ML_SELLER_123',
    };
  }

  async disconnect(integrationId: string): Promise<void> {
    // Mock - Em produção, revogar token no ML
    console.log(`Desconectando Mercado Livre: ${integrationId}`);
  }

  async refreshToken(integrationId: string): Promise<any> {
    // Mock - Em produção, usar refresh token real
    const newAccessToken = `ML_ACCESS_REFRESHED_${Date.now()}`;
    
    return {
      accessToken: this.encryptionService.encrypt(newAccessToken),
      expiresAt: this.encryptionService.calculateExpiresAt(21600),
    };
  }

  async testConnection(integrationId: string): Promise<boolean> {
    // Mock - Em produção, fazer chamada real à API do ML
    return true;
  }
}

@Injectable()
export class ShopeeAdapter implements MarketplaceAdapter {
  constructor(private readonly encryptionService: EncryptionService) {}

  async connect(credentials: any, userId: string): Promise<any> {
    const { partnerId, partnerKey, shopId } = credentials;

    if (!partnerId || !partnerKey) {
      throw new BadRequestException('Partner ID e Partner Key são obrigatórios');
    }

    // Mock de API Key
    const mockApiKey = `SHOPEE_KEY_${Date.now()}`;

    return {
      apiKey: this.encryptionService.encrypt(mockApiKey),
      shopId: shopId || 'SHOP_DEFAULT',
      partnerId,
    };
  }

  async disconnect(integrationId: string): Promise<void> {
    console.log(`Desconectando Shopee: ${integrationId}`);
  }

  async refreshToken(integrationId: string): Promise<any> {
    // Shopee usa API Key, não precisa refresh
    return null;
  }

  async testConnection(integrationId: string): Promise<boolean> {
    return true;
  }
}

@Injectable()
export class AmazonAdapter implements MarketplaceAdapter {
  constructor(private readonly encryptionService: EncryptionService) {}

  async connect(credentials: any, userId: string): Promise<any> {
    const { clientId, clientSecret, sellerId, region } = credentials;

    if (!clientId || !clientSecret || !sellerId) {
      throw new BadRequestException('Client ID, Secret e Seller ID são obrigatórios');
    }

    // Mock LWA (Login with Amazon)
    const mockAccessToken = `AMZ_ACCESS_${Date.now()}`;
    const mockRefreshToken = `AMZ_REFRESH_${Date.now()}`;

    return {
      accessToken: this.encryptionService.encrypt(mockAccessToken),
      refreshToken: this.encryptionService.encrypt(mockRefreshToken),
      expiresAt: this.encryptionService.calculateExpiresAt(3600), // 1 hora
      sellerId,
      extraData: { region: region || 'us-east-1' },
    };
  }

  async disconnect(integrationId: string): Promise<void> {
    console.log(`Desconectando Amazon: ${integrationId}`);
  }

  async refreshToken(integrationId: string): Promise<any> {
    const newAccessToken = `AMZ_ACCESS_REFRESHED_${Date.now()}`;
    
    return {
      accessToken: this.encryptionService.encrypt(newAccessToken),
      expiresAt: this.encryptionService.calculateExpiresAt(3600),
    };
  }

  async testConnection(integrationId: string): Promise<boolean> {
    return true;
  }
}

@Injectable()
export class WooCommerceAdapter implements MarketplaceAdapter {
  constructor(private readonly encryptionService: EncryptionService) {}

  async connect(credentials: any, userId: string): Promise<any> {
    const { storeUrl, consumerKey, consumerSecret } = credentials;

    if (!storeUrl || !consumerKey || !consumerSecret) {
      throw new BadRequestException('Store URL, Consumer Key e Secret são obrigatórios');
    }

    // WooCommerce não usa tokens OAuth, usa Consumer Key/Secret direto
    return {
      apiKey: this.encryptionService.encrypt(consumerKey),
      refreshToken: this.encryptionService.encrypt(consumerSecret),
      extraData: { storeUrl },
    };
  }

  async disconnect(integrationId: string): Promise<void> {
    console.log(`Desconectando WooCommerce: ${integrationId}`);
  }

  async refreshToken(integrationId: string): Promise<any> {
    // WooCommerce não precisa refresh
    return null;
  }

  async testConnection(integrationId: string): Promise<boolean> {
    return true;
  }
}
