import mongoose, { Schema, Document } from 'mongoose';

export type EventName =
  | 'page_view' | 'view_item' | 'search' | 'add_to_cart'
  | 'begin_checkout' | 'purchase' | 'refund' | 'wishlist' | 'signup';

export interface IMarketingEvent extends Document {
  eventId: string;
  name: EventName;
  userId?: mongoose.Types.ObjectId;
  sessionId: string;
  orderId?: mongoose.Types.ObjectId;
  value?: number;
  currency: string;
  source?: string;
  platform?: string;
  page?: string;
  productId?: mongoose.Types.ObjectId;
  utm?: Record<string, string>;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

const MarketingEventSchema = new Schema<IMarketingEvent>(
  {
    eventId: { type: String, required: true, unique: true },
    name: { type: String, enum: ['page_view','view_item','search','add_to_cart','begin_checkout','purchase','refund','wishlist','signup'], required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    sessionId: { type: String, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    value: Number,
    currency: { type: String, default: 'BDT' },
    source: String,
    platform: String,
    page: String,
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    utm: Schema.Types.Mixed,
    fbclid: String,
    gclid: String,
    ttclid: String,
    ip: String,
    userAgent: String,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

MarketingEventSchema.index({ name: 1, createdAt: -1 });
MarketingEventSchema.index({ createdAt: -1 });

export default mongoose.models.MarketingEvent || mongoose.model<IMarketingEvent>('MarketingEvent', MarketingEventSchema);
