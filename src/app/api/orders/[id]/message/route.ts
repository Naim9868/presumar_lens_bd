import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import { defaultOrderMessage, renderOrderMessage, sendOrderMessage } from '@/services/messaging.service';

export async function POST(req: NextRequest, { params }: { params: Promise<unknown> }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    if (!resolvedParams || typeof resolvedParams !== 'object' || !('id' in resolvedParams) || typeof resolvedParams.id !== 'string') {
      return NextResponse.json({ message: 'Invalid order ID' }, { status: 400 });
    }
    const order = await Order.findById(resolvedParams.id);
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    const message = renderOrderMessage(
      typeof body.message === 'string' && body.message.trim() ? body.message : defaultOrderMessage(order),
      order,
    );
    const result = await sendOrderMessage(order, message);
    return NextResponse.json({ success: true, message, ...result });
  } catch (error) {
    console.error('Send order message error:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to send message' }, { status: 500 });
  }
}
