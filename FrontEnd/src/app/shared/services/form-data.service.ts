import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CompanyFormData {
  name: string;
  companyPerson: string;
  mobilePhone: string;
  landLinePhone: string;
  registrationDocument: File | null;
  companyType: string;
  address: string;
  googleMapLocation: string;
  status?: string;
}

export interface UserFormData {
  firstName: string;
  phoneNo: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  provider: string;
  id: string;
  token: string;
}
export interface ForgetPassword {
  Password: string;
  Provider: string;
  Token: string;
}

export interface FormWizardData {
  company: CompanyFormData | null;
  user: UserFormData | null;
}

@Injectable({
  providedIn: 'root'
})
export class FormDataService {
  private readonly STORAGE_KEY = 'formWizardData';
  
  private formDataSubject = new BehaviorSubject<FormWizardData>({
    company: null,
    user: null
  });

  formData$ = this.formDataSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Get current form data
   */
  getFormData(): FormWizardData {
    return this.formDataSubject.getValue();
  }

  /**
   * Get company form data
   */
  getCompanyData(): CompanyFormData | null {
    return this.formDataSubject.getValue().company;
  }

  /**
   * Get user form data
   */
  getUserData(): UserFormData | null {
    return this.formDataSubject.getValue().user;
  }

  /**
   * Save company form data
   */
  saveCompanyData(data: CompanyFormData): void {
    const current = this.formDataSubject.getValue();
    const updated: FormWizardData = {
      ...current,
      company: data
    };
    this.formDataSubject.next(updated);
    this.saveToStorage(updated);
  }

  /**
   * Save user form data
   */
  saveUserData(data: UserFormData): void {
    const current = this.formDataSubject.getValue();
    const updated: FormWizardData = {
      ...current,
      user: data
    };
    this.formDataSubject.next(updated);
    this.saveToStorage(updated);
  }

  /**
   * Update company data partially
   */
  updateCompanyData(partialData: Partial<CompanyFormData>): void {
    const current = this.formDataSubject.getValue();
    const updated: FormWizardData = {
      ...current,
      company: current.company ? { ...current.company, ...partialData } : (partialData as CompanyFormData)
    };
    this.formDataSubject.next(updated);
    this.saveToStorage(updated);
  }

  /**
   * Update user data partially
   */
  updateUserData(partialData: Partial<UserFormData>): void {
    const current = this.formDataSubject.getValue();
    const updated: FormWizardData = {
      ...current,
      user: current.user ? { ...current.user, ...partialData } : (partialData as UserFormData)
    };
    this.formDataSubject.next(updated);
    this.saveToStorage(updated);
  }

  /**
   * Clear all form data
   */
  clearAll(): void {
    this.formDataSubject.next({ company: null, user: null });
    this.removeFromStorage();
  }

  /**
   * Clear company data
   */
  clearCompanyData(): void {
    const current = this.formDataSubject.getValue();
    this.formDataSubject.next({ ...current, company: null });
    this.saveToStorage(this.formDataSubject.getValue());
  }

  /**
   * Clear user data
   */
  clearUserData(): void {
    const current = this.formDataSubject.getValue();
    this.formDataSubject.next({ ...current, user: null });
    this.saveToStorage(this.formDataSubject.getValue());
  }

  /**
   * Save to localStorage (excluding File objects)
   */
  private saveToStorage(data: FormWizardData): void {
    try {
      // Store company data without File object
      const storageData = {
        company: data.company ? {
          ...data.company,
          registrationDocument: null // Files cannot be serialized
        } : null,
        user: data.user
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error('Error saving form data to storage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as FormWizardData;
        this.formDataSubject.next(data);
      }
    } catch (error) {
      console.error('Error loading form data from storage:', error);
    }
  }

  /**
   * Remove from localStorage
   */
  private removeFromStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error removing form data from storage:', error);
    }
  }

  /**
   * Check if company data exists
   */
  hasCompanyData(): boolean {
    return this.getCompanyData() !== null;
  }

  /**
   * Check if user data exists
   */
  hasUserData(): boolean {
    return this.getUserData() !== null;
  }
}
