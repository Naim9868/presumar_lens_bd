import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import {Product} from '@/models/Product';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET /api/admin/products/search — lightweight search for coupon picker
// query params: q (string), limit (number, default 15)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const sp = req.nextUrl.searchParams;
    const q = (sp.get('q') || '').trim();
    const limit = Math.min(50, Math.max(1, Number(sp.get('limit') || 15)));

    const query: Record<string, unknown> = {};
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { slug: { $regex: safe, $options: 'i' } },
        { sku: { $regex: safe, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .select('_id name slug price images categoryId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const flat = products.map((p: any) => ({
      _id: p._id?.toString(),
      name: p.name,
      slug: p.slug,
      price: typeof p.price === 'number' ? p.price : p.price?.sale ?? p.price?.regular ?? 0,
      image:
        Array.isArray(p.images) && p.images.length > 0
          ? p.images[0]?.url || p.images[0]?.src || ''
          : '',
      categoryId: p.categoryId?.toString?.() || '',
    }));

    return successResponse({ products: flat });
  } catch (err) {
    console.error('[GET /api/admin/products/search]', err);
    return errorResponse('Failed to search products', 500);
  }
}
