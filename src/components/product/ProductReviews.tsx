'use client';

import { useState } from 'react';
import { Star, User, Calendar, ChevronUp, ChevronDown } from 'lucide-react';

interface Review {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface ProductReviewsProps {
  reviews: Review[];
  productId: string;
}

export function ProductReviews({ reviews, productId }: ProductReviewsProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : 0;
  
  const ratingCounts = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 4);
  const hasMoreReviews = reviews.length > 4;
  
  const RatingBar = ({ star, count }: { star: number; count: number }) => {
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 dark:text-gray-400 w-8">{star} star</span>
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-gray-600 dark:text-gray-400 w-8">{count}</span>
      </div>
    );
  };
  
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
        <div className="text-4xl mb-3">💬</div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">No reviews yet</p>
        <button className="text-amber-600 hover:text-amber-700 font-medium text-sm">
          Be the first to review
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex gap-0.5 my-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.floor(averageRating) 
                  ? 'fill-amber-400 text-amber-400' 
                  : 'text-gray-300 dark:text-gray-600'
                }
              />
            ))}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map(star => (
            <RatingBar key={star} star={star} count={ratingCounts[star] || 0} />
          ))}
        </div>
      </div>
      
      {/* Review List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {displayedReviews.map((review) => (
          <div key={review._id} className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 font-semibold text-sm">
                  {review.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {review.name || 'Anonymous'}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar size={10} />
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < review.rating 
                      ? 'fill-amber-400 text-amber-400' 
                      : 'text-gray-300 dark:text-gray-600'
                    }
                  />
                ))}
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {review.comment}
            </p>
          </div>
        ))}
      </div>
      
      {/* See More Button */}
      {hasMoreReviews && (
        <button
          onClick={() => setShowAllReviews(!showAllReviews)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-amber-600 hover:text-amber-700 font-medium transition border-t border-gray-200 dark:border-gray-700 mt-2"
        >
          {showAllReviews ? (
            <>
              <ChevronUp size={16} />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              See All {reviews.length} Reviews
            </>
          )}
        </button>
      )}
    </div>
  );
}