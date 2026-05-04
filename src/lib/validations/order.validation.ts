// lib/validation/order.validation.ts
import { z } from 'zod';

export const orderItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  variantId: z.string().optional(),
  name: z.string(),
  sku: z.string().optional(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image: z.string().url().optional(),
});

export const shippingSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid Bangladesh phone number'),
  address: z.string().min(5, 'Address is required'),
  area: z.string(),
  city: z.string(),
});

export const createOrderSchema = z.object({
  userId: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shipping: shippingSchema,
  paymentMethod: z.enum(['COD', 'ONLINE']),
  deliveryType: z.enum(['INSIDE_DHAKA', 'OUTSIDE_DHAKA']),
  discount: z.number().min(0).default(0),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  note: z.string().optional(),
  customStatus: z.string().optional(),
});

export const bulkUpdateSchema = z.object({
  orderIds: z.array(z.string()),
  action: z.enum(['confirm', 'cancel', 'process', 'ship', 'deliver']),
});

export const trackingUpdateSchema = z.object({
  courier: z.string(),
  trackingId: z.string(),
});