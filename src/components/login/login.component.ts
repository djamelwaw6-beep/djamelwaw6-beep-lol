
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { signal } from '@angular/core';
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  // FIX: Explicitly type injected FormBuilder to resolve 'unknown' type error.
  private fb: FormBuilder = inject(FormBuilder);
  settingsService = inject(SettingsService);
  private authService = inject(AuthService);

  error = signal(false);
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  login(): void {
    this.error.set(false);
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) {
      return;
    }

    // This is a mock login. In a real app, you'd call an auth service.
    if (this.loginForm.get('password')?.value === 'google$5') {
      this.authService.login();
    } else {
      this.error.set(true);
    }
  }
}
