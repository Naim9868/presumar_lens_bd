import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { verifySSLCommerzPayment } from '@/services/payment.service';

// POST /api/payments/ssl/ipn — Instant Payment Notification
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const formData = await req.formData();
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });

    await verifySSLCommerzPayment(payload);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[SSL IPN]', err);
    return NextResponse.json({ error: 'IPN failed' }, { status: 500 });
  }
}
