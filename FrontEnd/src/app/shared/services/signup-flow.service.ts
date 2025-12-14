import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SignupFlowService {
  private companyId: number | null = null;

  // Temporary storage for company form data (keeps File in memory)
  private companyFormData: any = null;

  setCompanyId(id: number) {
    this.companyId = id;
  }

  getCompanyId(): number | null {
    return this.companyId;
  }

  clear() {
    this.companyId = null;
  }

  /**
   * Store entire company form (non-file fields will also be persisted to localStorage)
   */
  setCompanyForm(data: any) {
    this.companyFormData = data;
    try {
      // persist non-file fields so they survive refresh
      const copy: any = { ...data };
      // Don't attempt to store the File object in localStorage; instead store a DataURL and file metadata
      if (copy.file) {
        // If the caller already provided fileDataUrl/fileName/fileType, keep those; otherwise they'll not be persisted
        delete copy.file;
      }
      localStorage.setItem('companyData', JSON.stringify(copy));
    } catch (e) {
      // ignore storage errors
    }
  }

  /**
   * Get stored company form. File may be null if page was refreshed.
   */
  getCompanyForm(): any {
    if (this.companyFormData) return this.companyFormData;
    try {
      const raw = localStorage.getItem('companyData');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
    return null;
  }

  /**
   * Reconstruct a File object from stored data URL (if present) and attach it to the in-memory company form.
   * Returns the File or null if not available.
   */
  getCompanyFileFromStorage(): File | null {
    const stored = this.getCompanyForm();
    if (!stored) return null;

    const dataUrl: string | undefined = stored.fileDataUrl;
    const name: string | undefined = stored.fileName;
    const type: string | undefined = stored.fileType;
    if (!dataUrl || !name) return null;

    try {
      // Convert dataURL to binary
      const arr = dataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = (mimeMatch && mimeMatch[1]) || type || '';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const file = new File([blob], name, { type: mime });

      // Attach to in-memory copy for future calls
      const existing = this.companyFormData || {};
      existing.file = file;
      this.companyFormData = existing;

      return file;
    } catch (e) {
      // If conversion fails, return null
      return null;
    }
  }

  /**
   * Open (or create) an IndexedDB database used to store compressed files
   */
  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('signup-flow-db', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Save a company file into IndexedDB, compressing it with CompressionStream if available.
   */
  async saveCompanyFile(file: File): Promise<void> {
    try {
      let blobToStore: Blob = file;
      let compressed = false;

      if ((window as any).CompressionStream) {
        try {
          // Use stream-based compression (gzip)
          const cs = new (window as any).CompressionStream('gzip');
          const compressedStream = file.stream().pipeThrough(cs);
          const compressedBlob = await new Response(compressedStream).blob();
          blobToStore = compressedBlob;
          compressed = true;
        } catch (e) {
          // If compression fails, fallback to storing raw file
          compressed = false;
          blobToStore = file;
        }
      }

      const db = await this.openDb();
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      const record = {
        key: 'company_document',
        blob: blobToStore,
        fileName: file.name,
        fileType: file.type,
        compressed,
        originalSize: file.size,
        storedAt: Date.now(),
      } as any;
      store.put(record);
      await new Promise((res, rej) => {
        tx.oncomplete = () => res(null);
        tx.onerror = () => rej(tx.error);
      });

      // Attach to in-memory company form as well
      const existing = this.companyFormData || {};
      existing.file = file;
      existing.fileName = file.name;
      existing.fileType = file.type;
      this.companyFormData = existing;
    } catch (e) {
      // ignore storage errors for now
      console.warn('Failed to save company file to IDB', e);
    }
  }

  /**
   * Retrieve company file from IndexedDB and decompress it if needed.
   */
  async getCompanyFileFromIDB(): Promise<File | null> {
    try {
      const db = await this.openDb();
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.get('company_document');
      const rec: any = await new Promise((res, rej) => {
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });
      if (!rec) return null;

      let blob: Blob = rec.blob;
      if (rec.compressed && (window as any).DecompressionStream) {
        try {
          const ds = new (window as any).DecompressionStream('gzip');
          const decompressedStream = blob.stream().pipeThrough(ds);
          const decompressedBlob = await new Response(decompressedStream).blob();
          blob = decompressedBlob;
        } catch (e) {
          console.warn('Decompression failed', e);
          // fall through and try returning stored blob if decompression unavailable
        }
      }

      const file = new File([blob], rec.fileName || 'company_doc', { type: rec.fileType || '' });
      // store in-memory
      const existing = this.companyFormData || {};
      existing.file = file;
      existing.fileName = rec.fileName;
      existing.fileType = rec.fileType;
      this.companyFormData = existing;
      return file;
    } catch (e) {
      console.warn('Failed to read company file from IDB', e);
      return null;
    }
  }

  clearCompanyForm() {
    this.companyFormData = null;
    try {
      localStorage.removeItem('companyData');
    } catch (e) {}
  }
}
