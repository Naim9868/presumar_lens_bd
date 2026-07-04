import Shipment from '@/models/Shipment';
import Order from '@/models/Order';
import OrderEvent from '@/models/OrderEvent';
import { bookSteadFastOrder, trackSteadFastOrder } from '@/integrations/steadfast';
import { bookPathaoOrder, getPathaoCities, getPathaoZones } from '@/integrations/pathao';
import { bookRedXOrder, trackRedXOrder } from '@/integrations/redx';
import { connectDB } from '@/lib/dbConnect';

export type CourierProvider = 'STEADFAST' | 'PATHAO' | 'REDX';

export interface BookShipmentInput {
  orderId: string;
  provider: CourierProvider;
  // Pathao specific
  pathao?: {
    storeId: number;
    cityId: number;
    zoneId: number;
    deliveryType: number; // 48=normal, 12=express
    itemWeight: number;
  };
}

export async function bookShipment(input: BookShipmentInput) {
  await connectDB();

  const order = await Order.findById(input.orderId);
  if (!order) throw new Error('Order not found');

  const isCOD = true; // extend later with payment check
  const codAmount = isCOD ? order.pricing.total : 0;

  let result: unknown = {};
  let consignmentId = '';
  let trackingId = '';
  let trackingUrl = '';
  let status = 'BOOKED';

  switch (input.provider) {
    case 'STEADFAST': {
      result = await bookSteadFastOrder({
        invoice: order.orderId,
        recipient_name: order.shipping.name,
        recipient_phone: order.shipping.phone,
        recipient_address: `${order.shipping.address}, ${order.shipping.area}, ${order.shipping.city}`,
        cod_amount: codAmount,
        note: `Order: ${order.orderId}`,
      });
      const consignment = (result as any).consignment;
      consignmentId = consignment?.consignment_id?.toString() || '';
      trackingId = consignment?.tracking_code || '';
      trackingUrl = `https://steadfast.com.bd/t/${trackingId}`;
      status = consignment ? 'BOOKED' : 'FAILED';
      break;
    }

    case 'PATHAO': {
      if (!input.pathao) throw new Error('Pathao config required');
      result = await bookPathaoOrder({
        store_id: input.pathao.storeId,
        merchant_order_id: order.orderId,
        recipient_name: order.shipping.name,
        recipient_phone: order.shipping.phone,
        recipient_address: order.shipping.address,
        recipient_city: input.pathao.cityId,
        recipient_zone: input.pathao.zoneId,
        delivery_type: input.pathao.deliveryType,
        item_type: 2,
        item_quantity: order.items.reduce((s: number, i: any) => s + i.quantity, 0),
        amount_to_collect: codAmount,
        item_weight: input.pathao.itemWeight,
      });
      consignmentId = (result as any).data?.consignment_id?.toString() || '';
      trackingId = (result as any).data?.order_id?.toString() || '';
      trackingUrl = '';
      status = consignmentId ? 'BOOKED' : 'FAILED';
      break;
    }

    case 'REDX': {
      result = await bookRedXOrder({
        customer_name: order.shipping.name,
        customer_phone: order.shipping.phone,
        delivery_area: order.shipping.city,
        delivery_area_id: 0, // map from city
        merchant_invoice_id: order.orderId,
        cash_collection_amount: codAmount,
        parcel_details_amount: order.pricing.total,
        pickup_store_id: parseInt(process.env.REDX_STORE_ID || '0'),
        parcel_weight: 500,
      });
      consignmentId = (result as any).tracking_id?.toString() || '';
      trackingId = consignmentId;
      trackingUrl = `https://redx.com.bd/track-parcel/?trackingId=${trackingId}`;
      status = consignmentId ? 'BOOKED' : 'FAILED';
      break;
    }
  }

  // Save shipment record
  const shipment = await Shipment.create({
    orderId: input.orderId,
    provider: input.provider,
    consignmentId,
    trackingId,
    trackingUrl,
    status,
    bookedAt: new Date(),
    courierResponse: result,
    events: [{ status, note: 'Shipment booked', time: new Date() }],
  });

  // Update order status
  await Order.findByIdAndUpdate(input.orderId, { status: 'SHIPPED' });

  // Log timeline
  await OrderEvent.create({
    orderId: input.orderId,
    status: 'SHIPPED',
    source: 'SYSTEM',
    note: `Booked with ${input.provider}. Tracking: ${trackingId}`,
  });

  return shipment;
}

