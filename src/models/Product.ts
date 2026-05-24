// models/Product.ts

import mongoose, { Schema } from "mongoose";
import { generateVariantKey } from "../utils/variant";
import { normalizeString } from "../utils/normalize";
import { generateUniqueSlug } from "../utils/slug";

const VariantAttributeSchema = new Schema(
  {
    key: String,
    value: String,
  },
  { _id: false }
);

const ProductVariantSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true },
    variantKey: { type: String, required: true },
    attributes: [VariantAttributeSchema],

    price: { type: Number, required: true },
    compareAtPrice: Number,

    inventory: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },

    images: {
      type: [String],
      default: [],
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["in_stock", "out_of_stock", "discontinued"],
      default: "in_stock",
    },
  },
  { _id: false }
);

const ProductSpecSchema = new Schema(
  {
    key: String,
    label: String,
    value: Schema.Types.Mixed,
    group: String,
    unit: String,

    filterable: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
    },

    shortDescription: {
      type: String,
      required: true,
    },

    brandId: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subcategoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },

    specsFlat: [ProductSpecSchema],

    variants: [ProductVariantSchema],

    images: {
      type: [String],
      default: [],
    },

    thumbnail: {
      type: String,
      required: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    lowestPrice: Number,
    highestPrice: Number,
    totalInventory: Number,

    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    // IMPORTANT
    searchKeywords: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);





/* =========================================
   INDEXES
========================================= */

ProductSchema.index({
  searchKeywords: "text",
  name: "text",
  shortDescription: "text",
});

ProductSchema.index({
  brandId: 1,
});

ProductSchema.index({
  categoryId: 1,
});

ProductSchema.index({
  status: 1,
});

ProductSchema.index({
  tags: 1,
});

ProductSchema.index({
  lowestPrice: 1,
});

ProductSchema.index({
  createdAt: -1,
});

ProductSchema.index({ 'specsFlat.key': 1, 'specsFlat.value': 1 });
ProductSchema.index({ 'variants.inventory': 1 });


/* =========================================
   PRE SAVE
========================================= */

ProductSchema.pre("save", async function () {
  const doc = this as any;

  /*
    ======================================
    NORMALIZE SPECS
    ======================================
  */

  if (doc.specsFlat?.length) {
    doc.specsFlat.forEach((spec: any) => {
      if (spec.key) {
        spec.key = normalizeString(spec.key);
      }

      if (spec.value && typeof spec.value === "string") {
        spec.value = normalizeString(spec.value);
      }
    });
  }

  /*
    ======================================
    VARIANTS
    ======================================
  */

  if (doc.variants?.length) {
    doc.variants.forEach((variant: any) => {
      variant.attributes?.forEach((attr: any) => {
        if (attr.key) {
          attr.key = normalizeString(attr.key);
        }

        if (attr.value) {
          attr.value = normalizeString(attr.value);
        }
      });

      variant.variantKey = generateVariantKey(
        variant.attributes
      );
    });
  }

  /*
    ======================================
    AGGREGATES
    ======================================
  */

  if (doc.variants.length > 0) {
    const prices = doc.variants.map(
      (v: any) => v.price || 0
    );

    doc.lowestPrice = Math.min(...prices);

    doc.highestPrice = Math.max(...prices);

    doc.totalInventory = doc.variants.reduce(
      (sum: number, v: any) =>
        sum + (v.inventory || 0),
      0
    );
  }

  /*
    ======================================
    SLUG
    ======================================
  */

  if (!doc.slug || doc.isModified("name")) {
    const baseSlug = doc.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    doc.slug = await generateUniqueSlug(
      baseSlug,
      doc._id?.toString()
    );
  }

  /*
    ======================================
    SEARCH KEYWORDS
    ======================================
  */

  const keywords = new Set<string>();

  const addKeyword = (value: any) => {
    if (!value) return;

    const str = String(value)
      .toLowerCase()
      .trim();

    if (!str) return;

    keywords.add(str);
  };

  // Product basic info
  addKeyword(doc.name);
  addKeyword(doc.slug);
  addKeyword(doc.shortDescription);
  addKeyword(doc.description);

  // Tags
  doc.tags?.forEach((tag: string) => {
    addKeyword(tag);
  });

  // Specs
  doc.specsFlat?.forEach((spec: any) => {
    addKeyword(spec.key);
    addKeyword(spec.label);
    addKeyword(spec.value);
    addKeyword(spec.group);
    addKeyword(spec.unit);
  });

  // Variants
  doc.variants?.forEach((variant: any) => {
    addKeyword(variant.sku);
    addKeyword(variant.variantKey);

    variant.attributes?.forEach((attr: any) => {
      addKeyword(attr.key);
      addKeyword(attr.value);
    });
  });

  doc.searchKeywords = Array.from(keywords);
});





export const Product =
  mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);
// models/ProductVariant.ts
export const ProductVariant =
  mongoose.models.ProductVariant ||
  mongoose.model('ProductVariant', ProductVariantSchema);

// models/ProductSpecification.ts
export const ProductSpecification =
  mongoose.models.ProductSpecification ||
  mongoose.model('ProductSpecification', ProductSpecSchema);

 