import mongoose, { Schema, Document } from 'mongoose';

export interface IAudience extends Document {
  name: string;
  description?: string;
  rules: {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
    value: unknown;
  }[];
  customerCount: number;
  autoRefresh: boolean;
  lastRefreshed?: Date;
}

const AudienceSchema = new Schema<IAudience>(
  {
    name: { type: String, required: true },
    description: String,
    rules: [
      {
        field: String,
        operator: { type: String, enum: ['gt', 'lt', 'eq', 'gte', 'lte', 'contains'] },
        value: Schema.Types.Mixed,
      },
    ],
    customerCount: { type: Number, default: 0 },
    autoRefresh: { type: Boolean, default: false },
    lastRefreshed: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Audience || mongoose.model<IAudience>('Audience', AudienceSchema);