// models/Review.ts
import mongoose, { Schema } from 'mongoose';

const ReviewSchema = new Schema({
  productId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  image: { 
    type: String 
  },
  comment: { 
    type: String, 
    required: true 
  },
  isVerifiedPurchase: { 
    type: Boolean, 
    default: false 
  },
}, { 
  timestamps: true 
});

// Index for faster queries
ReviewSchema.index({ productId: 1, status: 1 });
ReviewSchema.index({ createdAt: -1 });

export const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);