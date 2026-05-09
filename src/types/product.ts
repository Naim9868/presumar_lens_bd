// Variant attribute from your schema
export interface VariantAttribute {
  key: string;
  value: string;
}

// Product variant from your schema
export interface ProductVariant {
  sku: string;
  variantKey?: string;
  attributes: VariantAttribute[];
  price: number;
  compareAtPrice?: number;
  inventory: number;
  reserved?: number;
  images?: string[];
  isDefault?: boolean; // Keep as optional since schema has default: false
  status: 'in_stock' | 'out_of_stock' | 'discontinued';
}

// Product specification from your schema
export interface ProductSpec {
  key: string;
  label: string;
  value: any;
  group: string;
  unit?: string;
  filterable?: boolean;
}

// Main Product type matching your schema
export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  subcategory?: {
    id: string;
    name: string;
    slug: string;
  } | undefined;
  specsFlat: ProductSpec[];
  variants: ProductVariant[];
  images: string[];
  thumbnail: string;
  tags: string[];
  price: number; // derived (lowestPrice)
  maxPrice: number; // highestPrice
  totalInventory: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'archived';
  // Optional fields for UI
  soldCount?: number;
  rating?: number;
  reviewCount?: number;
}

// Brand type
export interface IBrand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}

// Category with specification template
export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  parentId?: string | ICategory;
  specificationTemplate: CategorySpecGroup[];
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

// Category specification field
export interface CategorySpecField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'multiselect';
  unit?: string;
  options?: string[];
  required: boolean;
  filterable: boolean;
  isVariantAttribute: boolean;
  defaultValue?: any;
}

// Category specification group
export interface CategorySpecGroup {
  groupName: string;
  fields: CategorySpecField[];
  displayOrder: number;
}

// Review type
export interface IReview {
  _id: string;
  productId: string;
  name: string;
  email?: string;
  rating: number;
  image?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IReviewWithProduct extends IReview {
  product?: IProduct;
}

// Cart item type
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: ProductVariant;
  selectedAttributes?: Record<string, string>;
  sku?: string;
  compareAtPrice?: number;
  originalPrice?: number;
}

// Wishlist item type
export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  sizes?: string[];
  colors?: string[];
  originalPrice?: number;
}

// Checkout item type
export interface CheckoutItem {
  _id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  quantity: number;
  selectedAttributes?: Record<string, string>;
  variant?: ProductVariant;
  sku?: string;
}

// Database product type
export interface IProductDB {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  brandId: string;
  categoryId: string;
  subcategoryId?: string;
  specsFlat: ProductSpec[];
  variants: ProductVariant[];
  images: string[];
  thumbnail: string;
  tags: string[];
  lowestPrice: number;
  highestPrice: number;
  totalInventory: number;
  status: 'draft' | 'active' | 'archived';
  deletedAt?: Date | null;
  searchKeywords?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Populated product type
export interface IProductPopulated {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  brandId: {
    _id: string;
    name: string;
    slug: string;
  };
  categoryId: {
    _id: string;
    name: string;
    slug: string;
  };
  subcategoryId?: {
    _id: string;
    name: string;
    slug: string;
  };
  specsFlat: ProductSpec[];
  variants: ProductVariant[];
  images: string[];
  thumbnail: string;
  tags: string[];
  lowestPrice: number;
  highestPrice: number;
  totalInventory: number;
  status: 'draft' | 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}