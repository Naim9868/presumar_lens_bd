import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { updateOrderStatus } from '@/services/order.service';
import { OrderStatus } from '@/models/Order';
import { successResponse, errorResponse } from '@/lib/api-response';

const VALID_STATUSES: OrderStatus[] = [
  'PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'PROCESSING',
  'PACKED', 'READY_TO_SHIP', 'SHIPPED', 'IN_TRANSIT',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
  'RETURN_REQUESTED', 'RETURNED', 'REFUNDED',
];

// PATCH /api/orders/[id]/status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { status, note, adminId } = await req.json();

    if (!status) return errorResponse('Status is required');
    if (!VALID_STATUSES.includes(status)) return errorResponse(`Invalid status: ${status}`);

    const order = await updateOrderStatus(id, status, adminId, note);
    return successResponse({ order });
  } catch (err) {
    console.error('[PATCH /api/orders/[id]/status]', err);
    return errorResponse('Failed to update order status', 500);
  }
}
