// app/api/payments/sslcommerz/success/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment.service';
import { sendNotification } from '@/lib/services/notification.service';
import Order from '@/models/Order';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const transactionId = formData.get('tran_id') as string;
    
    const result = await PaymentService.handlePaymentSuccess(transactionId);
    
    if (result.success) {
      // Send payment success notification
      const order = await Order.findById(result.orderId);
      await sendNotification({
        userId: order.userId,
        type: 'PAYMENT_SUCCESS',
        orderId: order._id,
      });
      
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/payment/success?orderId=${result.orderId}`,
        303
      );
    }
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/payment/failed`,
      303
    );
  } catch (error) {
    console.error('Payment success error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL}/payment/failed`, 303);
  }
}