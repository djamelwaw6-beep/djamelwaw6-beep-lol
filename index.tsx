
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { importProvidersFrom } from '@angular/core';

import { AppComponent } from './src/app.component';
import { APP_ROUTES } from './src/app.routes';

// Import all components used in routing
import { LoginComponent } from './src/components/login/login.component';
import { AdminComponent } from './src/components/admin/admin.component';
import { StoreComponent } from './src/components/store/store.component';
import { CheckoutComponent } from './src/components/checkout/checkout.component';


bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withHashLocation()),
    importProvidersFrom(ReactiveFormsModule),
  ],
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.