import { v4 as uuidv4 } from 'uuid';
import MarketingEvent from '@/models/MarketingEvent';
import Attribution from '@/models/Attribution';
import { connectDB } from '@/lib/dbConnect';
import { sendToMetaConversionsAPI } from '@/integrations/meta';
import { sendToTikTokEventsAPI } from '@/integrations/tiktok';
import { sendToGA4 } from '@/integrations/google';

export interface TrackPayload {
  name: string;
  userId?: string;
  sessionId: string;
  value?: number;
  productId?: string;
  orderId?: string;
  utm?: Record<string, string>;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
  page?: string;
  source?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(payload: TrackPayload): Promise<string> {
  await connectDB();

  const eventId = uuidv4();

  // Derive source from utm or click ids
  const source = payload.utm?.utm_source || payload.utm?.source
    || (payload.fbclid ? 'facebook' : null)
    || (payload.gclid ? 'google' : null)
    || (payload.ttclid ? 'tiktok' : null)
    || payload.source
    || 'direct';

  await MarketingEvent.create({
    eventId,
    name: payload.name,
    userId: payload.userId,
    sessionId: payload.sessionId,
    value: payload.value,
    productId: payload.productId,
    orderId: payload.orderId,
    utm: payload.utm,
    fbclid: payload.fbclid,
    gclid: payload.gclid,
    ttclid: payload.ttclid,
    page: payload.page,
    source,
    ip: payload.ip,
    userAgent: payload.userAgent,
    currency: 'BDT',
    metadata: payload.metadata,
  });

  // Server-side forwarding for purchase events
  if (payload.name === 'purchase' && payload.orderId) {
    const eventData = { eventId, ...payload, source };

    // Fire all platform APIs in parallel, non-blocking
    Promise.allSettled([
      sendToMetaConversionsAPI(eventData),
      sendToTikTokEventsAPI(eventData),
      sendToGA4(eventData),
    ]).catch(console.error);

    // Save attribution
    await saveAttribution(payload).catch(console.error);
  }

  return eventId;
}

async function saveAttribution(payload: TrackPayload) {
  if (!payload.orderId) return;

  const source = payload.utm?.utm_source || payload.utm?.source
    || (payload.fbclid ? 'facebook' : null)
    || (payload.gclid ? 'google' : null)
    || (payload.ttclid ? 'tiktok' : null)
    || 'direct';

  const touch = {
    source,
    medium: payload.utm?.utm_medium || payload.utm?.medium,
    campaign: payload.utm?.utm_campaign || payload.utm?.campaign,
    at: new Date(),
  };

  await Attribution.create({
    orderId: payload.orderId,
    userId: payload.userId,
    firstTouch: touch,
    lastTouch: touch,
    touchpoints: [touch],
    conversionValue: payload.value || 0,
  });
}

export async function getEventStats(filters: {
  startDate?: string;
  endDate?: string;
  name?: string;
}) {
  await connectDB();

  const match: Record<string, unknown> = {};
  if (filters.name) match.name = filters.name;
  if (filters.startDate || filters.endDate) {
    match.createdAt = {};
    if (filters.startDate) (match.createdAt as Record<string, unknown>).$gte = new Date(filters.startDate);
    if (filters.endDate) (match.createdAt as Record<string, unknown>).$lte = new Date(filters.endDate);
  }

  return MarketingEvent.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$name',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
      },
    },
    { $sort: { count: -1 } },
  ]);
}

export async function getChannelStats(filters: { startDate?: string; endDate?: string }) {
  await connectDB();

  const match: Record<string, unknown> = { name: 'purchase' };
  if (filters.startDate || filters.endDate) {
    match.createdAt = {};
    if (filters.startDate) (match.createdAt as Record<string, unknown>).$gte = new Date(filters.startDate);
    if (filters.endDate) (match.createdAt as Record<string, unknown>).$lte = new Date(filters.endDate);
  }

  return MarketingEvent.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$source',
        orders: { $sum: 1 },
        revenue: { $sum: '$value' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);
}
