'use server';

import { dbConnect as connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import { Product } from '@/models/Product';
import { createOrderSchema } from '@/lib/validations/order.validation';
import { z } from 'zod';  
import { revalidatePath } from 'next/cache';

// Helper function to serialize MongoDB documents
function serializeDocument(doc: any): any {
  if (!doc) return null;
  
  if (Array.isArray(doc)) {
    return doc.map(item => serializeDocument(item));
  }
  
  if (typeof doc === 'object') {
    const serialized: any = {};
    for (const key in doc) {
      const value = doc[key];
      
      if (value && typeof value === 'object' && value._bsontype === 'ObjectId') {
        serialized[key] = value.toString();
      }
      else if (value instanceof Date) {
        serialized[key] = value.toISOString();
      }
      else if (value && typeof value === 'object') {
        serialized[key] = serializeDocument(value);
      }
      else {
        serialized[key] = value;
      }
    }
    return serialized;
  }
  
  return doc;
}

type CreateOrderInput = z.infer<typeof createOrderSchema>;

export async function createOrder(data: any) {
  try {
    await connectDB();

    // Validate that items exists and is an array
    if (!data.items || !Array.isArray(data.items)) {
      console.error('Invalid items data:', data.items);
      return { success: false, error: 'Invalid order items' };
    }

    const { items, shipping, deliveryType, paymentMethod, discount = 0, userId = null } = data;

    console.log('Processing order with items:', items.length); // Debug log

    const verifiedItems = [];

    for (const item of items) {
      // Validate item has required fields
      if (!item.productId) {
        console.error('Missing productId for item:', item);
        return { success: false, error: `Missing product ID for ${item.name || 'unknown product'}` };
      }

      const product = await Product.findById(item.productId);

      if (!product) {
        return { success: false, error: `Product ${item.name} not found` };
      }

      let variant = null;

      if (item.variantId) {
        variant = product.variants?.find(
          (v: any) =>
            v.sku === item.variantId || v.variantKey === item.variantId
        );
      }

      if (!variant && product.variants?.length) {
        variant =
          product.variants.find((v: any) => v.isDefault) ||
          product.variants[0];
      }

      if (!variant) {
        return { success: false, error: `Variant not found for ${item.name}` };
      }

      const availableStock =
        (variant.inventory || 0) - (variant.reserved || 0);

      if (availableStock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${item.name}. Available: ${availableStock}`,
        };
      }

      verifiedItems.push({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || '',
        sku: variant.sku,
        variantKey: variant.variantKey,
        variantId: variant.sku,
      });
    }

    // Reserve stock
    for (const item of verifiedItems) {
      await Product.updateOne(
        {
          _id: item.productId,
          'variants.sku': item.sku,
        },
        {
          $inc: { 'variants.$.reserved': item.quantity },
        }
      );
    }

    const subtotal = verifiedItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    const deliveryCharge = deliveryType === 'INSIDE_DHAKA' ? 60 : 120;
    const total = subtotal + deliveryCharge - discount;

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    // Create order items in correct format
    const orderItems = verifiedItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    }));

    const order = await Order.create({
      orderId: orderId,
      userId: userId || null,
      items: orderItems,
      pricing: {
        subtotal,
        deliveryCharge,
        discount,
        total,
      },
      shipping: {
        name: shipping.name,
        phone: shipping.phone,
        address: shipping.address,
        area: shipping.area,
        city: shipping.city,
      },
      delivery: {
        type: deliveryType,
      },
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'COD' ? 'UNPAID' : 'PENDING',
      },
      status: 'PENDING',
      timeline: [
        {
          status: 'PENDING',
          note: 'Order placed successfully',
          createdAt: new Date(),
        },
      ],
      isCancelled: false,
    });

    revalidatePath('/admin/orders');
    revalidatePath('/orders');

    return {
      success: true,
      orderId: order._id.toString(),
      orderNumber: order.orderId,
    };
  } catch (error) {
    console.error('Order creation error:', error);
    return { success: false, error: 'Failed to create order' };
  }
}

export async function getOrders() {
  try {
    await connectDB();
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    
    // Serialize orders
    const serializedOrders = orders.map(order => serializeDocument(order));
    
    return { success: true, orders: serializedOrders };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, orders: [] };
  }
}

export async function getOrderById(Id: string) {
  try {
    await connectDB();
    const order = await Order.findById(Id).lean();
    
    if (!order) {
      return { success: false, order: null };
    }
    
    const serializedOrder = serializeDocument(order);
    
    return { success: true, order: serializedOrder };
  } catch (error) {
    console.error('Error fetching order:', error);
    return { success: false, order: null };
  }
}

export async function getUserOrders(userId: string) {
  try {
    await connectDB();
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    
    const serializedOrders = orders.map(order => serializeDocument(order));
    
    return { success: true, orders: serializedOrders };
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return { success: false, orders: [] };
  }
}

export async function updateOrderStatus(orderId: string, status: string, note?: string) {
  try {
    await connectDB();
    
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    
    order.status = status;
    order.timeline.push({
      status,
      note: note || `Order status updated to ${status}`,
      createdAt: new Date(),
    });
    
    await order.save();
    
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    
    return { success: true, order: serializeDocument(order) };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: 'Failed to update order status' };
  }
}

export async function deleteOrder(orderId: string) {
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