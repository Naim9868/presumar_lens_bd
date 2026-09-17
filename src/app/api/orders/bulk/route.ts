import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import OrderEvent from '@/models/OrderEvent';
import mongoose from 'mongoose';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { orderIds, action } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'No orders selected' },
        { status: 400 }
      );
    }

    const validIds = orderIds.filter((id: string) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid order IDs provided' },
        { status: 400 }
      );
    }

    const statusMap: Record<string, string> = {
      confirm: 'CONFIRMED',
      cancel: 'CANCELLED',
      process: 'PROCESSING',
      ship: 'SHIPPED',
      deliver: 'DELIVERED',
    };

    const status = statusMap[action];
    if (!status) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const result = await Order.updateMany(
      { _id: { $in: validIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { $set: { status } }
    );

    // Log events for each updated order
    const eventDocs = validIds.map((id: string) => ({
      orderId: new mongoose.Types.ObjectId(id),
      status,
      source: 'ADMIN' as const,
      note: `Bulk action: ${action}`,
    }));

    await OrderEvent.insertMany(eventDocs);

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} orders updated successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { error: 'Failed to update orders' },
      { status: 500 }
    );
  }
}