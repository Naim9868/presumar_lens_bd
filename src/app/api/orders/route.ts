// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { createOrder, getOrders } from '@/services/order.service';
import { getOrderStats, ordersToCSV } from '@/services/order-stats.service';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-response';
import Order from '@/models/Order';



export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const sp = req.nextUrl.searchParams;
 
    const exportFormat = sp.get('export');
 
    // ── Export all orders as CSV ──
    if (exportFormat === 'csv') {
      const orders = await Order.find()
        .sort('-createdAt')
        .limit(5000)
        .lean();
      const csv = ordersToCSV(orders as unknown as Record<string, unknown>[]);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="orders-${Date.now()}.csv"`,
        },
      });
    }
 
    // ── Stats only ──
    if (sp.get('statsOnly') === 'true') {
      const stats = await getOrderStats();
      return NextResponse.json({ success: true, stats });
    }
 
    // ── Normal paginated list ──
    const result = await getOrders({
      status: sp.get('status') || undefined,
      search: sp.get('search') || undefined,
      page: Number(sp.get('page') || 1),
      limit: Number(sp.get('limit') || 20),
      startDate: sp.get('startDate') ? new Date(sp.get('startDate')!) : undefined,
      endDate: sp.get('endDate') ? new Date(sp.get('endDate')!) : undefined,
      userId: sp.get('userId') || undefined,
      sort: sp.get('sort') || '-createdAt',
      source: sp.get('source') || undefined,
    });

     return paginatedResponse(result.orders, result.total, result.page, result.limit);
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}



// POST /api/orders — create new order
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      userId, guestEmail, items, pricing, coupon,
      shipping, deliveryType, paymentMethod, marketing,
    } = body;

    // Basic validation
    if (!items?.length) return errorResponse('Order must have at least one item');
    if (!shipping?.name || !shipping?.phone) return errorResponse('Shipping info required');
    if (!pricing?.total) return errorResponse('Pricing total required');
    if (!paymentMethod) return errorResponse('Payment method required');
    if (!deliveryType) return errorResponse('Delivery type required');

    // Extract meta from request
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    const order = await createOrder({
      userId,
      guestEmail,
      items,
      pricing,
      coupon,
      shipping,
      deliveryType,
      paymentMethod,
      marketing,
      meta: { ip, userAgent, device: userAgent.includes('Mobile') ? 'mobile' : 'desktop' },
    });

    return successResponse({ order }, 201);
  } catch (err) {
    console.error('[POST /api/orders]', err);
    return errorResponse('Failed to create order', 500);
  }
}