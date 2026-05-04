import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  // userId?: mongoose.Types.ObjectId;

  items: {
    productId: mongoose.Types.ObjectId;
    variantId?: string; // Changed to string for SKU
    name: string;
    sku?: string;
    price: number;
    quantity: number;
    image?: string;
  }[];

  pricing: {
    subtotal: number;
    deliveryCharge: number;
    discount: number;
    total: number;
  };

  status: string;
  customStatus?: string;

  timeline: {
    status: string;
    note?: string;
    createdAt: Date;
  }[];

  payment: {
    method: 'COD' | 'ONLINE';
    status: 'PAID' | 'UNPAID' | 'FAILED';
    transactionId?: string;
  };

  shipping: {
    name: string;
    phone: string;
    address: string;
    area: string;
    city: string;
  };

  delivery: {
    type: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';
    courier?: string;
    trackingId?: string;
  };

  isCancelled: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, unique: true, required: true },

    // userId: { type: Schema.Types.ObjectId, ref: 'User' },

    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        variantId: { type: String }, // Changed from Schema.Types.ObjectId to String
        name: { type: String, required: true },
        sku: { type: String },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String },
      },
    ],

    pricing: {
      subtotal: { type: Number, required: true },
      deliveryCharge: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },

    status: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
      ],
      default: 'PENDING',
    },

    customStatus: { type: String },

    timeline: [
      {
        status: { type: String, required: true },
        note: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    payment: {
      method: { type: String, enum: ['COD', 'ONLINE'], required: true },
      status: {
        type: String,
        enum: ['PAID', 'UNPAID', 'FAILED'],
        default: 'UNPAID',
      },
      transactionId: { type: String },
    },

    shipping: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      area: { type: String, required: true },
      city: { type: String, required: true },
    },

    delivery: {
      type: {
        type: String,
        enum: ['INSIDE_DHAKA', 'OUTSIDE_DHAKA'],
        required: true,
      },
      courier: { type: String },
      trackingId: { type: String },
    },

    isCancelled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Check if model exists before creating a new one
const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;