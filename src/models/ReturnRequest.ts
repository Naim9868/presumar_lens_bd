import mongoose, { Schema, Document } from 'mongoose';

export interface IReturnRequest extends Document {
  orderId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  reason: string;
  description?: string;
  images?: string[];
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  refundAmount?: number;
  refundedAt?: Date;
  adminNote?: string;
}

const ReturnSchema = new Schema<IReturnRequest>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, required: true },
    description: String,
    images: [String],
    status: {
      type: String,
      enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'],
      default: 'REQUESTED',
    },
    refundAmount: Number,
    refundedAt: Date,
    adminNote: String,
  },
  { timestamps: true }
);

export default mongoose.models.ReturnRequest || mongoose.model<IReturnRequest>('ReturnRequest', ReturnSchema);