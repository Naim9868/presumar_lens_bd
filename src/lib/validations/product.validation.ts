import { z } from 'zod';

/* ========================
   SAFE BASE TYPES
======================== */

const ObjectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

const SafeString = z.string().trim().min(1);

const SafeNumber = z.coerce.number();

/* ========================
   SPEC FIELD
======================== */

export const ProductSpecSchema = z.object({
  key: SafeString,
  label: SafeString,
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  group: SafeString,
  unit: z.string().optional(),
  filterable: z.boolean().default(false)
});

/* ========================
   VARIANT
======================== */

export const ProductVariantSchema = z.object({
  sku: SafeString.transform(v => v.toUpperCase()),

  variantKey: z.string().optional(),

  attributes: z.array(
    z.object({
      key: SafeString,
      value: SafeString
    })
  ).min(1),

  specificationOverrides: z.array(ProductSpecSchema).default([]),

  price: SafeNumber.refine(v => v > 0, 'Price must be > 0'),

  compareAtPrice: SafeNumber.optional(),

  inventory: z.coerce.number().int().min(0).default(0),

  reserved: z.coerce.number().int().min(0).default(0),

  weight: SafeNumber.optional(),

  images: z.array(z.string().url()).optional(),

  isDefault: z.boolean().default(false),

  status: z.enum(['in_stock', 'out_of_stock', 'discontinued']).default('in_stock')
}).superRefine((data, ctx) => {
  if (data.reserved > data.inventory) {
    ctx.addIssue({
      code: 'custom',
      message: 'Reserved cannot exceed inventory',
      path: ['reserved']
    });
  }

  if (data.compareAtPrice && data.compareAtPrice <= data.price) {
    ctx.addIssue({
      code: 'custom',
      message: 'compareAtPrice must be greater than price',
      path: ['compareAtPrice']
    });
  }
});

/* ========================
   CATEGORY TEMPLATE
======================== */

const CategorySpecFieldSchema = z.object({
  key: SafeString,
  label: SafeString,
  type: z.enum(['text', 'number', 'select', 'boolean', 'multiselect']),
  unit: z.string().optional(),
  options: z.array(z.string()).optional().default([]),
  required: z.boolean().default(false),
  filterable: z.boolean().default(false),
  isVariantAttribute: z.boolean().default(false),
  defaultValue: z.any().optional()
});

const CategorySpecGroupSchema = z.object({
  groupName: SafeString,
  fields: z.array(CategorySpecFieldSchema).default([]),
  displayOrder: z.number().default(0)
});

/* ========================
   CREATE CATEGORY
======================== */

export const CreateCategorySchema = z.object({
  name: SafeString.max(100),

  slug: z.string().optional(),

  parentId: ObjectId.optional(),

  specificationTemplate: z.array(CategorySpecGroupSchema).default([]),

  status: z.enum(['active', 'inactive']).default('active')
});

/* ========================
   UPDATE CATEGORY (FIXED - NO .partial BUG)
======================== */

export const UpdateCategorySchema = CreateCategorySchema.extend({
  name: SafeString.max(100).optional(),
  slug: z.string().optional(),
  parentId: ObjectId.optional(),
  specificationTemplate: z.array(CategorySpecGroupSchema).optional(),
  status: z.enum(['active', 'inactive']).optional()
});

/* ========================
   PRODUCT
======================== */

export const CreateProductSchema = z.object({
  name: SafeString.max(200),
  slug: z.string().optional(),
  description: SafeString.min(50).max(5000),
  shortDescription: SafeString.min(10).max(500),
  brandId: ObjectId,
  categoryId: ObjectId,
  subcategoryId: ObjectId.optional(), // This should be optional
  specsFlat: z.array(ProductSpecSchema).default([]),
  variants: z.array(ProductVariantSchema).min(1),
  images: z.array(z.string().url()).default([]),
  thumbnail: z.string().url(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  deletedAt: z.date().nullable().optional(),
  searchKeywords: z.array(z.string()).optional()
});

/* ========================
   QUERY
======================== */

export const ProductQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),

  query: z.string().optional(),

  categoryId: ObjectId.optional(),
  brandId: ObjectId.optional(),

  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),

  tags: z.string().optional(),

  status: z.enum(['draft', 'active', 'archived', 'all']).default('all'),

  sortBy: z.enum([
    'price_asc',
    'price_desc',
    'newest',
    'oldest',
    'name_asc',
    'name_desc'
  ]).default('newest')
});

/* ========================
   SAFE SANITIZER (NO any BUGS)
======================== */

export function sanitizeProductData(data: Record<string, unknown>) {
  return {
    ...data,
    name: typeof data.name === 'string' ? data.name.trim() : '',
    slug: typeof data.slug === 'string' ? data.slug.toLowerCase().trim() : '',
    description: typeof data.description === 'string' ? data.description.trim() : '',
    shortDescription: typeof data.shortDescription === 'string' ? data.shortDescription.trim() : '',
    tags: Array.isArray(data.tags)
      ? data.tags.filter((t): t is string => typeof t === 'string')
      : [],
    images: Array.isArray(data.images)
      ? data.images.filter((i): i is string => typeof i === 'string')
      : [],
    specsFlat: Array.isArray(data.specsFlat) ? data.specsFlat : [],
    variants: Array.isArray(data.variants) ? data.variants : []
  };
}