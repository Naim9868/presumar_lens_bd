// src/app/api/orders/[id]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { updateOrderStatus } from '@/services/order.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { reason, adminId } = body;

    const { id } = await params;
    const order = await updateOrderStatus(
      id,
      'CANCELLED',
      adminId,
      reason || 'Order cancelled'
    );
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Order cancelled successfully',
      order 
    });
  } catch (error: any) {
    console.error('Cancel order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel order' },
      { status: 500 }
    );
  }
}