
import { Injectable, signal } from '@angular/core';
import { Settings, DeliveryCompany, MarketingBot, Product, StoreSection } from '../models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private defaultSettings: Settings = {
    storeName: 'المتجر البلاتيني',
    heroTitle: 'جودة بلاتينية وأناقة عصرية',
    logo: 'https://via.placeholder.com/150?text=Logo',
    heroColor: '#ffffff',
    heroFont: "'Tajawal', sans-serif",
    heroSize: '4rem',
    heroAnimation: 'slide',
    logoEffect: 'none',
    logoShape: 'monogram',
    bgImage: 'https://picsum.photos/1920/1080?grayscale&blur=3',
    bgColor: '#0f172a',
    bgOverlayColor: '#000000',
    bgOverlayOpacity: 0.3,
    cardBgColor: '#ffffff',
    cardTextColor: '#1e293b',
    // cardBorderRadius removed, relying on cardShape CSS classes
    cardBorderRadius: '1.5rem', 
    cardShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    cardAnimation: 'magnetic-tilt',
    cardAnimationSpeed: 25,
    cardShape: 'default',
    cardShowTitle: false,
    cardShowPrice: false,
    notificationShape: 'default',
    offerDisplayType: 'beside-cart',
    gridColumns: 4,
    theme: 'dark',
    storeSections: [],
    deliveryCompanies: [
      { id: 1, name: 'ياليدين إكسبريس', fee: 600 },
      { id: 2, name: 'أخرى', fee: 700 },
    ],
    notifications: {
      method: 'none',
      destination: '',
      verified: false,
    },
    marketingBots: [
      {
        id: 'waw',
        name: 'المسوق WAW',
        enabled: false,
        discountPercentage: 20,
        durationHours: 24,
        productIds: [],
        offerEndDate: null,
      }
    ],
    footer: {
        aboutText: 'نحن متجر رائد في تقديم أفضل المنتجات العصرية بجودة عالية وأسعار تنافسية. نسعى دائماً لرضاكم وتوفير تجربة تسوق فريدة.',
        contactEmail: 'contact@example.com',
        socialLinks: {
            facebook: 'https://facebook.com',
            instagram: 'https://instagram.com',
            twitter: 'https://twitter.com',
            telegram: 'https://telegram.org',
            tiktok: '',
            youtube: ''
        },
        quickLinks: [
            { label: 'من نحن', url: '#' },
            { label: 'سياسة الخصوصية', url: '#' },
            { label: 'الشروط والأحكام', url: '#' }
        ]
    }
  };

  settings = signal<Settings>(this.loadSettings());
  
  toastState = signal<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });
  private timerId: any = null;

  private loadSettings(): Settings {
    try {
      const saved = localStorage.getItem('platinumStoreSettings');
      if (saved) {
        let parsed = JSON.parse(saved);
        
        const defaults = this.defaultSettings;

        // Handle migration from logoAnimation to logoEffect
        if (parsed.logoAnimation && !parsed.logoEffect) {
          parsed.logoEffect = parsed.logoAnimation;
          delete parsed.logoAnimation;
        }

        parsed = { ...defaults, ...parsed };
        
        // Ensure notifications object is fully populated
        parsed.notifications = { ...defaults.notifications, ...parsed.notifications };
        
        // Ensure footer object is fully populated
        parsed.footer = { ...defaults.footer, ...parsed.footer };
        parsed.footer.socialLinks = { ...defaults.footer.socialLinks, ...parsed.footer.socialLinks };
        // Ensure quickLinks array exists and has structure
        if(!parsed.footer.quickLinks || parsed.footer.quickLinks.length === 0) {
            parsed.footer.quickLinks = defaults.footer.quickLinks;
        }

        const validDisplayTypes: (typeof defaults.offerDisplayType)[] = ['beside-logo', 'beside-cart', 'above-hero'];
        if (!validDisplayTypes.includes(parsed.offerDisplayType)) {
            parsed.offerDisplayType = defaults.offerDisplayType;
        }
        
        const validLogoEffects = ['none', 'pulse', 'rotate', 'bounce', 'sparkle', 'wave', 'glow', 'shine', 'color-shift', '3d-effect'];
        if (!validLogoEffects.includes(parsed.logoEffect)) {
            parsed.logoEffect = defaults.logoEffect;
        }

        return parsed;
      }
      return this.defaultSettings;
    } catch (e) {
      console.error('Failed to load settings from localStorage', e);
      return this.defaultSettings;
    }
  }

  private saveSettings(settings: Settings) {
    localStorage.setItem('platinumStoreSettings', JSON.stringify(settings));
  }

  showToast(message: string) {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    this.toastState.set({ message, visible: true });
    this.timerId = setTimeout(() => {
      this.toastState.update(state => ({ ...state, visible: false }));
      this.timerId = null;
    }, 4000);
  }

  updateSettings(newSettings: Partial<Settings>) {
    this.settings.update(current => {
      const updated = { ...current, ...newSettings };
      this.saveSettings(updated);
      return updated;
    });
  }

  addDeliveryCompany(company: Omit<DeliveryCompany, 'id'>) {
    this.settings.update(current => {
      const newCompany = { ...company, id: Date.now() };
      const updated = { ...current, deliveryCompanies: [...current.deliveryCompanies, newCompany] };
      this.saveSettings(updated);
      return updated;
    });
  }

  updateDeliveryCompany(updatedCompany: DeliveryCompany) {
    this.settings.update(current => {
      const companies = current.deliveryCompanies.map(c => c.id === updatedCompany.id ? updatedCompany : c);
      const updated = { ...current, deliveryCompanies: companies };
      this.saveSettings(updated);
      return updated;
    });
  }

  deleteDeliveryCompany(id: number) {
    this.settings.update(current => {
      const companies = current.deliveryCompanies.filter(c => c.id !== id);
      const updated = { ...current, deliveryCompanies: companies };
      this.saveSettings(updated);
      return updated;
    });
  }

  // Store Section Methods
  addStoreSection(section: Omit<StoreSection, 'id'>) {
    this.settings.update(current => {
      const newSection = { ...section, id: Date.now() };
      const updated = { ...current, storeSections: [...current.storeSections, newSection] };
      this.saveSettings(updated);
      return updated;
    });
  }

  updateStoreSection(updatedSection: StoreSection) {
    this.settings.update(current => {
      const sections = current.storeSections.map(s => s.id === updatedSection.id ? updatedSection : s);
      const updated = { ...current, storeSections: sections };
      this.saveSettings(updated);
      return updated;
    });
  }

  deleteStoreSection(id: number) {
    this.settings.update(current => {
      const sections = current.storeSections.filter(s => s.id !== id);
      const updated = { ...current, storeSections: sections };
      this.saveSettings(updated);
      return updated;
    });
  }

  // Marketing Bot Methods
  addMarketingBot(bot: Omit<MarketingBot, 'id' | 'enabled' | 'offerEndDate'>) {
    this.settings.update(current => {
      const newBot: MarketingBot = {
        ...bot,
        id: `bot_${Date.now()}`,
        enabled: false,
        offerEndDate: null
      };
      const updated = { ...current, marketingBots: [...current.marketingBots, newBot] };
      this.saveSettings(updated);
      return updated;
    });
  }

  updateMarketingBot(updatedBot: MarketingBot) {
    this.settings.update(current => {
      const bots = current.marketingBots.map(b => b.id === updatedBot.id ? updatedBot : b);
      const updated = { ...current, marketingBots: bots };
      this.saveSettings(updated);
      return updated;
    });
  }

  deleteMarketingBot(botId: string) {
    this.settings.update(current => {
      const bots = current.marketingBots.filter(b => b.id !== botId);
      const updated = { ...current, marketingBots: bots };
      this.saveSettings(updated);
      return updated;
    });
  }
}
