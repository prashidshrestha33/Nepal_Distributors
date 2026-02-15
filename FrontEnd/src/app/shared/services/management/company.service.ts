import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth.service';
import { ApiGatewayService } from '../api-gateway.service';

/* ===================== MODELS ===================== */

export interface company {
  id?: number;
  name?: string;
  email?: string;
  mobilePhone?: string;
  contactPerson?: string;
  landlinePhone?: string;
  registrationDocument?: string;
  companyType?: string;
  status?: string;
  userType?: string;
  credits?: number;
  location?: string;
  googleMapLocation?: string;
  createdAt?: string;
}

export interface ApproveCompanyRequest {
  companyId: number;
  assignCategory?: string;
  approveFg?: 'Y' | 'N';
  rejectComment?: string;
}

export interface StaticValue {
  catalogId?: number;
  staticId?: number;
  staticValueKey: string;
  staticData?: string;
  displayOrder: string;
}

export interface StaticValueCatalog {
  id: number;
  catalogId: number;
  catalogName: string;
  catalogType: string;
  catalogDescription: string;
}

export interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  depth: number;
  children?: Category[];
}

/* ===================== SERVICE ===================== */

@Injectable({
  providedIn: 'root'
})
export class CompanyService {

  private apiUrl = `${environment.apiBaseUrl}/api/Companies`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private apiGateway: ApiGatewayService
  ) {}

  /* ===================== LIST ===================== */

  getCompanys(): Observable<company[]> {
    const token = this.authService.getToken();
    let request$: Observable<any>;

    if (token) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      request$ = this.http.get<any>(this.apiUrl, { headers });
    } else {
      request$ = this.http.get<any>(this.apiUrl);
    }

    return request$.pipe(
      map(response => {
        let companies: any[] = [];

        if (Array.isArray(response)) {
          companies = response;
        } else if (response?.data && Array.isArray(response.data)) {
          companies = response.data;
        } else if (response?.result && Array.isArray(response.result)) {
          companies = response.result;
        } else {
          return [];
        }

        return companies.map((Company: any) => ({
          id: Company.id,
          name: Company.name || '',
          email: Company.email || '',
          mobilePhone: Company.mobilePhone || Company.MobilePhone || '',
          contactPerson: Company.contactPerson || Company.ContactPerson || '',
          landlinePhone: Company.landlinePhone || Company.LandlinePhone || '',
          registrationDocument: Company.registrationDocument || Company.RegistrationDocument || '',
          companyType: Company.companyType || Company.CompanyType || '',
          status: Company.status || Company.Status || 'inactive',
          userType: Company.userType || Company.UserType || '',
          credits: Number(Company.credits ?? 0),
          location: Company.location || Company.Location || '',
          googleMapLocation: Company.googleMapLocation || Company.GoogleMapLocation || '',
          createdAt: Company.createdAt || Company.created_at
        })) as company[];
      })
    );
  }

  /* ===================== SINGLE COMPANY ===================== */

  getCompanyById(id: number): Observable<company> {
    return this.apiGateway.getWithResult<company>(
      `${this.apiUrl}/${id}`,
      { requiresAuth: true }
    );
  }

  /** ✅ Alias for popup usage */
  getById(id: number): Observable<company> {
    return this.getCompanyById(id);
  }
uploadDocument(
  file: File, 
  companyId: number
): Observable<{ success: boolean; fileName: string }> {

  const formData = new FormData();
  formData.append('file', file);
  formData.append('companyId', companyId.toString());
  formData.append('fieldName', "test"); // <-- send fieldName to backend

  return this.http.post<{ success: boolean; fileName: string }>(
    `${this.apiUrl}/upload-document`,
    formData
  );
}

  // Optional: Update other fields
  updateField(request: { companyId: number; fieldName: string; fieldValue: any }): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/update-field`, request);
  }

  /* ===================== CREATE ===================== */

  createCompany(Company: company): Observable<company> {
    return this.http.post<company>(this.apiUrl, Company);
  }

  /* ===================== UPDATE ===================== */

  updateCompany(companyId: number, data: FormData) {
   return this.apiGateway.post<FormData>(
    `${environment.apiBaseUrl}/api/Companies/update`,
    data,
    { requiresAuth: true } // pass auth if needed
  );
}


  /* ===================== DELETE ===================== */

  deleteCompany(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  rejectCompany(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reject`, {});
  }

  /* ===================== APPROVAL ===================== */

  ApproveCompany(request: ApproveCompanyRequest): Observable<ApproveCompanyRequest> {
    return this.apiGateway.post<ApproveCompanyRequest>(
      `${environment.apiBaseUrl}/api/Companies/approve`,
      request,
      { requiresAuth: true }
    );
  }

  /* ===================== STATIC & CATEGORY ===================== */

  getStaticValuesrole(): Observable<StaticValueCatalog[]> {
    return this.apiGateway.getWithResult<StaticValueCatalog[]>(
      '/api/StaticValue/GetStaticValue?catalogkey=roles',
      { requiresAuth: true }
    );
  }

  getCategories(): Observable<Category[]> {
    return this.apiGateway.getWithResult<Category[]>(
      `${environment.apiBaseUrl}/api/Product/Category`
    );
  }

  /* ===================== REGISTRATION ===================== */

  sendRegisterLink(email: string, role: string, company_id: string): Observable<any[]> {
    return this.apiGateway.get<any[]>(
      `/api/Companies/send-registration-link?email=${encodeURIComponent(email)}&company_id=${encodeURIComponent(company_id)}&role=${encodeURIComponent(role)}`,
      { requiresAuth: true }
    );
  }
}
