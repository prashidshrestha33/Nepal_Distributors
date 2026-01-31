import { Component, OnInit, OnDestroy, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../../../ui.service';
import { Observable, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-otp-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './otp-popup.component.html',
  styleUrls: ['./otp-popup.component.css']
})
export class OtpPopupComponent implements OnInit, OnDestroy {

  @ViewChild('hiddenInput') hiddenInput!: ElementRef<HTMLInputElement>;

  @Output() submitOtp = new EventEmitter<string>(); // <-- Add this
  @Output() resendOtp = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  otp: string = ''; // full OTP string
  otpArray: string[] = ['', '', '', '', '', '']; // for display
  timer = 120;
  intervalId: any;
  canResend = false;

  show$: Observable<boolean>;
  showSub!: Subscription;

  constructor(private ui: UiService) {
    this.show$ = this.ui.showOtp$;
  }

  ngOnInit() {
    this.showSub = this.show$.subscribe(show => {
      if (show) {
        this.startTimer();
        setTimeout(() => this.focusInput(), 50);
      } else {
        this.clearTimer();
        this.resetOtp();
      }
    });
  }

  ngOnDestroy() {
    this.showSub.unsubscribe();
    this.clearTimer();
  }

  focusInput() {
    this.hiddenInput?.nativeElement.focus();
  }

  onInput(event: Event) {
    const input = (event.target as HTMLInputElement).value.toUpperCase();
    const valid = /^[A-Z0-9]*$/;
    if (!valid.test(input)) {
      (event.target as HTMLInputElement).value = this.otp;
      return;
    }

    this.otp = input.slice(0, 6);
    this.otpArray = this.otp.split('');
    while (this.otpArray.length < 6) this.otpArray.push('');
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Backspace' && this.otp.length > 0) {
      this.otp = this.otp.slice(0, -1);
      this.otpArray = this.otp.split('');
      while (this.otpArray.length < 6) this.otpArray.push('');
    }
  }

  startTimer() {
    this.timer = 60;
    this.canResend = false;
    this.intervalId = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        this.canResend = true;
        this.clearTimer();
      }
    }, 1000);
  }

  clearTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // ✅ Fixed submit
  submit() {
    if (this.otp.length === 6) {
      this.submitOtp.emit(this.otp); // send string to parent
      this.ui.closeOtp();
    }
  }

  resend() {
    if (!this.canResend) return;
    this.resetOtp();
    this.resendOtp.emit(); // emit resend event
    this.startTimer();
    setTimeout(() => this.focusInput(), 50);
  }

  closePopup() {
    this.ui.closeOtp();
    this.clearTimer();
    this.resetOtp();
    this.close.emit(); // emit close event
  }

  private resetOtp() {
    this.otp = '';
    this.otpArray = ['', '', '', '', '', ''];
  }
}
