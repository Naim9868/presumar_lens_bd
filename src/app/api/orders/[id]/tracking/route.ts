// app/api/orders/[id]/tracking/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import Shipment from '@/models/Shipment';
import { courierService } from '@/lib/services/courier.service';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    let trackingInfo: unknown = null;

    // Find shipment for this order
    const shipment = await Shipment.findOne({ orderId: order._id }).lean();

    if (shipment?.trackingId && shipment?.provider) {
      try {
        const provider = shipment.provider.toLowerCase();

        switch (provider) {
          case 'pathao':
            trackingInfo = await courierService.pathao.trackOrder(
              shipment.trackingId
            );
            break;

          case 'redx':
            trackingInfo = await courierService.redx.trackOrder(
              shipment.trackingId
            );
            break;
        }
      } catch (err) {
        console.error('Tracking failed:', err);
      }
    }

    // Calculate estimated delivery
    let estimatedDelivery: Date | null = null;

    if (order.status === 'SHIPPED' && shipment?.bookedAt) {
      const shippingDate = new Date(shipment.bookedAt);
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