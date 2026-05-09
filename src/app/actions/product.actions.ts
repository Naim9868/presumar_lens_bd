'use server';

import mongoose from 'mongoose';
import { dbConnect as connectDB } from '@/lib/dbConnect';
import "@/models";
import { Product } from '@/models/Product';
import { Brand, IBrand } from '@/models/Brand';
import { IProduct, IProductPopulated, ProductVariant } from '@/types/product';
import { toProductDTO } from '@/utils/ProductDTO';



export type FilterOptions = {
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  tags?: string[];
  search?: string;
  inStock?: boolean;

  specs?: {
    key: string;
    values: string[];
  }[];

  sortBy?:
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'rating_desc';
};

interface GetAllProductsResponse {
  success: boolean;
  products: IProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

interface GetAllProductsParams extends FilterOptions {
  page?: number;
  limit?: number;
  query?: string;
  categoryId?: string;
  brandId?: string;
  status?: string;
}

// Helper function to serialize MongoDB documents
function serializeDocument(doc: any): any {
  if (!doc) return null;

  // Handle arrays
  if (Array.isArray(doc)) {
    return doc.map(item => serializeDocument(item));
  }

  // Handle objects
  if (typeof doc === 'object') {
    const serialized: any = {};
    for (const key in doc) {
      const value = doc[key];

      // Convert ObjectId to string
      if (value && typeof value === 'object' && value._bsontype === 'ObjectId') {
        serialized[key] = value.toString();
      }
      // Convert Date to ISO string
      else if (value instanceof Date) {
        serialized[key] = value.toISOString();
      }
      // Recursively serialize nested objects
      else if (value && typeof value === 'object') {
        serialized[key] = serializeDocument(value);
      }
      else {
        serialized[key] = value;
      }
    }
    return serialized;
  }

  return doc;
}



export async function getAllProducts(
  params: GetAllProductsParams = {}
): Promise<GetAllProductsResponse> {
  try {
    await connectDB();

    const {
      page = 1,
      limit = 20,
      query,
      categoryId,
      brandId,
      status,
      minPrice,
      maxPrice,
      tags,
      specs,
      sortBy = 'newest',
      inStock,
    } = params;

    const filter: any = {
      deletedAt: null,
    };

    /* ================= STATUS ================= */

    if (status && status !== 'all') {
      filter.status = status;
    } else {
      filter.status = 'active';
    }

    /* ================= CATEGORY ================= */

    if (
      categoryId &&
      mongoose.Types.ObjectId.isValid(categoryId)
    ) {
      filter.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    /* ================= BRAND ================= */

    if (
      brandId &&
      mongoose.Types.ObjectId.isValid(brandId)
    ) {
      filter.brandId = new mongoose.Types.ObjectId(brandId);
    }




    /* ================= PRICE ================= */

    if (
      minPrice !== undefined ||
      maxPrice !== undefined
    ) {
      filter.lowestPrice = {};

      if (minPrice !== undefined) {
        filter.lowestPrice.$gte = minPrice;
      }

      if (maxPrice !== undefined) {
        filter.lowestPrice.$lte = maxPrice;
      }
    }

    /* ================= STOCK ================= */

    if (inStock) {
      filter.totalInventory = { $gt: 0 };
    }

    /* ================= SEARCH ================= */

    if (query?.trim()) {
      filter.$or = [
        {
          name: {
            $regex: query,
            $options: 'i',
          },
        },
        {
          shortDescription: {
            $regex: query,
            $options: 'i',
          },
        },
        {
          tags: {
            $in: [new RegExp(query, 'i')],
          },
        },
      ];
    }

    /* ================= TAGS ================= */

    if (tags?.length) {
      filter.tags = { $in: tags };
    }

    /* ================= SPECS ================= */

    if (specs?.length) {
      filter.$and = specs.map((spec) => ({
        specsFlat: {
          $elemMatch: {
            key: spec.key,
            value: { $in: spec.values },
          },
        },
      }));
    }

    /* ================= SORT ================= */

    let sort: any = {
      createdAt: -1,
    };

    switch (sortBy) {
      case 'price_asc':
        sort = { lowestPrice: 1 };
        break;

      case 'price_desc':
        sort = { lowestPrice: -1 };
        break;

      case 'rating_desc':
        sort = { rating: -1 };
        break;

      case 'newest':
      default:
        sort = { createdAt: -1 };
        break;
    }

    /* ================= PAGINATION ================= */

    const skip = (page - 1) * limit;

    /* ================= QUERY ================= */

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('brandId', 'name slug')
        .populate('categoryId', 'name slug')
        .populate('subcategoryId', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);



    /* ---------- Batch Fetch Relations ---------- */

    const variants = products.map((p, i) => {
      // console.log(`product[${i}] variant:`, p.variants);
      // console.log(p.variants.map(v => v.price));
      return p.variants;
    })


    /* ---------- Attach Computed Fields ---------- */
    const finalProducts = products.map((product, i) => {

      const prices = product.variants.map((v: ProductVariant) => v.price);

      return {
        ...product,
        lowestPrice: prices.length ? Math.min(...prices) : 0,
        heighestPrice: prices.length ? Math.max(...prices) : 0,
        variantCount: variants.length,
      };
    });



    /* ================= DTO ================= */

    const productsDTO: IProduct[] = finalProducts.map((product: any) =>
      toProductDTO(serializeDocument(product))
    );


    // console.log(productsDTO);


    return {
      success: true,
      products: productsDTO,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    console.error('getAllProducts error:', error);

    return {
      success: false,
      products: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
      error: error.message || 'Something went wrong',
    };
  }
}


// Get single product by slug
export async function getProductBySlug(slug: string) {
  try {
    await connectDB();

    const product = await Product.findOne({
      slug,
      status: 'active',
      deletedAt: null
    })
      .populate('brandId', 'name slug description')
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .lean();

    if (!product) {
      return { success: false, product: null };
    }

    const serializedProduct = serializeDocument(product);
    // console.log(serializedProduct);

    return {
      success: true,
      product: toProductDTO(serializedProduct)
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return { success: false, product: null };
  }
}

// get product by id
export async function getProductById(productId: string) {
  try {
    await connectDB();

    const product = await Product.findOne({
      _id: productId,
      status: 'active',
      deletedAt: null
    })
      .populate('brandId', 'name slug description')
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .lean();

    if (!product) {
      return { success: false, product: null };
    }

    const serializedProduct = serializeDocument(product);
    // console.log(serializedProduct);

    return {
      success: true,
      product: toProductDTO(serializedProduct)
    };
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return { success: false, product: null };
  }
}

// Get products by category
export async function getProductsByCategory(categoryId: string, limit?: number) {
  try {
    await connectDB();

    const query = {
      categoryId,
      status: 'active',
      deletedAt: null
    };

    let productsQuery = Product.find(query)
      .select('_id name slug thumbnail brandId categoryId lowestPrice highestPrice status variants images createdAt')
      .populate('brandId', 'name slug')
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 });

    if (limit) {
      productsQuery = productsQuery.limit(limit);
    }

    const products = await productsQuery.lean();


    const productsDTO = products.map((p: IProductPopulated) =>
      toProductDTO(serializeDocument(p))
    );

    return { success: true, products: productsDTO };
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return { success: false, products: [] };
  }
}

// Get all brands for filtering
export async function getAllBrands() {
  try {
    await connectDB();

    const brands = await Brand.find({ isActive: true })
      .select('_id name slug')
      .lean();

    // ✅ Use same serializer for consistency
    const serializedBrands = brands.map((brand: IBrand) =>
      serializeDocument(brand)
    );

    return { success: true, brands: serializedBrands };
  } catch (error) {
    console.error('Error fetching brands:', error);
    return { success: false, brands: [] };
  }
}

