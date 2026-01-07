import { Injectable, signal, computed } from '@angular/core';
import { CartItem, Product, ProductVariant } from '../models';

@Injectable({ providedIn: 'root' })
export class CartService {
  cart = signal<CartItem[]>([]);
  cartCount = computed(() => this.cart().reduce((acc, item) => acc + item.quantity, 0));
  subtotal = computed(() => this.cart().reduce((acc, item) => acc + item.price * item.quantity, 0));

  addToCart(product: Product, selectedVariant: ProductVariant | null = null) {
    this.cart.update(currentCart => {
      const cartId = selectedVariant ? `${product.id}-${selectedVariant.color}` : `${product.id}`;
      const existingItem = currentCart.find(item => item.cartId === cartId);

      if (existingItem) {
        return currentCart.map(item =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      
      const newItem: CartItem = {
        ...product,
        variants: product.variants, // Explicitly preserve variants
        quantity: 1,
        cartId: cartId,
        selectedVariant: selectedVariant || undefined,
        image: selectedVariant?.image || product.image,
      };
      return [...currentCart, newItem];
    });
  }

  removeFromCart(cartId: string) {
    this.cart.update(currentCart => currentCart.filter(item => item.cartId !== cartId));
  }

  clearCart() {
    this.cart.set([]);
  }
}