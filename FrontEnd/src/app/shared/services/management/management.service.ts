import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiGatewayService } from '../api-gateway.service';

// ============================================
// INTERFACES
// ============================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  depth?: number;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id?:  number;
  sku: string;
  name: string;
  shortDescription: string;
  rate: number;
  status:  string;
  isFeatured: boolean;
  imageUrl?: string;
  imageFile?:  File;
  createdAt?:  Date;
}

export interface ProductResponse {
  data: Product[];
  totalCount: number;
  pageNumber:  number;
  pageSize: number;
}

export interface Order {
  id?: number;
  orderNumber: string;
  userId?: number;
  totalAmount:  number;
  status: 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
  createdAt?: Date;
}

export interface Notification {
  id?: number;
  type:  'order' | 'quotation' | 'system';
  message: string;
  relatedId?: number;
  read: boolean;
  createdAt?: Date;
}

export interface Quotation {
  id?:  number;
  quotationNumber:  string;
  userId?: number;
  items?:  any[];
  totalAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
}

export interface StaticValue { 
  catalogId?: number;
  staticId?:  number;
  staticValueKey: string;
  staticData?: string;
  displayOrder:  string;
}

export interface StaticValueCatalog {
  catalogId?: number;
  catalogName: string;
  catalogType:  string;
  catalogDescription: string;
}

// ============================================
// CATEGORY SERVICE
// ============================================

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private apiGateway: ApiGatewayService) {}

  getTreeCategories(): Observable<Category[]> {
    return this.apiGateway.get<any>(
      '/api/Product/tree',
      { requiresAuth: true }
    ).pipe(
      map((response: any) => {
        return response?. result?.categories || response?.categories || [];
      })
    );
  }

  getCategories(): Observable<Category[]> {
    return this.getTreeCategories();
  }

  createCategory(category: Category): Observable<Category> {
    return this.apiGateway.postWithResult<Category>(
      '/api/Product/AddCatagory',
      category,
      { requiresAuth: true }
    );
  }

  moveCategory(categoryId: number, newParentId:  number): Observable<Category> {
    return this.apiGateway.postWithResult<Category>(
      '/api/Product/move',
      { categoryId, newParentId },
      { requiresAuth:  true }
    );
  }

  deleteCategory(id: number): Observable<void> {
    return this.apiGateway. deleteWithResult<void>(
      `/api/Product/${id}`,
      { requiresAuth: true }
    );
  }
}

// ============================================
// PRODUCT SERVICE
// ============================================

@Injectable({ providedIn:  'root' })
export class ProductService {
  constructor(private apiGateway: ApiGatewayService) {}

  getProducts(page: number = 1, pageSize: number = 20): Observable<ProductResponse> {
    const params = this.apiGateway.buildParams({ page, pageSize });
    return this.apiGateway. get<ProductResponse>(
      '/api/Product',
      { requiresAuth: true, params }
    );
  }

  getProductById(id: number): Observable<Product> {
    return this.apiGateway.get<Product>(
      `/api/Product/${id}`,
      { requiresAuth: true }
    );
  }

  createProduct(product: Product): Observable<Product> {
    const formData = this.buildProductFormData(product);
    return this.apiGateway.post<Product>(
      '/api/Product/AddProduct',
      formData,
      { 
        requiresAuth: true,
        headers: {}
      }
    );
  }

  updateProduct(id:  number, product: Product): Observable<Product> {
    const formData = this.buildProductFormData(product);
    return this.apiGateway.put<Product>(
      `/api/Product/${id}`,
      formData,
      { 
        requiresAuth: true,
        headers: {}
      }
    );
  }

  deleteProduct(id:  number): Observable<void> {
    return this.apiGateway.delete<void>(
      `/api/Product/${id}`,
      { requiresAuth: true }
    );
  }

  private buildProductFormData(product:  Product): FormData {
    const formData = new FormData();
    formData.append('sku', product.sku);
    formData.append('name', product.name);
    formData.append('shortDescription', product.shortDescription);
    formData.append('rate', product.rate.toString());
    formData.append('status', product.status);
    formData.append('isFeatured', product.isFeatured.toString());
    
    if (product.imageFile) {
      formData.append('ImageFile', product.imageFile, product. imageFile.name);
    }
    
    return formData;
  }
}

