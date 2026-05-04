// app/api/orders/[id]/tracking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect as connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
// import { authenticate } from '@/lib/auth';
import { courierService } from '@/lib/services/courier.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // const user = await authenticate(req);
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await connectDB();

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check access
    // if (user.role !== 'admin' && order.userId?.toString() !== user.id) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    let trackingInfo = null;
    
    // Get tracking info from courier if available
    if (order.delivery?.trackingId && order.delivery?.courier) {
      try {
        if (order.delivery.courier.toLowerCase() === 'pathao') {
          trackingInfo = await courierService.pathao.trackOrder(order.delivery.trackingId);
        } else if (order.delivery.courier.toLowerCase() === 'redx') {
          trackingInfo = await courierService.redx.trackOrder(order.delivery.trackingId);
        }
      } catch (error) {
        console.error('Courier tracking error:', error);
      }
    }

    // Calculate estimated delivery date
    let estimatedDelivery = null;
    if (order.status === 'SHIPPED') {
      const shippingDate = new Date(order.timeline.find(t => t.status === 'SHIPPED')?.createdAt || order.updatedAt);
      const deliveryDays = order.delivery?.type === 'INSIDE_DHAKA' ? 2 : 4;
      estimatedDelivery = new Date(shippingDate);
      estimatedDelivery.setDate(shippingDate.getDate() + deliveryDays);
    }

    return NextResponse.json({
      orderId: order.orderId,
      status: order.status,
      timeline: order.timeline,
      tracking: trackingInfo,
      estimatedDelivery,
      currentLocation: trackingInfo?.current_location || null,
    });
  } catch (error) {
    console.error('Error fetching tracking info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}