import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Category {
  id?: number;
  name: string;
  description?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private api = environment.apiBaseUrl;
  private categoryEndpoint = `${this.api}/api/product`;

  constructor(private http: HttpClient) { }

  /**
   * Get all categories
   */
  getCategories(): Observable<any> {
    return this.http.get<any>(`${this.categoryEndpoint}/GetCategory`);
  }

  /**
   * Get category by ID
   */
  getCategoryById(id: number): Observable<any> {
    return this.http.get<any>(`${this.categoryEndpoint}/GetCategory/${id}`);
  }

  /**
   * Add new category
   */
  addCategory(category: Category): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(`${this.categoryEndpoint}/AddCategory`, category, { headers });
  }

  /**
   * Update existing category
   */
  updateCategory(id: number, category: Category): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<any>(`${this.categoryEndpoint}/UpdateCategory/${id}`, category, { headers });
  }

  /**
   * Delete category
   */
  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.categoryEndpoint}/DeleteCategory/${id}`);
  }
}
