// src/app/api/orders/[id]/fraud/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import { calculateFraudScore } from '@/services/order-stats.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const fraud = calculateFraudScore(order as any);
    return NextResponse.json({ success: true, fraud });
  } catch (err) {
    console.error('[GET /api/orders/[id]/fraud]', err);
    return NextResponse.json({ error: 'Failed to calculate fraud score' }, { status: 500 });
  }
}