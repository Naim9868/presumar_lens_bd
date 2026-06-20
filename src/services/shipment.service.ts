// src/services/shipment.service.ts
import Shipment from '@/models/Shipment';
import Order from '@/models/Order';
import { bookSteadFastOrder } from '@/integrations/steadfast';
import { bookPathaoOrder } from '@/integrations/pathao';

export async function bookShipment(orderId: string, provider: 'STEADFAST' | 'PATHAO') {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  let result: Record<string, unknown> = {};
  let consignmentId = '';
  let trackingId = '';
  let trackingUrl = '';

  if (provider === 'STEADFAST') {
    result = await bookSteadFastOrder({
      invoice: order.orderId,
      recipient_name: order.shipping.name,
      recipient_phone: order.shipping.phone,
      recipient_address: `${order.shipping.address}, ${order.shipping.area}, ${order.shipping.city}`,
      cod_amount: order.payment?.method === 'COD' ? order.pricing.total : 0,
    });
    consignmentId = (result as any).consignment?.consignment_id?.toString() || '';
    trackingId = (result as any).consignment?.tracking_code || '';
    trackingUrl = `https://steadfast.com.bd/t/${trackingId}`;
  }

  // Save shipment
  const shipment = await Shipment.create({
    orderId,
    provider,
    consignmentId,
    trackingId,
    trackingUrl,
    status: 'BOOKED',
    bookedAt: new Date(),
    courierResponse: result,
  });

  // Update order
  await Order.findByIdAndUpdate(orderId, { status: 'SHIPPED' });

  return shipment;
}