import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import { initiateSSLCommerzPayment, initiateBkashPayment } from '@/services/payment.service';
import { successResponse, errorResponse } from '@/lib/api-response';

// POST /api/payments/create
// Body: { orderId, method: 'SSL' | 'BKASH' | 'NAGAD' }
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { orderId, method } = await req.json();

    if (!orderId) return errorResponse('Order ID required');
    if (!method) return errorResponse('Payment method required');

    const order = await Order.findById(orderId);
    if (!order) return errorResponse('Order not found', 404);
    if (order.status !== 'AWAITING_PAYMENT') {
      return errorResponse('Order is not awaiting payment');
    }

    let result: Record<string, unknown> = {};

    switch (method) {
      case 'SSL': {
        const data = await initiateSSLCommerzPayment(
          orderId,
          order.pricing.total,
          order.orderId
        );
        result = { gatewayUrl: data.GatewayPageURL, method: 'SSL' };
        break;
      }

      case 'BKASH': {
        const data = await initiateBkashPayment(
          orderId,
          order.pricing.total,
          order.orderId
        );
        result = { bkashUrl: data.bkashURL, paymentId: data.paymentID, method: 'BKASH' };
        break;
      }

      default:
        return errorResponse('Unsupported payment method');
    }

    return successResponse(result);
  } catch (err) {
    console.error('[POST /api/payments/create]', err);
    return errorResponse('Failed to initiate payment', 500);
  }
}
