import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiGatewayService } from './api-gateway.service';
export interface Feedback {
  id?: number;
  userId?: number;
  companyId?: number;
  subject?: string;
  message?: string;
  fileName?: string;
  createdAt?: string;
  fullName?: string;
  email?: string;
}

export interface FeedbackCategoryDto {
  catalogId?: number;
  staticValueKey: string;
  staticData: string;
  displayOrder?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = `${environment.apiBaseUrl}/api/Feedback`;

  constructor(
    private http: HttpClient,
    private apiGateway: ApiGatewayService
  ) {}

  submitFeedback(formData: FormData): Observable<any> {
    // API endpoint might be protected, but if submit is for users we can use HTTP client. 
    // We should pass auth headers if the user is logged in. 
    // For simplicity, we just use raw http for multipart form-data because ApiGatewayService might not handle FormData correctly.
    // If we need auth, we should add headers. Let's assume HttpInterceptor handles it or we can get token.
    // Wait, the API controller doesn't have [Authorize] on SubmitFeedback, so it's fine.
    return this.apiGateway.post<any>(`${this.apiUrl}/submit`, formData);
  }

  getFeedbacks(): Observable<Feedback[]> {
    return this.apiGateway.get<Feedback[]>(`${this.apiUrl}/inbox`);
  }

  getFeedbackById(id: number): Observable<Feedback> {
    return this.apiGateway.get<Feedback>(`${this.apiUrl}/${id}`);
  }

  getCategories(): Observable<FeedbackCategoryDto[]> {
    debugger;
    return this.apiGateway.get<FeedbackCategoryDto[]>(`${this.apiUrl}/categories`);
  }
}
