// Pathao Courier Integration — Bangladesh
// Docs: https://merchant.pathao.com/aladdin/api/v1

const PATHAO_API = process.env.NODE_ENV === 'production'
  ? 'https://merchant.pathao.com/aladdin/api/v1'
  : 'https://merchant.pathao.com/aladdin/api/v1'; // sandbox same for now

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getPathaoToken(): Promise<string> {
  // Return cached token if still valid (buffer 60s)
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
    return tokenCache.token;
  }

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

  if (!data.access_token) {
    throw new Error(`Pathao auth failed: ${JSON.stringify(data)}`);
  }

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };

  return data.access_token;
}

function getAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export interface PathaoOrderInput {
  store_id: number;
  merchant_order_id: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city: number;
  recipient_zone: number;
  recipient_area?: number;
  delivery_type: number; // 48 = normal, 12 = express
  item_type: number;     // 2 = parcel
  item_quantity: number;
  amount_to_collect: number;
  item_weight: number;   // in KG
  item_description?: string;
  special_instruction?: string;
}

export async function bookPathaoOrder(data: PathaoOrderInput) {
  const token = await getPathaoToken();

  const res = await fetch(`${PATHAO_API}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function getPathaoCities() {
  const token = await getPathaoToken();
  const res = await fetch(`${PATHAO_API}/city-list`, {
    headers: getAuthHeaders(token),
  });
  return res.json();
}

export async function getPathaoZones(cityId: number) {
  const token = await getPathaoToken();
  const res = await fetch(`${PATHAO_API}/zone-list/${cityId}`, {
    headers: getAuthHeaders(token),
  });
  return res.json();
}

export async function getPathaoAreas(zoneId: number) {
  const token = await getPathaoToken();
  const res = await fetch(`${PATHAO_API}/area-list/${zoneId}`, {
    headers: getAuthHeaders(token),
  });
  return res.json();
}

export async function getPathaoStores() {
  const token = await getPathaoToken();
  const res = await fetch(`${PATHAO_API}/stores`, {
    headers: getAuthHeaders(token),
  });
  return res.json();
}

export async function getPathaoOrderDetails(consignmentId: string) {
  const token = await getPathaoToken();
  const res = await fetch(`${PATHAO_API}/orders/${consignmentId}/info`, {
    headers: getAuthHeaders(token),
  });
  return res.json();
}

export async function calculatePathaoPrice(data: {
  store_id: number;
  item_type: number;
  delivery_type: number;
  item_weight: number;
  recipient_city: number;
  recipient_zone: number;
}) {
  const token = await getPathaoToken();
  const res = await fetch(`${PATHAO_API}/merchant/price-plan`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return res.json();
}
