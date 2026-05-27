import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface HeroBanner {
  imageUrl: string;
  caption: string;
  displayOrder: number;
}

export interface AboutUsData {
  imageUrl: string;
  description: string;
}

export interface ServiceFeature {
  title: string;
  description: string;
  displayOrder: number;
}

export interface CategoryData {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  activeFlag: boolean;
  
  // PascalCase fallbacks for database properties
  Id?: number;
  Name?: string;
  Slug?: string;
  Image?: string | null;
  ActiveFlag?: boolean;
}

export interface ProductData {
  id: number;
  sku: string;
  name: string;
  description: string;
  shortDescription: string;
  categoryId: number;
  rate: number;
  companyName: string | null;
  defaultImage: string | null;
  
  // PascalCase fallbacks for database properties
  Id?: number;
  Sku?: string;
  Name?: string;
  Description?: string;
  ShortDescription?: string | null;
  CategoryId?: number;
  Rate?: number;
  CompanyName?: string | null;
  DefaultImage?: string | null;
}

export interface BrandData {
  name: string;
  logo: string | null;
}

export interface HomepageResponse {
  heroBanners: HeroBanner[];
  aboutUs: AboutUsData | null;
  services: ServiceFeature[];
  categories: CategoryData[];
  products: ProductData[];
  brands: BrandData[];
  contactInfo: { [key: string]: string };
}

@Injectable({
  providedIn: 'root'
})
export class HomepageService {
  private http = inject(HttpClient);
  
  // Dynamically switch base URL between local development and production origin
  private baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:49857/api'
    : '/api';

  getHomepageData(): Observable<HomepageResponse> {
    return this.http.get<{ success: boolean; result: HomepageResponse }>(`${this.baseUrl}/homepage`).pipe(
      map(response => response.result)
    );
  }
}
