// redux/features/product-details-slice.ts (Simplified version)
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IProduct } from "@/types/product";

interface ProductDetailsState {
  value: IProduct | null;
}

const initialState: ProductDetailsState = {
  value: null,
};

export const productDetailsSlice = createSlice({
  name: "productDetails",
  initialState,
  reducers: {
    setProductDetails: (state, action: PayloadAction<IProduct>) => {
      state.value = action.payload;
    },
    
    updateProductDetails: (state, action: PayloadAction<Partial<IProduct>>) => {
      if (state.value) {
        state.value = { ...state.value, ...action.payload };
      }
    },
    
    clearProductDetails: (state) => {
      state.value = null;
    },
  },
});

export const { setProductDetails, updateProductDetails, clearProductDetails } = productDetailsSlice.actions;

// Selectors
export const selectProductDetails = (state: any) => state.productDetailsReducer.value;

export default productDetailsSlice.reducer;