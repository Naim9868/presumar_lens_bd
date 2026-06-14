
import mongoose, { Schema, Document, Types } from "mongoose";
import { normalizeString } from "../utils/normalize";
import { generateVariantKey } from "../utils/variant";
import { generateUniqueSlug } from "../utils/slug";

/* ==================================================
   SPECIFICATION
================================================== */

const ProductSpecificationSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
    },

    label: {
      type: String,
      required: true,
    },

    value: {
      type: Schema.Types.Mixed,
      required: true,
    },

    unit: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: [
        "text",
        "textarea",
        "number",
        "boolean",
        "date",
        "select",
        "multiselect",
      ],
      default: "text",
    },

    filterable: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const ProductSpecificationGroupSchema = new Schema(
  {
    groupName: {
      type: String,
      required: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    specifications: {
      type: [ProductSpecificationSchema],
      default: [],
    },
  },
  { _id: false }
);

/* ==================================================
   FLAT SPECS (SEARCH + FILTERING)
================================================== */

const ProductFlatSpecSchema = new Schema(
  {
    key: String,
    label: String,
    value: Schema.Types.Mixed,
    unit: String,

    filterable: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/* ==================================================
   VARIANT
================================================== */

const VariantAttributeSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
    },

    value: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const ProductVariantSchema = new Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
    },

    variantKey: {
      type: String,
      required: true,
    },

    attributes: {
      type: [VariantAttributeSchema],
      default: [],
    },

    price: {
      type: Number,
      required: true,
    },

    compareAtPrice: {
      type: Number,
      default: 0,
    },

    inventory: {
      type: Number,
      default: 0,
    },

    reserved: {
      type: Number,
      default: 0,
    },

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
      enum: [
        "in_stock",
        "out_of_stock",
        "discontinued",
      ],
      default: "in_stock",
    },
  },
  { _id: false }
);


const ProductImageSchema = new Schema({
  url: String,
  alt: String,
  sortOrder: Number
}, { _id: false });


const ProductImageGroupSchema = new Schema({
  type: {
    type: String,
    enum: [
      "product",
      "package",
      "sample",
      "lifestyle",
      "installation",
      "comparison",
      "other"
    ],
    required: true
  },

  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    default: ""
  },

  images: [ProductImageSchema]

}, { _id: false });

const ProductVideoSchema = new Schema({
  url: String,
  title: String,
  thumbnail: String,
  platform: {
    type: String,
    enum: ["youtube", "vimeo", "other"],
    default: "youtube"
  }
}, { _id: false });


const BadgeSchema = new mongoose.Schema(
  {
    id: String,
    label: String,
    color: String,
    icon: String,
    type: {
      type: String,
      enum: ['default', 'custom'],
      default: 'custom',
    },
  },
  { _id: false }
);

/* ==================================================
   PRODUCT
================================================== */

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
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

    specificationGroups: {
      type: [ProductSpecificationGroupSchema],
      default: [],
    },

    specsFlat: {
      type: [ProductFlatSpecSchema],
      default: [],
    },

    variants: {
      type: [ProductVariantSchema],
      default: [],
    },

    imageGroups: {
      type: [ProductImageGroupSchema],
      default: []
    },

    thumbnail: {
      type: String,
      required: true,
    },

    videos: {
      type: [ProductVideoSchema],
      default: []
    },

    tags: {
      type: [String],
      default: [],
    },

    inventorySummary: {
      available: {
        type: Number,
        default: 0
      },

      reserved: {
        type: Number,
        default: 0
      },

      incoming: {
        type: Number,
        default: 0
      },

      lowStockThreshold: {
        type: Number,
        default: 5
      }
    },

    relatedProducts: [{
      type: Schema.Types.ObjectId,
      ref: "Product"
    }],

    featured: {
      type: Boolean,
      default: false
    },

    badges: {
      type: [BadgeSchema],
      default: [],
    },

    ratingAverage: {
      type: Number,
      default: 0
    },

    ratingCount: {
      type: Number,
      default: 0
    },

    searchBoost: {
      type: Number,
      default: 1
    },

    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: {
        type: [String],
        default: []
      },

      canonicalUrl: String,

      ogImage: String,

      noIndex: {
        type: Boolean,
        default: false
      }
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

    searchKeywords: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/* ==================================================
   INDEXES
================================================== */

ProductSchema.index({
  searchKeywords: "text",
  name: "text",
  shortDescription: "text",
});

ProductSchema.index({ brandId: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ lowestPrice: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({
  deletedAt: 1
});

ProductSchema.index({
  featured: 1
});

ProductSchema.index({
  ratingAverage: -1
});

ProductSchema.index({
  searchBoost: -1
});

ProductSchema.index({
  "specsFlat.key": 1,
  "specsFlat.value": 1,
});

ProductSchema.index({
  "variants.inventory": 1,
});

ProductSchema.index({
  relatedProducts: 1
});

ProductSchema.index({
  status: 1,
  categoryId: 1,
  brandId: 1,
  lowestPrice: 1
});

/* ==================================================
   PRE SAVE
================================================== */

ProductSchema.pre("save", async function () {
  const doc = this as any;

  /* -----------------------------
     Build specsFlat automatically
  ------------------------------ */

  const flatSpecs: any[] = [];

  doc.specificationGroups?.forEach((group: any) => {
    group.specifications?.forEach((spec: any) => {
      if (spec.key) {
        spec.key = normalizeString(spec.key);
      }

      flatSpecs.push({
        key: spec.key,
        label: spec.label,
        value: spec.value,
        unit: spec.unit,
        filterable: spec.filterable,
      });
    });
  });

  doc.specsFlat = flatSpecs;

  /* -----------------------------
     Variants
  ------------------------------ */

  doc.variants?.forEach((variant: any) => {
    variant.attributes?.forEach((attr: any) => {
      attr.key = normalizeString(attr.key);
      attr.value = normalizeString(attr.value);
    });

    variant.variantKey =
      generateVariantKey(variant.attributes);
  });

  /* -----------------------------
     inventorySummary
  ------------------------------ */

  doc.inventorySummary.available =
    doc.variants.reduce(
      (sum: number, v: any) =>
        sum + (v.inventory || 0),
      0
    );

  doc.inventorySummary.reserved =
    doc.variants.reduce(
      (sum: number, v: any) =>
        sum + (v.reserved || 0),
      0
    );

  /* -----------------------------
     Aggregate Prices
  ------------------------------ */

  if (doc.variants?.length) {
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

  /* -----------------------------
     Slug
  ------------------------------ */

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

  /* -----------------------------
     Search Keywords
  ------------------------------ */

  const keywords = new Set<string>();

  const addKeyword = (value: any) => {
    if (!value) return;

    const str = String(value)
      .toLowerCase()
      .trim();

    if (!str) return;

    keywords.add(str);
  };

  addKeyword(doc.name);
  addKeyword(doc.slug);
  addKeyword(doc.shortDescription);
  addKeyword(doc.description);

  doc.tags?.forEach(addKeyword);

  doc.specsFlat?.forEach((spec: any) => {
    addKeyword(spec.key);
    addKeyword(spec.label);
    addKeyword(spec.value);
    addKeyword(spec.unit);
  });

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
