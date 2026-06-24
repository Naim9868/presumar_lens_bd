import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { executeBkashPayment } from '@/services/payment.service';

// GET /api/payments/bkash/callback — bKash redirects here
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const paymentID = searchParams.get('paymentID');
    const status = searchParams.get('status');

    if (!paymentID || status !== 'success') {
      return NextResponse.redirect(`${appUrl}/order/failed?reason=bkash_${status}`);
    }

    const result = await executeBkashPayment(paymentID);

    if (result.statusCode === '0000') {
      return NextResponse.redirect(`${appUrl}/order/success`);
    } else {
      return NextResponse.redirect(`${appUrl}/order/failed?reason=${result.statusMessage}`);
    }
  } catch (err) {
    console.error('[bKash Callback]', err);
    return NextResponse.redirect(`${appUrl}/order/failed?reason=error`);
  }
}
