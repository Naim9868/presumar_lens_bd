// redux/features/wishlist-slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IProduct, WishlistItem } from "@/types/product";

interface WishlistState {
  items: WishlistItem[];
}

const initialState: WishlistState = {
  items: [],
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addToWishlist: (state, action: PayloadAction<IProduct>) => {
      const existingItem = state.items.find(item => item._id === action.payload._id);
      if (!existingItem) {
        state.items.push({
          ...action.payload,
          addedAt: new Date().toISOString(),
        });
      }
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item._id !== action.payload);
    },
    clearWishlist: (state) => {
      state.items = [];
    },
  },
});

export const { addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;

// Selectors
export const selectWishlistItems = (state: any) => state.wishlistReducer.items;
export const selectWishlistCount = (state: any) => state.wishlistReducer.items.length;
export const isInWishlist = (state: any, productId: string) => {
  return state.wishlistReducer.items.some((item: WishlistItem) => item._id === productId);
};