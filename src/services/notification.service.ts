import { Injectable, inject } from '@angular/core';
import { SettingsService } from './settings.service';
import { Order, Notifications } from '../models';

export type NotificationStatus = {
  sent: boolean;
  reason?: 'disabled' | 'unverified' | 'unconfigured';
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private settingsService = inject(SettingsService);
  private settings = this.settingsService.settings;

  private formatOrderAsText(order: Order): string {
    const paymentMethodMap = {
      cod: 'الدفع عند الإستلام',
      baridi: 'بريدي موب',
      visa: 'بطاقة فيزا'
    };
    const paymentMethodText = paymentMethodMap[order.paymentMethod as keyof typeof paymentMethodMap] || order.paymentMethod;

    let text = `
طلب جديد من متجر: ${this.settings().storeName}
================================
** معلومات الزبون **
الاسم: ${order.customer.name}
الهاتف: ${order.customer.phone}
الولاية: ${order.customer.wilaya}, ${order.customer.city}
البريد الإلكتروني: ${order.customer.email || 'لم يحدد'}
شركة التوصيل: ${order.deliveryCompany}
طريقة الدفع: ${paymentMethodText}
================================
** المنتجات المطلوبة **
`;
    order.items.forEach(item => {
      text += `- ${item.name} (x${item.quantity}) - السعر: ${item.price.toLocaleString()} د.ج\n`;
    });

    text += `
================================
** ملخص الدفع **
المجموع الفرعي: ${order.subtotal.toLocaleString()} د.ج
شحن للولاية: ${order.shipping.toLocaleString()} د.ج
رسوم شركة التوصيل: ${order.deliveryFee.toLocaleString()} د.ج
--------------------------------
الإجمالي للدفع: ${order.total.toLocaleString()} د.ج
================================
    `;
    return text.trim();
  }
  
  sendVerificationCode(code: string) {
    const notificationSettings = this.settings().notifications;
    if (notificationSettings.method === 'none' || !notificationSettings.destination) {
        console.log('Cannot send verification code, notification is disabled or not configured.');
        return;
    }
    
    const text = `رمز التحقق الخاص بك لمتجر ${this.settings().storeName} هو: ${code}`;
    this.sendMessage(text, notificationSettings.destination, notificationSettings.method);
  }
  
  sendOrderNotification(order: Order): NotificationStatus {
      if (!order) return { sent: false };
      const notificationSettings = this.settings().notifications;
      
      if (notificationSettings.method === 'none') {
          console.log('Automatic notification is disabled.');
          return { sent: false, reason: 'disabled' };
      }
      if (!notificationSettings.destination) {
          console.log('Automatic notification is not configured.');
          return { sent: false, reason: 'unconfigured' };
      }
      if (!notificationSettings.verified) {
          console.log('Automatic notification is not verified.');
          return { sent: false, reason: 'unverified' };
      }
      
      const text = this.formatOrderAsText(order);
      const destination = notificationSettings.destination;
      this.sendMessage(text, destination, notificationSettings.method, order);
      return { sent: true };
  }
  
  private sendMessage(text: string, destination: string, method: Notifications['method'], order?: Order) {
      const encodedText = encodeURIComponent(text);

      switch(method) {
          case 'whatsapp':
              window.open(`https://wa.me/${destination}?text=${encodedText}`, '_blank');
              break;
          case 'email':
              const subject = order 
                  ? `طلب جديد من متجر: ${this.settings().storeName}`
                  : `رمز التحقق لمتجر: ${this.settings().storeName}`;
              window.location.href = `mailto:${destination}?subject=${encodeURIComponent(subject)}&body=${encodedText}`;
              break;
          case 'messenger':
              // Messenger doesn't support pre-filled text via URL for pages.
              // For a real app, you would use the Messenger Platform API.
              window.open(`https://m.me/${destination}`, '_blank');
              if (!order) {
                  alert(`تم إرسال رمز التحقق. يرجى لصقه في محادثة Messenger: ${text}`);
              }
              break;
          case 'telegram':
              window.open(`https://t.me/share/url?url=_&text=${encodedText}`, '_blank');
              break;
          case 'webhook':
              const body = order
                  ? JSON.stringify({ text: text, order: order })
                  : JSON.stringify({ text: text });

              fetch(destination, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: body
              })
              .then(response => {
                if (!response.ok) {
                  console.error('Webhook request failed with status:', response.status);
                }
              })
              .catch(err => console.error('Webhook fetch failed:', err));
              break;
      }
  }
}