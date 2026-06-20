import mongoose, { Schema, Document } from 'mongoose';

export interface IAttribution extends Document {
  orderId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  firstTouch: { source: string; medium?: string; campaign?: string; at: Date };
  lastTouch: { source: string; medium?: string; campaign?: string; at: Date };
  touchpoints: { source: string; medium?: string; campaign?: string; at: Date }[];
  conversionValue: number;
}

const AttributionSchema = new Schema<IAttribution>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    firstTouch: { source: String, medium: String, campaign: String, at: Date },
    lastTouch: { source: String, medium: String, campaign: String, at: Date },
    touchpoints: [{ source: String, medium: String, campaign: String, at: Date }],
    conversionValue: Number,
  },
  { timestamps: true }
);

export default mongoose.models.Attribution || mongoose.model<IAttribution>('Attribution', AttributionSchema);