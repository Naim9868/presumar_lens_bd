// app/api/orders/[id]/tracking/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import Order from '@/models/Order';
import { courierService } from '@/lib/services/courier.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    let trackingInfo: unknown = null;

    /* ===============================
       🚚 COURIER TRACKING
    =============================== */
    if (order.delivery?.trackingId && order.delivery?.courier) {
      try {
        const courier = order.delivery.courier.toLowerCase();

        switch (courier) {
          case 'pathao':
            trackingInfo = await courierService.pathao.trackOrder(
              order.delivery.trackingId
            );
            break;

          case 'redx':
            trackingInfo = await courierService.redx.trackOrder(
              order.delivery.trackingId
            );
            break;
        }
      } catch (err) {
        console.error('Tracking failed:', err);
      }
    }

    /* ===============================
       📅 ESTIMATED DELIVERY
    =============================== */
    let estimatedDelivery: Date | null = null;

    if (order.status === 'SHIPPED') {
      const shippedEvent = order.timeline?.find(
        (t: any) => t.status === 'SHIPPED'
      );

      const shippingDate = new Date(
        shippedEvent?.createdAt || order.updatedAt
      );

      const deliveryDays =
        order.delivery?.type === 'INSIDE_DHAKA' ? 2 : 4;

      estimatedDelivery = new Date(shippingDate);
      estimatedDelivery.setDate(
        shippingDate.getDate() + deliveryDays
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.orderId,
        status: order.status,
        timeline: order.timeline || [],
        tracking: trackingInfo,
        estimatedDelivery,
        currentLocation:
          (trackingInfo as any)?.current_location || null,
      },
    });

  } catch (error: any) {
    console.error('Tracking API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}