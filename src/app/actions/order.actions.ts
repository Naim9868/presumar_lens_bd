'use server';

import mongoose from 'mongoose';
import { connectDB } from '@/lib/dbConnect';
import { createOrder as createOrderService, updateOrderStatus as updateOrderStatusService } from '@/services/order.service';
import { incrementCouponUsage } from '@/services/coupon.service';
import Order from '@/models/Order';
import { revalidatePath } from 'next/cache';

// Helper: serialize MongoDB docs (ObjectId → string, Date → ISO)
function serializeDocument<T = any>(doc: any): T {
  if (doc === null || doc === undefined) return doc as T;

  if (Array.isArray(doc)) return doc.map((d) => serializeDocument(d)) as unknown as T;

  if (doc instanceof mongoose.Types.ObjectId) return doc.toString() as unknown as T;
  if (doc instanceof Date) return doc.toISOString() as unknown as T;

  if (typeof doc === 'object') {
    const out: any = {};
    for (const key of Object.keys(doc)) {
      out[key] = serializeDocument(doc[key]);
    }
    return out as T;
  }
  return doc;
}

export interface CreateOrderClientInput {
  items: Array<{
    productId: string;
    variantKey?: string;
    name: string;
    sku?: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    image?: string;
    slug?: string;
    brand?: string;
    category?: string;
  }>;
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
    _id?: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
    value: number;
    discountAmount: number;
  };
  userId?: string | null;
  guestEmail?: string;
  guestPhone?: string;
  marketing?: Record<string, unknown>;
  meta?: {
    ip?: string;
    userAgent?: string;
    device?: string;
    platform?: string;
  };
}

export async function createOrderAction(data: CreateOrderClientInput): Promise<
  | { success: true; orderId: string; orderNumber: string }
  | { success: false; error: string }
> {
  try {
    await connectDB();

    if (!data.items?.length) {
      return { success: false, error: 'At least one item is required' };
    }
    if (!data.shipping?.name || !data.shipping?.phone) {
      return { success: false, error: 'Shipping info required' };
    }
    if (!data.shipping.address || !data.shipping.area || !data.shipping.city) {
      return { success: false, error: 'Complete shipping address is required' };
    }

    // Build order items in the canonical schema shape (with snapshot)
    const orderItems = data.items.map((it) => {
      const sale = Number(it.price) || 0;
      const original = Number(it.originalPrice ?? it.price) || 0;
      const qty = Math.max(1, Number(it.quantity) || 1);
      return {
        productId: it.productId,
        variantKey: it.variantKey,
        snapshot: {
          name: it.name,
          slug: it.slug || '',
          image: it.image || '',
          sku: it.sku || '',
          brand: it.brand || '',
          category: it.category || '',
          attributes: {} as Record<string, string>,
        },
        price: { original, sale },
        quantity: qty,
        total: sale * qty,
      };
    });

    const subtotal = orderItems.reduce((s, i) => s + i.total, 0);
    const deliveryCharge =
      data.deliveryType === 'INSIDE_DHAKA' ? 60 : 120;

    const couponDiscount =
      data.coupon?.type === 'FREE_SHIPPING'
        ? 0
        : Number(data.coupon?.discountAmount || 0);
    const freeShipping = data.coupon?.type === 'FREE_SHIPPING';
    const finalDelivery = freeShipping ? 0 : deliveryCharge;
    const total = Math.max(0, subtotal - couponDiscount + finalDelivery);

    const order = await createOrderService({
      userId: data.userId || undefined,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      items: orderItems,
      shipping: data.shipping,
      deliveryType: data.deliveryType,
      paymentMethod: data.paymentMethod,
      pricing: {
        subtotal,
        itemDiscount: 0,
        couponDiscount,
        campaignDiscount: 0,
        deliveryCharge: finalDelivery,
        tax: 0,
        total,
      },
      coupon: data.coupon
        ? {
            couponId: data.coupon._id,
            code: data.coupon.code,
            type: data.coupon.type,
            value: data.coupon.value,
            discountAmount: data.coupon.discountAmount,
          }
        : undefined,
      marketing: data.marketing as any,
      meta: data.meta,
    });

    // Increment coupon usage atomically (best-effort, non-blocking)
    if (data.coupon?.code) {
      incrementCouponUsage(data.coupon.code).catch((err) =>
        console.error('[createOrderAction] incrementCouponUsage', err)
      );
    }

    revalidatePath('/admin/orders');
    revalidatePath('/admin/coupons');

    return {
      success: true,
      orderId: order._id.toString(),
      orderNumber: order.orderId,
    };
  } catch (error: any) {
    console.error('[createOrderAction]', error);
    return {
      success: false,
      error: error?.message || 'Failed to create order',
    };
  }
}

export async function getOrdersAction() {
  try {
    await connectDB();
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    return { success: true, orders: orders.map((o) => serializeDocument(o)) };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, orders: [] };
  }
}

export async function getOrderByIdAction(id: string) {
  try {
    await connectDB();
    const order = await Order.findById(id).lean();
    if (!order) return { success: false, order: null };
    return { success: true, order: serializeDocument(order) };
  } catch (error) {
    console.error('Error fetching order:', error);
    return { success: false, order: null };
  }
}

export async function getUserOrdersAction(userId: string) {
  try {
    await connectDB();
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
    return { success: true, orders: orders.map((o) => serializeDocument(o)) };
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return { success: false, orders: [] };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: string,
  note?: string
): Promise<{ success: boolean; order?: any; error?: string }> {
  try {
    await connectDB();
    const order = await updateOrderStatusService(orderId, status, undefined, note);
    if (!order) return { success: false, error: 'Order not found' };

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');

    return { success: true, order: serializeDocument(order) };
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update order status',
    };
  }
}

export async function deleteOrderAction(orderId: string) {
  try {
    await connectDB();
    await Order.findByIdAndDelete(orderId);
    revalidatePath('/admin/orders');
    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    return { success: false, error: 'Failed to delete order' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy aliases — kept so existing callers continue to work after the refactor.
// Prefer the *Action suffixed names in new code.
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Use createOrderAction instead. */
export const createOrder = createOrderAction;

/** @deprecated Use getOrderByIdAction instead. */
export async function getOrderById(id: string) {
  return getOrderByIdAction(id);
}

/** @deprecated Use getOrdersAction instead. */
export async function getOrders() {
  return getOrdersAction();
}

/** @deprecated Use getUserOrdersAction instead. */
export async function getUserOrders(userId: string) {
  return getUserOrdersAction(userId);
}

/** @deprecated Use updateOrderStatusAction instead. */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  note?: string
) {
  return updateOrderStatusAction(orderId, status, note);
}

/** @deprecated Use deleteOrderAction instead. */
export async function deleteOrder(orderId: string) {
  return deleteOrderAction(orderId);
}