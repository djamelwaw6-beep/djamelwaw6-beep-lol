
import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, OnDestroy, HostBinding, HostListener } from '@angular/core';
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
  host: {
    '[class.dark]': 'settings().theme === "dark"',
    '[class.light]': 'settings().theme === "light"',
    '[style.--bg-image]': 'settings().bgImage ? "url(" + settings().bgImage + ")" : "none"',
    '[style.--bg-color]': 'settings().bgColor',
    '[style.--bg-overlay-color]': 'settings().bgOverlayColor',
    '[style.--bg-overlay-opacity]': 'settings().bgOverlayOpacity',
    '[style.cursor]': 'isGrabbing() ? "grabbing" : "default"',
    '[class.grabbing-active]': 'isGrabbing()',
  }
})
export class StoreComponent implements OnDestroy {
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
    
    if (filter === 'all') {
      return products;
    }
    
    // Check if filter is a category
    if (this.categories().includes(filter)) {
      return products.filter(p => p.category === filter);
    }

    // Check if filter is a bot offer (only one active at a time for simplicity)
    const activeBot = this.activeBotOffer();
    if (activeBot && activeBot.id === filter) {
        return products.filter(p => activeBot.productIds.includes(p.id));
    }

    return products;
  });

  // --- Product Modal State ---
  selectedProduct = signal<Product | null>(null);
  selectedVariant = signal<ProductVariant | null>(null);
  showShareOptions = signal(false);
  isLinkCopied = signal(false);
  canShareNatively = !!navigator.share; // Check if native share API is available

  openProductModal(product: Product) {
    this.selectedProduct.set(product);
    this.selectedVariant.set(product.variants.length > 0 ? product.variants[0] : null);
    this.showShareOptions.set(false);
  }

  closeProductModal() {
    this.selectedProduct.set(null);
    this.selectedVariant.set(null);
    this.showShareOptions.set(false);
    this.isLinkCopied.set(false);
  }

  selectVariant(variant: ProductVariant) {
    this.selectedVariant.set(variant);
  }

  addToCartFromModal(product: Product, event: Event) {
    event.stopPropagation();
    this.cartService.addToCart(product, this.selectedVariant());
    this.settingsService.showToast(`تمت إضافة ${product.name} إلى السلة!`);
    this.closeProductModal();
  }

  // --- Sharing Logic ---
  toggleShare(event: Event) {
    event.stopPropagation();
    this.showShareOptions.update(val => !val);
    this.isLinkCopied.set(false);
  }

  shareTo(platform: string, product: Product) {
    const productUrl = this.document.location.origin + this.router.createUrlTree(['/store'], { fragment: `product-${product.id}` }).toString();
    const shareText = `شاهد هذا المنتج الرائع: ${product.name} بسعر ${product.price.toLocaleString()} د.ج!`;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      // Add other platforms if needed
    }
    this.showShareOptions.set(false);
  }

  copyLink() {
    if (this.selectedProduct()) {
      const productUrl = this.document.location.origin + this.router.createUrlTree(['/store'], { fragment: `product-${this.selectedProduct()!.id}` }).toString();
      navigator.clipboard.writeText(productUrl).then(() => {
        this.isLinkCopied.set(true);
        setTimeout(() => this.isLinkCopied.set(false), 2000);
      }).catch(err => {
        console.error('Failed to copy link: ', err);
        this.settingsService.showToast('فشل نسخ الرابط.');
      });
    }
  }

  nativeShare(product: Product) {
    if (navigator.share) {
      const productUrl = this.document.location.origin + this.router.createUrlTree(['/store'], { fragment: `product-${product.id}` }).toString();
      navigator.share({
        title: product.name,
        text: product.description,
        url: productUrl,
      })
      .then(() => console.log('Successful share'))
      .catch((error) => console.log('Error sharing', error));
    }
    this.showShareOptions.set(false);
  }


  setFilter(filter: string) {
    this.activeFilter.set(filter);
  }

  // --- Cart Sidebar State ---
  showCart = signal(false);
  cart = this.cartService.cart;
  cartCount = this.cartService.cartCount;
  cartTotal = this.cartService.subtotal; // Using subtotal for now, shipping added in checkout

  goToCheckout() {
    if (this.cart().length > 0) {
      this.router.navigate(['/checkout']);
      this.showCart.set(false);
    } else {
      this.settingsService.showToast('سلة التسوق فارغة!');
    }
  }

  // --- Marketing Bots & Offers ---
  activeBotOffer = computed(() => {
    const bots = this.settings().marketingBots;
    const now = new Date();
    // Find the first enabled bot with a valid offerEndDate
    const activeBot = bots.find(bot => 
      bot.enabled && bot.offerEndDate && new Date(bot.offerEndDate) > now
    );
    return activeBot || null;
  });

  offerProducts = computed(() => {
    const offer = this.activeBotOffer();
    if (!offer || offer.productIds.length === 0) return [];
    return this.products().filter(p => offer.productIds.includes(p.id));
  });

  discountedPriceMap = computed<Map<number, number>>(() => {
    const offer = this.activeBotOffer();
    const map = new Map<number, number>();
    if (offer && offer.productIds.length > 0) {
      this.products().forEach(p => {
        if (offer.productIds.includes(p.id)) {
          map.set(p.id, p.price * (1 - offer.discountPercentage / 100));
        }
      });
    }
    return map;
  });

  offerTimeRemaining = signal<string>('');
  private offerCountdownInterval: any;

  constructor() {
    effect(() => {
      const offer = this.activeBotOffer();
      if (this.offerCountdownInterval) {
        clearInterval(this.offerCountdownInterval);
      }
      if (offer && offer.offerEndDate) {
        this.startOfferCountdown(offer.offerEndDate);
      } else {
        this.offerTimeRemaining.set('');
      }
    });

    effect(() => {
      const justPlaced = this.orderService.orderJustPlaced();
      if (justPlaced) {
        this.showPostCheckoutIcon.set(true);
        this.showGreetingIcon.set(false); // Hide normal greeting
        this.orderService.orderJustPlaced.set(false); // Reset the flag
        setTimeout(() => this.showPostCheckoutIcon.set(false), 8000); // Hide after 8 seconds
      }
    });

    effect(() => {
        const currentTheme = this.settings().theme;
        this.document.documentElement.classList.remove('light', 'dark');
        this.document.documentElement.classList.add(currentTheme);
    });

    // Check for product fragment in URL on load
    this.router.events.subscribe(() => {
      const fragment = this.router.routerState.snapshot.url.split('#')[1];
      if (fragment && fragment.startsWith('product-')) {
        const productId = parseInt(fragment.split('-')[1], 10);
        const product = this.products().find(p => p.id === productId);
        if (product) {
          this.openProductModal(product);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.offerCountdownInterval) {
      clearInterval(this.offerCountdownInterval);
    }
    if (this.showcaseProgressTimer) {
      clearTimeout(this.showcaseProgressTimer);
    }
    if (this.showcaseIntroTimer) {
      clearTimeout(this.showcaseIntroTimer);
    }
    if (this.showcaseDetailsTimer) {
      clearTimeout(this.showcaseDetailsTimer);
    }
  }

  private startOfferCountdown(endDateString: string) {
    const endDate = new Date(endDateString).getTime();
    this.offerCountdownInterval = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate - now;

      if (distance < 0) {
        clearInterval(this.offerCountdownInterval);
        this.offerTimeRemaining.set('انتهى العرض!');
        // Optionally update the bot to disabled state in settings service
        const activeBot = this.activeBotOffer();
        if (activeBot) {
          this.settingsService.updateMarketingBot({ ...activeBot, enabled: false, offerEndDate: null });
        }
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      this.offerTimeRemaining.set(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);
  }

  isOfferGridModalOpen = signal(false);
  openOfferGridModal() { this.isOfferGridModalOpen.set(true); }
  closeOfferGridModal() { this.isOfferGridModalOpen.set(false); }
  selectProductFromGrid(product: Product) {
    this.openProductModal(product);
    this.closeOfferGridModal();
  }

  // --- Cinema Story Showcase Mode ---
  isShowcaseOpen = signal(false);
  currentShowcaseIndex = signal(0);
  showcaseProgress = signal(0); // 0-100%
  showcaseIntroVisible = signal(true);
  showcaseDetailsVisible = signal(false);
  private showcaseProgressTimer: any;
  private showcaseIntroTimer: any;
  private showcaseDetailsTimer: any;
  readonly SHOWCASE_DURATION = 8000; // 8 seconds per product

  openShowcase() {
    this.isShowcaseOpen.set(true);
    this.currentShowcaseIndex.set(0);
    this.showcaseDetailsVisible.set(false); // Start with details hidden
    this.startShowcaseProgress();
  }

  closeShowcase() {
    this.isShowcaseOpen.set(false);
    clearTimeout(this.showcaseProgressTimer);
    clearTimeout(this.showcaseIntroTimer);
    clearTimeout(this.showcaseDetailsTimer);
    this.showcaseProgress.set(0);
  }

  nextShowcaseItem() {
    clearTimeout(this.showcaseProgressTimer);
    clearTimeout(this.showcaseIntroTimer);
    clearTimeout(this.showcaseDetailsTimer);
    this.showcaseIntroVisible.set(true); // Always show intro for new item
    this.showcaseDetailsVisible.set(false); // Hide details for new item
    this.currentShowcaseIndex.update(idx => {
      const nextIdx = idx + 1;
      return nextIdx < this.products().length ? nextIdx : 0; // Loop back to start
    });
    this.startShowcaseProgress();
  }

  prevShowcaseItem() {
    clearTimeout(this.showcaseProgressTimer);
    clearTimeout(this.showcaseIntroTimer);
    clearTimeout(this.showcaseDetailsTimer);
    this.showcaseIntroVisible.set(true); // Always show intro for new item
    this.showcaseDetailsVisible.set(false); // Hide details for new item
    this.currentShowcaseIndex.update(idx => {
      const prevIdx = idx - 1;
      return prevIdx >= 0 ? prevIdx : this.products().length - 1; // Loop to end
    });
    this.startShowcaseProgress();
  }

  startShowcaseProgress() {
    this.showcaseProgress.set(0);
    const interval = 50; // Update every 50ms
    let progress = 0;
    
    // Timer for auto-hiding intro text after a short delay
    this.showcaseIntroTimer = setTimeout(() => {
      this.showcaseIntroVisible.set(false);
    }, 4000); // Show intro for 4 seconds

    const updateProgress = () => {
      progress += (interval / this.SHOWCASE_DURATION) * 100;
      this.showcaseProgress.set(Math.min(progress, 100));

      if (progress < 100) {
        this.showcaseProgressTimer = setTimeout(updateProgress, interval);
      } else {
        this.nextShowcaseItem();
      }
    };
    this.showcaseProgressTimer = setTimeout(updateProgress, interval);
  }

  handleShowcaseClick(event: Event) {
    // Only toggle details if not already showing full details and intro has passed
    if (!this.showcaseDetailsVisible()) {
        this.toggleShowcaseDetails();
    } else {
        // If details are already open, clicking again closes them or just does nothing for now.
        // Or, we could advance to next item here too: this.nextShowcaseItem();
        this.toggleShowcaseDetails();
    }
  }

  toggleShowcaseDetails() {
    clearTimeout(this.showcaseDetailsTimer);
    this.showcaseDetailsVisible.update(val => !val);
    if (!this.showcaseDetailsVisible()) {
        // If details are closed, restart the intro timer to show intro again (optional, for continuity)
        // Or simply advance to next item if user is done with details
        this.nextShowcaseItem();
    } else {
        // If details are opened, pause progress and intro
        clearTimeout(this.showcaseProgressTimer);
        clearTimeout(this.showcaseIntroTimer);
        this.showcaseIntroVisible.set(false); // Hide intro if showing
    }
  }

  // Define various animations for the story mode
  getStoryAnimation(index: number): string {
    const animations = [
      'animate-[zoom_8s_ease-in-out_forwards]', // Slow zoom
      'animate-[pan-left-slow_8s_ease-in-out_forwards]', // Pan left
      'animate-[pan-right-slow_8s_ease-in-out_forwards]', // Pan right
      'animate-[fade-zoom-out_8s_ease-in-out_forwards]', // Fade and zoom out
      'animate-[slide-up-slow_8s_ease-in-out_forwards]', // Slide up slowly
    ];

    const randomAnimations = [
      'animate-[pan-left-slow_8s_ease-in-out_forwards]',
      'animate-[pan-right-slow_8s_ease-in-out_forwards]',
      'animate-[zoom_8s_ease-in-out_forwards]',
      'animate-[rotate-zoom_8s_ease-in-out_forwards]'
    ];
    
    // Tailwind's arbitrary values for keyframes need to be defined in tailwind.config.js usually.
    // Since we don't have that, we'll keep simple CSS classes for animations or define specific ones.
    // For now, these classes will need to be present in store.component.css
    return randomAnimations[index % randomAnimations.length];
  }

  // --- Dynamic Product Card Animations ---
  cardMousePosition = signal({ x: 0, y: 0 });
  isGrabbing = signal(false); // To change cursor

  onCardMouseMove(event: MouseEvent, index: number, animationType: string) {
    if (animationType === 'magnetic-tilt' || animationType === 'directional-glare' || animationType === 'spotlight-focus' || animationType === 'floating-elements') {
      const card = event.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      this.cardMousePosition.set({ x, y });

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      if (animationType === 'magnetic-tilt' || animationType === 'floating-elements') {
        const rotation = 10;
        const rx = (y / rect.height - 0.5) * rotation * -1;
        const ry = (x / rect.width - 0.5) * rotation;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
    }
  }

  onCardMouseLeave(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    card.style.removeProperty('--mouse-x');
    card.style.removeProperty('--mouse-y');
  }

  getCardAnimationClass(index: number, animationType: string): string {
    const animationSpeed = this.settings().cardAnimationSpeed;

    switch (animationType) {
      case 'magnetic-tilt': return 'card-animate-magnetic-tilt';
      case 'floating-elements': return 'card-animate-floating-elements';
      case 'directional-glare': return 'card-animate-directional-glare';
      case 'spotlight-focus': return 'card-animate-spotlight-focus';
      case 'liquid-distortion': return 'card-animate-liquid-distortion';
      case 'glitch-effect': return 'card-animate-glitch-effect';
      case 'staggered-pop': return 'card-animate-staggered-pop'; // This will need specific CSS keyframes
      case 'random-mix':
        const animations = ['magnetic-tilt', 'floating-elements', 'directional-glare', 'spotlight-focus', 'liquid-distortion', 'glitch-effect', 'staggered-pop'];
        const randomIndex = (index + Math.floor(Math.random() * 100)) % animations.length;
        return this.getCardAnimationClass(index, animations[randomIndex]); // Recursive call
      default: return 'none';
    }
  }

  // --- Rendered Layout ---
  renderedLayout = computed<LayoutItem[]>(() => {
    const layout: LayoutItem[] = [];
    const availableProducts = this.filteredProducts();
    const storeSections = this.settings().storeSections;

    const usedProductIds = new Set<number>();

    // Render defined sections first
    for (const section of storeSections) {
        const sectionProducts: Product[] = [];
        // Attempt to fill section with products that haven't been used yet
        for (const product of availableProducts) {
            if (!usedProductIds.has(product.id)) {
                // For simplicity, for sections, we're just taking any available products.
                // A more complex logic might involve matching products to section categories.
                sectionProducts.push(product);
                usedProductIds.add(product.id);
            }
            if (sectionProducts.length >= section.productCount) {
                break;
            }
        }
        if (sectionProducts.length > 0) {
            layout.push({
                isSection: true,
                section: section,
                products: sectionProducts
            });
        }
    }

    // Render remaining products in a default grid
    const remainingProducts = availableProducts.filter(p => !usedProductIds.has(p.id));
    if (remainingProducts.length > 0) {
        layout.push({
            isSection: false,
            products: remainingProducts,
            settings: {
                columns: this.settings().gridColumns,
                cardShape: this.settings().cardShape,
                cardAnimation: this.settings().cardAnimation
            }
        });
    }

    return layout;
  });
}
