// src/app/ui.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ImageViewerState {
  url: string;
}

export interface StatusPopupState {
  message: string;
  type: 'success' | 'error';
}

export interface FgPopupState {
  show: boolean;
  data?: any; // optional data to pass into popup
}

@Injectable({
  providedIn: 'root'
})
export class UiService {

  // =========================
  // OTP POPUP
  // =========================
  private otpSubject = new BehaviorSubject<boolean>(false);
  readonly showOtp$: Observable<boolean> = this.otpSubject.asObservable();

  openOtp(): void {
    this.otpSubject.next(true);
  }

  closeOtp(): void {
    this.otpSubject.next(false);
  }

  // =========================
  // IMAGE VIEWER
  // =========================
  private imageSubject = new BehaviorSubject<ImageViewerState | null>(null);
  readonly showImage$: Observable<ImageViewerState | null> = this.imageSubject.asObservable();

  openImage(url: string): void {
    if (!url) return;
    this.imageSubject.next({ url });
  }

  closeImage(): void {
    this.imageSubject.next(null);
  }

  // =========================
  // STATUS POPUP
  // =========================
  private statusSubject = new BehaviorSubject<StatusPopupState | null>(null);
  readonly showStatus$: Observable<StatusPopupState | null> = this.statusSubject.asObservable();

  private statusTimeout: any;

  showStatus(message: string, type: 'success' | 'error', duration: number = 3000): void {

    if (!message) return;

    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
    }

    this.statusSubject.next({ message, type });

    this.statusTimeout = setTimeout(() => {
      this.closeStatus();
    }, duration);
  }

  showSuccess(message: string, duration?: number): void {
    this.showStatus(message, 'success', duration);
  }

  showError(message: string, duration?: number): void {
    this.showStatus(message, 'error', duration);
  }

  closeStatus(): void {
    this.statusSubject.next(null);
  }

  // =========================
  // FG POPUP (GENERIC)
  // =========================
  private fgPopupSubject = new BehaviorSubject<FgPopupState>({
    show: false
  });

  readonly showFgPopup$: Observable<FgPopupState> =
    this.fgPopupSubject.asObservable();

  openFgPopup(data?: any): void {
    this.fgPopupSubject.next({
      show: true,
      data: data || null
    });
  }

  closeFgPopup(): void {
    this.fgPopupSubject.next({
      show: false,
      data: null
    });
  }

}