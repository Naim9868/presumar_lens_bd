'use client';

import { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Printer, 
  Download, 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

interface OrderInvoiceProps {
  order: {
    _id: string;
    orderId: string;
    status: string;
    createdAt: string;
    items: Array<{
      snapshot: { name: string; image?: string };
      price: { original: number; sale: number };
      quantity: number;
      total: number;
    }>;
    pricing: {
      subtotal: number;
      couponDiscount: number;
      deliveryCharge: number;
      total: number;
      currency: string;
    };
    shipping: {
      name: string;
      phone: string;
      email?: string;
      address: string;
      area: string;
      city: string;
      postcode?: string;
      division?: string;
    };
    paymentMethod: string;
    paymentStatus: string;
  };
  onPrint: () => void;
  onDownloadPDF: () => void;
  onContinue: () => void;
  isModal?: boolean;
}

export default function OrderInvoice({ 
  order, 
  onPrint, 
  onDownloadPDF, 
  onContinue,
  isModal = false 
}: OrderInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      AWAITING_PAYMENT: 'bg-orange-100 text-orange-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-indigo-100 text-indigo-800',
      PACKED: 'bg-purple-100 text-purple-800',
      READY_TO_SHIP: 'bg-cyan-100 text-cyan-800',
      SHIPPED: 'bg-emerald-100 text-emerald-800',
      IN_TRANSIT: 'bg-teal-100 text-teal-800',
      OUT_FOR_DELIVERY: 'bg-green-100 text-green-800',
      DELIVERED: 'bg-green-500 text-white',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
      {status.replace('_', ' ')}
    </Badge>;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-600">Order Placed Successfully!</h2>
        <p className="text-muted-foreground">
          Thank you for your order. We'll notify you when it's on the way.
        </p>
      </div>

      {/* Invoice */}
      <div ref={invoiceRef} className="bg-white rounded-lg shadow-lg overflow-hidden border">
        {/* Invoice Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold">Invoice</h3>
              <p className="text-muted-foreground">
                Order #{order.orderId}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(order.status)}
              <Badge variant="outline" className="capitalize">
                {order.paymentMethod}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Order Date</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Payment Method</p>
              <p className="font-medium flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Payment Status</p>
              <Badge 
                className={cn(
                  order.paymentStatus === 'PAID' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-yellow-500 text-white'
                )}
              >
                {order.paymentStatus}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="font-bold text-lg text-primary">
                {formatCurrency(order.pricing.total)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Customer & Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Customer Information
              </h4>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.shipping.name}</p>
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {order.shipping.phone}
                </p>
                {order.shipping.email && (
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {order.shipping.email}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Delivery Address
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{order.shipping.address}</p>
                <p>{order.shipping.area}, {order.shipping.city}</p>
                {order.shipping.division && <p>{order.shipping.division}</p>}
                {order.shipping.postcode && <p>Postal: {order.shipping.postcode}</p>}
              </div>
            </div>
          </div>

          <Separator />

          {/* Items Table */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-primary" />
              Order Items
            </h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-semibold">Item</th>
                    <th className="text-center p-3 font-semibold">Quantity</th>
                    <th className="text-right p-3 font-semibold">Price</th>
                    <th className="text-right p-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            {item.snapshot.image ? (
                              <img 
                                src={item.snapshot.image} 
                                alt={item.snapshot.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <span>{item.snapshot.name}</span>
                        </div>
                      </td>
                      <td className="text-center p-3">{item.quantity}</td>
                      <td className="text-right p-3">
                        {formatCurrency(item.price.sale)}
                      </td>
                      <td className="text-right p-3 font-medium">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={2} className="p-3"></td>
                    <td className="p-3 text-right font-medium">Subtotal</td>
                    <td className="p-3 text-right">{formatCurrency(order.pricing.subtotal)}</td>
                  </tr>
                  {order.pricing.couponDiscount > 0 && (
                    <tr>
                      <td colSpan={2} className="p-3"></td>
                      <td className="p-3 text-right font-medium text-green-600">
                        Discount
                      </td>
                      <td className="p-3 text-right text-green-600">
                        -{formatCurrency(order.pricing.couponDiscount)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={2} className="p-3"></td>
                    <td className="p-3 text-right font-medium">Delivery</td>
                    <td className="p-3 text-right">
                      {formatCurrency(order.pricing.deliveryCharge)}
                    </td>
                  </tr>
                  <tr className="border-t-2">
                    <td colSpan={2} className="p-3"></td>
                    <td className="p-3 text-right font-bold text-lg">Total</td>
                    <td className="p-3 text-right font-bold text-lg text-primary">
                      {formatCurrency(order.pricing.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button variant="outline" onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Invoice
        </Button>
        <Button variant="outline" onClick={onDownloadPDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        <Button onClick={onContinue}>
          {isModal ? 'Continue Shopping' : 'View Order Details'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}