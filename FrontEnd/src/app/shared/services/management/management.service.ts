import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Category {
  id?: number;
  name: string;
  slug: string;
  parentId?: number;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private apiUrl = `${environment.apiBaseUrl}/api/product/AddCategory`;
  private getCategoriesUrl = `${environment.apiBaseUrl}/api/categories`;
  constructor(private http: HttpClient) {}
  getCategories(): Observable<Category[]> { return this.http.get<Category[]>(this.apiUrl); }
  getParentCategories(): Observable<Category[]> { return this.http.get<Category[]>(`${this.apiUrl}?parentId=0`); }
  getCategoryById(id: number): Observable<Category> { return this.http.get<Category>(`${this.getCategoriesUrl}/${id}`); }
  createCategory(category: Category): Observable<Category> { return this.http.post<Category>(this.apiUrl, category); }
  updateCategory(id: number, category: Category): Observable<Category> { return this.http.put<Category>(`${this.getCategoriesUrl}/${id}`, category); }
  deleteCategory(id: number): Observable<void> { return this.http.delete<void>(`${this.getCategoriesUrl}/${id}`); }
  approveCategory(id: number): Observable<Category> { return this.http.post<Category>(`${this.getCategoriesUrl}/${id}/approve`, {}); }
}

export interface Product {
  id?: number;
  sku: string;
  name: string;
  shortDescription: string;
  rate: number;
  status: string;
  isFeatured: boolean;
  imageUrl?: string;
  imageFile?: File;
  createdAt?: Date;
}

export interface ProductResponse {
  data: Product[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = `${environment.apiBaseUrl}/api/product`;
  constructor(private http: HttpClient) {}
  
  /**
   * Get products with pagination
   * @param page Page number (1-indexed)
   * @param pageSize Number of items per page
   */
  getProducts(page: number = 1, pageSize: number = 20): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
  }
  
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }
  
  /**
   * Create product with multipart/form-data
   * @param product Product data with optional image file
   */
  createProduct(product: Product): Observable<Product> {
    const formData = new FormData();
    formData.append('sku', product.sku);
    formData.append('name', product.name);
    formData.append('shortDescription', product.shortDescription);
    formData.append('rate', product.rate.toString());
    formData.append('status', product.status);
    formData.append('isFeatured', product.isFeatured.toString());
    
    if (product.imageFile) {
      formData.append('ImageFile', product.imageFile, product.imageFile.name);
    }
    
    return this.http.post<Product>(`${this.apiUrl}/AddProduct`, formData);
  }
  
  updateProduct(id: number, product: Product): Observable<Product> {
    const formData = new FormData();
    formData.append('sku', product.sku);
    formData.append('name', product.name);
    formData.append('shortDescription', product.shortDescription);
    formData.append('rate', product.rate.toString());
    formData.append('status', product.status);
    formData.append('isFeatured', product.isFeatured.toString());
    
    if (product.imageFile) {
      formData.append('ImageFile', product.imageFile, product.imageFile.name);
    }
    
    return this.http.put<Product>(`${this.apiUrl}/${id}`, formData);
  }
  
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

export interface Order {
  id?: number;
  orderNumber: string;
  userId?: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
  createdAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = `${environment.apiBaseUrl}/api/orders`;
  constructor(private http: HttpClient) {}
  getOrders(): Observable<Order[]> { return this.http.get<Order[]>(this.apiUrl); }
  getOrderById(id: number): Observable<Order> { return this.http.get<Order>(`${this.apiUrl}/${id}`); }
  createOrder(order: Order): Observable<Order> { return this.http.post<Order>(this.apiUrl, order); }
  updateOrder(id: number, order: Order): Observable<Order> { return this.http.put<Order>(`${this.apiUrl}/${id}`, order); }
  approveOrder(id: number): Observable<Order> { return this.http.post<Order>(`${this.apiUrl}/${id}/approve`, {}); }
  deleteOrder(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}

export interface Notification {
  id?: number;
  type: 'order' | 'quotation' | 'system';
  message: string;
  relatedId?: number;
  read: boolean;
  createdAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = `${environment.apiBaseUrl}/api/notifications`;
  constructor(private http: HttpClient) {}
  getNotifications(): Observable<Notification[]> { return this.http.get<Notification[]>(this.apiUrl); }
  markAsRead(id: number): Observable<Notification> { return this.http.post<Notification>(`${this.apiUrl}/${id}/read`, {}); }
  deleteNotification(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}

export interface Quotation {
  id?: number;
  quotationNumber: string;
  userId?: number;
  items?: any[];
  totalAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class QuotationService {
  private apiUrl = `${environment.apiBaseUrl}/api/quotations`;
  constructor(private http: HttpClient) {}
  getQuotations(): Observable<Quotation[]> { return this.http.get<Quotation[]>(this.apiUrl); }
  getQuotationById(id: number): Observable<Quotation> { return this.http.get<Quotation>(`${this.apiUrl}/${id}`); }
  createQuotation(quotation: Quotation): Observable<Quotation> { return this.http.post<Quotation>(this.apiUrl, quotation); }
  updateQuotation(id: number, quotation: Quotation): Observable<Quotation> { return this.http.put<Quotation>(`${this.apiUrl}/${id}`, quotation); }
  approveQuotation(id: number): Observable<Quotation> { return this.http.post<Quotation>(`${this.apiUrl}/${id}/approve`, {}); }
  deleteQuotation(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}

export interface StaticValue {
  id?: number;
  key: string;
  value: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class StaticValueService {
  private apiUrl = `${environment.apiBaseUrl}/api/static-values`;
  constructor(private http: HttpClient) {}
  getStaticValues(): Observable<StaticValue[]> { return this.http.get<StaticValue[]>(this.apiUrl); }
  getStaticValueById(id: number): Observable<StaticValue> { return this.http.get<StaticValue>(`${this.apiUrl}/${id}`); }
  createStaticValue(value: StaticValue): Observable<StaticValue> { return this.http.post<StaticValue>(this.apiUrl, value); }
  updateStaticValue(id: number, value: StaticValue): Observable<StaticValue> { return this.http.put<StaticValue>(`${this.apiUrl}/${id}`, value); }
  deleteStaticValue(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}
