import { Types, Document } from 'mongoose';



export interface ProductCardData {
  id: number | string;
  name: string;
  slug: string;
  brand: string;
  imageUrl: string;
  originalPrice: number;
  discountPrice: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  stock?: number;
  isAvailable: boolean;
  badges: {
    isBestSeller?: boolean;
    isNewArrival?: boolean;
    isLimitedStock?: boolean;
    isPremium?: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ==================== Spec Field ====================

export interface ICategorySpecField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'multiselect';
  unit?: string;
  options?: string[];
  required: boolean;
  filterable: boolean;
  isVariantAttribute: boolean;
  defaultValue?: unknown; // ✅ no `any`
}

// ==================== Spec Group ====================

export interface ICategorySpecGroup {
  groupName: string;
  fields: ICategorySpecField[];
  displayOrder: number;
}

// ==================== Base Category ====================

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug?: string;
  parentId?: Types.ObjectId | null;

  specificationTemplate: ICategorySpecGroup[];

  status: 'active' | 'inactive';

  createdAt: Date;
  updatedAt: Date;
}

// ==================== Mongoose Document ====================

export interface ICategoryDocument extends ICategory, Document {}

// ==================== Lean Version (IMPORTANT) ====================
// Use this when you do `.lean()`

export interface ICategoryLean {
  _id: string; // ObjectId becomes string
  name: string;
  slug?: string;
  parentId?: string | null;

  specificationTemplate: ICategorySpecGroup[];

  status: 'active' | 'inactive';

  createdAt: Date;
  updatedAt: Date;
}


//order type

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Pricing {
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
}

export interface TimelineEvent {
  status: string;
  note?: string;
  createdAt: Date;
}

export interface Payment {
  method: 'COD' | 'ONLINE';
  status: 'PAID' | 'UNPAID' | 'FAILED';
  transactionId?: string;
}

export interface Shipping {
  name: string;
  phone: string;
  address: string;
  area: string;
  city: string;
}

export interface Delivery {
  type: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';
  courier?: string;
  trackingId?: string;
}

export interface Order {
  _id: string;
  orderId: string;
  userId?: string;
  items: OrderItem[];
  pricing: Pricing;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  customStatus?: string;
  timeline: TimelineEvent[];
  payment: Payment;
  shipping: Shipping;
  delivery: Delivery;
  isCancelled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderStats {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    todayOrders: number;
    todayRevenue: number;
    averageOrderValue: number;
  };
  statusCounts: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  monthlyData: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  statusDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface VariantAttribute {
  key: string;
  value: string;
}

export interface ProductVariant {
  sku: string;
  variantKey: string;
  attributes: VariantAttribute[];
  price: number;
  compareAtPrice?: number;
  inventory: number;
  reserved: number;
  weight?: number;
  images: string[];
  isDefault: boolean;
  status: 'in_stock' | 'out_of_stock' | 'discontinued';
}

export interface ProductSpec {
  key: string;
  label: string;
  value: string | number | boolean;
  group: string;
  unit?: string;
  filterable: boolean;
}

export interface Product {
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

export interface TransformedProduct {
  _id: string;
  id: string;
  name: string;
  slug: string;
  brand: string;
  brandId?: string;
  categoryId?: string;
  rating: number;
  reviewCount: number;
  soldCount: number;
  originalPrice: number;
  discountPrice: number;
  imageUrl: string;
  thumbnail: string;
  images: string[];
  isAvailable: boolean;
  stock: number;
  freeShipping: boolean;
  emiAvailable: boolean;
  warranty: string;
  badges: {
    isBestSeller?: boolean;
    isNewArrival?: boolean;
    isLimitedStock?: boolean;
    isPremium?: boolean;
  };
  variants: ProductVariant[];
  specs: ProductSpec[];
  description: string;
  shortDescription: string;
  tags: string[];
  status: string;
  fullProductData: Product;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku?: string;
  variantKey?: string;
  attributes?: VariantAttribute[];
  selectedVariant?: ProductVariant;
}

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  slug: string;
}

export interface FilterOptions {
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  tags?: string[];
  rating?: number;
  inStock?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'rating_desc' | 'newest' | 'popularity';
}

export interface Review {
  _id: string;
  productId: string;
  userId?: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: Date;
}