import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * RegistrationFlowService
 * Manages the multi-step registration flow with proper state management.
 * Tracks whether user is coming from signup form and manages form pre-fill logic.
 */
@Injectable({
  providedIn: 'root'
})
export class RegistrationFlowService {
  private comingFromSignupSubject = new BehaviorSubject<boolean>(false);
  private formDataSubject = new BehaviorSubject<any>(null);
  private stepSubject = new BehaviorSubject<number>(1);

  public comingFromSignup$ = this.comingFromSignupSubject.asObservable();
  public formData$ = this.formDataSubject.asObservable();
  public step$ = this.stepSubject.asObservable();

  constructor() {
    this.loadFromSessionStorage();
  }

  /**
   * Set flag indicating user is coming from signup form
   * This should be called before navigating to register-company
   */
  setComingFromSignup(value: boolean): void {
    this.comingFromSignupSubject.next(value);
    if (value) {
      sessionStorage.setItem('comingFromSignup', 'true');
    } else {
      sessionStorage.removeItem('comingFromSignup');
    }
  }

  /**
   * Get current coming from signup state
   */
  isComingFromSignup(): boolean {
    return this.comingFromSignupSubject.value;
  }

  /**
   * Set form data to be pre-filled in the register-company form
   */
  setFormData(data: any): void {
    this.formDataSubject.next(data);
    try {
      // Store in sessionStorage for page refresh within the same session
      sessionStorage.setItem('registrationFormData', JSON.stringify(data));
    } catch (e) {
      console.warn('Could not store form data in session storage', e);
    }
  }

  /**
   * Get pre-fill form data
   */
  getFormData(): any {
    return this.formDataSubject.value;
  }

  /**
   * Set current step in the registration flow
   */
  setStep(step: number): void {
    this.stepSubject.next(step);
    sessionStorage.setItem('registrationStep', step.toString());
  }

  /**
   * Get current step
   */
  getStep(): number {
    return this.stepSubject.value;
  }

  /**
   * Reset the entire flow (call after successful registration)
   */
  resetFlow(): void {
    this.comingFromSignupSubject.next(false);
    this.formDataSubject.next(null);
    this.stepSubject.next(1);
    sessionStorage.removeItem('comingFromSignup');
    sessionStorage.removeItem('registrationFormData');
    sessionStorage.removeItem('registrationStep');
  }

  /**
   * Clear form data and flow state
   * Called when user navigates directly without going through signup
   */
  clearFormData(): void {
    this.formDataSubject.next(null);
    this.comingFromSignupSubject.next(false);
    this.stepSubject.next(1);
    sessionStorage.removeItem('comingFromSignup');
    sessionStorage.removeItem('registrationFormData');
    sessionStorage.removeItem('registrationStep');
  }

  /**
   * Load state from session storage on service initialization
   */
  private loadFromSessionStorage(): void {
    const comingFromSignup = sessionStorage.getItem('comingFromSignup') === 'true';
    const formData = sessionStorage.getItem('registrationFormData');
    const step = sessionStorage.getItem('registrationStep');

    this.comingFromSignupSubject.next(comingFromSignup);
    if (formData) {
      try {
        this.formDataSubject.next(JSON.parse(formData));
      } catch (e) {
        console.warn('Could not parse form data from session storage', e);
      }
    }
    if (step) {
      this.stepSubject.next(parseInt(step, 10));
    }
  }
}
