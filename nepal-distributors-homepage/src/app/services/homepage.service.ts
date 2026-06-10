import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
  isFeatured?: boolean;
  
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
  IsFeatured?: boolean;
}

export interface BrandData {
  name: string;
  logo: string | null;
}

export interface PremierBrandData {
  name: string;
  logo: string | null;
  displayOrder: number;
}

export interface HomepageResponse {
  heroBanners: HeroBanner[];
  aboutUs: AboutUsData | null;
  services: ServiceFeature[];
  categories: CategoryData[];
  products: ProductData[];
  brands: BrandData[];
  contactInfo: { [key: string]: string };
  advertisements?: any[];
  privacyPolicy?: any[];
  termsAndConditions?: any[];
  testimonials?: any[];
  premierBrands?: PremierBrandData[];
}

@Injectable({
  providedIn: 'root'
})
export class HomepageService {
  private http = inject(HttpClient);
  
  private baseUrl = environment.apiUrl;

  getHomepageData(): Observable<HomepageResponse> {
    return this.http.get<{ success: boolean; result: HomepageResponse }>(`${this.baseUrl}/homepage`).pipe(
      map(response => response.result)
    );
  }
}
