"use server";

import { dbConnect } from "@/lib/dbConnect";
import { Product } from "@/models/Product";

export async function searchProducts(
  query: string,
  categoryId?: string
) {
  try {
    await dbConnect();

    if (!query.trim()) {
      return [];
    }

    const filter: any = {
      status: "active",
      deletedAt: null,
      $or: [
        {
          name: {
            $regex: query,
            $options: "i",
          },
        },
        {
          shortDescription: {
            $regex: query,
            $options: "i",
          },
        },
        {
          tags: {
            $in: [new RegExp(query, "i")],
          },
        },
      ],
    };

    // Optional category filter
    if (categoryId && categoryId !== "0") {
      filter.categoryId = categoryId;
    }

    const products = await Product.find(filter)
      .select(`
        name
        slug
        thumbnail
        lowestPrice
        highestPrice
      `)
      .limit(8)
      .lean();

    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.error(error);
    return [];
  }
}