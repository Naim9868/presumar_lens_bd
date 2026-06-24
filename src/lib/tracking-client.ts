// src/lib/tracking-client.ts
// Use this in your Next.js frontend pages/components

// ─── UTM & Click ID Capture ───────────────────────────────

export interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
  referrer?: string;
}

export function captureUTM(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const data: UTMData = {};

  const keys: (keyof UTMData)[] = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'ttclid',
  ];

  keys.forEach((key) => {
    const val = params.get(key);
    if (val) data[key] = val;
  });

  if (document.referrer) data.referrer = document.referrer;

  if (Object.keys(data).length > 0) {
    try {
      sessionStorage.setItem('_utm', JSON.stringify(data));
    } catch { /* sessionStorage blocked */ }
  }
}

export function getUTM(): UTMData {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem('_utm') || '{}');
  } catch {
    return {};
  }
}

// ─── Session ID ───────────────────────────────────────────

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    let sid = sessionStorage.getItem('_sid');
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('_sid', sid);
    }
    return sid;
  } catch {
    return `sess_${Date.now()}`;
  }
}

// ─── Track Event ──────────────────────────────────────────

export type TrackEventName =
  | 'page_view'
  | 'view_item'
  | 'search'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'signup'
  | 'wishlist';

interface TrackOptions {
  value?: number;
  productId?: string;
  orderId?: string;
  page?: string;
  metadata?: Record<string, unknown>;
}

export async function track(name: TrackEventName, options: TrackOptions = {}): Promise<void> {
  try {
    const utm = getUTM();
    const sessionId = getSessionId();

    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        sessionId,
        value: options.value,
        productId: options.productId,
        orderId: options.orderId,
        page: options.page || (typeof window !== 'undefined' ? window.location.pathname : undefined),
        utm: Object.keys(utm).length > 0 ? utm : undefined,
        fbclid: utm.fbclid,
        gclid: utm.gclid,
        ttclid: utm.ttclid,
        metadata: options.metadata,
      }),
    });
  } catch { /* fire and forget — never block UX */ }
}

// ─── Browser-side Pixel Helpers ───────────────────────────
// Call these in addition to server-side events for deduplication

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (...args: unknown[]) => void };
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackFBPixel(event: string, data: Record<string, unknown> = {}): void {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, data);
  }
}

export function trackTikTokPixel(event: string, data: Record<string, unknown> = {}): void {
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.track(event, data);
  }
}

export function trackGA4(event: string, data: Record<string, unknown> = {}): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, data);
  }
}

// ─── Purchase (fires all at once) ─────────────────────────

export async function trackPurchase(params: {
  orderId: string;
  total: number;
  items?: { id: string; name: string; price: number; quantity: number }[];
}): Promise<void> {
  const { orderId, total, items = [] } = params;

  // Server-side (reliable — deduped by eventId)
  await track('purchase', { value: total, orderId });

  // Browser-side pixels (for real-time reporting in ad platforms)
  trackFBPixel('Purchase', { value: total, currency: 'BDT', order_id: orderId });
  trackTikTokPixel('PlaceAnOrder', { value: total, currency: 'BDT', order_id: orderId });
  trackGA4('purchase', {
    transaction_id: orderId,
    value: total,
    currency: 'BDT',
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
}

// ─── Add To Cart ──────────────────────────────────────────

export async function trackAddToCart(params: {
  productId: string;
  name: string;
  price: number;
  quantity?: number;
}): Promise<void> {
  await track('add_to_cart', { productId: params.productId, value: params.price });
  trackFBPixel('AddToCart', { content_ids: [params.productId], value: params.price, currency: 'BDT' });
  trackTikTokPixel('AddToCart', { content_id: params.productId, price: params.price, currency: 'BDT' });
  trackGA4('add_to_cart', { currency: 'BDT', value: params.price, items: [{ item_id: params.productId, item_name: params.name, price: params.price, quantity: params.quantity || 1 }] });
}

// ─── View Item ────────────────────────────────────────────

export async function trackViewItem(params: {
  productId: string;
  name: string;
  price: number;
}): Promise<void> {
  await track('view_item', { productId: params.productId, value: params.price });
  trackFBPixel('ViewContent', { content_ids: [params.productId], value: params.price, currency: 'BDT' });
  trackTikTokPixel('ViewContent', { content_id: params.productId, price: params.price, currency: 'BDT' });
  trackGA4('view_item', { currency: 'BDT', value: params.price, items: [{ item_id: params.productId, item_name: params.name, price: params.price }] });
}

// ─── Begin Checkout ───────────────────────────────────────

export async function trackBeginCheckout(total: number): Promise<void> {
  await track('begin_checkout', { value: total });
  trackFBPixel('InitiateCheckout', { value: total, currency: 'BDT' });
  trackTikTokPixel('InitiateCheckout', { value: total, currency: 'BDT' });
  trackGA4('begin_checkout', { currency: 'BDT', value: total });
}
