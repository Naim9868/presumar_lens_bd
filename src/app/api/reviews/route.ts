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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    comment: review.comment || '',
    isVerifiedPurchase: Boolean(review.isVerifiedPurchase),
    status: review.status || 'approved',
    source: review.source || 'customer',
    createdAt: review.createdAt ? new Date(review.createdAt).toISOString() : null,
    updatedAt: review.updatedAt ? new Date(review.updatedAt).toISOString() : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const isAdmin = searchParams.get('admin') === 'true';
    const productId = searchParams.get('productId');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);

    const conditions: Record<string, unknown>[] = [];

    if (productId) {
      if (!Types.ObjectId.isValid(productId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid product ID' },
          { status: 400 }
        );
      }
      conditions.push({ productId });
    }

    if (isAdmin) {
      if (status && status !== 'all') {
        if (!isReviewStatus(status)) {
          return NextResponse.json(
            { success: false, error: 'Invalid review status' },
            { status: 400 }
          );
        }
        conditions.push({ status });
      }
    } else {
      conditions.push(approvedReviewCondition());
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      conditions.push({
        $or: [
          { name: regex },
          { email: regex },
          { comment: regex },
        ],
      });
    }

    const query = conditions.length ? { $and: conditions } : {};

    if (!isAdmin) {
      const reviews = await Review.find(query)
        .populate('productId', 'name slug thumbnail status')
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json(reviews.map((review) => serializeReview(review)).filter(Boolean));
    }

    const [reviews, total, pendingCount, approvedCount, legacyApprovedCount, rejectedCount] =
      await Promise.all([
        Review.find(query)
          .populate('productId', 'name slug thumbnail status')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Review.countDocuments(query),
        Review.countDocuments({ status: 'pending' }),
        Review.countDocuments({ status: 'approved' }),
        Review.countDocuments({
          $or: [
            { status: { $exists: false } },
            { status: null },
          ],
        }),
        Review.countDocuments({ status: 'rejected' }),
      ]);

    return NextResponse.json({
      success: true,
      reviews: reviews.map((review) => serializeReview(review)).filter(Boolean),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: pendingCount + approvedCount + legacyApprovedCount + rejectedCount,
        pending: pendingCount,
        approved: approvedCount + legacyApprovedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    console.error('Review fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const productId = String(body.productId || '');
    const rating = Number(body.rating);
    const status = isReviewStatus(body.status) ? body.status : body.source === 'admin' ? 'approved' : 'pending';

    if (!Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, error: 'Valid product is required' },
        { status: 400 }
      );
    }

    if (!body.name?.trim() || !body.comment?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name and comment are required' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const review = await Review.create({
      productId,
      name: body.name.trim(),
      email: body.email?.trim() || '',
      rating,
      image: body.image?.trim() || '',
      comment: body.comment.trim(),
      isVerifiedPurchase: Boolean(body.isVerifiedPurchase),
      status,
      source: body.source === 'admin' ? 'admin' : 'customer',
    });

    if (status === 'approved') {
      await syncProductReviewStats(productId);
    }

    const populatedReview = await Review.findById(review._id)
      .populate('productId', 'name slug thumbnail status')
      .lean();

    return NextResponse.json(
      { success: true, review: serializeReview(populatedReview) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Review create error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
