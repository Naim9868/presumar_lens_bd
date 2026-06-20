import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  type: 'FIXED' | 'PERCENTAGE' | 'FREE_SHIPPING';
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  allowedUsers?: mongoose.Types.ObjectId[];
  allowedProducts?: mongoose.Types.ObjectId[];
  allowedCategories?: string[];
  startDate?: Date;
  endDate?: Date;
  active: boolean;
  description?: string;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, unique: true, required: true, uppercase: true },
    type: { type: String, enum: ['FIXED', 'PERCENTAGE', 'FREE_SHIPPING'], required: true },
    value: { type: Number, required: true },
    minOrder: Number,
    maxDiscount: Number,
    usageLimit: Number,
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    allowedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    allowedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    allowedCategories: [String],
    startDate: Date,
    endDate: Date,
    active: { type: Boolean, default: true },
    description: String,
  },
  { timestamps: true }
);

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);