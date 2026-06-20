import mongoose, { Schema, Document } from 'mongoose';

export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'google' | 'telegram' | 'whatsapp';

export interface ICampaign extends Document {
  name: string;
  slug: string;
  platform: Platform;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  objective: 'TRAFFIC' | 'ENGAGEMENT' | 'SALES' | 'REMARKETING' | 'AWARENESS';
  budget: { total: number; daily?: number };
  startDate: Date;
  endDate?: Date;
  utm: {
    source: string;
    medium: string;
    campaign: string;
    term?: string;
    content?: string;
  };
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
    orders: number;
    revenue: number;
    roas: number;
  };
  externalCampaignId?: string;
  createdBy?: mongoose.Types.ObjectId;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'tiktok', 'youtube', 'google', 'telegram', 'whatsapp'],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED'],
      default: 'DRAFT',
    },
    objective: {
      type: String,
      enum: ['TRAFFIC', 'ENGAGEMENT', 'SALES', 'REMARKETING', 'AWARENESS'],
    },
    budget: { total: Number, daily: Number },
    startDate: Date,
    endDate: Date,
    utm: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String,
    },
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      spend: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      roas: { type: Number, default: 0 },
    },
    externalCampaignId: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

export default mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);