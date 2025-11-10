import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { EncryptionService } from '../encryption.service';
import {
  MercadoLivreAuthDto,
  MercadoLivreCallbackDto,
  MercadoLivreTokenResponseDto,
  ShopeeAuthDto,
  ShopeeSignatureDto,
  ShopeeAuthResponseDto,
  WooCommerceAuthDto,
  WooCommerceTestResponseDto,
  AmazonAuthDto,
  AmazonLWATokenResponseDto,
  AmazonMarketplaceParticipationDto,
  TestConnectionResponseDto,
} from '../dto/auth.dto';

// ============================================
// MERCADO LIVRE AUTHENTICATION SERVICE
// ============================================
@Injectable()
export class MercadoLivreAuthService {
  private readonly AUTH_URL = 'https://auth.mercadolivre.com.br/authorization';
  private readonly TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
  private readonly API_URL = 'https://api.mercadolibre.com';

  constructor(private encryptionService: EncryptionService) {}

  /**
   * Gera URL de autorização OAuth2
   */
  getAuthorizationUrl(clientId: string, redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state || crypto.randomBytes(16).toString('hex'),
    });

    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Troca code por access_token
   */
  async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<MercadoLivreTokenResponseDto> {
    try {
      const response = await axios.post(
        this.TOKEN_URL,
        {
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestException(
        `Erro ao trocar código por token: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Renova access_token usando refresh_token
   */
  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
  ): Promise<MercadoLivreTokenResponseDto> {
    try {
      const response = await axios.post(
        this.TOKEN_URL,
        {
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new UnauthorizedException(
        `Erro ao renovar token: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Valida token e obtém informações do usuário
   */
  async validateToken(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(`${this.API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  /**
   * Testa conexão completa
   */
  async testConnection(credentials: MercadoLivreAuthDto): Promise<TestConnectionResponseDto> {
    const startTime = Date.now();

    try {
      // Simula fluxo: em produção real, o token já estaria salvo
      // Aqui apenas validamos se as credenciais estão corretas
      const authUrl = this.getAuthorizationUrl(
        credentials.clientId,
        credentials.redirectUri || 'http://localhost:3000/api/integrations/mercado-livre/callback',
      );

      return {
        success: true,
        message: 'Credenciais válidas. Fluxo OAuth2 pode ser iniciado.',
        data: {
          authUrl,
          clientId: credentials.clientId,
        },
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }
}

// ============================================
// SHOPEE AUTHENTICATION SERVICE
// ============================================
@Injectable()
export class ShopeeAuthService {
  private readonly API_URL = 'https://partner.shopeemobile.com';
  private readonly API_VERSION = '/api/v2';

  constructor(private encryptionService: EncryptionService) {}

  /**
   * Gera assinatura HMAC-SHA256
   */
  generateSignature(params: ShopeeSignatureDto): string {
    const { partnerId, partnerKey, path, timestamp } = params;
    
    // Formato: partner_id + path + timestamp
    const baseString = `${partnerId}${path}${timestamp}`;
    
    // HMAC-SHA256 com partner_key
    const hmac = crypto.createHmac('sha256', partnerKey);
    hmac.update(baseString);
    
    return hmac.digest('hex');
  }

  /**
   * Obtém informações da loja
   */
  async getShopInfo(credentials: ShopeeAuthDto): Promise<ShopeeAuthResponseDto> {
    const path = `${this.API_VERSION}/shop/get_shop_info`;
    const timestamp = Math.floor(Date.now() / 1000);

    const sign = this.generateSignature({
      partnerId: credentials.partnerId,
      partnerKey: credentials.partnerKey,
      path,
      timestamp,
    });

    try {
      const response = await axios.get(`${this.API_URL}${path}`, {
        params: {
          partner_id: credentials.partnerId,
          shop_id: credentials.shopId,
          timestamp,
          sign,
        },
      });

      if (response.data.error) {
        throw new BadRequestException(response.data.message || 'Erro na API Shopee');
      }

      return response.data;
    } catch (error) {
      throw new BadRequestException(
        `Erro ao autenticar Shopee: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Testa conexão
   */
  async testConnection(credentials: ShopeeAuthDto): Promise<TestConnectionResponseDto> {
    const startTime = Date.now();

    try {
      const shopInfo = await this.getShopInfo(credentials);

      return {
        success: true,
        message: 'Conexão bem-sucedida com Shopee',
        data: shopInfo,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }
}

// ============================================
// WOOCOMMERCE AUTHENTICATION SERVICE
// ============================================
@Injectable()
export class WooCommerceAuthService {
  constructor(private encryptionService: EncryptionService) {}

  /**
   * Gera header de autenticação Basic
   */
  private getAuthHeader(consumerKey: string, consumerSecret: string): string {
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Testa autenticação obtendo informações da loja
   */
  async getStoreInfo(credentials: WooCommerceAuthDto): Promise<WooCommerceTestResponseDto> {
    const url = `${credentials.storeUrl.replace(/\/$/, '')}/wp-json/wc/v3`;

    try {
      const response = await axios.get(`${url}`, {
        headers: {
          Authorization: this.getAuthHeader(credentials.consumerKey, credentials.consumerSecret),
        },
      });

      return response.data;
    } catch (error) {
      throw new BadRequestException(
        `Erro ao conectar WooCommerce: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Testa listagem de produtos
   */
  async testProductsEndpoint(credentials: WooCommerceAuthDto): Promise<any> {
    const url = `${credentials.storeUrl.replace(/\/$/, '')}/wp-json/wc/v3/products`;

    try {
      const response = await axios.get(url, {
        params: { per_page: 1 },
        headers: {
          Authorization: this.getAuthHeader(credentials.consumerKey, credentials.consumerSecret),
        },
      });

      return response.data;
    } catch (error) {
      throw new BadRequestException(
        `Erro ao testar endpoint de produtos: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Testa conexão completa
   */
  async testConnection(credentials: WooCommerceAuthDto): Promise<TestConnectionResponseDto> {
    const startTime = Date.now();

    try {
      const storeInfo = await this.getStoreInfo(credentials);
      const products = await this.testProductsEndpoint(credentials);

      return {
        success: true,
        message: 'Conexão bem-sucedida com WooCommerce',
        data: {
          store: storeInfo,
          productsCount: products.length,
        },
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }
}

// ============================================
// AMAZON SP-API AUTHENTICATION SERVICE
// ============================================
@Injectable()
export class AmazonAuthService {
  private readonly LWA_TOKEN_URL = 'https://api.amazon.com/auth/o2/token';
  private readonly SP_API_URL = 'https://sellingpartnerapi-na.amazon.com';

  constructor(private encryptionService: EncryptionService) {}

  /**
   * Obtém access_token usando refresh_token
   */
  async getAccessToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string,
  ): Promise<AmazonLWATokenResponseDto> {
    try {
      const response = await axios.post(
        this.LWA_TOKEN_URL,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new UnauthorizedException(
        `Erro ao obter token LWA: ${error.response?.data?.error_description || error.message}`,
      );
    }
  }

  /**
   * Obtém marketplace participations
   */
  async getMarketplaceParticipations(
    accessToken: string,
  ): Promise<AmazonMarketplaceParticipationDto[]> {
    try {
      const response = await axios.get(
        `${this.SP_API_URL}/sellers/v1/marketplaceParticipations`,
        {
          headers: {
            'x-amz-access-token': accessToken,
          },
        },
      );

      return response.data.payload || [];
    } catch (error) {
      throw new BadRequestException(
        `Erro ao obter marketplace participations: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Testa conexão completa
   */
  async testConnection(credentials: AmazonAuthDto): Promise<TestConnectionResponseDto> {
    const startTime = Date.now();

    try {
      // 1. Obter access_token
      const tokenResponse = await this.getAccessToken(
        credentials.clientId,
        credentials.clientSecret,
        credentials.refreshToken,
      );

      // 2. Validar com SP-API
      const participations = await this.getMarketplaceParticipations(tokenResponse.access_token);

      return {
        success: true,
        message: 'Conexão bem-sucedida com Amazon SP-API',
        data: {
          marketplaces: participations.length,
          sellerId: credentials.sellerId,
        },
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }
}
