
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet />

    @if (toastState().visible) {
      <div class="notification-container bottom-4 right-4 animate-slide-in-down"
           [class]="'notification-style-' + settings().notificationShape">
        <div class="notification-content">
          <img [src]="settings().logo || 'https://picsum.photos/40/40'" alt="Store Logo" class="notification-logo" />
          <div>
            <div class="notification-title">إشعار المتجر</div>
            <div class="notification-subtitle">{{ toastState().message }}</div>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './app.component.css', // Changed to styleUrl for consistency if needed, though inline style is fine too
  imports: [CommonModule, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  settingsService = inject(SettingsService);
  toastState = this.settingsService.toastState;
  settings = this.settingsService.settings;
}