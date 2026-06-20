// src/models/OrderEvent.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrderEvent extends Document {
  orderId: Types.ObjectId;
  status: string;
  previousStatus?: string;
  source: 'SYSTEM' | 'ADMIN' | 'CUSTOMER' | 'COURIER' | 'PAYMENT';
  note?: string;
  metadata?: Record<string, unknown>;
  createdBy?: Types.ObjectId;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const OrderEventSchema = new Schema<IOrderEvent>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    status: { type: String, required: true },
    previousStatus: String,
    source: { 
      type: String, 
      enum: ['SYSTEM', 'ADMIN', 'CUSTOMER', 'COURIER', 'PAYMENT'], 
      default: 'SYSTEM' 
    },
    note: String,
    metadata: Schema.Types.Mixed,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

OrderEventSchema.index({ orderId: 1, createdAt: -1 });

export default mongoose.models.OrderEvent || mongoose.model<IOrderEvent>('OrderEvent', OrderEventSchema);