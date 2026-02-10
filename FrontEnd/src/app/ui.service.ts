// src/app/ui.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ImageViewerState {
  url: string;
}

export interface StatusPopupState {
  message: string;
  type: 'success' | 'error'; // success = tick, error = cross
}

@Injectable({
  providedIn: 'root'
})
export class UiService {
  // ------------------
  // OTP popup
  // ------------------
  private _showOtp = new BehaviorSubject<boolean>(false);
  readonly showOtp$: Observable<boolean> = this._showOtp.asObservable();

  openOtp(): void { this._showOtp.next(true); }
  closeOtp(): void { this._showOtp.next(false); }

  // ------------------
  // Image Viewer
  // ------------------
  private _showImage = new BehaviorSubject<ImageViewerState | null>(null);
  readonly showImage$: Observable<ImageViewerState | null> = this._showImage.asObservable();

  openImage(url: string): void { this._showImage.next({ url }); }
  closeImage(): void { this._showImage.next(null); }

  // ------------------
  // Status Popup
  // ------------------
  private _showStatus = new BehaviorSubject<StatusPopupState | null>(null);
  readonly showStatus$: Observable<StatusPopupState | null> = this._showStatus.asObservable();

  showStatus(message: string, type: 'success' | 'error'): void {
    this._showStatus.next({ message, type });
  }
  closeStatus(): void { this._showStatus.next(null); }

  // ------------------
  // Company Profile Popup
  // ------------------
  private _showCompanyProfile = new BehaviorSubject<number | null>(null);
  readonly showCompanyProfile$: Observable<number | null> = this._showCompanyProfile.asObservable();

  openCompanyProfile(companyId: number): void {
    this._showCompanyProfile.next(companyId);
  }

  closeCompanyProfile(): void {
    this._showCompanyProfile.next(null);
  }
}
