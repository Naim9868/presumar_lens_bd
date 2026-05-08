// lib/cart-utils.ts
import { CartItem, WishlistItem } from '@/types/product';

// Cart functions
export const addToCart = (item: CartItem) => {
  const cart = getCart();
  const existingIndex = cart.findIndex(
    (i) => i.id === item.id && i.sku === item.sku
  );
  
  if (existingIndex > -1) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdated'));
};

export const getCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
};

export const removeFromCart = (id: string, sku?: string) => {
  const cart = getCart();
  const filtered = sku 
    ? cart.filter(item => !(item.id === id && item.sku === sku))
    : cart.filter(item => item.id !== id);
  localStorage.setItem('cart', JSON.stringify(filtered));
  window.dispatchEvent(new Event('cartUpdated'));
};

export const updateCartQuantity = (id: string, quantity: number, sku?: string) => {
  const cart = getCart();
  const index = sku
    ? cart.findIndex(item => item.id === id && item.sku === sku)
    : cart.findIndex(item => item.id === id);
  
  if (index > -1) {
    if (quantity <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = quantity;
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  }
};

export const clearCart = () => {
  localStorage.removeItem('cart');
  window.dispatchEvent(new Event('cartUpdated'));
};

// Wishlist functions
export const addToWishlist = (item: WishlistItem) => {
  const wishlist = getWishlist();
  if (!wishlist.some(i => i.id === item.id)) {
    wishlist.push(item);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlistUpdated'));
  }
};

export const getWishlist = (): WishlistItem[] => {
  if (typeof window === 'undefined') return [];
  const wishlist = localStorage.getItem('wishlist');
  return wishlist ? JSON.parse(wishlist) : [];
};

export const removeFromWishlist = (id: string) => {
  const wishlist = getWishlist();
  const filtered = wishlist.filter(item => item.id !== id);
  localStorage.setItem('wishlist', JSON.stringify(filtered));
  window.dispatchEvent(new Event('wishlistUpdated'));
};

export const loadWishlist = getWishlist;