// lib/services/courier.service.ts
import axios from 'axios';

interface CourierOrder {
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  parcel_value: number;
  weight: number;
}

class PathaoCourier {
  private accessToken: string | null = null;
  
  async authenticate() {
    const response = await axios.post('https://api-hermes.pathao.com/aladdin/api/v1/issue-token', {
      client_id: process.env.PATHAO_CLIENT_ID,
      client_secret: process.env.PATHAO_CLIENT_SECRET,
      username: process.env.PATHAO_USERNAME,
      password: process.env.PATHAO_PASSWORD,
    });
    
    this.accessToken = response.data.access_token;
    return this.accessToken;
  }
  
  async createOrder(orderData: CourierOrder, storeId: number) {
    if (!this.accessToken) await this.authenticate();
    
    const response = await axios.post(
      `https://api-hermes.pathao.com/aladdin/api/v1/orders`,
      {
        store_id: storeId,
        ...orderData,
        delivery_type: 48, // Standard delivery
        item_quantity: 1,
      },
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    );
    
    return response.data;
  }
  
  async trackOrder(orderId: string) {
    if (!this.accessToken) await this.authenticate();
    
    const response = await axios.get(
      `https://api-hermes.pathao.com/aladdin/api/v1/orders/${orderId}`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    );
    
    return response.data;
  }
}

class RedxCourier {
  async createOrder(orderData: CourierOrder) {
    const response = await axios.post(
      'https://openapi.redx.com.bd/v1.0/orders',
      {
        pickup_address: process.env.REDX_PICKUP_ADDRESS,
        pickup_phone: process.env.REDX_PICKUP_PHONE,
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
    
    return response.data;
  }
}

export const courierService = {
  pathao: new PathaoCourier(),
  redx: new RedxCourier(),
};