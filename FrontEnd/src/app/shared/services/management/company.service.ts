import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth.service';
import { ApiGatewayService } from '../api-gateway.service';
export interface company {
  id?: number;
  name?: string;              // ✅ add this
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
  assignCategory?: string;   // e.g. "1,2,5"
  approveFg?: 'Y' | 'N';     // Y or N
  rejectComment?: string;    // optional
}
export interface StaticValue { 
  catalogId?: number;
  staticId?:  number;
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

export interface Category {
   id: number;
  name: string;
  parentId?: number | null;
  depth: number;
  children?: Category[];
}


@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = `${environment.apiBaseUrl}/api/Companies`;

  constructor(private http: HttpClient, private authService: AuthService,private apiGateway: ApiGatewayService) {}
getCompanys(): Observable<company[]> {
  const token = this.authService.getToken();

  let request$: Observable<any>;

  if (token) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    request$ = this.http.get<any>(this.apiUrl, { headers });
  } else {
    request$ = this.http.get<any>(this.apiUrl);
  }

  return request$.pipe(
    map(response => {
      console.log('API response:', response);

      let Companys: any[] = [];

      // Handle different response formats
      if (Array.isArray(response)) {
        Companys = response;
      } else if (response?.data && Array.isArray(response.data)) {
        Companys = response.data;
      } else if (response?.result && Array.isArray(response.result)) {
        Companys = response.result;
      } else {
        console.warn('Unexpected response format:', response);
        return [];
      }

      // Map backend fields to company interface
      return Companys.map((Company: any) => ({
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
        createdAt: Company.createdAt ? new Date(Company.createdAt) :
                   Company.created_at ? new Date(Company.created_at) : undefined
      })) as company[];
    })
  );
}
  getStaticValuesrole(): Observable<StaticValueCatalog[]> {
    return this. apiGateway.getWithResult<StaticValueCatalog[]>(
      '/api/StaticValue/GetStaticValue?catalogkey=roles',
      { requiresAuth: true }
    );
  }
sendRegisterLink(email: string, role: string, company_id: string): Observable<any[]> {
  debugger;
  return this.apiGateway.get<any[]>(
    `/api/Companies/send-registration-link?email=${encodeURIComponent(email)}&company_id=${encodeURIComponent(company_id)}&role=${encodeURIComponent(role)}`,
    { requiresAuth: true }
  );
}

  getCategories(): Observable<Category[]> {
    return this.apiGateway.getWithResult<Category[]>(`${environment.apiBaseUrl}/api/Product/Category`);
  }
  getCompanyById(id: number): Observable<company> {
     return this.apiGateway.getWithResult<company>(
          `${this.apiUrl}/${id}`,
          { requiresAuth: true }
        );
  }

  createCompany(Company: company): Observable<company> {
    return this.http.post<company>(this.apiUrl, Company);
  }
  ApproveCompany(Company: ApproveCompanyRequest): Observable<ApproveCompanyRequest> {
    debugger;
     return this.apiGateway.post<ApproveCompanyRequest>(
          `${environment.apiBaseUrl}/api/Companies/approve`,Company,
          { requiresAuth: true }
        );
  }
  updateCompany(id: number, Company: company): Observable<company> {
    return this.http.put<company>(`${this.apiUrl}/${id}`, Company);
  }

  deleteCompany(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  rejectCompany(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reject`, {});
  }
}
