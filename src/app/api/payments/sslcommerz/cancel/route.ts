// app/api/payments/sslcommerz/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const transactionId = formData.get('tran_id') as string;
  
  console.log(`Payment cancelled for transaction: ${transactionId}`);
  
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL}/payment/cancelled`, 303);
}