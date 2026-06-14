// types/product.ts
import { Types } from "mongoose";

export type ProductStatus =
  | "draft"
  | "active"
  | "archived";

export type VariantStatus =
  | "in_stock"
  | "out_of_stock"
  | "discontinued";

export type SpecificationType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "select"
  | "multiselect";

export type ImageGroupType =
  | "product"
  | "package"
  | "sample"
  | "lifestyle"
  | "installation"
  | "comparison"
  | "other";

export type VideoPlatform =
  | "youtube"
  | "vimeo"
  | "other";

/* ==================================================
   SPECIFICATIONS
================================================== */

export interface IProductSpecification {
  key: string;
  label: string;
  value: string | number | boolean | string[] | Date;
  unit?: string;
  type?: SpecificationType;
  filterable?: boolean;
}

export interface IProductSpecificationGroup {
  groupName: string;
  displayOrder?: number;
  specifications: IProductSpecification[];
}

/* ==================================================
   FLAT SPECS
================================================== */

export interface IProductFlatSpec {
  key: string;
  label: string;
  value: string | number | boolean | string[] | Date;
  unit?: string;
  filterable?: boolean;
}

/* ==================================================
   VARIANTS
================================================== */

export interface IVariantAttribute {
  key: string;
  value: string;
}

export interface IProductVariant {
  sku: string;
  variantKey: string;

  attributes: IVariantAttribute[];

  price: number;
  compareAtPrice?: number;

  inventory: number;
  reserved?: number;

  images: string[];

  isDefault?: boolean;

  status: VariantStatus;
}

/* ==================================================
   IMAGES
================================================== */

export interface IProductImage {
  url: string;
  alt?: string;
  sortOrder?: number;
}

export interface IProductImageGroup {
  type: ImageGroupType;
  title: string;
  description?: string;
  images: IProductImage[];
}

/* ==================================================
   Videos
================================================== */

export interface IProductVideo {
  url: string;
  title?: string;
  thumbnail?: string;
  platform?: VideoPlatform;
}

/* =====================================================
   INVENTORY SUMMARY
===================================================== */

export interface IInventorySummary {
  available: number;

  reserved: number;

  incoming: number;

  lowStockThreshold: number;
}

/* ==================================================
SEO
================================================== */

export interface IProductSEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];

  canonicalUrl?: string;

  ogImage?: string;

  noIndex?: boolean;
}

/* ==================================================
BADGES
================================================== */

export type BadgeType =
  | "default"
  | "custom";

export interface IProductBadge {
  id?: string;
  label: string;
  color?: string;
  icon?: string;
  type?: BadgeType;
}

/* ==================================================
   PRODUCT
================================================== */

export interface IProduct {
  _id: string;

  name: string;
  slug: string;

  description: string;
  shortDescription: string;

  brandId: string;
  categoryId: string;
  subcategoryId?: string;

  specificationGroups: IProductSpecificationGroup[];

  /**
   * Auto-generated from specificationGroups
   * Used for filtering and searching
   */
  specsFlat: IProductFlatSpec[];

  variants: IProductVariant[];

  imageGroups: IProductImageGroup[];

  thumbnail: string;

  videos: IProductVideo[];

  tags: string[];

   badges: IProductBadge[];

  relatedProducts: (
    string |
    Types.ObjectId
  )[];

  featured: boolean;

  searchBoost: number;

  inventorySummary: IInventorySummary;

  lowestPrice: number;
  highestPrice?: number;
  totalInventory: number;

  ratingAverage: number;

  ratingCount: number;

  seo?: IProductSEO;

  status: ProductStatus;

  deletedAt?: string | null;

  searchKeywords: string[];

  createdAt: string;
  updatedAt: string;
}

/* ==================================================
   PRODUCT LIST ITEM
================================================== */
export interface IProductVariantCard {
  _id?: string;
  price: number;
  compareAtPrice?: number;
  isDefault?: boolean;
}

export interface IProductCard {
  _id: string;

  name: string;
  slug: string;

  thumbnail?: string;

  images?: string[];

  price?: number;

  variants?: IProductVariantCard[];

  brand?: {
    _id?: string;
    name: string;
    slug?: string;
  } | null;

  totalInventory: number;

  soldCount?: number;

  isAvailable: boolean;
}

/* ==================================================
   CREATE PRODUCT
================================================== */

export interface ICreateProduct {
  name: string;
  description: string;
  shortDescription: string;

  brandId: string;
  categoryId: string;
  subcategoryId?: string;

  specificationGroups: IProductSpecificationGroup[];

  variants: IProductVariant[];

  imageGroups: IProductImageGroup[];

  thumbnail: string;

  videos?: IProductVideo[];

  tags?: string[];

  badges?: IProductBadge[];

  seo?: IProductSEO;

  status?: ProductStatus;
}

/* ==================================================
   PRODUCT FILTERS
================================================== */

export interface IProductFilters {
  page?: number;
  limit?: number;

  query?: string;

  categoryId?: string;
  brandId?: string;

  minPrice?: number;
  maxPrice?: number;

  tags?: string[];

  status?: ProductStatus;

  specs?: Record<
    string,
    string | number | boolean | string[]
  >;
  sort?: string | 'newest' | 'price_low' | 'price_high' | 'popular' | 'rating';
}

export interface IProductListResponse {
  products: IProduct[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  filters?: {
    brands?: {
      id: string;
      name: string;
      count: number;
    }[];

    specs?: {
      key: string;
      values: {
        value: string;
        count: number;
      }[];
    }[];

    sort?: 'newest' | 'price_low' | 'price_high' | 'popular' | 'rating';
  };
}


export interface UpdateProductData {
  id: string;

  name?: string;
  description?: string;
  shortDescription?: string;

  brandId?: string;
  categoryId?: string;
  subcategoryId?: string;

  specificationGroups?: IProductSpecificationGroup[];

  variants?: IProductVariant[];

  imageGroups?: IProductImageGroup[];

  thumbnail?: string;

  videos?: IProductVideo[];

  tags?: string[];

  badges?: IProductBadge[];

  relatedProducts?: string[];

  featured?: boolean;

  searchBoost?: number;

  seo?: IProductSEO;

  status?: ProductStatus;
}