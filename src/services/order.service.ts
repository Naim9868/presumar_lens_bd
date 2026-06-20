// src/services/order.service.ts
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import Order, { IOrder } from '@/models/Order';
import OrderEvent from '@/models/OrderEvent';
import Customer from '@/models/Customer';

import { reserveInventory, releaseInventory } from './inventory.service';

export interface CreateOrderInput {
  userId?: string;
  guestEmail?: string;
  guestPhone?: string;
  items: {
    productId: string;
    variantKey?: string;
    snapshot: {
      name: string;
      slug: string;
      image?: string;
      sku?: string;
      brand?: string;
      category?: string;
      attributes?: Record<string, string>;
    };
    price: { original: number; sale: number };
    quantity: number;
  }[];
  shipping: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    area: string;
    city: string;
    postcode?: string;
    division?: string;
    landmark?: string;
  };
  deliveryType: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';
  paymentMethod: 'COD' | 'ONLINE';
  coupon?: {
    couponId?: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
    value: number;
    discountAmount: number;
  };
  marketing?: {
    source?: string;
    medium?: string;
    campaign?: string;
    fbclid?: string;
    gclid?: string;
    ttclid?: string;
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
      term?: string;
      content?: string;
    };
    referrer?: string;
  };
  meta?: {
    ip?: string;
    userAgent?: string;
    device?: string;
    platform?: string;
  };
}

export async function createOrder(input: CreateOrderInput): Promise<IOrder> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderId = `ORD-${nanoid(10).toUpperCase()}`;

    // Calculate pricing
    const subtotal = input.items.reduce(
      (sum, item) => sum + item.price.sale * item.quantity,
      0
    );

    const totalItems = input.items.map((item) => ({
      ...item,
      total: item.price.sale * item.quantity,
    }));

    // Calculate delivery charge based on location
    const deliveryCharge = input.deliveryType === 'INSIDE_DHAKA' ? 60 : 120;

    // Reserve inventory
    const inventoryItems = input.items.map((item) => ({
      productId: item.productId,
      variantKey: item.variantKey,
      quantity: item.quantity,
    }));

    await reserveInventory(
      inventoryItems
    );

    // Calculate final total
    let finalTotal = subtotal + deliveryCharge;
    let couponDiscount = 0;
    let couponData = undefined;

    if (input.coupon) {
      if (input.coupon.type === 'FREE_SHIPPING') {
        // Free shipping
        finalTotal = subtotal; // Remove delivery charge
      } else {
        couponDiscount = input.coupon.discountAmount;
        finalTotal = subtotal - couponDiscount + deliveryCharge;
      }

      couponData = {
        couponId: input.coupon.couponId ? new mongoose.Types.ObjectId(input.coupon.couponId) : undefined,
        code: input.coupon.code,
        type: input.coupon.type,
        value: input.coupon.value,
        discountAmount: input.coupon.discountAmount,
      };
    }

    // Create order
    const [order] = await Order.create(
      [{
        orderId,
        userId: input.userId
          ? new mongoose.Types.ObjectId(input.userId)
          : undefined,

        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,

        items: totalItems,

        pricing: {
          subtotal,
          itemDiscount: 0,
          couponDiscount,
          campaignDiscount: 0,
          deliveryCharge,
          tax: 0,
          total: finalTotal,
          currency: 'BDT',
        },

        coupon: couponData,

        marketing: input.marketing || {},

        status:
          input.paymentMethod === 'COD'
            ? 'PENDING'
            : 'AWAITING_PAYMENT',

        shipping: input.shipping,

        delivery: {
          type: input.deliveryType,
        },

        inventory: {
          reserved: true,
          released: false,
          itemsReserved: inventoryItems,
        },

        meta: input.meta || {},

        notifications: {
          sms: false,
          email: false,
          whatsapp: false,
        },

        paymentMethod: input.paymentMethod,
        paymentStatus: 'PENDING',
      }],
      { session }
    );

    let customer = await Customer.findOne({ phone: input.shipping.phone, }).session(session);
    if (!customer) {
      customer = await Customer.create([{
        userId: order.userId,
        name: input.shipping.name,
        phone: input.shipping.phone,
        email: input.shipping.email,
        address: [{
          label: 'Home',
          ...input.shipping,
          isDefault: true
        }],
        stats: {
          ordersCount: 1,
          totalSpent: finalTotal,
          firstOrderAt: new Date(),
          lastOrderAt: new Date(),
        },

        account: {
          hasLogin:
            !!input.userId,
        },
      }],
        { session }
      );

    } else {
      await Customer.updateOne(
        { _id: customer._id },
        {
          $inc: {
            'stats.ordersCount': 1,
            'stats.totalSpent': finalTotal,
          },

          $set: {
            name: input.shipping.name,
            email: input.shipping.email,
            phone: input.shipping.phone,
            updatedAt: new Date(),
            'stats.lastOrderAt': new Date(),
          },

          $setOnInsert: {
            'stats.firstOrderAt':
              new Date(),
          },
        },
        { session }
      );
    }

    // Log event
    await OrderEvent.create(
      [{
        orderId: order._id,
        status: order.status,
        previousStatus: null,
        source: 'SYSTEM',
        note: 'Order created',
        ip: input.meta?.ip,
        userAgent: input.meta?.userAgent,
      }],
      { session }
    );

    await session.commitTransaction();

    // Return populated order
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  adminId?: string,
  note?: string
): Promise<IOrder | null> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new Error('Order not found');
    }

    const previousStatus = order.status;

    // If cancelling, release inventory
    if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
      await releaseInventory(order.inventory.itemsReserved);
      order.inventory.released = true;
      order.inventory.releasedAt = new Date();
    }

    // Update status
    order.status = status as any;
    await order.save({ session });

    // Log event
    await OrderEvent.create({
      orderId: order._id,
      status,
      previousStatus,
      source: adminId ? 'ADMIN' : 'SYSTEM',
      note,
      createdBy: adminId ? new mongoose.Types.ObjectId(adminId) : undefined,
    });

    await session.commitTransaction();

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function getOrderById(orderId: string): Promise<IOrder | null> {
  return Order.findById(orderId);
}

export async function getOrderByOrderId(orderId: string): Promise<IOrder | null> {
  return Order.findOne({ orderId });
}

export interface OrderFilterOptions {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export async function getOrders(options: OrderFilterOptions) {
  const { status, startDate, endDate, userId, search, page = 1, limit = 20, sort = '-createdAt' } = options;

  const filter: any = {};

  if (status) {
    filter.status = status;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = startDate;
    if (endDate) filter.createdAt.$lte = endDate;
  }

  if (userId) {
    filter.userId = new mongoose.Types.ObjectId(userId);
  }

  if (search) {
    filter.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { 'shipping.name': { $regex: search, $options: 'i' } },
      { 'shipping.phone': { $regex: search, $options: 'i' } },
      { 'shipping.email': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}