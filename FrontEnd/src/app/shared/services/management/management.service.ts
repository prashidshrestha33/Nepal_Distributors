import { inject, Injectable } from '@angular/core';
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
  id: number;
  sku?: string;
  name: string;
  description: string;
  shortDescription?: string;
  categoryId: number;
  brandId: number;
  manufacturerId: number;
  rate: number;
  hsCode: string;
  status: string;
  isFeatured?: boolean;
  seoTitle: string;
  seoDescription: string;
  attributes?: string;
  createdBy: string;
  imageFile?: File | string;
  createdAt?: Date;
  updatedAt?: Date;
  approveFg?: string;
  approveTs?: Date;
  imageUrl?: string;
  imageName?: string;
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
  staticId:  number;
  staticValueKey: string;
  staticData?: string;
  displayOrder:  string;
}

export interface StaticValueCatalog {
  id:number;
  catalogId: number;
  catalogName: string;
  catalogType:  string;
  catalogDescription: string;
}

export interface Brand {
id?: number;
name?: string;
}
export interface Users {
id?: number;
name?: string;
email?:string;
company?:number;
credit?:number;
}

export interface ApproveProduct {
  id?: number;
  action?: string;
  remarks?:string;
}
interface Toast {
  message: string;
  type: 'success' | 'error';
}


@Injectable({ providedIn: 'root' })
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
  
SearchProducts(keyword:string,page: number = 1, pageSize: number = 20): Observable<ProductResponse> {
    const params = this.apiGateway.buildParams({ page, pageSize });
    return this.apiGateway. get<ProductResponse>(
      `/api/Product/search?keyword=${keyword}`,
      { requiresAuth: true, params }
    );
  }
  getProductById(id: number): Observable<Product> {
    return this.apiGateway.get<Product>(
      `/api/Product/Update/${id}`,
      { requiresAuth: true }
    );
  }
ApprovedProductById(id: number, payload: ApproveProduct): Observable<Product> {
  return this.apiGateway.post<Product>(
    `api/Product/ApproveProduct/${id}`,
    payload
  );
}

  createProduct(product: Product, image?: File): Observable<Product> {
    
    const formData = this.buildProductFormData(product, image);
    for (let pair of formData.entries()) {
    }
    return this.apiGateway.post<Product>(
      '/api/Product/AddProduct',
      formData,
      { 
        requiresAuth: true,
        headers: {}
      }
    );
  }
  updateProduct(id:  number, product: Product, image?: File): Observable<Product> {
    const formData = this.buildProductFormData(product, image);
    return this.apiGateway.post<Product>(
      `/api/Product/${id}`,
      formData,
      { 
        requiresAuth: true,
        headers: {}
      }
    );
  }


  private buildProductFormData(product: Product, imageFile?: File): FormData { 
  const formData = new FormData();
  formData.append('Sku', (product.sku ?? 0).toString());
  formData.append('Name', product.name ?? '');
  formData.append('Description', product.description ?? '');
  formData.append('ShortDescription', (product.shortDescription ?? 0).toString());
  formData.append('CategoryId', (product.categoryId ?? 0).toString());
  formData.append('BrandId', (product.brandId ?? 0).toString());
  formData.append('ManufacturerId', (product.manufacturerId ?? 0).toString());
  formData.append('Rate', (product.rate ?? 0).toString());
  formData.append('HsCode', product.hsCode ?? '');
  formData.append('Status', product.status ?? '');
  formData.append('IsFeatured', product.isFeatured ? 'true' : 'false');
  formData.append('SeoTitle', product.seoTitle ?? '');
  formData.append('SeoDescription', product.seoDescription ?? '');
  formData.append('Attributes', (product.attributes ?? 0).toString());
  formData.append('CreatedBy', product.createdBy ?? '');

  // Append file if exists
  if (imageFile) {
    formData.append('ImageFile', imageFile, (imageFile as File).name);
  } else if (typeof product.imageFile === 'string') {
    formData.append('ImageFile', product.imageFile);
  }

  return formData;
}

  
    approveProduct(id:  number, product: Product): Observable<Product> {
    const formData = this.buildProductFormData(product);
    return this.apiGateway.put<Product>(
      `/api/Product/ApproveProduct/${id}`,
      formData,
      { 
        requiresAuth: true,
        headers: {}
      }
    );
  }

  bulkApproveProduct(productId: number, payload: { action: string; remarks?: string }): Observable<any> {
  return this.apiGateway.post(`/api/Product/ApproveProduct/${productId}`, payload, {
    requiresAuth: true
  });
}

  deleteProduct(id:  number): Observable<void> {
    return this.apiGateway.delete<void>(
      `/api/Product/${id}`,
      { requiresAuth: true }
    );
  }
CSVImporter(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('File', file, file.name); // MUST be "File"

  return this.apiGateway.post<any>(
    '/api/Import/products',
    formData,
    {
      requiresAuth: true
    }
  );
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
    '/api/StaticValue/GetStaticValueSingle',
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


//Get User
@Injectable({ providedIn: 'root' })
export class Users {
  constructor(private apiGateway: ApiGatewayService) {}
getUser(id: number): Observable<Users[]> {
    return this.apiGateway.getWithResult<Users[]>(
      `/api/Users`,
      { requiresAuth: true }
    );
  }
}

