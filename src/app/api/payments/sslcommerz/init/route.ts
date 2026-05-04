// app/api/payments/sslcommerz/init/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect as connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import { PaymentService } from '@/lib/services/payment.service';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    await connectDB();

    const order = await Order.findById(orderId).populate('userId');
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const paymentUrl = await PaymentService.initSSLCommerzPayment(order, order.userId);
    
    return NextResponse.json({ paymentUrl });
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
  }
}