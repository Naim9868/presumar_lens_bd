// src/app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { updateOrderStatus } from '@/services/order.service';
import OrderEvent from '@/models/OrderEvent';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { status, note, adminId } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = [
      'PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'PROCESSING',
      'PACKED', 'READY_TO_SHIP', 'SHIPPED', 'IN_TRANSIT',
      'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
      'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const order = await updateOrderStatus(id, status, adminId, note);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}