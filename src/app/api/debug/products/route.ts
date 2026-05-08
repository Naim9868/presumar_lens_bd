import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { Brand } from '@/models/Brand';
import { Category } from '@/models/Category';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get all products
    const products = await Product.find({}).lean();
    
    // Check each product's references
    const debugInfo = [];
    
    for (const product of products) {
      const info: any = {
        productId: product._id,
        name: product.name,
        brandId: product.brandId,
        categoryId: product.categoryId,
        brandExists: null,
        categoryExists: null,
        brandData: null,
        categoryData: null
      };
      
      // Check if brand exists
      if (product.brandId) {
        const brand = await Brand.findById(product.brandId).lean();
        info.brandExists = !!brand;
        info.brandData = brand;
      }
      
      // Check if category exists
      if (product.categoryId) {
        const category = await Category.findById(product.categoryId).lean();
        info.categoryExists = !!category;
        info.categoryData = category;
      }
      
      debugInfo.push(info);
    }
    
    // Get all brands and categories for reference
    const allBrands = await Brand.find({}).lean();
    const allCategories = await Category.find({}).lean();
    
    return NextResponse.json({
      products: debugInfo,
      allBrands: allBrands.map(b => ({ id: b._id, name: b.name })),
      allCategories: allCategories.map(c => ({ id: c._id, name: c.name })),
      message: 'Check if brandId and categoryId in products match existing brands/categories'
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}