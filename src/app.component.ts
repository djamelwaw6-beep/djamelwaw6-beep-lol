import { Component, effect, inject, Renderer2, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  private settingsService = inject(SettingsService);
  private renderer = inject(Renderer2);
  // FIX: Explicitly type injected DOCUMENT to resolve 'unknown' type error.
  private document: Document = inject(DOCUMENT);
  // FIX: Explicitly type injected Title to resolve 'unknown' type error.
  private titleService: Title = inject(Title);

  settings = this.settingsService.settings;
  toastState = this.settingsService.toastState;

  constructor() {
    effect(() => {
      const currentSettings = this.settingsService.settings();
      this.titleService.setTitle(`${currentSettings.storeName} | Platinum Store Pro`);
      
      if (currentSettings.theme === 'dark') {
        this.renderer.addClass(this.document.documentElement, 'dark');
      } else {
        this.renderer.removeClass(this.document.documentElement, 'dark');
      }
    });
  }
}
