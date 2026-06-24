// src/types/order.ts

export type OrderStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

export type PaymentMethod = 'COD' | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type DeliveryType = 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';
export type CourierProvider = 'PATHAO' | 'REDX' | 'STEADFAST' | 'PAPERFLY' | 'SUNDARBAN';

export interface OrderItem {
  _id: string;
  productId: string;
  variantKey?: string;
  snapshot: {
    name: string;
    slug: string;
    image?: string;
    sku?: string;
    brand?: string;
    category?: string;
    attributes?: Record<string, string>;
  };
  price: { original: number; sale: number };
  quantity: number;
  total: number;
}

export interface OrderShipping {
  name: string;
  phone: string;
  email?: string;
  address: string;
  area: string;
  city: string;
  postcode?: string;
  division?: string;
  landmark?: string;
}

export interface OrderPricing {
  subtotal: number;
  itemDiscount: number;
  couponDiscount: number;
  campaignDiscount: number;
  deliveryCharge: number;
  tax: number;
  total: number;
  currency: string;
}

export interface OrderCoupon {
  couponId?: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
  value: number;
  discountAmount: number;
}

export interface OrderMarketing {
  source?: string;
  medium?: string;
  campaign?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  referrer?: string;
}

export interface OrderNote {
  _id: string;
  text: string;
  createdBy?: string;
  createdAt: string;
}

export interface OrderShipment {
  _id: string;
  provider: CourierProvider;
  consignmentId?: string;
  trackingId?: string;
  trackingUrl?: string;
  status: string;
  bookedAt?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
}

export interface FraudScore {
  score: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
}

export interface FraudFlag {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}
 
export interface FraudResult {
  score: number;
  risk: 'low' | 'medium' | 'high';
  flags: FraudFlag[];
}

export interface Order {
  _id: string;
  orderId: string;
  userId?: string;
  guestEmail?: string;
  guestPhone?: string;
  items: OrderItem[];
  pricing: OrderPricing;
  coupon?: OrderCoupon;
  marketing?: OrderMarketing;
  status: OrderStatus;
  shipping: OrderShipping;
  delivery: { type: DeliveryType };
  inventory: {
    reserved: boolean;
    released: boolean;
    releasedAt?: string;
  };
  notes: OrderNote[];
  meta: {
    ip?: string;
    userAgent?: string;
    device?: string;
    platform?: string;
  };
  notifications: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shipment?: OrderShipment;
  fraudScore?: FraudResult;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  statusBreakdown: Partial<Record<OrderStatus, number>>;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface OrderEvent {
  _id: string;
  orderId: string;
  status: string;
  previousStatus?: string;
  source: 'SYSTEM' | 'ADMIN' | 'CUSTOMER' | 'COURIER';
  note?: string;
  createdBy?: string;
  createdAt: string;
}

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; dot: string; border: string; }> = {
  PENDING:           { label: 'Pending',          color: 'text-amber-700',  bg: 'bg-amber-50 border border-amber-200',   dot: 'bg-amber-400', border: 'border-1'  },
  AWAITING_PAYMENT:  { label: 'Awaiting Payment', color: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200', dot: 'bg-orange-400', border: 'border-1' },
  CONFIRMED:         { label: 'Confirmed',         color: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200',     dot: 'bg-blue-400', border: 'border-1'   },
  PROCESSING:        { label: 'Processing',        color: 'text-indigo-700', bg: 'bg-indigo-50 border border-indigo-200', dot: 'bg-indigo-400', border: 'border-1' },
  PACKED:            { label: 'Packed',            color: 'text-violet-700', bg: 'bg-violet-50 border border-violet-200', dot: 'bg-violet-400', border: 'border-1' },
  READY_TO_SHIP:     { label: 'Ready to Ship',    color: 'text-cyan-700',   bg: 'bg-cyan-50 border border-cyan-200',     dot: 'bg-cyan-400', border: 'border-1'   },
  SHIPPED:           { label: 'Shipped',           color: 'text-sky-700',    bg: 'bg-sky-50 border border-sky-200',       dot: 'bg-sky-400', border: 'border-1'    },
  IN_TRANSIT:        { label: 'In Transit',        color: 'text-teal-700',   bg: 'bg-teal-50 border border-teal-200',     dot: 'bg-teal-400', border: 'border-1'   },
  OUT_FOR_DELIVERY:  { label: 'Out for Delivery',  color: 'text-lime-700',   bg: 'bg-lime-50 border border-lime-200',     dot: 'bg-lime-400', border: 'border-1'   },
  DELIVERED:         { label: 'Delivered',         color: 'text-green-700',  bg: 'bg-green-50 border border-green-200',   dot: 'bg-green-400', border: 'border-1'  },
  CANCELLED:         { label: 'Cancelled',         color: 'text-red-700',    bg: 'bg-red-50 border border-red-200',       dot: 'bg-red-400', border: 'border-1'    },
  RETURN_REQUESTED:  { label: 'Return Requested',  color: 'text-rose-700',   bg: 'bg-rose-50 border border-rose-200',     dot: 'bg-rose-400', border: 'border-1'   },
  RETURNED:          { label: 'Returned',          color: 'text-pink-700',   bg: 'bg-pink-50 border border-pink-200',     dot: 'bg-pink-400', border: 'border-1'   },
  REFUNDED:          { label: 'Refunded',          color: 'text-slate-700',  bg: 'bg-slate-50 border border-slate-200',   dot: 'bg-slate-400', border: 'border-1'  },
};

export const SOURCE_CONFIG: Record<string, { icon: string; color: string }> = {
  facebook:  { icon: 'FB',  color: 'bg-blue-600 text-white' },
  instagram: { icon: 'IG',  color: 'bg-pink-600 text-white' },
  tiktok:    { icon: 'TT',  color: 'bg-gray-900 text-white' },
  google:    { icon: 'G',   color: 'bg-red-500 text-white'  },
  youtube:   { icon: 'YT',  color: 'bg-red-600 text-white'  },
  whatsapp:  { icon: 'WA',  color: 'bg-green-500 text-white'},
  telegram:  { icon: 'TG',  color: 'bg-sky-500 text-white'  },
  organic:   { icon: '🌱',  color: 'bg-emerald-100 text-emerald-700' },
  direct:    { icon: '↗',   color: 'bg-gray-100 text-gray-700' },
  referral:  { icon: '↩',   color: 'bg-purple-100 text-purple-700' },
};