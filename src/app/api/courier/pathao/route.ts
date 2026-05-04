// app/api/courier/pathao/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { courierService } from '@/lib/services/courier.service';
// import { authenticate } from '@/lib/auth';
import Order from '@/models/Order';
import { dbConnect as connectDB } from '@/lib/dbConnect';

export async function POST(req: NextRequest) {
  try {
    // const user = await authenticate(req);
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const { orderId, storeId } = await req.json();
    await connectDB();
    
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const courierOrder = await courierService.pathao.createOrder({
      recipient_name: order.shipping.name,
      recipient_phone: order.shipping.phone,
      recipient_address: `${order.shipping.address}, ${order.shipping.area}, ${order.shipping.city}`,
      cod_amount: order.payment.method === 'COD' ? order.pricing.total : 0,
      parcel_value: order.pricing.total,
      weight: 0.5, // Default weight in kg
    }, storeId);
    
    // Update order with courier info
    order.delivery.courier = 'Pathao';
    order.delivery.trackingId = courierOrder.consignment_id;
    await order.save();
    
    return NextResponse.json(courierOrder);
  } catch (error) {
    console.error('Pathao courier error:', error);
    return NextResponse.json({ error: 'Failed to create courier order' }, { status: 500 });
  }
}