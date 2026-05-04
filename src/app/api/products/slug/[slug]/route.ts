import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { ProductVariant } from '@/models/ProductVariant';
import { ProductSpecification } from '@/models/ProductSpecification';
import { Brand } from '@/models/Brand';
import { Category } from '@/models/Category';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;
    
    // Find product by slug
    const product = await Product.findOne({ slug, status: 'active' }).lean();
    
    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }
    
    // Get brand details
    const brand = await Brand.findById(product.brandId).select('name slug').lean();
    
    // Get category details
    const category = await Category.findById(product.categoryId).select('name slug').lean();
    
    // Get variants
    const variants = await ProductVariant.find({ productId: product._id }).lean();
    
    // Get specifications
    const specifications = await ProductSpecification.findOne({ productId: product._id }).lean();
    
    // Calculate min/max prices
    const prices = variants.map(v => v.price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    
    const defaultVariant = variants.find(v => v.isDefault) || variants[0];
    
    return NextResponse.json({
      success: true,
      data: {
        ...product,
        brandId: brand,
        categoryId: category,
        variants,
        specifications,
        minPrice,
        maxPrice,
        defaultVariant
      }
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch product'
    }, { status: 500 });
  }
}