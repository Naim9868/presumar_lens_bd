import { CheckoutItem } from '@/types';

type shipping = {
    name: string;
    phone: string;
    address: string;
    area: string;
    city: string;
}

export function buildOrderPayload(
  items: CheckoutItem[],
  shipping: shipping,
  deliveryType: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA'
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const deliveryCharge =
    deliveryType === 'INSIDE_DHAKA' ? 60 : 120;

  return {
    items: items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    })),

    pricing: {
      subtotal,
      deliveryCharge,
      discount: 0,
      total: subtotal + deliveryCharge,
    },

    payment: {
      method: 'COD',
      status: 'UNPAID',
    },

    shipping,
    delivery: {
      type: deliveryType,
    },
  };
}