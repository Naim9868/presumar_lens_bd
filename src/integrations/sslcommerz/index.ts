// SSLCommerz Payment Integration — Bangladesh
// Docs: https://developer.sslcommerz.com/doc/v4

const isSandbox = process.env.NODE_ENV !== 'production';

const SSLCOMMERZ_INIT_URL = isSandbox
  ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
  : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

const SSLCOMMERZ_VALIDATE_URL = isSandbox
  ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
  : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php';

export interface SSLCommerzInitInput {
  tran_id: string;        // unique transaction ID (use orderId)
  total_amount: number;
  cus_name: string;
  cus_email: string;
  cus_phone: string;
  cus_add1?: string;
  cus_city?: string;
  product_name?: string;
  success_url?: string;
  fail_url?: string;
  cancel_url?: string;
  ipn_url?: string;
}

export async function initiateSSLCommerz(input: SSLCommerzInitInput) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const params = new URLSearchParams({
    store_id: process.env.SSLCOMMERZ_STORE_ID!,
    store_passwd: process.env.SSLCOMMERZ_STORE_PASS!,
    total_amount: input.total_amount.toString(),
    currency: 'BDT',
    tran_id: input.tran_id,
    success_url: input.success_url || `${appUrl}/api/payments/ssl/success`,
    fail_url: input.fail_url || `${appUrl}/api/payments/ssl/fail`,
    cancel_url: input.cancel_url || `${appUrl}/api/payments/ssl/cancel`,
    ipn_url: input.ipn_url || `${appUrl}/api/payments/ssl/ipn`,
    cus_name: input.cus_name,
    cus_email: input.cus_email || 'customer@example.com',
    cus_add1: input.cus_add1 || 'Dhaka',
    cus_city: input.cus_city || 'Dhaka',
    cus_country: 'Bangladesh',
    cus_phone: input.cus_phone,
    shipping_method: 'NO',
    product_name: input.product_name || 'Ecommerce Order',
    product_category: 'General',
    product_profile: 'general',
  });

  const res = await fetch(SSLCOMMERZ_INIT_URL, {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const data = await res.json();

  if (data.status !== 'SUCCESS') {
    throw new Error(`SSLCommerz init failed: ${data.failedreason}`);
  }

  return data; // data.GatewayPageURL is the redirect URL
}

export async function validateSSLCommerz(valId: string) {
  const url = `${SSLCOMMERZ_VALIDATE_URL}?val_id=${valId}&store_id=${process.env.SSLCOMMERZ_STORE_ID}&store_passwd=${process.env.SSLCOMMERZ_STORE_PASS}&format=json`;

  const res = await fetch(url);
  const data = await res.json();

  return data; // data.status === 'VALID' means success
}

export function verifySSLCommerzIPN(payload: Record<string, string>): boolean {
  // Basic IPN verification — in production also verify IP from SSLCommerz
  return payload.status === 'VALID' || payload.status === 'VALIDATED';
}
