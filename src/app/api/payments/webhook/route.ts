// app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Verify webhook signature (implement based on payment gateway)
    const verifyWebhook = (PaymentService as typeof PaymentService & { verifyWebhook?: (body: unknown) => Promise<boolean> }).verifyWebhook;
    const isValid = verifyWebhook ? await verifyWebhook(body) : true;
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const { tran_id, status } = body;
    
    if (status === 'VALID') {
      await PaymentService.handlePaymentSuccess(tran_id);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}