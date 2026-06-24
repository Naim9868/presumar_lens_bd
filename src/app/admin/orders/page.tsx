// src/app/admin/orders/page.tsx
import { Suspense } from 'react';
import { connectDB } from '@/lib/dbConnect';
import { getOrders } from '@/services/order.service';
import { getOrderStats } from '@/services/order-stats.service';
import OrdersClient from '@/components/admin/orders/OrdersClient';

export const dynamic = 'force-dynamic';

// Default values for fallback
const defaultPagination = { page: 1, limit: 20, total: 0, pages: 0 };
const defaultStats = {
  totalOrders: 0,
  totalRevenue: 0,
  pendingOrders: 0,
  deliveredOrders: 0,
  statusBreakdown: {},
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; status?: string; search?: string }>;
}) {
  try {
    const params = await searchParams;
    await connectDB();

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const status = params.status || undefined;
    const search = params.search || undefined;

    // Fetch orders and stats with error handling
    const [result, stats] = await Promise.all([
      getOrders({
        page,
        limit,
        status,
        search,
        sort: '-createdAt',
      }).catch((error) => {
        console.error('Failed to fetch orders:', error);
        return {
          orders: [],
          pagination: { page, limit, total: 0, pages: 0 },
        };
      }),
      getOrderStats().catch((error) => {
        console.error('Failed to fetch stats:', error);
        return defaultStats;
      }),
    ]);

    // Ensure we have valid data structures
    const orders = Array.isArray(result.orders) ? result.orders : [];
    const pagination = 'pagination' in result
      ? result.pagination
      : {
          page: result.page ?? page,
          limit: result.limit ?? limit,
          total: result.total ?? 0,
          pages: result.pages ?? 0,
        };
    const serializedStats = stats || defaultStats;

    // Serialize for client-side
    const serializedOrders = JSON.parse(JSON.stringify(orders));
    const serializedPagination = JSON.parse(JSON.stringify(pagination));
    const serializedStatsData = JSON.parse(JSON.stringify(serializedStats));

    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading orders...</div>
        </div>
      }>
        <OrdersClient
          initialOrders={serializedOrders}
          initialPagination={serializedPagination}
          initialStats={serializedStatsData}
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Error in OrdersPage:', error);
    
    // Return with empty data on error
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading orders...</div>
        </div>
      }>
        <OrdersClient
          initialOrders={[]}
          initialPagination={defaultPagination}
          initialStats={defaultStats}
        />
      </Suspense>
    );
  }
}