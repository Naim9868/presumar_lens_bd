// RedX Courier Integration — Bangladesh
// Docs: https://openapi.redx.com.bd
import { getCourierSettings } from '@/services/courier-config.service';

const REDX_API = 'https://openapi.redx.com.bd/v1.0.0-beta';

async function getHeaders() {
  const settings = await getCourierSettings();
  return {
    'Content-Type': 'application/json',
    'ACCESS-TOKEN': settings.redxAccessToken,
  };
}

export interface RedXOrderInput {
  customer_name: string;
  customer_phone: string;
  delivery_area: string;
  delivery_area_id: number;
  merchant_invoice_id: string;
  cash_collection_amount: number;
  parcel_details_amount: number;
  pickup_store_id: number;
  parcel_weight: number; // in grams
  instruction?: string;
}

export async function bookRedXOrder(data: RedXOrderInput) {
  const res = await fetch(`${REDX_API}/parcel`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`RedX API error: ${error}`);
  }

  return res.json();
}

export async function trackRedXOrder(trackingId: string) {
  const res = await fetch(`${REDX_API}/parcel/info/${trackingId}`, {
    headers: await getHeaders(),
  });
  return res.json();
}

export async function getRedXAreas(district: string) {
  const res = await fetch(`${REDX_API}/area?district=${encodeURIComponent(district)}`, {
    headers: await getHeaders(),
  });
  return res.json();
}

export async function cancelRedXOrder(trackingId: string) {
  const res = await fetch(`${REDX_API}/parcel/cancel/${trackingId}`, {
    method: 'POST',
    headers: await getHeaders(),
  });
  return res.json();
}
