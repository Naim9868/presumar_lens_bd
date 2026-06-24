// bKash Tokenized Checkout Integration — Bangladesh
// Docs: https://developer.bka.sh/docs

const BKASH_BASE_URL = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

interface BkashTokenResponse {
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getBkashToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30000) {
    return tokenCache.token;
  }

  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      username: process.env.BKASH_USERNAME!,
      password: process.env.BKASH_PASSWORD!,
    },
    body: JSON.stringify({
      app_key: process.env.BKASH_APP_KEY,
      app_secret: process.env.BKASH_APP_SECRET,
    }),
  });

  const data: BkashTokenResponse = await res.json();

  if (!data.id_token) {
    throw new Error('bKash token grant failed');
  }

  tokenCache = {
    token: data.id_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.id_token;
}

export async function createBkashPayment(params: {
  amount: number;
  orderRef: string;
  callbackURL?: string;
}) {
  const token = await getBkashToken();

  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      authorization: token,
      'x-app-key': process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({
      mode: '0011',
      payerReference: params.orderRef,
      callbackURL:
        params.callbackURL ||
        `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/bkash/callback`,
      amount: params.amount.toFixed(2),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: params.orderRef,
    }),
  });

  return res.json();
}

export async function executeBkashPayment(paymentId: string) {
  const token = await getBkashToken();

  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      authorization: token,
      'x-app-key': process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({ paymentID: paymentId }),
  });

  return res.json();
}

export async function queryBkashPayment(paymentId: string) {
  const token = await getBkashToken();

  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/payment/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      authorization: token,
      'x-app-key': process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({ paymentID: paymentId }),
  });

  return res.json();
}

export async function refundBkashPayment(params: {
  paymentId: string;
  trxId: string;
  amount: number;
  reason: string;
}) {
  const token = await getBkashToken();

  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/payment/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      authorization: token,
      'x-app-key': process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({
      paymentID: params.paymentId,
      trxID: params.trxId,
      amount: params.amount.toFixed(2),
      currency: 'BDT',
      reason: params.reason,
    }),
  });

  return res.json();
}
