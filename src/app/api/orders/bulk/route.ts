import { NextRequest, NextResponse } from 'next/server';
import { dbConnect as connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { orderIds, action } = body;
    
    if (!orderIds || !orderIds.length) {
      return NextResponse.json(
        { error: 'No orders selected' },
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
      { _id: { $in: orderIds } },
      {
        $set: { 
          status, 
          isCancelled: status === 'CANCELLED' 
        },
        $push: {
          timeline: {
            status,
            note: `Bulk action: ${action}`,
            createdAt: new Date(),
          },
        },
      }
    );
    
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