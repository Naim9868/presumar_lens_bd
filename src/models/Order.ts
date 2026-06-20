// src/models/Order.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { Product } from './Product';

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

export interface IOrder extends Document {
  orderId: string;
  userId?: Types.ObjectId;
  guestEmail?: string;
  guestPhone?: string;
  items: {
    productId: Types.ObjectId;
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
  }[];
  pricing: {
    subtotal: number;
    itemDiscount: number;
    couponDiscount: number;
    campaignDiscount: number;
    deliveryCharge: number;
    tax: number;
    total: number;
    currency: string;
  };
  coupon?: {
    couponId?: Types.ObjectId;
    code: string;
    type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
    value: number;
    discountAmount: number;
  };
  marketing?: {
    source?: string;
    medium?: string;
    campaign?: string;
    fbclid?: string;
    gclid?: string;
    ttclid?: string;
    utm: {
      source?: string;
      medium?: string;
      campaign?: string;
      term?: string;
      content?: string;
    };
    referrer?: string;
  };
  status: OrderStatus;
  shipping: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    area: string;
    city: string;
    postcode?: string;
    division?: string;
    landmark?: string;
  };
  delivery: {
    type: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';
  };
  inventory: {
    reserved: boolean;
    released: boolean;
    releasedAt?: Date;
    itemsReserved: {
      productId: Types.ObjectId;
      variantKey?: string;
      quantity: number;
    }[];
  };
  notes: {
    text: string;
    createdBy?: Types.ObjectId;
    createdAt: Date;
  }[];
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
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    guestEmail: String,
    guestPhone: String,

    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        variantKey: String,
        snapshot: {
          name: { type: String, required: true },
          slug: String,
          image: String,
          sku: String,
          brand: String,
          category: String,
          attributes: Schema.Types.Mixed,
        },
        price: { 
          original: { type: Number, required: true },
          sale: { type: Number, required: true }
        },
        quantity: { type: Number, required: true, min: 1 },
        total: { type: Number, required: true },
      },
    ],

    pricing: {
      subtotal: { type: Number, required: true },
      itemDiscount: { type: Number, default: 0 },
      couponDiscount: { type: Number, default: 0 },
      campaignDiscount: { type: Number, default: 0 },
      deliveryCharge: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      total: { type: Number, required: true },
      currency: { type: String, default: 'BDT' },
    },

    coupon: {
      couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
      code: String,
      type: { type: String, enum: ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'] },
      value: Number,
      discountAmount: Number,
    },

    marketing: {
      source: String,
      medium: String,
      campaign: String,
      fbclid: String,
      gclid: String,
      ttclid: String,
      utm: {
        source: String,
        medium: String,
        campaign: String,
        term: String,
        content: String,
      },
      referrer: String,
    },

    status: {
      type: String,
      enum: [
        'PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'PROCESSING',
        'PACKED', 'READY_TO_SHIP', 'SHIPPED', 'IN_TRANSIT',
        'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
        'RETURN_REQUESTED', 'RETURNED', 'REFUNDED',
      ],
      default: 'PENDING',
    },

    shipping: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: String,
      address: { type: String, required: true },
      area: { type: String, required: true },
      city: { type: String, required: true },
      postcode: String,
      division: String,
      landmark: String,
    },

    delivery: {
      type: {
        type: String,
        enum: ['INSIDE_DHAKA', 'OUTSIDE_DHAKA'],
        required: true,
      },
    },

    inventory: {
      reserved: { type: Boolean, default: false },
      released: { type: Boolean, default: false },
      releasedAt: Date,
      itemsReserved: [
        {
          productId: { type: Schema.Types.ObjectId, ref: 'Product' },
          variantKey: String,
          quantity: Number,
        },
      ],
    },

    notes: [
      {
        text: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    meta: { 
      ip: String, 
      userAgent: String, 
      device: String,
      platform: String,
    },

    notifications: {
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
    },

    paymentMethod: {
      type: String,
      enum: ['COD', 'ONLINE'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

// Indexes
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'marketing.source': 1 });
OrderSchema.index({ 'shipping.phone': 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ orderId: 'text' });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);