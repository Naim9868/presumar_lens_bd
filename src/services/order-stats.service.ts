// src/services/order-stats.service.ts
import Order from '@/models/Order';
import Shipment from '@/models/Shipment';
import { OrderStatus, OrderStats, FraudResult } from '@/types/order';

// ─── Stats ────────────────────────────────────────────────
export async function getOrderStats(): Promise<OrderStats> {
  const [totals, statusGroups] = await Promise.all([
    Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
          deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
        },
      },
    ]),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const breakdown: Partial<Record<OrderStatus, number>> = {};
  statusGroups.forEach((s: { _id: string; count: number }) => {
    breakdown[s._id as OrderStatus] = s.count;
  });

  const t = totals[0] || { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, deliveredOrders: 0 };

  return {
    totalOrders: t.totalOrders,
    totalRevenue: t.totalRevenue,
    pendingOrders: t.pendingOrders,
    deliveredOrders: t.deliveredOrders,
    statusBreakdown: breakdown,
  };
}

// ─── Fraud Detection ──────────────────────────────────────
export function calculateFraudScore(order: {
  pricing: { total: number; deliveryCharge: number };
  shipping: { phone: string; address: string; city: string };
  items: { quantity: number; price: { sale: number } }[];
  meta?: { ip?: string; userAgent?: string };
  paymentMethod: string;
  marketing?: { source?: string };
  guestEmail?: string;
  userId?: string;
}): FraudResult {
  const flags: FraudResult['flags'] = [];
  let score = 0;

  // High value COD
  if (order.paymentMethod === 'COD' && order.pricing.total > 10000) {
    score += 25;
    flags.push({ type: 'HIGH_VALUE_COD', severity: 'high', message: 'High value COD order (>৳10,000)' });
  }

  // Very high quantity single item
  const maxQty = Math.max(...order.items.map((i) => i.quantity));
  if (maxQty > 10) {
    score += 20;
    flags.push({ type: 'BULK_QUANTITY', severity: 'medium', message: `Unusually high quantity (${maxQty} units)` });
  }

  // Guest order with no email
  if (!order.userId && !order.guestEmail) {
    score += 10;
    flags.push({ type: 'NO_EMAIL', severity: 'low', message: 'Guest order without email' });
  }

  // Suspicious phone (test numbers)
  const phone = order.shipping.phone;
  if (/^01[0-9]{9}$/.test(phone) === false || phone === '01700000000') {
    score += 15;
    flags.push({ type: 'INVALID_PHONE', severity: 'medium', message: 'Phone number format suspicious' });
  }

  // Free delivery on large orders
  if (order.pricing.deliveryCharge === 0 && order.pricing.total > 5000) {
    score += 5;
    flags.push({ type: 'FREE_DELIVERY_LARGE', severity: 'low', message: 'Free delivery on large order' });
  }

  // Multiple items all at exact same price
  const allSamePrice = order.items.every((i) => i.price.sale === order.items[0].price.sale);
  if (order.items.length > 3 && allSamePrice) {
    score += 10;
    flags.push({ type: 'UNIFORM_PRICING', severity: 'low', message: 'All items have identical prices' });
  }

  // No source / direct traffic for large order
  if (!order.marketing?.source && order.pricing.total > 5000) {
    score += 5;
    flags.push({ type: 'NO_SOURCE', severity: 'low', message: 'No traffic source for large order' });
  }

  const risk: FraudResult['risk'] = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';

  return { score: Math.min(score, 100), risk, flags };
}

// ─── CSV Export ───────────────────────────────────────────
export function ordersToCSV(orders: Record<string, unknown>[]): string {
  const headers = [
    'Order ID', 'Date', 'Customer Name', 'Phone', 'City',
    'Items', 'Subtotal', 'Delivery', 'Discount', 'Total',
    'Payment Method', 'Payment Status', 'Order Status', 'Source',
  ];

  const rows = orders.map((o: any) => [
    o.orderId,
    new Date(o.createdAt).toLocaleDateString('en-BD'),
    o.shipping?.name || '',
    o.shipping?.phone || '',
    o.shipping?.city || '',
    o.items?.length || 0,
    o.pricing?.subtotal || 0,
    o.pricing?.deliveryCharge || 0,
    (o.pricing?.couponDiscount || 0) + (o.pricing?.campaignDiscount || 0),
    o.pricing?.total || 0,
    o.paymentMethod || '',
    o.paymentStatus || '',
    o.status || '',
    o.marketing?.source || 'direct',
  ]);

  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  return [
    headers.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(',')),
  ].join('\n');
}

// ─── Add note to order ────────────────────────────────────
export async function addNoteToOrder(
  orderId: string,
  text: string,
  adminId?: string
) {
  return Order.findByIdAndUpdate(
    orderId,
    {
      $push: {
        notes: {
          text,
          createdBy: adminId,
          createdAt: new Date(),
        },
      },
    },
    { new: true }
  );
}

// ─── Get order with shipment ──────────────────────────────
export async function getOrderWithShipment(orderId: string) {
  const [order, shipment] = await Promise.all([
    Order.findById(orderId).lean(),
    Shipment.findOne({ orderId }).lean(),
  ]);

  if (!order) return null;
  return { ...order, shipment: shipment || null };
}