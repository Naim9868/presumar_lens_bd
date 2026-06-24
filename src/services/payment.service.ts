import Payment from '@/models/Payment';
import Order from '@/models/Order';
import OrderEvent from '@/models/OrderEvent';
import { connectDB } from '@/lib/dbConnect';

export type PaymentMethod = 'COD' | 'SSL' | 'BKASH' | 'NAGAD';

// ─────────────────────────────────────────────
// SSLCommerz
// ─────────────────────────────────────────────
export async function initiateSSLCommerzPayment(orderId: string, amount: number, orderRef: string) {
  const params = new URLSearchParams({
    store_id: process.env.SSLCOMMERZ_STORE_ID!,
    store_passwd: process.env.SSLCOMMERZ_STORE_PASS!,
    total_amount: amount.toString(),
    currency: 'BDT',
    tran_id: orderRef,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/ssl/success`,
    fail_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/ssl/fail`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/ssl/cancel`,
    ipn_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/ssl/ipn`,
    cus_name: 'Customer',
    cus_email: 'customer@example.com',
    cus_add1: 'Dhaka',
    cus_city: 'Dhaka',
    cus_country: 'Bangladesh',
    cus_phone: '01700000000',
    shipping_method: 'NO',
    product_name: 'Ecommerce Order',
    product_category: 'General',
    product_profile: 'general',
  });

  const isSandbox = process.env.NODE_ENV !== 'production';
  const url = isSandbox
    ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
    : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

  const res = await fetch(url, {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const data = await res.json();

  // Create pending payment record
  await Payment.create({
    orderId,
    method: 'SSL',
    provider: 'SSLCommerz',
    amount,
    currency: 'BDT',
    status: 'PENDING',
    transactionId: orderRef,
  });

  return data; // contains GatewayPageURL
}

export async function verifySSLCommerzPayment(payload: Record<string, string>) {
  await connectDB();

  const { val_id, status, tran_id, amount } = payload;

  if (status !== 'VALID' && status !== 'VALIDATED') {
    return { success: false, message: 'Payment not validated' };
  }

  // Verify with SSLCommerz
  const isSandbox = process.env.NODE_ENV !== 'production';
  const verifyUrl = isSandbox
    ? `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${process.env.SSLCOMMERZ_STORE_ID}&store_passwd=${process.env.SSLCOMMERZ_STORE_PASS}&format=json`
    : `https://securepay.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${process.env.SSLCOMMERZ_STORE_ID}&store_passwd=${process.env.SSLCOMMERZ_STORE_PASS}&format=json`;

  const res = await fetch(verifyUrl);
  const verification = await res.json();

  if (verification.status !== 'VALID') {
    return { success: false, message: 'Verification failed' };
  }

  // Update payment
  await Payment.findOneAndUpdate(
    { transactionId: tran_id },
    { status: 'PAID', paidAt: new Date(), gatewayResponse: verification }
  );

  // Find order by orderId (tran_id is orderId)
  const order = await Order.findOne({ orderId: tran_id });
  if (order) {
    await Order.findByIdAndUpdate(order._id, { status: 'CONFIRMED' });
    await OrderEvent.create({
      orderId: order._id,
      status: 'CONFIRMED',
      source: 'SYSTEM',
      note: `Payment confirmed via SSLCommerz. Val ID: ${val_id}`,
    });
  }

  return { success: true, order };
}

// ─────────────────────────────────────────────
// bKash
// ─────────────────────────────────────────────
async function getBkashToken(): Promise<string> {
  const res = await fetch(`${process.env.BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
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
  const data = await res.json();
  return data.id_token;
}

export async function initiateBkashPayment(orderId: string, amount: number, orderRef: string) {
  await connectDB();
  const token = await getBkashToken();

  const res = await fetch(`${process.env.BKASH_BASE_URL}/tokenized/checkout/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      authorization: token,
      'x-app-key': process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({
      mode: '0011',
      payerReference: orderRef,
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/bkash/callback`,
      amount: amount.toString(),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: orderRef,
    }),
  });

  const data = await res.json();

  await Payment.create({
    orderId,
    method: 'BKASH',
    provider: 'bKash',
    amount,
    currency: 'BDT',
    status: 'PENDING',
    transactionId: data.paymentID,
    gatewayResponse: data,
  });

  return data; // contains bkashURL
}

export async function executeBkashPayment(paymentId: string) {
  const token = await getBkashToken();

  const res = await fetch(`${process.env.BKASH_BASE_URL}/tokenized/checkout/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      authorization: token,
      'x-app-key': process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({ paymentID: paymentId }),
  });

  const data = await res.json();

  if (data.statusCode === '0000') {
    await Payment.findOneAndUpdate(
      { transactionId: paymentId },
      { status: 'PAID', paidAt: new Date(), gatewayResponse: data }
    );
  }

  return data;
}

// ─────────────────────────────────────────────
// Refund
// ─────────────────────────────────────────────
export async function processRefund(orderId: string, amount: number, note?: string) {
  await connectDB();

  const payment = await Payment.findOne({ orderId, status: 'PAID' });
  if (!payment) throw new Error('No paid payment found for this order');

  await Payment.findByIdAndUpdate(payment._id, {
    status: 'REFUNDED',
    refundAmount: amount,
    refundedAt: new Date(),
    refundNote: note,
  });

  await Order.findByIdAndUpdate(orderId, { status: 'REFUNDED' });
  await OrderEvent.create({
    orderId,
    status: 'REFUNDED',
    source: 'ADMIN',
    note: note || `Refund of ৳${amount} processed`,
  });

  return { success: true };
}

export async function getPaymentByOrder(orderId: string) {
  await connectDB();
  return Payment.findOne({ orderId }).lean();
}

export async function getTransactions(filters: {
  status?: string;
  method?: string;
  page?: number;
  limit?: number;
}) {
  await connectDB();
  const { status, method, page = 1, limit = 20 } = filters;
  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (method) query.method = method;

  const [transactions, total] = await Promise.all([
    Payment.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('orderId', 'orderId shipping.name pricing.total').lean(),
    Payment.countDocuments(query),
  ]);

  return { transactions, total };
}
