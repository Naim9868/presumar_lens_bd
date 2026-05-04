'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  User,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Printer,
  Mail,
  Globe,
  ShoppingBag,
  Tag,
  DollarSign,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// Interface matching your Order schema
interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Pricing {
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
}

interface TimelineEvent {
  status: string;
  note?: string;
  createdAt: string;
}

interface Payment {
  method: 'COD' | 'ONLINE';
  status: 'PAID' | 'UNPAID' | 'FAILED';
  transactionId?: string;
}

interface Shipping {
  name: string;
  phone: string;
  address: string;
  area: string;
  city: string;
}

interface Delivery {
  type: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';
  courier?: string;
  trackingId?: string;
}

interface Order {
  _id: string;
  orderId: string;
  userId?: string;
  items: OrderItem[];
  pricing: Pricing;
  status: string;
  customStatus?: string;
  timeline: TimelineEvent[];
  payment: Payment;
  shipping: Shipping;
  delivery: Delivery;
  isCancelled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrderDetailClientProps {
  order: Order;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PROCESSING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  SHIPPED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusIcons: Record<string, any> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle,
  PROCESSING: Clock,
  SHIPPED: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
};

const statusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function OrderDetailClient({ order: initialOrder }: OrderDetailClientProps) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState(initialOrder);
  const [localStatus, setLocalStatus] = useState(initialOrder.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const StatusIcon = statusIcons[order.status] || Clock;
  const statusColor = statusColors[order.status] || statusColors.PENDING;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    const originalStatus = localStatus;
    setLocalStatus(newStatus);
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: order.orderId,
          status: newStatus,
          note: `Order status updated to ${newStatus}`
        }),
      });

      if (!response.ok) {
        setLocalStatus(originalStatus);
        throw new Error('Failed to update');
      }

      const result = await response.json();
      
      if (result.success) {
        setOrder(prev => ({
          ...prev,
          status: newStatus,
          timeline: [...prev.timeline, {
            status: newStatus,
            note: `Order status updated to ${newStatus}`,
            createdAt: new Date().toISOString(),
          }]
        }));
        
        toast.success(`Order status updated to ${newStatus}`);
        
        // Dispatch event for any other components listening
        window.dispatchEvent(new CustomEvent('orderUpdated', { 
          detail: { orderId: order._id, newStatus } 
        }));
      } else {
        setLocalStatus(originalStatus);
        toast.error(result.error || 'Failed to update order status');
      }
    } catch (error) {
      setLocalStatus(originalStatus);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }

    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    let stylesHtml = '';
    styles.forEach((style) => {
      stylesHtml += style.outerHTML;
    });

    const subtotal = order.pricing.subtotal;
    const deliveryCharge = order.pricing.deliveryCharge;
    const discount = order.pricing.discount;
    const total = order.pricing.total;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${order.orderId}</title>
          ${stylesHtml}
          <style>
            @media print {
              @page { size: A4; margin: 0.5in; }
              body { background: white; font-family: system-ui, sans-serif; }
              .no-print { display: none !important; }
              .shadow-lg { box-shadow: none !important; }
            }
            body { font-family: system-ui, -apple-system, sans-serif; }
            .invoice-container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .mb-4 { margin-bottom: 16px; }
            .mb-6 { margin-bottom: 24px; }
            .border { border: 1px solid #e5e7eb; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .rounded-lg { border-radius: 8px; }
            .p-4 { padding: 16px; }
            .p-3 { padding: 12px; }
            .bg-gray-50 { background-color: #f9fafb; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-500 { color: #6b7280; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background-color: #f9fafb; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="text-center mb-6">
              <h1 class="text-3xl font-bold" style="margin-bottom: 8px;">INVOICE</h1>
              <p class="text-gray-600">Order #${order.orderId}</p>
              <p class="text-gray-600">Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
            </div>

            <div class="text-center mb-6">
              <p class="font-semibold">Your Store Name</p>
              <p class="text-gray-600">support@yourstore.com | ${order.shipping.phone}</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
              <div class="border rounded-lg p-4">
                <h3 class="font-semibold mb-2" style="border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Bill To:</h3>
                <p class="font-medium">${order.shipping.name}</p>
                <p>📞 ${order.shipping.phone}</p>
                <p class="mt-2">📍 ${order.shipping.address}</p>
                <p>${order.shipping.area}, ${order.shipping.city}</p>
              </div>

              <div class="border rounded-lg p-4">
                <h3 class="font-semibold mb-2" style="border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Invoice Details:</h3>
                <p>Order ID: ${order.orderId}</p>
                <p>Payment: ${order.payment.method}</p>
                <p>Status: ${order.status}</p>
                <p>Delivery: ${order.delivery.type === 'INSIDE_DHAKA' ? 'Inside Dhaka' : 'Outside Dhaka'}</p>
              </div>
            </div>

            <div class="border rounded-lg mb-6">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(item => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.sku || 'N/A'}</td>
                      <td>${formatPrice(item.price)}</td>
                      <td>${item.quantity}</td>
                      <td>${formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
              <div style="width: 256px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Subtotal:</span>
                  <span>${formatPrice(subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Delivery Fee:</span>
                  <span>${formatPrice(deliveryCharge)}</span>
                </div>
                ${discount > 0 ? `
                  <div style="display: flex; justify-content: space-between; color: #16a34a;">
                    <span>Discount:</span>
                    <span>-${formatPrice(discount)}</span>
                  </div>
                ` : ''}
                <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
                  <div style="display: flex; justify-content: space-between; font-weight: bold;">
                    <span>Total:</span>
                    <span>${formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="text-center text-gray-500 mt-6 pt-4" style="border-top: 1px solid #e5e7eb;">
              <p>Thank you for your business!</p>
            </div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // Don't render until after hydration
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
        >
          <ArrowLeft size={20} />
          Back to Orders
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => router.refresh()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition"
          >
            <Printer size={18} />
            Print Invoice
          </button>
        </div>
      </div>

      {/* Order Detail */}
      <div ref={printRef} className="space-y-6">
        {/* Status Banner */}
        <div className={`p-6 rounded-2xl ${statusColor}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <StatusIcon size={32} />
              <div>
                <h2 className="text-xl font-bold">Order #{order.orderId}</h2>
                <p className="text-sm opacity-75">
                  Status: {order.status} • Last updated: {formatDate(order.updatedAt)}
                </p>
                {order.customStatus && (
                  <p className="text-sm mt-1 font-medium">Custom Status: {order.customStatus}</p>
                )}
              </div>
            </div>

            <select
              value={localStatus}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              disabled={isUpdating}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-50"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Items & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package size={20} className="text-amber-600" />
                  Order Items ({order.items.length})
                </h3>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {order.items.map((item, index) => (
                  <div key={index} className="p-4 flex gap-4">
                    {item.image && (
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        SKU: {item.sku || 'N/A'}
                        {item.variantId && <span className="ml-2">Variant: {item.variantId}</span>}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatPrice(item.price)} × {item.quantity}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Summary */}
              <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.pricing.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Delivery Charge</span>
                    <span>{formatPrice(order.pricing.deliveryCharge)}</span>
                  </div>
                  {order.pricing.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(order.pricing.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total</span>
                    <span className="text-amber-600">{formatPrice(order.pricing.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-amber-600" />
                Order Timeline
              </h3>

              <div className="space-y-4">
                {order.timeline.map((event, index) => {
                  const EventIcon = statusIcons[event.status] || Clock;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <EventIcon size={14} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">
                          {event.status.toLowerCase()}
                        </p>
                        {event.note && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {event.note}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDate(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User size={20} className="text-amber-600" />
                Customer Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 flex items-center justify-center text-white font-semibold text-lg">
                    {order.shipping.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-lg text-gray-900 dark:text-white">
                      {order.shipping.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone size={16} className="text-amber-600" />
                    <span>{order.shipping.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-amber-600" />
                Shipping Address
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Globe size={16} className="text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.shipping.city}
                    </p>
                  </div>
                </div>
                <div className="pl-6">
                  <p className="text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-gray-700 dark:text-gray-300">
                    {order.shipping.address}, {order.shipping.area}, {order.shipping.city}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Delivery Type</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-0.5 flex items-center gap-2">
                    <Truck size={14} />
                    {order.delivery.type === 'INSIDE_DHAKA' ? 'Inside Dhaka' : 'Outside Dhaka'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-amber-600" />
                Payment Information
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Method</p>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2 mt-0.5">
                    <CreditCard size={14} />
                    {order.payment.method}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${
                    order.payment.status === 'PAID' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : order.payment.status === 'FAILED'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {order.payment.status}
                  </span>
                </div>
                {order.payment.transactionId && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Transaction ID</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white mt-0.5 break-all">
                      {order.payment.transactionId}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Courier Tracking */}
            {order.delivery.trackingId && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Truck size={20} className="text-amber-600" />
                  Tracking Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Courier</p>
                    <p className="font-medium text-gray-900 dark:text-white mt-0.5">{order.delivery.courier || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tracking ID</p>
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg block mt-1 break-all">
                      {order.delivery.trackingId}
                    </code>
                  </div>
                  {order.delivery.courier && (
                    <button
                      onClick={() => window.open(`https://${order.delivery.courier?.toLowerCase()}.com/tracking/${order.delivery.trackingId}`, '_blank')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Track Order
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}