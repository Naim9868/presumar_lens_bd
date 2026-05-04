// lib/services/payment.service.ts
import SSLCommerz from 'sslcommerz-lts';

const sslcz = new SSLCommerz(
  process.env.SSL_STORE_ID!,
  process.env.SSL_STORE_PASSWORD!,
  process.env.SSL_IS_LIVE === 'true'
);

export class PaymentService {
  static async initSSLCommerzPayment(order: any, user: any) {
    const transactionId = `TX_${Date.now()}_${order._id}`;
    
    const paymentData = {
      total_amount: order.pricing.total,
      currency: 'BDT',
      tran_id: transactionId,
      success_url: `${process.env.NEXT_PUBLIC_URL}/api/payments/sslcommerz/success`,
      fail_url: `${process.env.NEXT_PUBLIC_URL}/api/payments/sslcommerz/fail`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/api/payments/sslcommerz/cancel`,
      ipn_url: `${process.env.NEXT_PUBLIC_URL}/api/payments/webhook`,
      shipping_method: 'Courier',
      product_name: 'Order Products',
      product_category: 'General',
      product_profile: 'general',
      cus_name: user.name,
      cus_email: user.email,
      cus_phone: user.phone,
      cus_add1: user.address,
      cus_city: user.city,
      cus_country: 'Bangladesh',
      multi_card_name: 'mastercard,visacard,amexcard',
      value_a: order._id.toString(),
      value_b: order.orderId,
    };

    const response = await sslcz.init(paymentData);
    return response.GatewayPageURL;
  }

  static async handlePaymentSuccess(transactionId: string) {
    const response = await sslcz.validate({ val_id: transactionId });
    
    if (response.status === 'VALID') {
      const orderId = response.value_a;
      await Order.findByIdAndUpdate(orderId, {
        'payment.status': 'PAID',
        'payment.transactionId': transactionId,
      });
      
      return { success: true, orderId };
    }
    
    return { success: false };
  }
}