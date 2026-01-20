import * as CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EncryptionHelper {

  private static readonly Key = environment.encryptionKey; // 32 bytes for AES-256
  private static readonly IV = environment.encryptionIV;   // 16 bytes

  static decrypt<T>(encryptedText: string): T {
    try {
      if (!encryptedText) return null as any;

      console.log('Encrypted Text (Base64):', encryptedText);

      // Parse Base64 to WordArray
      const encryptedBytes = CryptoJS.enc.Base64.parse(encryptedText);
      const key = CryptoJS.enc.Utf8.parse(this.Key);
      const iv = CryptoJS.enc.Utf8.parse(this.IV);

      // Decrypt using AES-CBC
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: encryptedBytes } as any,
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      const decryptedData = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedData) {
        console.error('Decryption failed. No data returned.');
        return null as any;
      }

      console.log('Decrypted Data (UTF-8):', decryptedData);

      return JSON.parse(decryptedData) as T;
    } catch (error) {
      console.error('Decryption error:', error);
      return null as any;
    }
  }

  static encrypt(data: any): string {
    const json = typeof data === 'string' ? data : JSON.stringify(data);
    const key = CryptoJS.enc.Utf8.parse(this.Key);
    const iv = CryptoJS.enc.Utf8.parse(this.IV);

    const encrypted = CryptoJS.AES.encrypt(json, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return encrypted.toString(); // Base64
  }
}
