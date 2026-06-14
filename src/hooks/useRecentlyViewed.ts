// hooks/useRecentlyViewed.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentlyViewedItem {
  productId: string;
  slug: string;
  name: string;
  thumbnail: string;
  price?: number; // Make price optional
  lowestPrice?: number; // Alternative price field
  variants?: Array<{ price: number }>; // Variants array
  images?: string[];
  imageGroups?: Array<{ images: Array<{ url: string } | string> }>;
  viewedAt: Date;
}

interface RecentlyViewedState {
  recentlyViewed: RecentlyViewedItem[];
  isLoaded: boolean;
  count: number;
  addToRecentlyViewed: (product: any) => void;
  removeFromRecentlyViewed: (productId: string) => void;
  clearRecentlyViewed: () => void;
}

export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      recentlyViewed: [],
      isLoaded: true,
      count: 0,

      addToRecentlyViewed: (product) => {
        const { recentlyViewed } = get();
        
        // Extract price from product
        let productPrice: number | undefined;
        if (product.lowestPrice) {
          productPrice = product.lowestPrice;
        } else if (product.price) {
          productPrice = product.price;
        } else if (product.variants && product.variants.length > 0) {
          productPrice = product.variants[0]?.price;
        }

        // Create new item
        const newItem: RecentlyViewedItem = {
          productId: product._id,
          slug: product.slug,
          name: product.name,
          thumbnail: product.thumbnail || '/images/placeholder.jpg',
          price: productPrice,
          lowestPrice: product.lowestPrice,
          variants: product.variants,
          images: product.images,
          imageGroups: product.imageGroups,
          viewedAt: new Date(),
        };

        // Remove if already exists and add to front
        const filtered = recentlyViewed.filter(
          (item) => item.productId !== product._id
        );
        
        const updated = [newItem, ...filtered].slice(0, 20); // Keep last 20 items

        set({
          recentlyViewed: updated,
          count: updated.length,
        });
      },

      removeFromRecentlyViewed: (productId) => {
        const { recentlyViewed } = get();
        const updated = recentlyViewed.filter(
          (item) => item.productId !== productId
        );
        set({
          recentlyViewed: updated,
          count: updated.length,
        });
      },

      clearRecentlyViewed: () => {
        set({
          recentlyViewed: [],
          count: 0,
        });
      },
    }),
    {
      name: 'recently-viewed',
      partialize: (state) => ({
        recentlyViewed: state.recentlyViewed.map(item => ({
          productId: item.productId,
          slug: item.slug,
          name: item.name,
          thumbnail: item.thumbnail,
          price: item.price,
          lowestPrice: item.lowestPrice,
          viewedAt: item.viewedAt,
        })),
      }),
    }
  )
);