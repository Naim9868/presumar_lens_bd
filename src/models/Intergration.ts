import mongoose, { Schema, Document } from 'mongoose';

export type IntegrationProvider =
  | 'facebook' | 'instagram' | 'tiktok' | 'google' | 'youtube'
  | 'whatsapp' | 'telegram' | 'sslcommerz' | 'bkash' | 'nagad'
  | 'pathao' | 'steadfast' | 'redx' | 'paperfly';

export interface IIntegration extends Document {
  provider: IntegrationProvider;
  enabled: boolean;
  credentials: {
    pixelId?: string;
    accessToken?: string;
    apiKey?: string;
    apiSecret?: string;
    accountId?: string;
    testEventCode?: string;
    webhookSecret?: string;
  };
  settings?: Record<string, unknown>;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    provider: { type: String, unique: true, required: true },
    enabled: { type: Boolean, default: false },
    credentials: {
      pixelId: String,
      accessToken: String,
      apiKey: String,
      apiSecret: String,
      accountId: String,
      testEventCode: String,
      webhookSecret: String,
    },
    settings: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.models.Integration || mongoose.model<IIntegration>('Integration', IntegrationSchema);