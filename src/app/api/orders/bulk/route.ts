import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import OrderEvent from '@/models/OrderEvent';
import mongoose from 'mongoose';
import { defaultOrderMessage, renderOrderMessage, sendOrderMessage } from '@/services/messaging.service';
import { bookShipment, CourierProvider } from '@/services/shipment.service';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { orderIds, action, message } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'No orders selected' },
        { status: 400 }
      );
    }

    const validIds = orderIds.filter((id: string) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid order IDs provided' },
        { status: 400 }
      );
    }

    const statusMap: Record<string, string> = {
      confirm: 'CONFIRMED',
      cancel: 'CANCELLED',
      process: 'PROCESSING',
      ship: 'SHIPPED',
      deliver: 'DELIVERED',
    };

    const status = statusMap[action];
    if (action === 'message') {
      const orders = await Order.find({ _id: { $in: validIds.map(id => new mongoose.Types.ObjectId(id)) } });
      const results = await Promise.allSettled(orders.map(order => {
        const rendered = renderOrderMessage(
          typeof message === 'string' && message.trim() ? message : defaultOrderMessage(order),
          order,
        );
        return sendOrderMessage(order, rendered);
      }));
      const sent = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - sent;
      return NextResponse.json({
        success: failed === 0,
        message: `${sent} message(s) sent${failed ? `, ${failed} failed` : ''}`,
        sent,
        failed,
      }, { status: failed ? 207 : 200 });
    }

    if (action === 'courier') {
      const provider = body.provider as CourierProvider;
      if (!['STEADFAST', 'PATHAO', 'REDX'].includes(provider)) {
        return NextResponse.json({ error: 'A valid courier provider is required' }, { status: 400 });
      }
      const results = await Promise.allSettled(validIds.map(id => bookShipment({ orderId: id, provider })));
      const booked = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - booked;
      return NextResponse.json({
        success: failed === 0,
        message: `${booked} shipment(s) booked${failed ? `, ${failed} failed` : ''}`,
        booked,
        failed,
      }, { status: failed ? 207 : 200 });
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const result = await Order.updateMany(
      { _id: { $in: validIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { $set: { status } }
    );

    // Log events for each updated order
    const eventDocs = validIds.map((id: string) => ({
      orderId: new mongoose.Types.ObjectId(id),
      status,
      source: 'ADMIN' as const,
      note: `Bulk action: ${action}`,
    }));

    await OrderEvent.insertMany(eventDocs);

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} orders updated successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { error: 'Failed to update orders' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { orderIds } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'No orders selected' },
        { status: 400 }
      );
    }

    const validIds = orderIds.filter((id: string) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid order IDs provided' },
        { status: 400 }
      );
    }

    const objectIds = validIds.map(id => new mongoose.Types.ObjectId(id));

    // Delete orders
    const result = await Order.deleteMany({ _id: { $in: objectIds } });

    // Delete associated events
    await OrderEvent.deleteMany({ orderId: { $in: objectIds } });

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} orders deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json(
      { error: 'Failed to delete orders' },
      { status: 500 }
    );
  }
}