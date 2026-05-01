import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MfaService } from '../../services/mfa.service';

@Component({
  selector: 'app-mfa-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mfa-verify.html',
})
export class MfaVerifyComponent implements OnInit {
  challenge: string | null = null;
  emailHint: string | null = null;
  code = '';
  rememberDevice = true;
  isVerifying = false;
  isResending = false;
  errorMessage = '';
  resendCooldown = 0;
  attemptsRemaining: number | null = null;

  constructor(private router: Router, private mfa: MfaService) {}

  ngOnInit() {
    const nav = history.state || {};
    this.challenge = nav.challenge ?? sessionStorage.getItem('mfa_challenge');
    this.emailHint = nav.emailHint ?? sessionStorage.getItem('mfa_email_hint');

    if (this.challenge) sessionStorage.setItem('mfa_challenge', this.challenge);
    if (this.emailHint) sessionStorage.setItem('mfa_email_hint', this.emailHint);

    if (!this.challenge) {
      this.router.navigate(['/login']);
    }
  }

  onCodeInput(value: string) {
    this.code = value.replace(/\D/g, '').slice(0, 6);
  }

  verify() {
    if (!this.challenge || this.code.length !== 6 || this.isVerifying) return;
    this.isVerifying = true;
    this.errorMessage = '';

    this.mfa.verify(this.challenge, this.code, this.rememberDevice).subscribe({
      next: (response) => {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        if (response.trust_token) {
          this.mfa.setTrustToken(response.trust_token);
        }
        sessionStorage.removeItem('mfa_challenge');
        sessionStorage.removeItem('mfa_email_hint');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isVerifying = false;
        const body = err?.error || {};
        this.errorMessage = body.message || 'Verification failed.';
        this.attemptsRemaining = typeof body.attempts_remaining === 'number'
          ? body.attempts_remaining
          : null;

        if (err?.status === 429 && this.attemptsRemaining === null) {
          // Too many attempts — kick back to login.
          sessionStorage.removeItem('mfa_challenge');
          sessionStorage.removeItem('mfa_email_hint');
          setTimeout(() => this.router.navigate(['/login']), 1500);
        }
      }
    });
  }

  resend() {
    if (!this.challenge || this.isResending || this.resendCooldown > 0) return;
    this.isResending = true;
    this.errorMessage = '';

    this.mfa.resend(this.challenge).subscribe({
      next: () => {
        this.isResending = false;
        this.startCooldown(60);
      },
      error: (err) => {
        this.isResending = false;
        const body = err?.error || {};
        this.errorMessage = body.message || 'Could not resend code.';
        if (typeof body.retry_after === 'number') {
          this.startCooldown(body.retry_after);
        }
      }
    });
  }

  cancel() {
    sessionStorage.removeItem('mfa_challenge');
    sessionStorage.removeItem('mfa_email_hint');
    this.router.navigate(['/login']);
  }

  private startCooldown(seconds: number) {
    this.resendCooldown = seconds;
    const tick = () => {
      this.resendCooldown -= 1;
      if (this.resendCooldown > 0) setTimeout(tick, 1000);
    };
    setTimeout(tick, 1000);
  }
}
