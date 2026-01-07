
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  // FIX: Explicitly type injected Router to resolve 'unknown' type error.
  const router: Router = inject(Router);

  // Prioritize the live, in-memory signal. This avoids race conditions with localStorage.
  if (authService.isLoggedIn()) {
    return true;
  }

  // As a fallback for page reloads, check localStorage.
  const isStorageLoggedIn = typeof localStorage !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';
  if (isStorageLoggedIn) {
    // If storage is logged in but the signal isn't (e.g., after a refresh), sync the signal.
    authService.isLoggedIn.set(true);
    return true;
  }
  
  // If neither are true, redirect to login.
  return router.createUrlTree(['/login']);
};
