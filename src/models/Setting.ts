// src/models/Setting.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  group: string;   // 'general' | 'payment' | 'notifications' | 'api' | 'marketing' | 'sms'
  key: string;
  value: string;   // always string — encrypt sensitive values before saving
  encrypted: boolean;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    group: { type: String, required: true, index: true },
    key:   { type: String, required: true },
    value: { type: String, default: '' },
    encrypted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SettingSchema.index({ group: 1, key: 1 }, { unique: true });

export default mongoose.models.Setting ||
  mongoose.model<ISetting>('Setting', SettingSchema);
