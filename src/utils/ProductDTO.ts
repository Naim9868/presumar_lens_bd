import { Types } from 'mongoose';
import { IProduct,IProductDB, IProductPopulated  } from '@/types/product';
import { ProductVariant } from '@/models/Product';


/* ================= TYPES ================= */

type ProductSource = IProductDB | IProductPopulated ;

type RelationDTO = {
  id: string;
  name: string;
  slug: string;
};

/* ================= HELPERS ================= */

// Extract ID safely
function getId(value: unknown): string {
  if (!value) return '';

  if (typeof value === 'string') return value;

  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === 'object' && value !== null && '_id' in value) {
    const v = value as any;
    return v._id?.toString?.() ?? '';
  }

  return String(value);
}

// ✅ FIXED: supports populated + non-populated
function getRelation(value: unknown): RelationDTO | null {
  if (!value) return null;

  // populated
  if (typeof value === 'object' && value !== null && '_id' in value) {
    const v = value as any;

    return {
      id: v._id?.toString?.() ?? '',
      name: v.name ?? '',
      slug: v.slug ?? ''
    };
  }

  // not populated (just ObjectId or string)
  return {
    id: getId(value),
    name: '',
    slug: ''
  };
}

// Safe date
function toISODate(value: unknown): string {
  if (!value) return new Date().toISOString();

  try {
    return new Date(value as any).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// Ensure array
function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

/* ================= MAIN DTO ================= */

export function toProductDTO(p: ProductSource): IProduct{
  if (!p) {
    throw new Error('Invalid product data');
  }

  const totalInventory = Number(p.totalInventory ?? 0);
  // const lowestPrice = Number(p.lowestPrice ?? 0);
  // const highestPrice = Number(p.highestPrice ?? 0);


  const brandField = (p as any).brand ?? (p as any).brandId;
  const categoryField = (p as any).category ?? (p as any).categoryId;
  const subcategoryField = (p as any).subcategory ?? (p as any).subcategoryId;

  return {
    _id: getId(p._id),

    name: p.name ?? '',
    slug: p.slug ?? '',

    description: p.description ?? '',
    shortDescription: p.shortDescription ?? '',

    // ✅ FIXED - use the determined field
    brand: getRelation(brandField),
    category: getRelation(categoryField),
    subcategory: getRelation(subcategoryField) ?? undefined,

    specsFlat: safeArray(p.specsFlat),
    variants: safeArray(p.variants),

    images: safeArray<string>(p.images),
    thumbnail: p.thumbnail ?? '',

    tags: safeArray<string>(p.tags),

    // ✅ Derived
    price: p.lowestPrice,
    maxPrice: p.highestPrice,

    totalInventory,
    isAvailable: totalInventory > 0,

    createdAt: toISODate(p.createdAt),
    updatedAt: toISODate(p.updatedAt), // ✅ added
  };
}