// SteadFast Courier Integration — Bangladesh
// Docs: https://portal.steadfast.com.bd/public/api/v1

const STEADFAST_API = 'https://portal.steadfast.com.bd/public/api/v1';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Api-Key': process.env.STEADFAST_API_KEY!,
    'Secret-Key': process.env.STEADFAST_SECRET_KEY!,
  };
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
  const res = await fetch(`${STEADFAST_API}/create_order`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`SteadFast API error: ${error}`);
  }

  return res.json();
}

export async function trackSteadFastOrder(trackingCode: string) {
  const res = await fetch(`${STEADFAST_API}/status_by_trackingid/${trackingCode}`, {
    headers: getHeaders(),
  });
  return res.json();
}

export async function trackSteadFastByInvoice(invoice: string) {
  const res = await fetch(`${STEADFAST_API}/status_by_invoice/${invoice}`, {
    headers: getHeaders(),
  });
  return res.json();
}

export async function getSteadFastBalance() {
  const res = await fetch(`${STEADFAST_API}/get_balance`, {
    headers: getHeaders(),
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
