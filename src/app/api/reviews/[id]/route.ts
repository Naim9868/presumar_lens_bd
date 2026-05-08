// app/api/reviews/[id]/route.ts (update the existing DELETE route to include PUT)
import { NextResponse, NextRequest } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { Review } from '@/models/Review';
import { Product } from '@/models/Product';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const review = await Review.findByIdAndDelete(id);
    
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    // Update product rating
    const reviews = await Review.find({ productId: review.productId });
    const avgRating = reviews.length 
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
      : 0;
    
    await Product.findByIdAndUpdate(review.productId, {
      rating: avgRating,
      reviewsCount: reviews.length
    });
    
    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}

// Add PUT method for updating reviews
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
     const { id } = await params;
    const body = await request.json();
    
    const review = await Review.findByIdAndUpdate(
      id,
      {
        name: body.name,
        rating: body.rating,
        comment: body.comment,
      },
      { new: true }
    ).populate('productId');
    
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    // Update product rating
    const reviews = await Review.find({ productId: review.productId });
    const avgRating = reviews.length 
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
      : 0;
    
    await Product.findByIdAndUpdate(review.productId, {
      rating: avgRating,
      reviewsCount: reviews.length
    });
    
    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}