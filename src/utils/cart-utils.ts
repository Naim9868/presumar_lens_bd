// lib/cart-utils.ts
import { CartItem, WishlistItem } from '@/types/product';

// Cart functions
export const addToCart = (item: CartItem) => {
  const cart = getCart();
  const existingIndex = cart.findIndex(
    (i) => i._id === item._id
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

export const removeFromCart = (id: string) => {
  const cart = getCart();
  const filtered = cart.filter(item => item._id !== id);
  localStorage.setItem('cart', JSON.stringify(filtered));
  window.dispatchEvent(new Event('cartUpdated'));
};

export const updateCartQuantity = (id: string, quantity: number) => {
  const cart = getCart();
  const index = cart.findIndex(item => item._id === id);
  
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
  if (!wishlist.some(i => i._id === item._id)) {
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
  const filtered = wishlist.filter(item => item._id !== id);
  localStorage.setItem('wishlist', JSON.stringify(filtered));
  window.dispatchEvent(new Event('wishlistUpdated'));
};

export const loadWishlist = getWishlist;

// Optional: Get cart total
export const getCartTotal = (): number => {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Optional: Get cart item count
export const getCartCount = (): number => {
  const cart = getCart();
  return cart.reduce((count, item) => count + item.quantity, 0);
};

// Optional: Check if item is in wishlist
export const isInWishlist = (productId: string): boolean => {
  const wishlist = getWishlist();
  return wishlist.some(item => item._id === productId);
};

// Optional: Sync Redux with localStorage (useful for initial load)
export const syncCartWithRedux = () => {
  if (typeof window !== 'undefined') {
    const cart = getCart();
    window.dispatchEvent(new CustomEvent('cartSync', { detail: cart }));
  }
};