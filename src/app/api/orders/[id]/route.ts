// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { getOrderById, updateOrderStatus } from '@/services/order.service';
import Order from '@/models/Order';
import OrderEvent from '@/models/OrderEvent';
import mongoose from 'mongoose';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Also delete associated events
    await OrderEvent.deleteMany({ orderId: new mongoose.Types.ObjectId(id) });

    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (error: unknown) {
    console.error('Delete order error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete order';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

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

    // Get events
    const OrderEvent = (await import('@/models/OrderEvent')).default;
    const events = await OrderEvent.find({ orderId: order._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ order, events });
  } catch (error: unknown) {
    console.error('Get order detail error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch order';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { status, note } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const order = await updateOrderStatus(id, status, undefined, note);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error: unknown) {
    console.error('Update order status error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update order';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}