// lib/services/order.service.ts
import { IOrder } from '@/models/Order';
import mongoose from 'mongoose';
// import { sendNotification } from './notification.service';
import Order from '@/models/Order';

export class OrderService {
  // static async createOrder(orderData: Partial<IOrder>) {
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     // Generate unique order ID
  //     const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      
  //     // Calculate pricing
  //     const subtotal = orderData.items!.reduce((sum, item) => sum + item.price * item.quantity, 0);
  //     const deliveryCharge = orderData.delivery?.type === 'INSIDE_DHAKA' ? 60 : 120;
  //     const total = subtotal + deliveryCharge - (orderData.pricing?.discount || 0);

  //     const order = await Order.create([{
  //       ...orderData,
  //       orderId,
  //       pricing: {
  //         subtotal,
  //         deliveryCharge,
  //         discount: orderData.pricing?.discount || 0,
  //         total,
  //       },
  //       timeline: [{
  //         status: 'PENDING',
  //         note: 'Order placed successfully',
  //         createdAt: new Date(),
  //       }],
  //       status: 'PENDING',
  //     }], { session });

  //     await session.commitTransaction();
      
  //     // Send notifications
  //     // await sendNotification({
  //     //   userId: orderData.userId,
  //     //   type: 'ORDER_PLACED',
  //     //   orderId: order[0]._id,
  //     // });
      
  //     return order[0];
  //   } catch (error) {
  //     await session.abortTransaction();
  //     throw error;
  //   } finally {
  //     session.endSession();
  //   }
  // }

  static async updateOrderStatus(
    orderId: string,
    status: string,
    note?: string
  ) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    order.status = status;
    order.timeline.push({
      status,
      note: note || `Order status updated to ${status}`,
      createdAt: new Date(),
    });

    await order.save();

    // Send status update notification
    // await sendNotification({
    //   userId: order.userId,
    //   type: `ORDER_${status}`,
    //   orderId: order._id,
    // });

    // Generate invoice when delivered
    // if (status === 'DELIVERED') {
    //   await generateInvoice(order);
    // }

    return order;
  }

  static async bulkUpdateOrders(orderIds: string[], action: string) {
    const statusMap: Record<string, string> = {
      confirm: 'CONFIRMED',
      cancel: 'CANCELLED',
      process: 'PROCESSING',
      ship: 'SHIPPED',
      deliver: 'DELIVERED',
    };

    const status = statusMap[action];
    if (!status) throw new Error('Invalid action');

    const orders = await Order.updateMany(
      { _id: { $in: orderIds } },
      {
        $set: { status, isCancelled: status === 'CANCELLED' },
        $push: {
          timeline: {
            status,
            note: `Bulk action: ${action}`,
            createdAt: new Date(),
          },
        },
      }
    );

    return orders;
  }

  static async getOrderStats() {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
        },
      },
    ]);

    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          status: 'DELIVERED',
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return { stats, dailyRevenue };
  }
}