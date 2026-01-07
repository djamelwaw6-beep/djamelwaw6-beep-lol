
import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // FIX: Explicitly type injected Router to resolve 'unknown' type error.
  private router: Router = inject(Router);
  isLoggedIn = signal<boolean>(false);

  constructor() {
    if (typeof localStorage !== 'undefined') {
      this.isLoggedIn.set(localStorage.getItem('isLoggedIn') === 'true');
    }
  }

  login(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('isLoggedIn', 'true');
    }
    this.isLoggedIn.set(true);
    this.router.navigate(['/admin']);
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
    }
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }
}
