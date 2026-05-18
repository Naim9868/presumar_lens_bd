// redux/features/cart-slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CartItem, ProductVariant, IProduct } from "@/types/product";

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

const generateCartItemId = (productId: string, variant: ProductVariant | null): string => {
  if (!variant) return productId;
  return `${productId}_${variant.sku}`;
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItemToCart: (state, action: PayloadAction<{
      product: IProduct;
      variant?: ProductVariant;
      quantity?: number;
      selectedAttributes?: Record<string, string>;
    }>) => {
      const { product, variant, quantity = 1, selectedAttributes } = action.payload;
      
      const cartItemId = generateCartItemId(product._id, variant || null);
      const existingItem = state.items.find(item => item._id === cartItemId);
      
      const finalVariant = variant || product.variants.find(v => v.isDefault) || product.variants[0];
      const maxStock = finalVariant?.inventory || product.totalInventory || 0;
      const price = finalVariant?.price || product.price;
      const image = finalVariant?.images?.[0] || product.thumbnail || product.images?.[0] || "/images/placeholder.jpg";
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity <= maxStock) {
          existingItem.quantity = newQuantity;
        } else {
          existingItem.quantity = maxStock;
        }
      } else {
        const newCartItem: CartItem = {
          _id: cartItemId,
          productId: product._id,
          name: product.name,
          slug: product.slug,
          price: price,
          quantity: Math.min(quantity, maxStock),
          image: image,
          variant: finalVariant || null,
          selectedAttributes: selectedAttributes || (finalVariant?.attributes?.reduce((acc, attr) => {
            acc[attr.key] = attr.value;
            return acc;
          }, {} as Record<string, string>) || {}),
          maxStock: maxStock,
        };
        state.items.push(newCartItem);
      }
    },
    
    removeItemFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item._id !== action.payload);
    },
    
    updateCartItemQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) => {
      const item = state.items.find(item => item._id === action.payload.id);
      if (item && action.payload.quantity <= item.maxStock && action.payload.quantity > 0) {
        item.quantity = action.payload.quantity;
      }
    },
    
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addItemToCart, removeItemFromCart, updateCartItemQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state: any) => state.cartReducer.items;
export const selectTotalPrice = (state: any) => {
  return state.cartReducer.items.reduce(
    (total: number, item: CartItem) => total + item.price * item.quantity,
    0
  );
};
export const selectCartCount = (state: any) => {
  return state.cartReducer.items.reduce(
    (count: number, item: CartItem) => count + item.quantity,
    0
  );
};