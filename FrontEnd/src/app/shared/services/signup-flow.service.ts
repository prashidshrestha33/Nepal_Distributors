import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SignupFlowService {
  private companyId: number | null = null;

  setCompanyId(id: number) {
    this.companyId = id;
  }

  getCompanyId(): number | null {
    return this.companyId;
  }

  clear() {
    this.companyId = null;
  }
}
