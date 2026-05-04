import { NextRequest, NextResponse } from 'next/server';
import { dbConnect as connectDB} from '@/lib/dbConnect';
import Order from '@/models/Order';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get all orders
    const orders = await Order.find({}).lean();
    
    // Calculate stats
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
    const confirmedOrders = orders.filter(o => o.status === 'CONFIRMED').length;
    const processingOrders = orders.filter(o => o.status === 'PROCESSING').length;
    const shippedOrders = orders.filter(o => o.status === 'SHIPPED').length;
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;
    
    const totalRevenue = orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today).length;
    const todayRevenue = orders
      .filter(o => o.status === 'DELIVERED' && new Date(o.createdAt) >= today)
      .reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
    
    // Monthly revenue for chart
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      const monthlyOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate.getMonth() === date.getMonth() && 
               orderDate.getFullYear() === date.getFullYear() &&
               o.status === 'DELIVERED';
      });
      
      const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
      
      last6Months.push({
        month: monthName,
        revenue: monthlyRevenue,
        orders: monthlyOrders.length,
      });
    }
    
    // Status distribution
    const statusDistribution = [
      { name: 'Pending', value: pendingOrders, color: '#F59E0B' },
      { name: 'Confirmed', value: confirmedOrders, color: '#10B981' },
      { name: 'Processing', value: processingOrders, color: '#3B82F6' },
      { name: 'Shipped', value: shippedOrders, color: '#8B5CF6' },
      { name: 'Delivered', value: deliveredOrders, color: '#059669' },
      { name: 'Cancelled', value: cancelledOrders, color: '#EF4444' },
    ];
    
    return NextResponse.json({
      success: true,
      overview: {
        totalOrders,
        totalRevenue,
        todayOrders,
        todayRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
      statusCounts: {
        pending: pendingOrders,
        confirmed: confirmedOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      monthlyData: last6Months,
      statusDistribution: statusDistribution.filter(s => s.value > 0),
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}