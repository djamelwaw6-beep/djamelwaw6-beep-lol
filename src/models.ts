
export interface MarketingBot {
  id: string;
  name: string;
  enabled: boolean;
  discountPercentage: number;
  durationHours: number;
  productIds: number[];
  offerEndDate: string | null;
}

export interface ProductVariant {
  color: string;
  image?: string;
  sizes: string[];
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  variants: ProductVariant[];
}

export interface CartItem extends Product {
  quantity: number;
  cartId: string;
  selectedVariant?: ProductVariant;
}

export interface DeliveryCompany {
  id: number;
  name: string;
  fee: number;
}

export interface Wilaya {
  name: string;
  cost: number;
}

export interface Notifications {
  method: 'none' | 'whatsapp' | 'email' | 'messenger' | 'telegram' | 'webhook';
  destination: string;
  verified: boolean;
}

export interface StoreSection {
  id: number;
  name: string;
  productCount: number;
  columns: number;
  cardShape: string;
  cardAnimation: string;
}

export interface FooterSettings {
  aboutText: string;
  contactEmail: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    telegram: string;
    tiktok: string;
    youtube: string;
  };
  quickLinks: { label: string; url: string }[];
}

export interface Settings {
  storeName: string;
  heroTitle: string;
  logo: string;
  heroColor: string;
  heroFont: string;
  heroSize: string;
  heroAnimation: string;
  logoEffect: string;
  logoShape: string;
  bgImage: string;
  bgColor: string;
  bgOverlayColor: string;
  bgOverlayOpacity: number;
  cardBgColor: string;
  cardTextColor: string;
  cardBorderRadius: string;
  cardShadow: string;
  cardAnimation: string;
  cardAnimationSpeed: number;
  cardShape: string;
  cardShowTitle: boolean;
  cardShowPrice: boolean;
  notificationShape: string;
  offerDisplayType: 'beside-logo' | 'beside-cart' | 'above-hero';
  gridColumns: number;
  theme: 'light' | 'dark';
  storeSections: StoreSection[];
  deliveryCompanies: DeliveryCompany[];
  notifications: Notifications;
  marketingBots: MarketingBot[];
  footer: FooterSettings;
}

export interface CustomerInfo {
    name: string;
    phone: string;
    wilaya: string;
    city: string;
    email?: string;
    deliveryCompany: string;
}

export interface Order {
    id?: number;
    date?: string;
    customer: CustomerInfo;
    items: CartItem[];
    subtotal: number;
    shipping: number;
    deliveryFee: number;
    total: number;
    deliveryCompany: string;
    paymentMethod: string;
}
