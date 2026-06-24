import { NextResponse, NextRequest } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/dbConnect';
import { Review } from '@/models/Review';
import { Product } from '@/models/Product';

const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;
type ReviewStatus = (typeof REVIEW_STATUSES)[number];

type Stringable = {
  toString: () => string;
};

type LeanProduct = {
  _id?: Stringable | string;
  name?: string;
  slug?: string;
  thumbnail?: string;
  status?: string;
};

type LeanReview = {
  _id?: Stringable | string;
  productId?: Stringable | string | LeanProduct;
  name?: string;
  email?: string;
  rating?: unknown;
  image?: string;
  comment?: string;
  isVerifiedPurchase?: boolean;
  status?: string;
  source?: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === 'string' && REVIEW_STATUSES.includes(value as ReviewStatus);
}

function approvedReviewCondition() {
  return {
    $or: [
      { status: 'approved' },
      { status: { $exists: false } },
      { status: null },
    ],
  };
}

async function syncProductReviewStats(productId: string) {
  if (!Types.ObjectId.isValid(productId)) return;

  const reviews = await Review.find({
    productId,
    ...approvedReviewCondition(),
  })
    .select('rating')
    .lean();

  const ratingCount = reviews.length;
  const ratingAverage = ratingCount
    ? Math.round((reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / ratingCount) * 10) / 10
    : 0;

  await Product.findByIdAndUpdate(productId, {
    ratingAverage,
    ratingCount,
  });
}

function serializeReview(review: LeanReview | null) {
  if (!review) return null;

  const populatedProduct =
    review.productId && typeof review.productId === 'object' && '_id' in review.productId
      ? review.productId as LeanProduct
      : null;

  return {
    _id: review._id?.toString(),
    productId: populatedProduct?._id?.toString() || review.productId?.toString(),
    product: populatedProduct
      ? {
          _id: populatedProduct._id?.toString(),
          name: populatedProduct.name || '',
          slug: populatedProduct.slug || '',
          thumbnail: populatedProduct.thumbnail || '',
          status: populatedProduct.status || '',
        }
      : null,
    name: review.name || '',
    email: review.email || '',
    rating: Number(review.rating || 0),
    image: review.image || '',
    imagePublicId: (review as any).imagePublicId || '',
    comment: review.comment || '',
    isVerifiedPurchase: Boolean(review.isVerifiedPurchase),
    status: review.status || 'approved',
    source: review.source || 'customer',
    createdAt: review.createdAt ? new Date(review.createdAt).toISOString() : null,
    updatedAt: review.updatedAt ? new Date(review.updatedAt).toISOString() : null,
  };
}

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid review ID' },
        { status: 400 }
      );
    }

    const review = await Review.findById(id)
      .populate('productId', 'name slug thumbnail status')
      .lean();

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, review: serializeReview(review) });
  } catch (error) {
    console.error('Review fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid review ID' },
        { status: 400 }
      );
    }

    const existingReview = await Review.findById(id);
    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const update: Record<string, unknown> = {};
    const affectedProductIds = new Set<string>([existingReview.productId.toString()]);

    if (body.productId !== undefined) {
      const nextProductId = String(body.productId || '');
      if (!Types.ObjectId.isValid(nextProductId)) {
        return NextResponse.json(
          { success: false, error: 'Valid product is required' },
          { status: 400 }
        );
      }

      const productExists = await Product.exists({ _id: nextProductId });
      if (!productExists) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      update.productId = nextProductId;
      affectedProductIds.add(nextProductId);
    }

    if (body.name !== undefined) {
      if (!body.name?.trim()) {
        return NextResponse.json(
          { success: false, error: 'Reviewer name is required' },
          { status: 400 }
        );
      }
      update.name = body.name.trim();
    }

    if (body.email !== undefined) update.email = body.email?.trim() || '';
    if (body.image !== undefined) update.image = body.image?.trim() || '';
    if (body.imagePublicId !== undefined) update.imagePublicId = body.imagePublicId?.trim() || '';

    if (body.comment !== undefined) {
      if (!body.comment?.trim()) {
        return NextResponse.json(
          { success: false, error: 'Review comment is required' },
          { status: 400 }
        );
      }
      update.comment = body.comment.trim();
    }

    if (body.rating !== undefined) {
      const rating = Number(body.rating);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return NextResponse.json(
          { success: false, error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }
      update.rating = rating;
    }

    if (body.status !== undefined) {
      if (!isReviewStatus(body.status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid review status' },
          { status: 400 }
        );
      }
      update.status = body.status;
    }

    if (body.isVerifiedPurchase !== undefined) {
      update.isVerifiedPurchase = Boolean(body.isVerifiedPurchase);
    }

    if (body.source !== undefined) {
      update.source = body.source === 'admin' ? 'admin' : 'customer';
    }

    const updatedReview = await Review.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .populate('productId', 'name slug thumbnail status')
      .lean();

    // Sync stats for all affected products
    await Promise.all(Array.from(affectedProductIds).map(syncProductReviewStats));

    return NextResponse.json({
      success: true,
      review: serializeReview(updatedReview),
    });
  } catch (error) {
    console.error('Review update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  // Properly delegate to PUT
  return PUT(request, context);
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid review ID' },
        { status: 400 }
      );
    }

    // Get the review first to check if it exists and get productId
    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    // Delete the review
    await Review.findByIdAndDelete(id);
    
    // Sync product stats
    await syncProductReviewStats(review.productId.toString());

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Review delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}