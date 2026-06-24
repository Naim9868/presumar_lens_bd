import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { processRefund } from '@/services/payment.service';
import { successResponse, errorResponse } from '@/lib/api-response';

// POST /api/payments/refund
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { orderId, amount, note } = await req.json();

    if (!orderId) return errorResponse('Order ID required');
    if (!amount || amount <= 0) return errorResponse('Valid amount required');

    const result = await processRefund(orderId, amount, note);
    return successResponse(result);
  } catch (err) {
    console.error('[POST /api/payments/refund]', err);
    return errorResponse((err as Error).message || 'Refund failed', 500);
  }
}
