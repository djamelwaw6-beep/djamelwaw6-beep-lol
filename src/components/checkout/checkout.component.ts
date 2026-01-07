import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { SettingsService } from '../../services/settings.service';
import { OrderService } from '../../services/order.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Order, Wilaya, CustomerInfo } from '../../models';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
  private cartService = inject(CartService);
  private settingsService = inject(SettingsService);
  private orderService = inject(OrderService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  cart = this.cartService.cart;
  settings = this.settingsService.settings;
  deliveryCompanies = this.settings().deliveryCompanies;
  wilayas: Wilaya[] = [
      { name: "أدرار", cost: 600 }, { name: "الشلف", cost: 400 }, { name: "الأغواط", cost: 500 },
      { name: "أم البواقي", cost: 450 }, { name: "باتنة", cost: 450 }, { name: "بجاية", cost: 350 },
      { name: "بسكرة", cost: 550 }, { name: "بشار", cost: 700 }, { name: "البليدة", cost: 300 },
      { name: "البويرة", cost: 350 }, { name: "تمنراست", cost: 800 }, { name: "تبسة", cost: 500 },
      { name: "تلمسان", cost: 500 }, { name: "تيارت", cost: 450 }, { name: "تيزي وزو", cost: 350 },
      { name: "الجزائر", cost: 250 }, { name: "الجلفة", cost: 450 }, { name: "جيجل", cost: 400 },
      { name: "سطيف", cost: 400 }, { name: "سعيدة", cost: 500 }, { name: "سكيكدة", cost: 450 },
      { name: "سيدي بلعباس", cost: 500 }, { name: "عنابة", cost: 450 }, { name: "قالمة", cost: 450 },
      { name: "قسنطينة", cost: 400 }, { name: "المدية", cost: 350 }, { name: "مستغانم", cost: 450 },
      { name: "المسيلة", cost: 400 }, { name: "معسكر", cost: 450 }, { name: "ورقلة", cost: 600 },
      { name: "وهران", cost: 400 }, { name: "البيض", cost: 550 }, { name: "إليزي", cost: 850 },
      { name: "برج بوعريريج", cost: 400 }, { name: "بومرداس", cost: 300 }, { name: "الطارف", cost: 500 },
      { name: "تندوف", cost: 850 }, { name: "تيسمسيلت", cost: 400 }, { name: "الوادي", cost: 600 },
      { name: "خنشلة", cost: 500 }, { name: "سوق أهراس", cost: 500 }, { name: "تيبازة", cost: 300 },
      { name: "ميلة", cost: 400 }, { name: "عين الدفلى", cost: 350 }, { name: "النعامة", cost: 600 },
      { name: "عين تيموشنت", cost: 500 }, { name: "غرداية", cost: 550 }, { name: "غليزان", cost: 400 },
  ];

  checkoutStep = signal<'info' | 'payment' | 'confirmation'>('info');
  selectedPaymentMethod = signal<'cod' | 'baridi' | 'visa'>('cod');
  confirmedOrder = signal<Order | null>(null);
  rememberMe = signal<boolean>(true);
  showUnverifiedNotificationWarning = signal(false);
  
  customerForm = new FormBuilder().group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern('^0[5-7][0-9]{8}$')]],
    wilaya: ['', Validators.required],
    city: ['', Validators.required],
    email: ['', Validators.email],
    deliveryCompany: ['', Validators.required]
  });

  subtotal = this.cartService.subtotal;
  shippingCost = signal(0);
  deliveryFee = signal(0);
  total = computed(() => this.subtotal() + this.shippingCost() + this.deliveryFee());

  constructor() {
    this.customerForm.get('wilaya')?.valueChanges.subscribe(wilayaName => {
      const wilaya = this.wilayas.find(w => w.name === wilayaName);
      this.shippingCost.set(wilaya ? wilaya.cost : 0);
    });

    this.customerForm.get('deliveryCompany')?.valueChanges.subscribe(companyId => {
        const id = parseInt(companyId || '0', 10);
        const company = this.deliveryCompanies.find(c => c.id === id);
        this.deliveryFee.set(company ? company.fee : 0);
    });
  }

  ngOnInit() {
    this.loadSavedDetails();
  }

  loadSavedDetails() {
    if (typeof localStorage === 'undefined') return;
    const remember = localStorage.getItem('platinumStoreRememberMe');
    this.rememberMe.set(remember !== 'false'); // Default to true
    if (this.rememberMe()) {
        const savedDetails = localStorage.getItem('platinumStoreCheckoutDetails');
        if (savedDetails) {
            try {
                this.customerForm.patchValue(JSON.parse(savedDetails));
            } catch(e) {
                console.error('Failed to parse saved details:', e);
                localStorage.removeItem('platinumStoreCheckoutDetails');
            }
        }
    }
  }

  goToPayment() {
    if (this.customerForm.valid) {
      if (typeof localStorage !== 'undefined') {
        if (this.rememberMe()) {
            localStorage.setItem('platinumStoreCheckoutDetails', JSON.stringify(this.customerForm.value));
            localStorage.setItem('platinumStoreRememberMe', 'true');
        } else {
            localStorage.removeItem('platinumStoreCheckoutDetails');
            localStorage.setItem('platinumStoreRememberMe', 'false');
        }
      }
      this.checkoutStep.set('payment');
    } else {
      this.customerForm.markAllAsTouched();
    }
  }

  confirmOrder() {
    const deliveryCompanyId = parseInt(this.customerForm.get('deliveryCompany')?.value || '0', 10);
    const company = this.deliveryCompanies.find(c => c.id === deliveryCompanyId);
    const order: Order = {
      customer: this.customerForm.value as CustomerInfo,
      items: this.cart(),
      subtotal: this.subtotal(),
      shipping: this.shippingCost(),
      deliveryFee: this.deliveryFee(),
      total: this.total(),
      deliveryCompany: company ? company.name : 'N/A',
      paymentMethod: this.selectedPaymentMethod()
    };

    this.confirmedOrder.set(order);
    this.orderService.addOrder(order);
    const notificationStatus = this.notificationService.sendOrderNotification(order);
    
    if (!notificationStatus.sent && notificationStatus.reason === 'unverified' && this.authService.isLoggedIn()) {
        this.showUnverifiedNotificationWarning.set(true);
    }
    
    this.cartService.clearCart();
    this.checkoutStep.set('confirmation');
  }
}