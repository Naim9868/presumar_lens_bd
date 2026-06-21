// src/models/Customer.ts
import mongoose, {
  Schema,
  Document,
  Types,
} from 'mongoose';
import { ICustomer } from '@/types/customer';

const CustomerSchema = new Schema<ICustomer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
    },
    addresses: [
      {
        label: {
          type: String,
          default: 'Home',
        },
        name: String,
        phone: String,
        email: String,
        address: String,
        area: String,
        city: String,
        postcode: String,
        division: String,
        landmark: String,
        isDefault: {
          type: Boolean,
          default: true,
        },
      },
    ],
    stats: {
      ordersCount: {
        type: Number,
        default: 0,
      },
      totalSpent: {
        type: Number,
        default: 0,
      },
      firstOrderAt: Date,
      lastOrderAt: Date,
    },
    account: {
      hasLogin: {
        type: Boolean,
        default: false,
      },
      convertedAt: Date,
    },
    notifications: {
      sms: {
        type: Boolean,
        default: false,
      },
      email: {
        type: Boolean,
        default: false,
      },
      whatsapp: {
        type: Boolean,
        default: true,
      },
    },
    notes: [
      {
        text: { type: String, required: true },
        createdBy: { type: String, default: 'ADMIN' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    smsHistory: [
      {
        message: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
        type: { type: String, enum: ['bulk', 'single'], default: 'single' },
        status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'sent' },
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED', 'ARCHIVED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
CustomerSchema.index({ phone: 1, email: 1 });
CustomerSchema.index({ status: 1 });
CustomerSchema.index({ 'stats.ordersCount': -1 });
CustomerSchema.index({ 'stats.totalSpent': -1 });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);