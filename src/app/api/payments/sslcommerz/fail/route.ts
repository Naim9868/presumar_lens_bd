// app/api/payments/sslcommerz/fail/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const transactionId = formData.get('tran_id') as string;
  
  // Log failed payment
  console.error(`Payment failed for transaction: ${transactionId}`);
  
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL}/payment/failed`, 303);
}