import { NextRequest, NextResponse } from 'next/server';

// POST /api/payments/ssl/fail
export async function POST(_req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  return NextResponse.redirect(`${appUrl}/order/failed?reason=payment_failed`);
}
