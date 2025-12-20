import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FileUploadResponse {
  success: boolean;
  message: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = environment.apiBaseUrl;
  private maxFileSize = 5 * 1024 * 1024; // 5MB
  private allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private allowedDocumentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  constructor(private http: HttpClient) {}

  /**
   * Upload product image with validation
   */
  uploadProductImage(file: File, productId?: string): Observable<HttpEvent<FileUploadResponse>> {
    // Validate file
    const validation = this.validateImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append('file', file);
    if (productId) {
      formData.append('productId', productId);
    }

    return this.http.post<FileUploadResponse>(
      `${this.apiUrl}/api/upload/product-image`,
      formData,
      { reportProgress: true, responseType: 'json' as any }
    );
  }

  /**
   * Upload document file
   */
  uploadDocument(file: File, documentType: string): Observable<HttpEvent<FileUploadResponse>> {
    const validation = this.validateDocument(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    return this.http.post<FileUploadResponse>(
      `${this.apiUrl}/api/upload/document`,
      formData,
      { reportProgress: true, responseType: 'json' as any }
    );
  }

  /**
   * Upload bulk files (multiple images/documents)
   */
  uploadMultiple(files: File[], type: 'image' | 'document'): Observable<HttpEvent<any>> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    formData.append('type', type);

    const endpoint = type === 'image' ? '/api/upload/bulk-images' : '/api/upload/bulk-documents';
    
    return this.http.post<any>(
      `${this.apiUrl}${endpoint}`,
      formData,
      { reportProgress: true, responseType: 'json' as any }
    );
  }

  /**
   * Delete uploaded file
   */
  deleteFile(fileUrl: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/upload/delete`, { fileUrl });
  }

  /**
   * Validate image file
   */
  private validateImage(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (file.size > this.maxFileSize) {
      return { valid: false, error: `File size must be less than 5MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB` };
    }

    if (!this.allowedImageTypes.includes(file.type)) {
      return { valid: false, error: 'Only image files are allowed (JPEG, PNG, GIF, WebP)' };
    }

    return { valid: true };
  }

  /**
   * Validate document file
   */
  private validateDocument(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (file.size > this.maxFileSize) {
      return { valid: false, error: `File size must be less than 5MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB` };
    }

    if (!this.allowedDocumentTypes.includes(file.type)) {
      return { valid: false, error: 'Only document files are allowed (PDF, Word, Excel)' };
    }

    return { valid: true };
  }

  /**
   * Get upload progress percentage
   */
  getProgressPercentage(event: HttpProgressEvent): number {
    if (event.total) {
      return Math.round((event.loaded / event.total) * 100);
    }
    return 0;
  }
}
