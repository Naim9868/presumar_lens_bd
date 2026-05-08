// app/api/courier/redx/route.ts

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { courierService } from '@/lib/services/courier.service';
import Order from '@/models/Order';
import { dbConnect } from '@/lib/dbConnect';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { orderId } = body;

    // ✅ Validate orderId
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // ✅ Fetch order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // ✅ Validate required order fields
    if (!order.shipping?.name || !order.shipping?.phone || !order.shipping?.address) {
      return NextResponse.json(
        { success: false, error: 'Incomplete shipping information' },
        { status: 400 }
      );
    }

    // ✅ Prepare courier payload
    const courierPayload = {
      recipient_name: order.shipping.name,
      recipient_phone: order.shipping.phone,
      recipient_address: [
        order.shipping.address,
        order.shipping.area,
        order.shipping.city,
      ]
        .filter(Boolean)
        .join(', '),

      cod_amount:
        order.payment?.method === 'COD'
          ? order.pricing?.total || 0
          : 0,

      parcel_value: order.pricing?.total || 0,
      weight: 0.5, // TODO: calculate dynamically later
    };

    // ✅ Call RedX API
    const courierOrder = await courierService.redx.createOrder(courierPayload);

    // ✅ Validate response (VERY IMPORTANT)
    if (!courierOrder || !courierOrder.order_id) {
      console.error('Invalid RedX response:', courierOrder);

      return NextResponse.json(
        { success: false, error: 'Invalid response from courier service' },
        { status: 502 }
      );
    }

    // ✅ Ensure delivery object exists
    if (!order.delivery) {
      order.delivery = {};
    }

    // ✅ Save tracking info
    order.delivery.courier = 'redx';
    order.delivery.trackingId = courierOrder.order_id;
    order.delivery.status = 'CREATED';

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Courier order created successfully',
      data: {
        trackingId: courierOrder.order_id,
        courier: 'redx',
        raw: courierOrder,
      },
    });

  } catch (error: any) {
    console.error('RedX courier error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create courier order',
      },
      { status: 500 }
    );
  }
}