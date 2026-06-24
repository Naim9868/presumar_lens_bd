import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { verifySSLCommerzPayment } from '@/services/payment.service';

// POST /api/payments/ssl/success — SSLCommerz redirects here on success
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const formData = await req.formData();
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });

    const result = await verifySSLCommerzPayment(payload);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (result.success) {
      return NextResponse.redirect(`${appUrl}/order/success?orderId=${result.order?.orderId}`);
    } else {
      return NextResponse.redirect(`${appUrl}/order/failed?reason=verification_failed`);
    }
  } catch (err) {
    console.error('[SSL Success]', err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    return NextResponse.redirect(`${appUrl}/order/failed?reason=error`);
  }
}
