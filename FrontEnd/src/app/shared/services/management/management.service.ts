import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiGatewayService } from '../api-gateway.service';
import { ApiResponse } from '../../models/api-response.model';
import { HttpEvent } from '@angular/common/http';

// ============================================
// INTERFACES
// ============================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  image?: string;  
  depth?: number;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
}
export interface ProductImage {
  id: number;
  productId: number;
  imageName: string;
  isDefault: boolean;
  createdAt: string;
}
export interface Product {
  id: number;
  sku?: string;
  name: string;
  description: string;
  defaultImage: string;
  shortDescription?: string;
  categoryId: number;
  brandId: number;
  manufacturerId: number;
  rate: number;
  hsCode: string;
  status: string;
  categoryName:string;
  categorySlug:string;
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
  images?: ProductImage[];
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
export interface ImportStatusResponse {
  statusCode: number;
  success: boolean;
  message: string;
  result?: any;
  errors?: any;
}


@Injectable({ providedIn: 'root' })
// ============================================
// CATEGORY SERVICE
// ============================================

@Injectable({ providedIn: 'root' })
export class CategoryService {
  approveCategory(id: number) {
    throw new Error('Method not implemented.');
  }
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
getAllCategories(): Observable<Category[]> {
  return this.apiGateway.get<Category>(
    '/api/Product/Categories',
    { requiresAuth: true }
  ).pipe(
    map((response: any) => response?.result || [])
  );
}

  getCategories(): Observable<Category[]> {
    return this.getTreeCategories();
  }

createCategory(formData: FormData): Observable<Category> {
  return this.apiGateway.post<Category>(
    '/api/Product/AddCatagory',
    formData,
     { 
       requiresAuth: true // make sure apiGateway attaches Authorization header
     }
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

    getCategoryById(id: number): Observable<void> {
    return this.apiGateway. get<void>(
      `/api/Product/${id}`,
      { requiresAuth: true }
    );
  }

  updateCategory(id: number, formData: FormData): Observable<any> {
    debugger;
  return this.apiGateway.post<any>(
    `/api/Product/Category/${id}`,
    formData,
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
    return this.apiGateway.get<any>(
      `/api/Product/Update/${id}`,
      { requiresAuth: true }
    )
    .pipe(map(res => res.result));
}
submitReview(payload: any): Observable<any> {
  return this.apiGateway.post<any>(
    `api/Product/Review`,
    payload
  );
}
ApprovedProductById(id: number, payload: ApproveProduct): Observable<Product> {
  return this.apiGateway.post<Product>(
    `api/Product/ApproveProduct/${id}`,
    payload
  );
}

  createProduct(product: Product, images?: { file: File, isDefault: boolean }[]): Observable<Product> {
    const formData = this.buildProductFormData(product, images);
  return this.apiGateway.post<Product>(
    '/api/Product/AddProduct',
    formData,
    { requiresAuth: true, headers: {} }
  );
}

updateProduct(id: number, product: Product, images?: { file: File, isDefault: boolean }[]): Observable<Product> {
  const formData = this.buildProductFormData(product, images);
  return this.apiGateway.post<Product>(
    `/api/Product/${id}`,
    formData,
    { requiresAuth: true, headers: {} }
  );
}

  private buildProductFormData(
  product: Product,
  images?: { file: File; isDefault: boolean; id?: number }[], 
  deletedImageIds: number[] = []
): FormData {
  const formData = new FormData();

  // ------------------- Product Fields -------------------
  formData.append('Sku', product.sku ?? '');
  formData.append('Name', product.name ?? '');
  formData.append('Description', product.description ?? '');
  formData.append('ShortDescription', product.shortDescription ?? '');
  formData.append('CategoryId', (product.categoryId ?? 0).toString());
  formData.append('BrandId', (product.brandId ?? 0).toString());
  formData.append('ManufacturerId', (product.manufacturerId ?? 0).toString());
  formData.append('Rate', (product.rate ?? 0).toString());
  formData.append('HsCode', product.hsCode ?? '');
  formData.append('Status', product.status ?? '');
  formData.append('IsFeatured', product.isFeatured ? 'true' : 'false');
  formData.append('SeoTitle', product.seoTitle ?? '');
  formData.append('SeoDescription', product.seoDescription ?? '');
  formData.append('Attributes', product.attributes ?? '');
  formData.append('CreatedBy', product.createdBy ?? '');

  // ------------------- Handle Image Deletions -------------------
  if (deletedImageIds.length > 0) {
    formData.append('ImageIdsToDelete', JSON.stringify(deletedImageIds)); // Serialize the array to JSON string
  }

  // ------------------- Handle Image Uploads -------------------
  if (images && images.length > 0) {
    let defaultIndex = 0;

    images.forEach((img, index) => {
      if (img.file) {
        formData.append('ImageFiles', img.file); // append new image files
      }

      if (img.isDefault) {
        defaultIndex = index; // set default image index
      }

      if (img.id) {
        formData.append('ExistingImageIds', img.id.toString()); // append existing image IDs
      }
    });

    formData.append('DefaultImageIndex', defaultIndex.toString()); // append default image index
  }
  formData.forEach((value, key) => {
  });

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
importStatus(id: string): Observable<ImportStatusResponse> {
  return this.apiGateway.get<ImportStatusResponse>(
    `/api/Import/status/${id}`,
    { requiresAuth: true }
  );
}
CSVImporter(file: File): Observable<HttpEvent<any>> {
  const formData = new FormData();
  formData.append('File', file, file.name);

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
  }  getSellerRequests(sellerCompanyId: number): Observable<any> {
    return this.apiGateway.get<any>(`/api/Orders/seller-requests/${sellerCompanyId}`);
  }
submitBulkQuote(payload: any): Observable<any> {
    return this.apiGateway.post<any>(
      '/api/Orders/submit-bulk-quote',
      payload,
      { requiresAuth: true }
    );
  }
  getSentQuotations(sellerCompanyId: number): Observable<any> {
    return this.apiGateway.get<any>(
      `/api/Orders/sent-quotations/${sellerCompanyId}`,
      { requiresAuth: true }
    );
  }
  getBuyerQuotations(buyerCompanyId: number): Observable<any> {
    return this.apiGateway.get<any>(
      `/api/Orders/buyer-dashboard/${buyerCompanyId}`,
      { requiresAuth: true }
    );
  } approveQuote(quoteId: number,buyerCompanyId: number): Observable<any> {
    return this.apiGateway.post<any>(
      `/api/Orders/buyer-approve-quote/${quoteId}/${buyerCompanyId}`,
      { requiresAuth: true }
    );
  }
 rejectQuote(quoteId: number): Observable<any> {
    return this.apiGateway.post<any>(
      `/api/Orders/buyer-reject-quote/${quoteId}`,
      { requiresAuth: true }
    );
  }

  submitQuote(payload: any): Observable<any> {
    return this.apiGateway.post<any>(
      '/api/Orders/submit-quote',
      payload,
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


    // --- KANBAN BOARD ENDPOINTS ---

  getSellerConfirmedOrders(sellerCompanyId: number): Observable<any> {
    return this.apiGateway.get<any>(
      `/api/Orders/seller-confirmed/${sellerCompanyId}`,
      { requiresAuth: true }
    );
  }

  updateOrderStatus(orderId: number, status: string): Observable<any> {
    return this.apiGateway.post<any>(
      `/api/Orders/update-status/${orderId}/${encodeURIComponent(status)}`, 
      {}, 
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