export async function trackShipment(shipmentId: string) {
  await connectDB();

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw new Error('Shipment not found');

  let trackingData: Record<string, unknown> = {};

  switch (shipment.provider) {
    case 'STEADFAST':
      if (shipment.trackingId) {
        trackingData = await trackSteadFastOrder(shipment.trackingId);
      }
      break;
    case 'REDX':
      if (shipment.trackingId) {
        trackingData = await trackRedXOrder(shipment.trackingId);
      }
      break;
  }

  return { shipment, trackingData };
}


export async function handleCourierWebhook(
  provider: CourierProvider,
  payload: Record<string, unknown>
) {
  await connectDB();

  let trackingId = '';
  let newStatus = '';
  let note = '';

  if (provider === 'STEADFAST') {
    trackingId = (payload.tracking_code as string) || '';
    newStatus = (payload.status as string) || '';
    note = (payload.note as string) || '';
  } else if (provider === 'PATHAO') {
    trackingId = (payload.order_id as string) || '';
    newStatus = (payload.order_status as string) || '';
  } else if (provider === 'REDX') {
    trackingId = (payload.tracking_id as string) || '';
    newStatus = (payload.status as string) || '';
  }

  if (!trackingId) return;

  const shipment = await Shipment.findOne({ trackingId });
  if (!shipment) return;

  // Push new event
  await Shipment.findByIdAndUpdate(shipment._id, {
    status: newStatus,
    $push: { events: { status: newStatus, note, time: new Date() } },
  });

  // Map courier status to order status
  const deliveredStatuses = ['delivered', 'DELIVERED', 'delivery_completed'];
  if (deliveredStatuses.includes(newStatus)) {
    await Order.findByIdAndUpdate(shipment.orderId, { status: 'DELIVERED' });
    await OrderEvent.create({
      orderId: shipment.orderId,
      status: 'DELIVERED',
      source: 'COURIER',
      note: `Marked delivered by ${provider}`,
    });
  }
}


export async function getPathaoCityList() {
  return getPathaoCities();
}


export async function getPathaoZoneList(cityId: number) {
  return getPathaoZones(cityId);
}



// services/shipment.service.ts (add these methods)

export async function getShipmentStats() {
  await connectDB();

  const total = await Shipment.countDocuments();
  const pending = await Shipment.countDocuments({ status: 'BOOKED' });
  const inTransit = await Shipment.countDocuments({ status: { $in: ['PICKED', 'IN_TRANSIT'] } });
  const delivered = await Shipment.countDocuments({ status: 'DELIVERED' });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thisMonth = await Shipment.countDocuments({
    createdAt: { $gte: startOfMonth }
  });

  return { total, pending, inTransit, delivered, thisMonth };
}

export async function getRecentShipments(limit: number = 5) {
  await connectDB();
  return Shipment.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('orderId', 'orderId')
    .lean();
}

export async function getShipments({
  page = 1,
  limit = 10,
  status,
  provider,
  search
}: {
  page?: number;
  limit?: number;
  status?: string;
  provider?: string;
  search?: string;
}) {
  await connectDB();

  const query: any = {};
  if (status) query.status = status;
  if (provider) query.provider = provider;
  if (search) {
    query.$or = [
      { trackingId: { $regex: search, $options: 'i' } },
      { 'orderId.orderId': { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const [shipments, total] = await Promise.all([
    Shipment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('orderId', 'orderId')
      .lean(),
    Shipment.countDocuments(query)
  ]);

  return {
    shipments,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  };
}

export async function getOrdersForShipping() {
  await connectDB();
  return Order.find({
    status: { $in: ['PLACED', 'PROCESSING', 'CONFIRMED'] },
    'shipping.phone': { $exists: true, $ne: '' }
  })
    .select('orderId shipping pricing')
    .limit(50)
    .lean();
}

export async function getAllShipments({ limit = 100 }: { limit?: number }) {
  await connectDB();
  return Shipment.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('orderId', 'orderId')
    .lean();
}

export async function getShipmentById(id: string) {
  await connectDB();
  const shipment = await Shipment.findById(id)
    .populate('orderId')
    .lean();
  
  if (!shipment) throw new Error('Shipment not found');
  return shipment;
}

