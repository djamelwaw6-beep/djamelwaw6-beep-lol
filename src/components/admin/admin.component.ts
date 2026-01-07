
import { Component, ChangeDetectionStrategy, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, FormArray, AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { GeminiService } from '../../services/gemini.service';
import { Product, Order, MarketingBot, StoreSection } from '../../models';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  settingsService = inject(SettingsService);
  productService = inject(ProductService);
  private fb: FormBuilder = inject(FormBuilder);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private geminiService = inject(GeminiService);

  // Data Signals
  settings = this.settingsService.settings;
  products = this.productService.products;
  orders = this.orderService.orders;
  
  // UI State
  activeTab = signal('settings');
  isSidebarOpen = signal(false);
  activePrintMenuOrderId = signal<number | null>(null);
  showBluetoothHelp = signal(false);
  
  // Computed
  categories = computed(() => [...new Set(this.products().map(p => p.category))]);
  uploadSuccessState = signal<{ [key: string]: boolean }>({});

  // --- AI Assistant ---
  isAIAssistantOpen = signal(false);
  // Removed 'generate-video', 'research', 'edit-image' modes
  aiMode = signal<'create-product' | 'generate-page'>('create-product');
  aiAssistantState = signal<'idle' | 'processing' | 'success' | 'error'>('idle');
  aiAssistantError = signal<string | null>(null);
  
  // AI Forms
  aiAssistantForm = this.fb.group({
    image: ['', Validators.required],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    instructions: ['']
  });

  adForm = this.fb.group({
    productName: ['', Validators.required],
    productDescription: ['', Validators.required]
  });

  // AI Feature States
  adPageGeneratorState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // Removed Veo Video Generation related signals and forms
  // Removed Ad Generation generatedAd, still used by HTML for display
  generatedAd = signal<{ headline: string; subheadline: string; features: any[] } | null>(null);
  
  // Removed Search Grounding related signals and forms
  // Removed Image Editing (Nano Banana) related signals and forms

  // --- Main Forms ---
  settingsForm = this.fb.group({
    storeName: ['', Validators.required],
    heroTitle: ['', Validators.required],
    logo: [''],
    theme: ['dark'],
    heroColor: ['#ffffff'],
    heroFont: ["'Tajawal', sans-serif"],
    heroSize: ['4rem'],
    bgImage: [''],
    bgColor: ['#0f172a'],
    heroAnimation: ['slide'],
    
    // VISUAL CUSTOMIZATION CONTROLS
    logoEffect: ['none'],
    logoShape: ['default'],
    cardBgColor: ['#ffffff'],
    cardTextColor: ['#1e293b'],
    // Removed cardBorderRadius manually
    cardShadow: ['0 10px 15px -3px rgb(0 0 0 / 0.1)'], 
    cardAnimation: ['magnetic-tilt'],
    cardAnimationSpeed: [20],
    cardShape: ['default'],
    cardShowTitle: [false],
    cardShowPrice: [false],
    notificationShape: ['default'],
    offerDisplayType: new FormControl<'beside-logo' | 'beside-cart' | 'above-hero'>('beside-cart'),
    gridColumns: [4],
    bgOverlayColor: ['#000000'],
    bgOverlayOpacity: [0.3],
    
    footer: this.fb.group({
        aboutText: [''],
        contactEmail: ['', Validators.email],
        socialLinks: this.fb.group({
            facebook: [''],
            instagram: [''],
            twitter: [''],
            telegram: [''],
            tiktok: [''],
            youtube: ['']
        }),
        quickLinks: this.fb.array([])
    })
  });

  get quickLinks(): FormArray { return this.settingsForm.get('footer.quickLinks') as FormArray; }

  // Product Form
  isEditingProduct = signal(false);
  editingProductId = signal<number | null>(null);
  productForm = this.fb.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    category: ['', Validators.required],
    image: ['', Validators.required],
    description: [''],
    variants: this.fb.array([]),
  });
  get variants(): FormArray { return this.productForm.get('variants') as FormArray; }
  newVariantForm = this.fb.group({ color: ['#000000'], image: [''], sizes: [''] });

  // Other Forms
  isEditingSection = signal(false);
  editingSectionId = signal<number | null>(null);
  sectionForm = this.fb.group({
    id: [null],
    name: ['', Validators.required],
    productCount: [4],
    columns: [4],
    cardShape: ['default'],
    cardAnimation: ['magnetic-tilt']
  });

  isEditingDelivery = signal(false);
  editingDeliveryId = signal<number | null>(null);
  deliveryForm = this.fb.group({ name: ['', Validators.required], fee: [0] });

  notificationsForm = this.fb.group({
    method: ['none', Validators.required],
    destination: [''],
    verificationCode: [''],
  });
  verificationState = signal<'idle' | 'pending' | 'error'>('idle');
  private generatedCode = signal<string | null>(null);

  marketingBotForm = this.fb.group({
    id: [''],
    name: ['', Validators.required],
    productIds: this.fb.control<number[]>([]),
    discountPercentage: [20],
    durationHours: [24],
  });
  isEditingBot = signal(false);
  isProductSelectorOpen = signal(false);
  editingBotFormForProducts = signal<FormGroup | null>(null); 
  isSelectingForAd = signal(false);
  tempSelectedIds = signal<Set<number>>(new Set());

  // Camera
  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;
  @ViewChild('photoCanvas') photoCanvas?: ElementRef<HTMLCanvasElement>;
  isCameraOpen = signal(false);
  activeImageControl = signal<FormControl | null>(null);
  showCameraPermissionHelp = signal(false);

  ngOnInit() {
    const currentSettings = this.settingsService.settings();
    this.settingsForm.patchValue(currentSettings as any);
    
    const quickLinksArray = this.settingsForm.get('footer.quickLinks') as FormArray;
    quickLinksArray.clear();
    if(currentSettings.footer && currentSettings.footer.quickLinks) {
        currentSettings.footer.quickLinks.forEach(link => {
            quickLinksArray.push(this.fb.group({ label: [link.label], url: [link.url] }));
        });
    }
    while (quickLinksArray.length < 2) { quickLinksArray.push(this.fb.group({ label: [''], url: [''] })); }

    this.notificationsForm.patchValue(currentSettings.notifications);
    this.route.queryParams.subscribe(params => { if (params['tab']) { this.activeTab.set(params['tab']); } });

    this.settingsForm.get('logo')?.valueChanges.subscribe(v => { if(v) this.settingsService.updateSettings({ logo: v }); });
    this.settingsForm.get('bgColor')?.valueChanges.subscribe(v => { if(v) this.settingsService.updateSettings({ bgColor: v, bgImage: '' }); });
  }

  getActiveTabName(): string {
    const tabs: {[key: string]: string} = {
      'settings': 'الإعدادات والمظهر',
      'orders': 'الطلبات',
      'products': 'المنتجات',
      'sections': 'أقسام المتجر',
      'categories': 'التصنيفات',
      'delivery': 'شركات التوصيل',
      'notifications': 'الإشعارات',
      'contact': 'معلومات الاتصال',
      'marketing': 'المسوق الذكي'
    };
    return tabs[this.activeTab()] || 'لوحة التحكم';
  }

  // --- Image Handling ---
  private resizeAndEncodeImage(file: File, maxSize: number = 800): Promise<string> { 
    return new Promise((resolve) => { 
      const reader = new FileReader(); 
      reader.onload = (e) => { 
        const img = new Image(); 
        img.onload = () => { 
          const canvas = document.createElement('canvas'); 
          let { width, height } = img; 
          if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } } 
          else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } } 
          canvas.width = width; canvas.height = height; 
          const ctx = canvas.getContext('2d'); 
          ctx?.drawImage(img, 0, 0, width, height); 
          resolve(canvas.toDataURL('image/jpeg', 0.85)); 
        }; 
        img.src = e.target?.result as string; 
      }; 
      reader.readAsDataURL(file); 
    }); 
  }

  handleFileInputChange(inputEl: HTMLInputElement, control: AbstractControl, successKey: string) { 
    const file = inputEl.files?.[0];
    if (inputEl) inputEl.value = ''; 
    if (file) { 
      this.resizeAndEncodeImage(file).then(dataUrl => { 
        control.setValue(dataUrl); 
        control.markAsDirty(); 
        this.uploadSuccessState.update(s => ({...s, [successKey]: true})); 
        setTimeout(() => this.uploadSuccessState.update(s => ({...s, [successKey]: false})), 2000); 
      }); 
    } 
  }

  async openCamera(control: AbstractControl | null) { 
    if (!navigator.mediaDevices) { alert('الكاميرا غير مدعومة'); return; } 
    this.activeImageControl.set(control as FormControl); 
    this.isCameraOpen.set(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setTimeout(() => { if(this.videoPlayer) this.videoPlayer.nativeElement.srcObject = stream; }, 100);
    } catch {
      this.isCameraOpen.set(false);
      this.showCameraPermissionHelp.set(true);
    }
  }

  captureImage() { 
    if (this.videoPlayer && this.photoCanvas && this.activeImageControl()) {
      const video = this.videoPlayer.nativeElement;
      const canvas = this.photoCanvas.nativeElement;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      this.activeImageControl()!.setValue(canvas.toDataURL('image/jpeg'));
      this.closeCamera();
    }
  }

  closeCamera() { 
    const stream = this.videoPlayer?.nativeElement.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    this.isCameraOpen.set(false); 
  }

  // --- CRUD Actions ---
  saveSettings() { if (this.settingsForm.invalid) return; this.settingsService.updateSettings(this.settingsForm.getRawValue() as any); this.settingsService.showToast('تم حفظ الإعدادات'); }
  saveProduct() {
    if (this.productForm.invalid) return;
    const raw = this.productForm.getRawValue();
    const productData = { ...raw, variants: raw.variants.map((v: any) => ({ ...v, sizes: typeof v.sizes === 'string' ? v.sizes.split(',') : v.sizes })) };
    if (this.isEditingProduct() && this.editingProductId()) this.productService.updateProduct({ ...productData, id: this.editingProductId()! });
    else this.productService.addProduct(productData as any);
    this.cancelProductEdit();
    this.settingsService.showToast('تم حفظ المنتج بنجاح');
  }
  
  editProduct(event: Event, p: Product) {
    event.stopPropagation();
    this.isEditingProduct.set(true); 
    this.editingProductId.set(p.id); 
    this.productForm.patchValue(p);
    this.variants.clear();
    p.variants.forEach(v => this.variants.push(this.fb.group({ color: [v.color], image: [v.image], sizes: [v.sizes.join(',')] })));
  }

  deleteProduct(event: Event, id: number) {
    event.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        this.productService.deleteProduct(id);
        this.settingsService.showToast('تم حذف المنتج بنجاح');
    }
  }

  cancelProductEdit() { this.isEditingProduct.set(false); this.editingProductId.set(null); this.productForm.reset(); this.variants.clear(); }
  addVariant() { const val = this.newVariantForm.value; if(val.color) this.variants.push(this.fb.group({ color: [val.color], image: [val.image], sizes: [val.sizes] })); this.newVariantForm.reset({color:'#000000', image: '', sizes: ''}); }
  removeVariant(i: number) { this.variants.removeAt(i); }
  printOrder() { window.print(); }
  downloadOrder(order: Order) { const blob = new Blob([`Order #${order.id}\n${order.customer.name}\n${order.total}`], {type: 'text/plain'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'order.txt'; a.click(); }
  deleteOrder(e: Event, order: Order) { e.stopPropagation(); if(confirm('حذف الطلب؟')) this.orderService.deleteOrder(order.id!); }
  togglePrintOptions(e: Event, id: number | undefined) { e.stopPropagation(); this.activePrintMenuOrderId.update(v => v === id ? null : id); }
  saveSection() { const val = this.sectionForm.value; if (this.isEditingSection() && this.editingSectionId()) this.settingsService.updateStoreSection({ ...val, id: this.editingSectionId()! } as any); else this.settingsService.addStoreSection(val as any); this.cancelSectionEdit(); }
  editSection(s: StoreSection) { this.isEditingSection.set(true); this.editingSectionId.set(s.id); this.sectionForm.patchValue(s); }
  deleteSection(id: number) { if(confirm('حذف؟')) this.settingsService.deleteStoreSection(id); }
  cancelSectionEdit() { this.isEditingSection.set(false); this.sectionForm.reset({ productCount: 4, columns: 4 }); }
  saveDeliveryCompany() { const val = this.deliveryForm.value; if (this.isEditingDelivery() && this.editingDeliveryId()) this.settingsService.updateDeliveryCompany({ ...val, id: this.editingDeliveryId()! } as any); else this.settingsService.addDeliveryCompany(val as any); this.cancelDeliveryEdit(); }
  editCompany(c: any) { this.isEditingDelivery.set(true); this.editingDeliveryId.set(c.id); this.deliveryForm.patchValue(c); }
  deleteCompany(id: number) { this.settingsService.deleteDeliveryCompany(id); }
  cancelDeliveryEdit() { this.isEditingDelivery.set(false); this.deliveryForm.reset(); }
  editBot(b: MarketingBot) { this.isEditingBot.set(true); this.marketingBotForm.patchValue(b); }
  saveBot() { const val = this.marketingBotForm.getRawValue(); if(this.isEditingBot()) { const existing = this.settings().marketingBots.find(bot => bot.id === val.id); if(existing) this.settingsService.updateMarketingBot({...existing, ...val}); } else { this.settingsService.addMarketingBot(val as any); } this.cancelBotEdit(); }
  deleteBot(id: string) { if(confirm('حذف؟')) this.settingsService.deleteMarketingBot(id); }
  cancelBotEdit() { this.isEditingBot.set(false); this.marketingBotForm.reset({discountPercentage: 20, durationHours: 24}); }
  toggleBot(b: MarketingBot) { this.settingsService.updateMarketingBot({ ...b, enabled: !b.enabled, offerEndDate: !b.enabled ? new Date(Date.now() + b.durationHours*3600000).toISOString() : null }); }
  openProductSelector(fg: FormGroup) { this.editingBotFormForProducts.set(fg); this.tempSelectedIds.set(new Set(fg.value.productIds || [])); this.isProductSelectorOpen.set(true); this.isSelectingForAd.set(false); }
  openProductSelectorForAd() { this.isSelectingForAd.set(true); this.isProductSelectorOpen.set(true); this.tempSelectedIds.set(new Set()); }
  closeProductSelector() { this.isProductSelectorOpen.set(false); }
  toggleProductInModal(id: number) { if(this.isSelectingForAd()) this.tempSelectedIds.set(new Set([id])); else this.tempSelectedIds.update(s => { s.has(id)?s.delete(id):s.add(id); return new Set(s); }); }
  confirmProductSelection() { if(this.isSelectingForAd()) { const pid = [...this.tempSelectedIds()][0]; const p = this.products().find(x => x.id === pid); if(p) this.adForm.patchValue({productName: p.name, productDescription: p.description}); } else { this.editingBotFormForProducts()?.patchValue({productIds: [...this.tempSelectedIds()]}); this.editingBotFormForProducts()?.markAsDirty(); } this.closeProductSelector(); }
  addQuickLink() { this.quickLinks.push(this.fb.group({ label: [''], url: [''] })); }
  removeQuickLink(i: number) { this.quickLinks.removeAt(i); }
  logout() { this.authService.logout(); }
  renameCategory(old: string) { const n = prompt('الاسم الجديد:', old); if(n && n!==old) { this.productService.updateCategory(old, n); this.settingsService.showToast('تم تعديل التصنيف بنجاح'); }}
  deleteCategory(c: string) { if(confirm('هل أنت متأكد من حذف هذا التصنيف؟')) { this.productService.deleteCategory(c); this.settingsService.showToast('تم حذف التصنيف بنجاح'); }}
  saveNotifications() { this.settingsService.updateSettings({ notifications: this.notificationsForm.value as any }); this.settingsService.showToast('تم الحفظ'); }
  sendVerificationCode() { const code = Math.floor(100000 + Math.random() * 900000).toString(); this.generatedCode.set(code); this.notificationService.sendVerificationCode(code); this.verificationState.set('pending'); }
  confirmVerification() { if(this.notificationsForm.value.verificationCode === this.generatedCode()) { this.settingsService.updateSettings({ notifications: { ...this.settings().notifications, verified: true } }); this.verificationState.set('idle'); } else { this.verificationState.set('error'); } }
  closeCameraPermissionHelp() { this.showCameraPermissionHelp.set(false); }
  openBluetoothHelp() { this.showBluetoothHelp.set(true); }
  closeBluetoothHelp() { this.showBluetoothHelp.set(false); }
  printViaWifi() { window.print(); }

  // --- AI Actions ---
  openAIAssistant() { this.isAIAssistantOpen.set(true); this.aiAssistantState.set('idle'); }
  closeAIAssistant() { this.isAIAssistantOpen.set(false); }
  // Only allow create-product and generate-page modes
  switchAIMode(mode: 'create-product' | 'generate-page') { this.aiMode.set(mode); }
  
  async createProductWithAI() {
    if (!this.geminiService.isConfigured()) {
      alert('API Key Missing: يرجى التأكد من توفر مفتاح Gemini API.');
      return;
    }
    this.aiAssistantState.set('processing');
    try {
        const val = this.aiAssistantForm.value;
        const details = await this.geminiService.generateProductDetailsFromImage(val.image!.split(',')[1], val.price!, this.categories());
        this.productService.addProduct({ name: details.name, price: val.price!, category: details.category, description: details.description, image: val.image!, variants: [] });
        this.aiAssistantState.set('success');
        setTimeout(() => this.closeAIAssistant(), 1500);
    } catch (e) {
      console.error("Error creating product with AI:", e);
      this.aiAssistantError.set('حدث خطأ أثناء إنشاء المنتج بالذكاء الاصطناعي. حاول مرة أخرى.');
      this.aiAssistantState.set('error');
    }
  }

  async generateLandingPageOnly() { 
      if (!this.geminiService.isConfigured()) {
        alert('API Key Missing: يرجى التأكد من توفر مفتاح Gemini API.');
        return;
      }
      this.adPageGeneratorState.set('loading');
      try {
          const val = this.adForm.value;
          const copy = await this.geminiService.generateAdCopy(val.productName!, val.productDescription!);
          // The image prompt generation is not directly used here for features
          // Assuming features will be rendered without individual images from AI for simplicity as per request
          this.generatedAd.set({ ...copy, features: copy.features.map(f => ({...f, image: null})) });
          this.adPageGeneratorState.set('success');
      } catch (e) {
        console.error("Error generating ad page:", e);
        this.adPageGeneratorState.set('error');
      }
  }

  // Removed generateVideoStandalone method
  // Removed performResearch method
  // Removed performImageEdit method

  populateAdForm(event: Event, p: Product) { 
    event.stopPropagation();
    this.adForm.patchValue({productName: p.name, productDescription: p.description}); 
    this.switchAIMode('generate-page'); 
    this.openAIAssistant(); 
  }
  
  async shareGeneratedAd() {
    const ad = this.generatedAd();
    if (!ad) {
      alert('لا يوجد إعلان لتتم مشاركته.');
      return;
    }
    const shareText = `إعلان جديد لـ ${ad.headline}!\n${ad.subheadline}\n\nالميزات:\n${ad.features.map(f => `- ${f.title}: ${f.description}`).join('\n')}\n\nاكتشف المزيد في متجرنا!`;
    
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        this.settingsService.showToast('تم نسخ الإعلان إلى الحافظة!');
      } catch (err) {
        console.error('Failed to copy ad to clipboard:', err);
        alert('حدث خطأ أثناء نسخ الإعلان. يرجى النسخ يدوياً.');
      }
    } else {
      alert('متصفحك لا يدعم النسخ التلقائي. يرجى نسخ النص يدوياً:\n\n' + shareText);
    }
  }
  // Removed downloadVideo method
  // Removed downloadEditedImage method
}
