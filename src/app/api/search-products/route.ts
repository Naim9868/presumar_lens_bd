// app/api/search-products/route.ts

import { NextRequest, NextResponse } from "next/server";

import "@/models";

import { dbConnect } from "@/lib/dbConnect";
import { Product } from "@/models/Product";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q")?.trim() || "";

    // Debounced search optimization
    if (q.length < 2) {
      return NextResponse.json({
        success: true,
        products: [],
      });
    }

    const products = await Product.find(
      {
        status: "active",
        deletedAt: null,

        $text: {
          $search: q,
        },
      },
      {
        score: {
          $meta: "textScore",
        },
      }
    )
      .select(`
        _id
        name
        slug
        thumbnail
        lowestPrice
        highestPrice
      `)
      .sort({
        score: {
          $meta: "textScore",
        },
      })
      .limit(8)
      .lean();

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        products: [],
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}