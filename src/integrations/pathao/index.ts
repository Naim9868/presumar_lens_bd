// src/integrations/pathao/index.ts

const PATHAO_API = 'https://merchant.pathao.com/aladdin/api/v1';

async function getPathaoToken(): Promise<string> {
  const res = await fetch(`${PATHAO_API}/issue-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PATHAO_CLIENT_ID,
      client_secret: process.env.PATHAO_CLIENT_SECRET,
      username: process.env.PATHAO_USERNAME,
      password: process.env.PATHAO_PASSWORD,
      grant_type: 'password',
    }),
  });
  const data = await res.json();
  return data.access_token;
}

export async function bookPathaoOrder(orderData: {
  store_id: number;
  merchant_order_id: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city: number;
  recipient_zone: number;
  delivery_type: number;    // 48 = normal, 12 = express
  item_type: number;        // 2 = parcel
  item_quantity: number;
  amount_to_collect: number;
  item_weight: number;
}) {
  const token = await getPathaoToken();

  const res = await fetch(`${PATHAO_API}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  return res.json();
}