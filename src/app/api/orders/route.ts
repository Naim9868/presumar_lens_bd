// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema } from '@/lib/validations/order.validation';
// import { OrderService } from '@/lib/services/order.service';
import { createOrder } from '@/app/actions/order.actions';
import { dbConnect } from '@/lib/dbConnect';
import Order from '@/models/Order';

// import { authenticate } from '@/lib/auth';
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Build query
    const query: any = {};
    
    if (status && status !== 'ALL') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shipping.name': { $regex: search, $options: 'i' } },
        { 'shipping.phone': { $regex: search, $options: 'i' } },
        { 'shipping.email': { $regex: search, $options: 'i' } },
      ];
    }
    
    // Execute queries
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);
    
    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await createOrder(parsed.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}