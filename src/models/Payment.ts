//models/Payment.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  method: 'COD' | 'SSL' | 'BKASH' | 'NAGAD' | 'CARD';
  provider?: string;
  transactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paidAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    method: { type: String, enum: ['COD', 'SSL', 'BKASH', 'NAGAD', 'CARD'], required: true },
    provider: String,
    transactionId: String,
    gatewayResponse: Schema.Types.Mixed,
    amount: { type: Number, required: true },
    currency: { type: String, default: 'BDT' },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number,
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);