// // lib/services/notification.service.ts
// import twilio from 'twilio';
// import sgMail from '@sendgrid/mail';
// import Order from '@/models/Order';
// import User from '@/models/User';

// // Initialize services
// const twilioClient = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );
// sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// interface NotificationData {
//   userId?: string;
//   type: string;
//   orderId: string;
//   customMessage?: string;
// }

export const sendNotification = async (type: string, order: any) => {
  console.log(`Notification: ${type} for ${order.orderId}`);

  // integrate SMS / email here later
};

// export async function sendNotification(data: NotificationData) {
//   try {
//     const order = await Order.findById(data.orderId);
//     if (!order) return;
    
//     let user = null;
//     if (data.userId) {
//       user = await User.findById(data.userId);
//     }
    
//     const templates: Record<string, any> = {
//       ORDER_PLACED: {
//         subject: 'Order Confirmation',
//         sms: `Your order ${order.orderId} has been placed successfully. We'll notify you once it's confirmed.`,
//         email: `
//           <h2>Order Confirmation</h2>
//           <p>Dear ${user?.name || 'Customer'},</p>
//           <p>Your order <strong>${order.orderId}</strong> has been placed successfully.</p>
//           <p>Total Amount: ৳${order.pricing.total}</p>
//           <p>We'll notify you once your order is confirmed.</p>
//           <a href="${process.env.NEXT_PUBLIC_URL}/orders/${order._id}">View Order Details</a>
//         `,
//       },
//       ORDER_CONFIRMED: {
//         subject: 'Order Confirmed',
//         sms: `Great news! Your order ${order.orderId} has been confirmed and is being processed.`,
//         email: `
//           <h2>Order Confirmed</h2>
//           <p>Dear ${user?.name || 'Customer'},</p>
//           <p>Your order <strong>${order.orderId}</strong> has been confirmed.</p>
//           <p>We're now processing your order and will notify you when it's shipped.</p>
//           <a href="${process.env.NEXT_PUBLIC_URL}/orders/${order._id}">Track Your Order</a>
//         `,
//       },
//       ORDER_PROCESSING: {
//         subject: 'Order Processing',
//         sms: `Your order ${order.orderId} is now being processed.`,
//         email: `
//           <h2>Order Processing</h2>
//           <p>Dear ${user?.name || 'Customer'},</p>
//           <p>Your order <strong>${order.orderId}</strong> is now being processed.</p>
//           <p>We'll notify you once it's shipped.</p>
//         `,
//       },
//       ORDER_SHIPPED: {
//         subject: 'Order Shipped',
//         sms: `Your order ${order.orderId} has been shipped! Tracking ID: ${order.delivery?.trackingId || 'N/A'}`,
//         email: `
//           <h2>Order Shipped</h2>
//           <p>Dear ${user?.name || 'Customer'},</p>
//           <p>Your order <strong>${order.orderId}</strong> has been shipped!</p>
//           ${order.delivery?.trackingId ? `<p>Tracking ID: <strong>${order.delivery.trackingId}</strong></p>` : ''}
//           <a href="${process.env.NEXT_PUBLIC_URL}/orders/${order._id}/tracking">Track Your Package</a>
//         `,
//       },
//       ORDER_DELIVERED: {
//         subject: 'Order Delivered',
//         sms: `Your order ${order.orderId} has been delivered. Thank you for shopping with us!`,
//         email: `
//           <h2>Order Delivered</h2>
//           <p>Dear ${user?.name || 'Customer'},</p>
//           <p>Your order <strong>${order.orderId}</strong> has been delivered.</p>
//           <p>Thank you for shopping with us! We hope you enjoy your purchase.</p>
//           <a href="${process.env.NEXT_PUBLIC_URL}/orders/${order._id}/invoice">Download Invoice</a>
//         `,
//       },
//       ORDER_CANCELLED: {
//         subject: 'Order Cancelled',
//         sms: `Your order ${order.orderId} has been cancelled.`,
//         email: `
//           <h2>Order Cancelled</h2>
//           <p>Dear ${user?.name || 'Customer'},</p>
//           <p>Your order <strong>${order.orderId}</strong> has been cancelled.</p>
//           ${data.customMessage ? `<p>Reason: ${data.customMessage}</p>` : ''}
//         `,
//       },
//       PAYMENT_SUCCESS: {
//         subject: 'Payment Successful',
//         sms: `Payment of ৳${order.pricing.total} for order ${order.orderId} was successful.`,
//         email: `
//           <h2>Payment Successful</h2>
//           <p>Dear ${user?.name || 'Customer'},</p>
//           <p>Your payment of <strong>৳${order.pricing.total}</strong> for order <strong>${order.orderId}</strong> was successful.</p>
//           <p>Your order is now confirmed and will be processed soon.</p>
//         `,
//       },
//     };
    
//     const template = templates[data.type];
//     if (!template) return;
    
//     // Send SMS
//     if (user?.phone) {
//       try {
//         await twilioClient.messages.create({
//           body: data.customMessage || template.sms,
//           from: process.env.TWILIO_PHONE_NUMBER,
//           to: user.phone,
//         });
//       } catch (error) {
//         console.error('SMS sending failed:', error);
//       }
//     }
    
//     // Send Email
//     if (user?.email) {
//       try {
//         await sgMail.send({
//           to: user.email,
//           from: process.env.EMAIL_FROM!,
//           subject: data.customMessage ? `Order Update: ${order.orderId}` : template.subject,
//           html: data.customMessage || template.email,
//         });
//       } catch (error) {
//         console.error('Email sending failed:', error);
//       }
//     }
//   } catch (error) {
//     console.error('Notification service error:', error);
//   }
// }