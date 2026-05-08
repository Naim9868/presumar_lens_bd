// lib/review-store.ts
import { create } from 'zustand';

interface ReviewState {
  productId: string | null;
  reviewId?: string;
  isOpen: boolean;
  openReviewForm: (productId: string, reviewId?: string) => void;
  closeReviewForm: () => void;
}

export const useReview = create<ReviewState>((set) => ({
  productId: null,
  reviewId: undefined,
  isOpen: false,
  openReviewForm: (productId, reviewId) => set({ productId, reviewId, isOpen: true }),
  closeReviewForm: () => set({ productId: null, reviewId: undefined, isOpen: false }),
}));