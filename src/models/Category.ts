// models/Category.ts
import mongoose, { Schema } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  image?: string;
  imagePublicId?: string;
  description?: string;
  parentId: mongoose.Types.ObjectId | null;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    image: String,
    
    imagePublicId: {
      type: String,
      trim: true,
    },

    description: String,

    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.index({
  name: "text",
  slug: "text",
});

// IMPORTANT: This pattern ensures the model is only created once
export const Category = (mongoose.models.Category as mongoose.Model<ICategory>) || 
  mongoose.model<ICategory>('Category', CategorySchema);