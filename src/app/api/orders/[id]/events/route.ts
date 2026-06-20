// src/app/api/orders/[id]/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import OrderEvent from '@/models/OrderEvent';
import { getOrderById } from '@/services/order.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const order = await getOrderById(id);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const events = await OrderEvent.find({ orderId: order._id })
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Get order events error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order events' },
      { status: 500 }
    );
  }
}