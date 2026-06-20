// src/integrations/steadfast/index.ts

const STEADFAST_API = 'https://portal.steadfast.com.bd/public/api/v1';

interface SteadFastOrderInput {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

export async function bookSteadFastOrder(data: SteadFastOrderInput) {
  const response = await fetch(`${STEADFAST_API}/create_order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': process.env.STEADFAST_API_KEY!,
      'Secret-Key': process.env.STEADFAST_SECRET_KEY!,
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function trackSteadFastOrder(trackingId: string) {
  const response = await fetch(`${STEADFAST_API}/status_by_trackingid/${trackingId}`, {
    headers: {
      'Api-Key': process.env.STEADFAST_API_KEY!,
      'Secret-Key': process.env.STEADFAST_SECRET_KEY!,
    },
  });
  return response.json();
}