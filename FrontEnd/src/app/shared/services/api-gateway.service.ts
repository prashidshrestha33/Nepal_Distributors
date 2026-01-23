import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

export interface RequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  body?: any; // CAN PASS BODY FOR GET, POST, etc.
  requiresAuth?: boolean;
  retryCount?: number;
  extractResult?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiGatewayService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Generic GET which can accept params or body (body is rarely supported by servers for GET, but Angular allows it)
  get<T>(endpoint: string, options: RequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);

    return this.http.get<T>(url, httpOptions).pipe(
      retry(options.retryCount || 0),
      catchError(this.handleError.bind(this))
    );
  }

  // GET with automatic extraction (expects result to be inside ApiResponse<T>)
  getWithResult<T>(endpoint: string, options: RequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    return this.http.get<ApiResponse<T>>(url, httpOptions).pipe(
      retry(options.retryCount || 0),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Request failed');
        }
        return response.result;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // GET with body (for use with custom backend supporting GET w/ body)
  getWithBody<T>(endpoint: string, body: any = null, options: RequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions({ ...options, body });
    return this.http.get<T>(url, httpOptions).pipe(
      retry(options.retryCount || 0),
      catchError(this.handleError.bind(this))
    );
  }

  // POST
  post<T>(endpoint: string, body: any = null, options: RequestOptions = {}): Observable<T> {
  const url = this.buildUrl(endpoint);
  // Pass the body to buildHttpOptions so it can check for FormData
  const httpOptions = this.buildHttpOptions({ ...options, body });
  return this.http.post<T>(url, body, httpOptions).pipe(
    catchError(this.handleError.bind(this))
  );
}

  // POST with automatic extraction
  postWithResult<T>(endpoint: string, body: any = null, options: RequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    return this.http.post<ApiResponse<T>>(url, body, httpOptions).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Request failed');
        }
        return response.result;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // PUT
  put<T>(endpoint: string, body: any = null, options: RequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    return this.http.put<T>(url, body, httpOptions).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // PUT with result extraction
  putWithResult<T>(endpoint: string, body: any = null, options: RequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    return this.http.put<ApiResponse<T>>(url, body, httpOptions).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Request failed');
        }
        return response.result;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // DELETE
  delete<T>(endpoint: string, options: RequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    return this.http.delete<T>(url, httpOptions).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // DELETE with result extraction
  deleteWithResult<T>(endpoint: string, options: RequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    return this.http.delete<ApiResponse<T>>(url, httpOptions).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Request failed');
        }
        return response.result;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // PATCH
  patch<T>(endpoint: string, body: any = null, options: RequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    return this.http.patch<T>(url, body, httpOptions).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // PATCH with result extraction
  patchWithResult<T>(endpoint: string, body: any = null, options: RequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    return this.http.patch<ApiResponse<T>>(url, body, httpOptions).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Request failed');
        }
        return response.result;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // Helper for building URLs (handles leading/trailing slashes)
  private buildUrl(endpoint: string): string {
    if (/^https?:\/\//.test(endpoint)) {
      return endpoint;
    }
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const cleanBaseUrl = this.baseUrl.endsWith('/') 
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  }

  // Helper for building HttpOptions, merging headers, params, and body
  private buildHttpOptions(options: RequestOptions): {
    headers: HttpHeaders;
    params?: HttpParams | { [param: string]: string | string[] };
    body?: any;
  } {
    let headers: HttpHeaders;
    if (options.headers instanceof HttpHeaders) {
      headers = options.headers;
    } else if (options.headers) {
      headers = new HttpHeaders(options.headers);
    } else {
      headers = new HttpHeaders();
    }

    const requiresAuth = options.requiresAuth !== false;
    if (requiresAuth) {
      const token = this.authService.getToken();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
  headers = headers.set('Content-Type', 'application/json');
}

    // Use HttpParams if passed as object
    let finalParams = options.params;
    if (options.params && !(options.params instanceof HttpParams)) {
      finalParams = this.buildParams(options.params as { [key: string]: any });
    }

    // Attach body property if present
    const result: any = { headers };
    if (finalParams) result.params = finalParams;
    if (options.body !== undefined) result.body = options.body;

    return result;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.errors) {
        errorMessage = JSON.stringify(error.error.errors);
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }
    console.error('❌ API Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  // Utility: returns auth headers
  getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Utility: builds query params from object
  buildParams(params: { [key: string]: any }): HttpParams {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] != null) {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });
    return httpParams;
  }
}