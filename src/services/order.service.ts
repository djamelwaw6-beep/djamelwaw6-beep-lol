import { Injectable, signal } from '@angular/core';
import { Order } from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  orders = signal<Order[]>(this.loadOrders());
  orderJustPlaced = signal(false);

  private loadOrders(): Order[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const saved = localStorage.getItem('platinumStoreOrders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load orders from localStorage', e);
      return [];
    }
  }

  private saveOrders() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('platinumStoreOrders', JSON.stringify(this.orders()));
  }

  addOrder(order: Order) {
    const newOrder = { ...order, id: Date.now(), date: new Date().toISOString() };
    this.orders.update(current => [newOrder, ...current]);
    this.saveOrders();
    this.orderJustPlaced.set(true);
  }

  deleteOrder(orderId: number) {
    this.orders.update(current => current.filter(o => o.id !== orderId));
    this.saveOrders();
  }
}