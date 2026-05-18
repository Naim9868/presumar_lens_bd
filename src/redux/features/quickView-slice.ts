// redux/features/quickView-slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IProduct } from "@/types/product";

interface QuickViewState {
  value: IProduct | null;
  isOpen: boolean;
}

const initialState: QuickViewState = {
  value: null,
  isOpen: false,
};

export const quickViewSlice = createSlice({
  name: "quickView",
  initialState,
  reducers: {
    // Open quick view with product
    openQuickView: (state, action: PayloadAction<IProduct>) => {
      state.value = action.payload;
      state.isOpen = true;
    },
    
    // Update quick view product
    updateQuickView: (state, action: PayloadAction<Partial<IProduct>>) => {
      if (state.value) {
        state.value = { ...state.value, ...action.payload };
      }
    },
    
    // Close quick view
    closeQuickView: (state) => {
      state.isOpen = false;
      state.value = null;
    },
    
    // Reset quick view (alias for closeQuickView)
    resetQuickView: (state) => {
      state.isOpen = false;
      state.value = null;
    },
  },
});

// Export actions
export const { openQuickView, updateQuickView, closeQuickView, resetQuickView } = quickViewSlice.actions;

// Selectors
export const selectQuickViewProduct = (state: any) => state.quickViewReducer.value;
export const selectQuickViewIsOpen = (state: any) => state.quickViewReducer.isOpen;

export default quickViewSlice.reducer;