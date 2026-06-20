export interface CartItem {
  id: string; // Unique cart item ID (productId-variantKey)
  productId: string;
  name: string;
  slug: string;
  image?: string;
  sku?: string;
  brand?: string;
  category?: string;
  price: {
    original: number;
    sale: number;
  };
  variantKey?: string;
  variantName?: string;
  attributes?: Record<string, string>;
  quantity: number;
  maxQuantity?: number;
}

// This matches the IProductVariant structure for the cart
export interface ProductVariant {
  variantKey: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  attributes?: Record<string, string>;
  isDefault?: boolean;
}