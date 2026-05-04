// src/models/Category.ts - WITHOUT middleware
import mongoose, { Schema } from 'mongoose';

const CategorySpecFieldSchema = new Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'select', 'boolean', 'multiselect'], required: true },
  unit: { type: String },
  options: { type: [String], default: [] },
  required: { type: Boolean, default: false },
  filterable: { type: Boolean, default: false },
  isVariantAttribute: { type: Boolean, default: false },
  defaultValue: { type: Schema.Types.Mixed }
}, { _id: false });

const CategorySpecGroupSchema = new Schema({
  groupName: { type: String, required: true },
  fields: { type: [CategorySpecFieldSchema], default: [] },
  displayOrder: { type: Number, default: 0 }
}, { _id: false });

const CategorySchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  specificationTemplate: { type: [CategorySpecGroupSchema], default: [] },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// NO middleware - slug will be handled in the API route

export const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);