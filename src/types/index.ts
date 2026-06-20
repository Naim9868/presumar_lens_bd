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

// export interface ApiResponse<T = any> {
//   success: boolean;
//   data?: T;
//   error?: string;
//   message?: string;
// }



export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  logoPublicId?: string;
  description?: string;
  website?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  imagePublicId?: string;
  description?: string;
  parentId: string | null;
  status: 'active' | 'inactive';
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface VariantAttribute {
  key: string;
  value: string;
}


export interface ProductVariant {
  sku: string;
  variantKey?: string;
  attributes: VariantAttribute[];
  price: number;
  compareAtPrice?: number;
  inventory: number;
  reserved?: number;
  // weight?: number;
  images?: string[];
  isDefault?: boolean;
  status: 'in_stock' | 'out_of_stock' | 'discontinued';
}

 

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
  // Optional: For backward compatibility
  variantId?: string;
  selectedVariant?: any;
}

export interface WishlistItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
  sku?: string;
  variantKey?: string;
  attributes?: VariantAttribute[];
  selectedVariant?: ProductVariant;
}

export interface FilterOptions {
 minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  tags?: string[];
  search?: string;
  inStock?: boolean;

  specs?: {
    key: string;
    values: string[];
  }[];

  sortBy?:
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'rating_desc';
}


export interface CheckoutItem {
  productId: string;     // match Order schema
  variantId?: string;    // SKU বা variantKey
  name: string;
  sku?: string;

  price: number;
  quantity: number;

  image?: string;

  // UI extras (optional)
  selectedAttributes?: Record<string, string>;
}