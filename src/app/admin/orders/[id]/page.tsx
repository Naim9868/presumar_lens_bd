// import { notFound } from 'next/navigation';
// import OrderDetailClient from './OrderDetailClient';
// import { getOrderById } from '@/app/actions/order.actions';

// interface PageProps {
//   params: Promise<{ id: string }> | { id: string };
// }

// // This is a Server Component
// export default async function OrderDetailPage({ params }: PageProps) {
//   // Handle both sync and async params (Next.js 15 compatibility)
//   const { id } = await params;
  
//   const result = await getOrderById(id);

//   if (!result.success || !result.order) {
//     notFound();
//   }

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       <OrderDetailClient order={result.order} />
//     </div>
//   );
// }


// src/app/(admin)/orders/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import {
  Package,
  Truck,
  CreditCard,
  User,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ArrowLeft,
  Plus,
} from 'lucide-react';

interface OrderDetail {
  _id: string;
  orderId: string;
  status: string;
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
  items: any[];
  createdAt: string;
  updatedAt: string;
  paymentMethod: string;
  paymentStatus: string;
  notes: any[];
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      const data = await response.json();
      setOrder(data.order);
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/orders/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        await fetchOrder();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const response = await fetch(`/api/orders/${params.id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newNote }),
      });
      
      if (response.ok) {
        setNewNote('');
        await fetchOrder();
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      const response = await fetch(`/api/orders/${params.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by admin' }),
      });
      
      if (response.ok) {
        await fetchOrder();
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

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
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{status.replace('_', ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-bold">Order Not Found</h2>
        <p className="text-muted-foreground">The order you're looking for doesn't exist.</p>
        <Button className="mt-4" onClick={() => router.push('/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Order {order.orderId}</h1>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-muted-foreground">
            Placed on {format(new Date(order.createdAt), 'PPP')}
          </p>
        </div>
        <div className="flex gap-2">
          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Order
              </Button>
              <Select
                value={order.status}
                onValueChange={handleStatusUpdate}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFIRMED">Confirm</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="PACKED">Packed</SelectItem>
                  <SelectItem value="READY_TO_SHIP">Ready to Ship</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">৳{order.pricing.total.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Items</p>
                    <p className="text-2xl font-bold">{order.items.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Payment</p>
                    <p className="text-2xl font-bold">{order.paymentMethod}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-2xl font-bold">{getStatusBadge(order.status)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>৳{order.pricing.subtotal.toLocaleString()}</span>
                </div>
                {order.pricing.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>-৳{order.pricing.couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span>৳{order.pricing.deliveryCharge.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>৳{order.pricing.total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {item.snapshot.image ? (
                        <img
                          src={item.snapshot.image}
                          alt={item.snapshot.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.snapshot.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × ৳{item.price.sale.toLocaleString()}
                      </p>
                      {item.snapshot.attributes && Object.keys(item.snapshot.attributes).length > 0 && (
                        <div className="flex gap-2 mt-1">
                          {Object.entries(item.snapshot.attributes).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">৳{item.total.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Tab */}
        <TabsContent value="customer">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{order.shipping.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Phone
                    </p>
                    <p className="font-medium">{order.shipping.phone}</p>
                  </div>
                  {order.shipping.email && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </p>
                      <p className="font-medium">{order.shipping.email}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>{order.shipping.address}</p>
                  <p>{order.shipping.area}, {order.shipping.city}</p>
                  {order.shipping.division && <p>{order.shipping.division}</p>}
                  {order.shipping.postcode && <p>Postal: {order.shipping.postcode}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge 
                    className={order.paymentStatus === 'PAID' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold">৳{order.pricing.total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div key={index} className="flex gap-4 border-l-2 border-gray-200 pl-4 pb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{event.status}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(event.createdAt), 'PPp')}
                        </span>
                      </div>
                      {event.note && (
                        <p className="text-sm text-muted-foreground mt-1">{event.note}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Source: {event.source}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
              <CardDescription>Add internal notes about this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAddNote}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Note
                  </Button>
                </div>

                {order.notes && order.notes.length > 0 && (
                  <div className="space-y-3 mt-4 border-t pt-4">
                    {order.notes.map((note, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p>{note.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(note.createdAt), 'PPp')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}