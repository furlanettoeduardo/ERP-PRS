import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly ivLength = 16;
  private readonly saltLength = 64;
  private readonly tagLength = 16;
  private readonly tagPosition: number;
  private readonly encryptedPosition: number;

  constructor() {
    // Gera chave a partir da secret key do ambiente
    const secret = process.env.ENCRYPTION_SECRET || 'default-secret-key-change-in-production';
    this.key = crypto.scryptSync(secret, 'salt', 32);
    this.tagPosition = this.saltLength + this.ivLength;
    this.encryptedPosition = this.tagPosition + this.tagLength;
  }

  /**
   * Criptografa um valor usando AES-256-GCM
   */
  encrypt(text: string): string {
    if (!text) return text;

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const salt = crypto.randomBytes(this.saltLength);
      
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
      ]);

      const tag = cipher.getAuthTag();

      // Combina salt + iv + tag + encrypted data
      const result = Buffer.concat([salt, iv, tag, encrypted]);
      
      return result.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Descriptografa um valor
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) return encryptedData;

    try {
      const data = Buffer.from(encryptedData, 'base64');

      const salt = data.slice(0, this.saltLength);
      const iv = data.slice(this.saltLength, this.tagPosition);
      const tag = data.slice(this.tagPosition, this.encryptedPosition);
      const encrypted = data.slice(this.encryptedPosition);

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Verifica se um token está expirado
   */
  isTokenExpired(expiresAt: Date): boolean {
    if (!expiresAt) return false;
    return new Date() >= new Date(expiresAt);
  }

  /**
   * Calcula data de expiração a partir de segundos
   */
  calculateExpiresAt(expiresInSeconds: number): Date {
    const now = new Date();
    return new Date(now.getTime() + expiresInSeconds * 1000);
  }
}
