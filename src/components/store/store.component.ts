
import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { SettingsService } from '../../services/settings.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { Product, ProductVariant, MarketingBot, StoreSection } from '../../models';

interface RenderedSection {
  isSection: true;
  section: StoreSection;
  products: Product[];
}
interface DefaultLayout {
  isSection: false;
  products: Product[];
  settings: {
    columns: number;
    cardShape: string;
    cardAnimation: string;
  }
}
type LayoutItem = RenderedSection | DefaultLayout;

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css'],
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreComponent {
  private router: Router = inject(Router);
  cartService = inject(CartService);
  settingsService = inject(SettingsService);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private document = inject(DOCUMENT);
  
  isAdminLoggedIn = this.authService.isLoggedIn;
  showGreetingIcon = signal(true);
  showPostCheckoutIcon = signal(false);
  readonly currentYear = new Date().getFullYear();

  products = this.productService.products;
  settings = this.settingsService.settings;
  categories = computed(() => [...new Set(this.products().map(p => p.category))]);
  
  activeFilter = signal('all');
  
  // Logic to filter products based on category or bot offer
  filteredProducts = computed(() => {
    const products = this.products();
    const filter = this.activeFilter();

    if (filter.startsWith('bot-offer-')) {
        const botId = filter.replace('bot-offer-', '');
        const offer = this.settingsService.settings().marketingBots.find(b => b.id === botId);
        if (offer) {
            return products.filter(p => offer.productIds.includes(p.id));
        }
    }

    switch (filter) {
      case 'all':
        return products;
      default:
        return products.filter(p => p.category === filter);
    }
  });
  
  showCart = signal(false);
  selectedProduct = signal<Product | null>(null);
  selectedVariant = signal<ProductVariant | null>(null);
  
  showShareOptions = signal(false);
  isLinkCopied = signal(false);
  readonly canShareNatively = typeof navigator !== 'undefined' && !!navigator.share;
  
  cart = this.cartService.cart;
  cartCount = this.cartService.cartCount;
  cartTotal = this.cartService.subtotal;

  private interactiveEffects = [
    'magnetic-tilt', 'floating-elements', 'directional-glare', 
    'spotlight-focus', 'liquid-distortion', 'liquid-distortion-v2', 
    'glitch-effect', 'color-shift-hover'
  ];

  private offerInterval: any;
  offerTimeRemaining = signal('');

  // --- Showcase Mode Logic ---
  isShowcaseOpen = signal(false);
  currentShowcaseIndex = signal(0);
  isShowcasePaused = signal(false);
  showcaseProgress = signal(0);
  
  showcaseIntroVisible = signal(true); 
  showcaseDetailsVisible = signal(false);
  
  private showcaseTimer: any;
  private showcaseProgressTimer: any;
  private showcaseIntroTimer: any;
  
  private readonly SHOWCASE_DURATION = 6000;
  private readonly PROGRESS_STEP = 50;

  activeBotOffer = computed<MarketingBot | null>(() => {
    const bots = this.settingsService.settings().marketingBots;
    const now = new Date();
    return bots.find(bot => 
      bot.enabled && bot.offerEndDate && new Date(bot.offerEndDate) > now
    ) || null;
  });

  isViewingBotOffer = computed(() => this.activeFilter().startsWith('bot-offer-'));

  discountedPriceMap = computed(() => {
      const offer = this.activeBotOffer();
      if (!offer) return new Map<number, number>();

      const productMap = new Map<number, number>();
      for (const productId of offer.productIds) {
          const product = this.products().find(p => p.id === productId);
          if (product) {
              const newPrice = product.price * (1 - offer.discountPercentage / 100);
              productMap.set(productId, newPrice);
          }
      }
      return productMap;
  });

  isOfferGridModalOpen = signal(false);
  offerProducts = computed(() => {
    const offer = this.activeBotOffer();
    if (!offer) return [];
    return this.products().filter(p => offer.productIds.includes(p.id));
  });

  renderedLayout = computed<LayoutItem[]>(() => {
    const products = [...this.filteredProducts()];
    const sections = this.settings().storeSections;
    const globalSettings = this.settings();
    const layout: LayoutItem[] = [];

    for (const section of sections) {
      if (products.length === 0) break;
      const sectionProducts = products.splice(0, section.productCount);
      layout.push({
        isSection: true,
        section: section,
        products: sectionProducts
      });
    }

    if (products.length > 0) {
      layout.push({
        isSection: false,
        products: products,
        settings: {
          columns: globalSettings.gridColumns,
          cardShape: globalSettings.cardShape,
          cardAnimation: globalSettings.cardAnimation
        }
      });
    }
    
    return layout;
  });

  constructor() {
    effect((onCleanup) => {
        const offer = this.activeBotOffer();
        if (offer && offer.offerEndDate) {
            this.updateOfferTimeRemaining();
            this.offerInterval = setInterval(() => this.updateOfferTimeRemaining(), 1000);
        }

        onCleanup(() => {
            if (this.offerInterval) {
                clearInterval(this.offerInterval);
            }
            this.stopShowcase();
        });
    });
    
    if (this.orderService.orderJustPlaced()) {
        this.showGreetingIcon.set(false);
        this.showPostCheckoutIcon.set(true);
        setTimeout(() => this.showPostCheckoutIcon.set(false), 6000);
        this.orderService.orderJustPlaced.set(false); 
    } else {
        setTimeout(() => this.showGreetingIcon.set(false), 10000);
    }
  }
  
  getCardAnimationClass(index: number, baseAnimation: string): string {
    if (baseAnimation === 'random-mix') {
        const effect = this.interactiveEffects[index % this.interactiveEffects.length];
        return 'card-animate-' + effect;
    }
    return 'card-animate-' + baseAnimation;
  }
  
  onCardMouseMove(event: MouseEvent, index: number, baseAnimation: string) {
    const card = event.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
    
    let concreteAnimation = baseAnimation;
    if (baseAnimation === 'random-mix') {
        concreteAnimation = this.interactiveEffects[index % this.interactiveEffects.length];
    }
    
    if (concreteAnimation === 'magnetic-tilt' || concreteAnimation === 'floating-elements') {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 15;
      const rotateY = (centerX - x) / 15;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    }
  }

  onCardMouseLeave(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    card.style.removeProperty('--mouse-x');
    card.style.removeProperty('--mouse-y');
    card.style.transform = ''; 
  }

  updateOfferTimeRemaining() {
    const offer = this.activeBotOffer();
    if (!offer || !offer.offerEndDate) {
        this.offerTimeRemaining.set('');
        return;
    }
    const endDate = new Date(offer.offerEndDate).getTime();
    const now = new Date().getTime();
    const distance = endDate - now;

    if (distance < 0) {
        this.offerTimeRemaining.set('انتهى العرض');
        if(this.offerInterval) clearInterval(this.offerInterval);
        return;
    }
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    const pad = (num: number) => num.toString().padStart(2, '0');
    this.offerTimeRemaining.set(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
  }

  openOfferGridModal() { this.isOfferGridModalOpen.set(true); }
  closeOfferGridModal() { this.isOfferGridModalOpen.set(false); }
  
  selectProductFromGrid(product: Product) {
    this.closeOfferGridModal();
    setTimeout(() => this.openProductModal(product), 150);
  }

  setFilter(category: string) {
    this.activeFilter.set(category);
  }
  
  addToCartFromModal(product: Product, event: MouseEvent) {
    event.stopPropagation();
    let finalProduct = { ...product };
    const priceMap = this.discountedPriceMap();
    if (priceMap.has(product.id)) {
        finalProduct.price = priceMap.get(product.id)!;
    }
    this.cartService.addToCart(finalProduct, this.selectedVariant());
    this.closeProductModal();
    
    if(this.isShowcaseOpen()) {
        this.settingsService.showToast('تمت الإضافة إلى السلة');
        this.showcaseDetailsVisible.set(false);
        this.resumeShowcase();
    }
  }
  
  openProductModal(product: Product) {
    this.selectedProduct.set(product);
    if (product.variants && product.variants.length > 0) {
      this.selectedVariant.set(product.variants[0]);
    } else {
      this.selectedVariant.set(null);
    }
  }

  closeProductModal() {
    this.selectedProduct.set(null);
    this.selectedVariant.set(null);
    this.closeShare();
  }
  
  selectVariant(variant: ProductVariant) {
    this.selectedVariant.set(variant);
  }
  
  goToCheckout() {
    if (this.cart().length > 0) {
      this.showCart.set(false);
      this.closeShowcase();
      this.router.navigate(['/checkout']);
    }
  }

  toggleShare(event: MouseEvent) {
    event.stopPropagation();
    this.showShareOptions.update(v => !v);
    if(this.showShareOptions()){
        this.isLinkCopied.set(false);
    }
  }

  closeShare() { this.showShareOptions.set(false); }

  private getValidUrl(): string {
      try {
          if (typeof window !== 'undefined' && window.location) {
              const url = window.location.href;
              if (url.startsWith('http://') || url.startsWith('https://')) {
                  return url;
              }
          }
      } catch (e) {
          console.warn('Current URL is invalid for sharing, using fallback.');
      }
      return 'https://example.com'; // Standard valid URL to prevent crash
  }

  shareTo(platform: 'facebook' | 'telegram', product: Product) {
      const validUrl = this.getValidUrl();
      const url = encodeURIComponent(validUrl);
      const text = encodeURIComponent(`اكتشف هذا المنتج الرائع: ${product.name}!`);
      let shareUrl = '';
      if (platform === 'facebook') {
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      } else if (platform === 'telegram') {
          shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
      }
      if(shareUrl) { window.open(shareUrl, '_blank'); }
      this.closeShare();
  }

  copyLink() {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(this.getValidUrl()).then(() => {
              this.isLinkCopied.set(true);
              setTimeout(() => {
                  this.isLinkCopied.set(false);
                  this.closeShare();
              }, 1500);
          }).catch(err => console.error('Failed to copy: ', err));
      } else {
        alert('خاصية نسخ الرابط غير مدعومة في هذا المتصفح.');
      }
  }

  nativeShare(product: Product) {
      const validUrl = this.getValidUrl();
      const shareData = {
          title: product.name,
          text: `اكتشف هذا المنتج الرائع: ${product.name}!\n${product.description}`,
          url: validUrl
      };
      if (this.canShareNatively) {
          navigator.share(shareData)
              .then(() => this.closeShare())
              .catch((error) => console.log('Error sharing:', error));
      }
  }

  // --- Showcase Implementation ---
  
  openShowcase() {
    if(this.products().length === 0) return;
    this.isShowcaseOpen.set(true);
    this.currentShowcaseIndex.set(0);
    this.startShowcase();
  }

  closeShowcase() {
    this.isShowcaseOpen.set(false);
    this.stopShowcase();
  }

  startShowcase() {
    this.stopShowcase();
    this.showcaseProgress.set(0);
    this.isShowcasePaused.set(false);
    this.resetSlideState();

    this.showcaseProgressTimer = setInterval(() => {
        if (!this.isShowcasePaused() && !this.showcaseDetailsVisible()) {
            this.showcaseProgress.update(v => {
                if (v >= 100) {
                    this.nextShowcaseItem();
                    return 0;
                }
                return v + (this.PROGRESS_STEP / this.SHOWCASE_DURATION) * 100;
            });
        }
    }, this.PROGRESS_STEP);
  }
  
  resetSlideState() {
      this.showcaseDetailsVisible.set(false);
      this.showcaseIntroVisible.set(true);
      
      const currentProduct = this.products()[this.currentShowcaseIndex()];
      if(currentProduct && currentProduct.variants && currentProduct.variants.length > 0) {
          this.selectedVariant.set(currentProduct.variants[0]);
      } else {
          this.selectedVariant.set(null);
      }

      if (this.showcaseIntroTimer) clearTimeout(this.showcaseIntroTimer);
      
      this.showcaseIntroTimer = setTimeout(() => {
          this.showcaseIntroVisible.set(false);
      }, 3000);
  }

  stopShowcase() {
    if (this.showcaseTimer) clearInterval(this.showcaseTimer);
    if (this.showcaseProgressTimer) clearInterval(this.showcaseProgressTimer);
    if (this.showcaseIntroTimer) clearTimeout(this.showcaseIntroTimer);
  }

  nextShowcaseItem() {
    this.showcaseProgress.set(0);
    this.currentShowcaseIndex.update(i => (i + 1) % this.products().length);
    this.resetSlideState();
  }

  prevShowcaseItem() {
    this.showcaseProgress.set(0);
    this.currentShowcaseIndex.update(i => (i - 1 + this.products().length) % this.products().length);
    this.resetSlideState();
  }
  
  handleShowcaseClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.closest('button') || target.closest('.showcase-details-card')) {
          return;
      }
      
      this.toggleShowcaseDetails();
  }

  toggleShowcaseDetails() {
      this.showcaseDetailsVisible.update(v => !v);
      if (this.showcaseDetailsVisible()) {
          this.pauseShowcase();
          this.showcaseIntroVisible.set(false);
      } else {
          this.resumeShowcase();
      }
  }

  pauseShowcase() {
    this.isShowcasePaused.set(true);
  }

  resumeShowcase() {
    this.isShowcasePaused.set(false);
  }

  getStoryAnimation(index: number): string {
      const animations = ['ken-burns', 'ken-burns-right', 'zoom-out', 'pan-left'];
      return animations[index % animations.length];
  }
}
