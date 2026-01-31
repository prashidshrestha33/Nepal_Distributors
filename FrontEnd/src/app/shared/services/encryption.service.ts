import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({ providedIn: 'root' })
export class EncryptionService {
  private readonly Key = '9FvA8kZ1Wm4R2T0YpE6HnLJxqB5CSDU7';
  private readonly IV = 'A9xT3QW2L7KZ8M0P';

  decrypt<T>(encryptedText: string): T | null {
    if (!encryptedText) return null;
    try {
      const encryptedWordArray = CryptoJS.enc.Base64.parse(encryptedText);
      const key = CryptoJS.enc.Utf8.parse(this.Key);
      const iv = CryptoJS.enc.Utf8.parse(this.IV);

      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: encryptedWordArray } as any,
        key,
        { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
      );

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

      try {
        return JSON.parse(decryptedText) as T;
      } catch {
        return decryptedText as unknown as T;
      }
    } catch (e) {
      console.error('Decryption failed:', e);
      return null;
    }
  }
}
