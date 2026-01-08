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
    heroSize: '4rem', // Changed default size
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
    cardAnimationSpeed: 0.25, // Default to a reasonable speed in seconds
    cardShape: 'default',
    cardShowTitle: false,
    cardShowPrice: false,
    notificationShape: 'default',
    offerDisplayType: 'beside-cart',
    gridColumns: 4,
    theme: 'dark',
    // Added default sections with different designs as requested
    storeSections: [
        {
            id: 101,
            name: 'وصل حديثاً',
            productCount: 4,
            columns: 4,
            cardShape: 'default',
            cardAnimation: 'magnetic-tilt'
        },
        {
            id: 102,
            name: 'الأكثر مبيعاً',
            productCount: 4,
            columns: 2,
            cardShape: 'circle',
            cardAnimation: 'spotlight-focus'
        }
    ],
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
        let parsed: Partial<Settings> = JSON.parse(saved);
        
        const defaults = this.defaultSettings;

        // FIX: Explicitly cast to 'any' to handle the potential existence of a deprecated property for migration purposes.
        // Handle migration from logoAnimation to logoEffect
        if ((parsed as any).logoAnimation && !parsed.logoEffect) {
          (parsed as any).logoEffect = (parsed as any).logoAnimation;
          delete (parsed as any).logoAnimation;
        }

        // Apply defaults for missing properties
        parsed = { ...defaults, ...parsed };
        
        // Ensure specific nested objects are fully populated
        parsed.notifications = { ...defaults.notifications, ...parsed.notifications };
        parsed.footer = { ...defaults.footer, ...parsed.footer };
        parsed.footer!.socialLinks = { ...defaults.footer.socialLinks, ...parsed.footer!.socialLinks };
        
        // Ensure quickLinks array exists and has structure, add defaults if empty or missing
        if(!parsed.footer!.quickLinks || parsed.footer!.quickLinks.length === 0) {
            parsed.footer!.quickLinks = defaults.footer.quickLinks;
        }

        // Validate specific enum-like properties
        const validDisplayTypes: (typeof defaults.offerDisplayType)[] = ['beside-logo', 'beside-cart', 'above-hero'];
        if (parsed.offerDisplayType && !validDisplayTypes.includes(parsed.offerDisplayType)) {
            parsed.offerDisplayType = defaults.offerDisplayType;
        }
        
        const validLogoEffects = ['none', 'pulse', 'rotate', 'bounce', 'sparkle', 'glow', '3d-effect']; // Simplified for now, can be expanded
        if (parsed.logoEffect && !validLogoEffects.includes(parsed.logoEffect)) {
            parsed.logoEffect = defaults.logoEffect;
        }

        const validHeroFonts = ["'Tajawal', sans-serif", "'Cairo', sans-serif", "'Amiri', serif", "'Changa', sans-serif", "'Noto Kufi Arabic', sans-serif", "'Markazi Text', serif", "'IBM Plex Sans Arabic', sans-serif"];
        if (parsed.heroFont && !validHeroFonts.includes(parsed.heroFont)) {
            parsed.heroFont = defaults.heroFont;
        }

        // Ensure cardAnimationSpeed is a number
        if (typeof parsed.cardAnimationSpeed !== 'number' || isNaN(parsed.cardAnimationSpeed)) {
            parsed.cardAnimationSpeed = defaults.cardAnimationSpeed;
        }

        return parsed as Settings; // Cast back to full Settings interface
      }
      return this.defaultSettings;
    } catch (e) {
      console.error('Failed to load settings from localStorage, falling back to defaults', e);
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