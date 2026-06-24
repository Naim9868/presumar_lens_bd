// src/lib/fraud-detection.ts
import { Order, FraudScore } from '@/types/order';

export function computeFraudScore(order: Order): FraudScore {
  const flags: string[] = [];
  let score = 0;

  // 1. Multiple orders from same IP in short time — can't check without DB here, flag if IP present
  if (!order.meta?.ip) {
    flags.push('No IP recorded');
    score += 5;
  }

  // 2. Delivery type vs city mismatch
  const city = order.shipping.city?.toLowerCase() ?? '';
  const isDhaka = ['dhaka', 'ঢাকা'].some((k) => city.includes(k));
  if (order.delivery.type === 'INSIDE_DHAKA' && !isDhaka) {
    flags.push('Delivery type mismatch with city');
    score += 20;
  }

  // 3. Very high order total with COD
  if (order.paymentMethod === 'COD' && order.pricing.total > 10000) {
    flags.push('High COD value (>10,000 BDT)');
    score += 15;
  }

  // 4. Suspiciously high quantity
  const highQty = order.items.some((i) => i.quantity > 20);
  if (highQty) {
    flags.push('Unusually high quantity');
    score += 20;
  }

  // 5. Multiple items × high value COD
  if (order.paymentMethod === 'COD' && order.items.length > 5 && order.pricing.total > 5000) {
    flags.push('Bulk COD order');
    score += 10;
  }

  // 6. No phone area code check (BD numbers start with 01)
  const phone = order.shipping.phone?.replace(/\D/g, '') ?? '';
  if (!phone.startsWith('01') && !phone.startsWith('880')) {
    flags.push('Non-standard phone number');
    score += 25;
  }

  // 7. Guest order with no email
  if (!order.userId && !order.guestEmail && !order.guestPhone) {
    flags.push('Anonymous guest order');
    score += 10;
  }

  // 8. Address too short
  if ((order.shipping.address?.length ?? 0) < 10) {
    flags.push('Incomplete address');
    score += 15;
  }

  const risk: FraudScore['risk'] = score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW';

  return { score: Math.min(score, 100), risk, flags };
}

export function getFraudColor(risk: FraudScore['risk']) {
  return {
    LOW:    { text: 'text-green-700',  bg: 'bg-green-50 border-green-200',  badge: 'bg-green-100 text-green-700'  },
    MEDIUM: { text: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  badge: 'bg-amber-100 text-amber-700'  },
    HIGH:   { text: 'text-red-700',    bg: 'bg-red-50 border-red-200',      badge: 'bg-red-100 text-red-700'      },
  }[risk];
}