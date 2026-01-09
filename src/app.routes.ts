
import { Routes } from '@angular/router';
import { authGuard } from './auth.guard'; // Assuming authGuard is in this path

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'store', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard]
  },
  {
    path: 'store',
    loadComponent: () => import('./components/store/store.component').then(m => m.StoreComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./components/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  { path: '**', redirectTo: 'store' } // Catch-all for unknown routes
];