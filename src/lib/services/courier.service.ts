// lib/services/courier.service.ts

import axios from 'axios';

const api = axios.create({
  timeout: 10000, // ✅ prevent hanging
});

interface CourierOrder {
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  parcel_value: number;
  weight: number;
}

/* ===============================
   🚚 PATHAO
=============================== */
class PathaoCourier {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async authenticate() {
    const res = await api.post(
      'https://api-hermes.pathao.com/aladdin/api/v1/issue-token',
      {
        client_id: process.env.PATHAO_CLIENT_ID,
        client_secret: process.env.PATHAO_CLIENT_SECRET,
        username: process.env.PATHAO_USERNAME,
        password: process.env.PATHAO_PASSWORD,
      }
    );

    this.accessToken = res.data.access_token;
    this.tokenExpiry = Date.now() + 50 * 60 * 1000; // ~50 min

    return this.accessToken;
  }

  private async getToken() {
    if (!this.accessToken || Date.now() > this.tokenExpiry) {
      await this.authenticate();
    }
    return this.accessToken;
  }

  async createOrder(orderData: CourierOrder, storeId: number) {
    const token = await this.getToken();

    const res = await api.post(
      `https://api-hermes.pathao.com/aladdin/api/v1/orders`,
      {
        store_id: storeId,
        ...orderData,
        delivery_type: 48,
        item_quantity: 1,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return res.data;
  }

  async trackOrder(orderId: string) {
    try {
      const token = await this.getToken();

      const res = await api.get(
        `https://api-hermes.pathao.com/aladdin/api/v1/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return res.data;
    } catch (err: any) {
      // 🔁 retry once if unauthorized
      if (err.response?.status === 401) {
        await this.authenticate();

        const res = await api.get(
          `https://api-hermes.pathao.com/aladdin/api/v1/orders/${orderId}`,
          {
            headers: { Authorization: `Bearer ${this.accessToken}` },
          }
        );

        return res.data;
      }

      throw err;
    }
  }
}

/* ===============================
   🚚 REDX
=============================== */

class RedxCourier {
  private baseURL = 'https://openapi.redx.com.bd/v1.0';

  async createOrder(orderData: CourierOrder) {
    try {
      // ✅ Validate env
      if (!process.env.REDX_API_KEY) {
        throw new Error('REDX_API_KEY is missing');
      }

      const res = await api.post(
        `${this.baseURL}/orders`,
        {
          pickup_address: process.env.REDX_PICKUP_ADDRESS,
          pickup_phone: process.env.REDX_PICKUP_PHONE,

          // ✅ FIXED template string
          merchant_order_id: `ORD_${Date.now()}`,

          customer_name: orderData.recipient_name,
          customer_phone: orderData.recipient_phone,
          customer_address: orderData.recipient_address,

          cod_amount: orderData.cod_amount,
          product_price: orderData.parcel_value,
          product_weight: orderData.weight,
        },
        {
          headers: {
            'API-Key': process.env.REDX_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      return res.data;

    } catch (err: any) {
      console.error('RedX create order error:', err?.response?.data || err.message);

      throw new Error(
        err?.response?.data?.message || 'Failed to create RedX order'
      );
    }
  }

  async trackOrder(trackingId: string) {
    try {
      const res = await api.get(
        `${this.baseURL}/parcel/${trackingId}`,
        {
          headers: {
            'API-Key': process.env.REDX_API_KEY!,
          },
        }
      );

      return res.data;
    } catch (err: any) {
      console.error('RedX tracking error:', err?.response?.data || err.message);
      return null;
    }
  }
}
/* ===============================
   EXPORT
=============================== */
export const courierService = {
  pathao: new PathaoCourier(),
  redx: new RedxCourier(),
};