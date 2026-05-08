import { NextResponse, NextRequest} from 'next/server';
import {dbConnect }from '@/lib/dbConnect';
import { Review } from '@/models/Review';
import { Product } from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    let query = {};
    if (productId) {
      query = { productId };
    }
    
    const reviews = await Review.find(query)
      .populate('productId')
      .sort({ createdAt: -1 });
      
    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const review = await Review.create(body);
    
    // Update product rating and review count
    const reviews = await Review.find({ productId: body.productId });
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    
    await Product.findByIdAndUpdate(body.productId, {
      rating: avgRating,
      reviewsCount: reviews.length
    });
    
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}