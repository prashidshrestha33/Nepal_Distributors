import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CatalogItem {
  id?: number;
  name: string;
  description?: string;
  isActive?: boolean;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private api = environment.apiBaseUrl;
  private catalogEndpoint = `${this.api}/api/StaticValue`;

  // Static company types as fallback
  private staticCompanyTypes = [
    { id: 1, catalogName: 'Importer', name: 'Importer' },
    { id: 3, catalogName: 'Retailer', name: 'Retailer' },
    { id: 4, catalogName: 'Wholesaler', name: 'Wholesaler' },
    { id: 6, catalogName: 'Manufacturer', name: 'Manufacturer' }
  ];

  constructor(private http: HttpClient) {
    console.log('CatalogService initialized with API:', this.catalogEndpoint);
  }

  /**
   * Get all catalogs from API, fallback to static values on error
   */
  getAllCatalog(): Observable<any> {
    const url = `${this.catalogEndpoint}/GetAllCatalog`;
    console.log('Fetching catalogs from:', url);
    console.log('This endpoint is public - no authorization required');
    return this.http.get<any>(url).pipe(
      catchError(error => {
        console.error('Error fetching catalogs from API:', error);
        console.warn('Using static company types as fallback');
        return of(this.staticCompanyTypes);
      })
    );
  }

  /**
   * Get static company types directly
   */
  getStaticCompanyTypes(): any[] {
    return this.staticCompanyTypes;
  }

  /**
   * Get catalog by ID
   */
  getCatalogById(id: number): Observable<any> {
    const url = `${this.catalogEndpoint}/GetAllCatalog/${id}`;
    console.log('Fetching catalog by ID from:', url);
    return this.http.get<any>(url);
  }
}