// ============================================
// ORDER SERVICE
// ============================================

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private apiGateway:  ApiGatewayService) {}

  getOrders(): Observable<Order[]> {
    return this.apiGateway.get<Order[]>(
      '/api/orders',
      { requiresAuth: true }
    );
  }

  getOrderById(id: number): Observable<Order> {
    return this.apiGateway.get<Order>(
      `/api/orders/${id}`,
      { requiresAuth: true }
    );
  }

  createOrder(order: Order): Observable<Order> {
    return this.apiGateway.post<Order>(
      '/api/orders',
      order,
      { requiresAuth: true }
    );
  }

  updateOrder(id: number, order:  Order): Observable<Order> {
    return this.apiGateway.put<Order>(
      `/api/orders/${id}`,
      order,
      { requiresAuth: true }
    );
  }

  approveOrder(id: number): Observable<Order> {
    return this.apiGateway.post<Order>(
      `/api/orders/${id}/approve`,
      {},
      { requiresAuth: true }
    );
  }

  deleteOrder(id: number): Observable<void> {
    return this.apiGateway.delete<void>(
      `/api/orders/${id}`,
      { requiresAuth: true }
    );
  }
}

// ============================================
// NOTIFICATION SERVICE
// ============================================

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private apiGateway:  ApiGatewayService) {}

  getNotifications(): Observable<Notification[]> {
    return this.apiGateway.get<Notification[]>(
      '/api/notifications',
      { requiresAuth: true }
    );
  }

  markAsRead(id: number): Observable<Notification> {
    return this. apiGateway.post<Notification>(
      `/api/notifications/${id}/read`,
      {},
      { requiresAuth: true }
    );
  }

  deleteNotification(id: number): Observable<void> {
    return this.apiGateway. delete<void>(
      `/api/notifications/${id}`,
      { requiresAuth: true }
    );
  }
}

// ============================================
// QUOTATION SERVICE
// ============================================

@Injectable({ providedIn: 'root' })
export class QuotationService {
  constructor(private apiGateway: ApiGatewayService) {}

  getQuotations(): Observable<Quotation[]> {
    return this.apiGateway.get<Quotation[]>(
      '/api/quotations',
      { requiresAuth: true }
    );
  }

  getQuotationById(id: number): Observable<Quotation> {
    return this.apiGateway.get<Quotation>(
      `/api/quotations/${id}`,
      { requiresAuth: true }
    );
  }

  createQuotation(quotation: Quotation): Observable<Quotation> {
    return this.apiGateway.post<Quotation>(
      '/api/quotations',
      quotation,
      { requiresAuth: true }
    );
  }

  updateQuotation(id: number, quotation: Quotation): Observable<Quotation> {
    return this.apiGateway.put<Quotation>(
      `/api/quotations/${id}`,
      quotation,
      { requiresAuth: true }
    );
  }

  approveQuotation(id: number): Observable<Quotation> {
    return this.apiGateway. post<Quotation>(
      `/api/quotations/${id}/approve`,
      {},
      { requiresAuth: true }
    );
  }

  deleteQuotation(id: number): Observable<void> {
    return this.apiGateway.delete<void>(
      `/api/quotations/${id}`,
      { requiresAuth: true }
    );
  }
}

// ============================================
// STATIC VALUE SERVICE
// ============================================

@Injectable({ providedIn: 'root' })
export class StaticValueService {
  constructor(private apiGateway: ApiGatewayService) {}

  getStaticValues(id: number): Observable<StaticValue[]> {
    return this.apiGateway.getWithResult<StaticValue[]>(
      `/api/StaticValue/GetStaticValueAll/${id}`,
      { requiresAuth: true }
    );
  }

  getStaticValuesCatagory(): Observable<StaticValueCatalog[]> {
    return this. apiGateway.getWithResult<StaticValueCatalog[]>(
      '/api/StaticValue/GetAllCatalog',
      { requiresAuth: true }
    );
  }

getStaticValueByFilter(filter: { catalogId?: string; staticId?: string; key?: string }): Observable<StaticValue> {
  // Filter props must be lowercase to match backend model binding
  return this.apiGateway.getWithResult<StaticValue>(
    '/api/StaticValue/GetStaticValue',
    { params: filter, requiresAuth: true }
  );
}
 createStaticValue(value: StaticValue): Observable<StaticValue> {
  // Ensure all fields that must be strings are converted accordingly.
  const payload = {
  staticId: value.staticId,
  catalogId: value.catalogId,
  staticValueKey: value.staticValueKey,
  staticData: value.staticData,
  displayOrder: value.displayOrder
  };

  return this.apiGateway.post<StaticValue>(
    '/api/StaticValue/AddStaticValue',
    payload,
    { requiresAuth: true }
  );
}
  updateStaticValue(value: StaticValue): Observable<StaticValue> {
     const payload = {
  staticId: value.staticId,
  catalogId: value.catalogId,
  staticValueKey: value.staticValueKey,
  staticData: value.staticData,
  displayOrder: value.displayOrder
  };
    return this.apiGateway.put<StaticValue>(
      `/api/StaticValue/UpdateStaticValue`,
      payload,
      { requiresAuth: true }
    );
  }

  deleteStaticValue(id: number): Observable<void> {
    return this.apiGateway.delete<void>(
      `/api/static-values/${id}`,
      { requiresAuth: true }
    );
  }
}