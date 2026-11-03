// SteadFast Courier Integration — Bangladesh
// Docs: https://portal.packzy.com/api/v1
import { getCourierSettings } from '@/services/courier-config.service';

const STEADFAST_API = process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1';

async function getHeaders() {
  const settings = await getCourierSettings();
  return {
    'Content-Type': 'application/json',
    'Api-Key': settings.steadfastApiKey,
    'Secret-Key': settings.steadfastSecretKey,
  };
}

async function steadfastFetch(path: string, init?: RequestInit) {
  try {
    return await fetch(`${STEADFAST_API}${path}`, init);
  } catch (err) {
    const cause = (err as Error & { cause?: { code?: string; message?: string } }).cause;
    const detail = cause?.code || cause?.message || (err as Error).message;
    throw new Error(`SteadFast API unreachable at ${STEADFAST_API} (${detail})`);
  }
}

export interface SteadFastOrderInput {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

export interface SteadFastOrderResponse {
  status: number;
  message: string;
  consignment: {
    consignment_id: number;
    tracking_code: string;
    invoice: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: number;
    status: string;
    created_at: string;
  };
}

export async function bookSteadFastOrder(data: SteadFastOrderInput): Promise<SteadFastOrderResponse> {
  const res = await steadfastFetch('/create_order', {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`SteadFast API error: ${error}`);
  }

  return res.json();
}

export async function trackSteadFastOrder(trackingCode: string) {
  const res = await steadfastFetch(`/status_by_trackingid/${trackingCode}`, {
    headers: await getHeaders(),
  });
  return res.json();
}

export async function trackSteadFastByInvoice(invoice: string) {
  const res = await steadfastFetch(`/status_by_invoice/${invoice}`, {
    headers: await getHeaders(),
  });
  return res.json();
}

export async function getSteadFastBalance() {
  const res = await steadfastFetch('/get_balance', {
    headers: await getHeaders(),
  });
  return res.json();
}

// Bulk order status check
export async function bulkTrackSteadFast(trackingCodes: string[]) {
  const results = await Promise.allSettled(
    trackingCodes.map((code) => trackSteadFastOrder(code))
  );
  return results.map((r, i) => ({
    trackingCode: trackingCodes[i],
    data: r.status === 'fulfilled' ? r.value : null,
    error: r.status === 'rejected' ? r.reason : null,
  }));
}
