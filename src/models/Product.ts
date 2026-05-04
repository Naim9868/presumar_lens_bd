// models/Product.ts
import mongoose, { Schema } from 'mongoose';
import { generateVariantKey } from '../utils/variant';
import { normalizeString } from '../utils/normalize';
import { generateUniqueSlug } from '../utils/slug';

// DO NOT redefine generateVariantKey here - it's imported above

const VariantAttributeSchema = new Schema({
  key: String,
  value: String
}, { _id: false });

const ProductVariantSchema = new Schema({
  sku: { type: String, required: true, unique: true },
  variantKey: { type: String, required: true },
  attributes: [VariantAttributeSchema],
  price: { type: Number, required: true },
  compareAtPrice: { type: Number },
  inventory: { type: Number, default: 0 },
  reserved: { type: Number, default: 0 },
  weight: { type: Number },
  images: { type: [String], default: [] },
  isDefault: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['in_stock', 'out_of_stock', 'discontinued'],
    default: 'in_stock'
  }
}, { _id: false });

const ProductSpecSchema = new Schema({
  key: String,
  label: String,
  value: Schema.Types.Mixed,
  group: String,
  unit: String,
  filterable: { type: Boolean, default: false }
}, { _id: false });

const ProductSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true },
  description: { type: String, required: true },
  shortDescription: { type: String, required: true },
  brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  specsFlat: [ProductSpecSchema],
  variants: [ProductVariantSchema],
  images: { type: [String], default: [] },
  thumbnail: { type: String, required: true },
  tags: { type: [String], default: [] },
  lowestPrice: Number,
  highestPrice: Number,
  totalInventory: Number,
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
  deletedAt: { type: Date, default: null },
  searchKeywords: { type: [String] }
}, { timestamps: true });

// ================= INDEXES =================
ProductSchema.index({ categoryId: 1, status: 1, lowestPrice: 1 });
ProductSchema.index({ 'specsFlat.key': 1, 'specsFlat.value': 1 });
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ brandId: 1 });

// ================= PRE SAVE =================
ProductSchema.pre('save', async function () {
  const doc = this as any;

  // Normalize specs
  if (doc.specsFlat?.length) {
    doc.specsFlat.forEach((spec: any) => {
      if (spec.key) spec.key = normalizeString(spec.key);
      if (spec.value && typeof spec.value === 'string') spec.value = normalizeString(spec.value);
    });
  }

  // Process variants
  if (doc.variants?.length) {
    doc.variants.forEach((v: any) => {
      // Normalize attributes
      v.attributes?.forEach((attr: any) => {
        if (attr.key) attr.key = normalizeString(attr.key);
        if (attr.value) attr.value = normalizeString(attr.value);
      });

      // Generate variantKey using imported function
      v.variantKey = generateVariantKey(v.attributes);
    });
  }

  // Validate variant count
  if (doc.variants.length > 100) {
    throw new Error('Too many variants. Maximum 100 variants allowed.');
  }

  // Calculate aggregates
  if (doc.variants.length > 0) {
    const prices = doc.variants.map((v: any) => v.price ?? 0);
    doc.lowestPrice = Math.min(...prices);
    doc.highestPrice = Math.max(...prices);
    doc.totalInventory = doc.variants.reduce((sum: number, v: any) => sum + (v.inventory ?? 0), 0);
  }

  // Generate slug if needed
  if (!doc.slug || doc.isModified('name')) {
    const baseSlug = doc.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    doc.slug = await generateUniqueSlug(baseSlug, doc._id?.toString());
  }
});

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);