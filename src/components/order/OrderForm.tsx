'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Truck,
  CreditCard,
  User,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Minus,
  Plus,
  X,
  Package,
  Tag,
  Clock,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/components/ui/use-taost';
import OrderSummary from './OrderSummary';
import OrderInvoice from './OrderInvoice';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  image?: string;
  sku?: string;
  brand?: string;
  category?: string;
  price: {
    original: number;
    sale: number;
  };
  variantKey?: string;
  variantName?: string;
  attributes?: Record<string, string>;
  quantity: number;
  maxQuantity?: number;
}

interface OrderFormProps {
  items: ProductItem[];
  userId?: string;
  onSuccess?: (orderId: string) => void;
  onClose?: () => void;
  isModal?: boolean;
  className?: string;
}

type DeliveryType = 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';
type PaymentMethod = 'COD' | 'ONLINE';

interface FormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  city: string;
  postcode: string;
  division: string;
  landmark: string;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  notes: string;
}

// Helper to convert any value (including ObjectId, Date, populated doc) to a plain string
const toPlainString = (val: any): string => {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (val instanceof Date) return val.toISOString();
  // Mongoose ObjectId has a toString() that returns the hex
  if (typeof val.toString === 'function') {
    const s = val.toString();
    // Avoid "[object Object]" fallbacks
    if (s && s !== '[object Object]') return s;
  }
  return '';
};

// Recursively strip ObjectIds/Mongoose objects so data is plain-JSON safe for client components
const toPlain = (val: any): any => {
  if (val == null) return val;
  if (Array.isArray(val)) return val.map(toPlain);
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'object') {
    // Mongoose ObjectId (or any object with a non-default toJSON)
    if (typeof (val as any).toJSON === 'function' && !(val as any).toJSON.toString().includes('Object')) {
      // If it's just an ObjectId-shaped object, convert to hex string
      const hex = toPlainString(val);
      if (hex) return hex;
    }
    const out: Record<string, any> = {};
    for (const k of Object.keys(val)) {
      out[k] = toPlain(val[k]);
    }
    return out;
  }
  return val;
};

// Helper to ensure order has all required fields for Invoice
const normalizeOrderData = (order: any) => {
  console.log('Normalizing order data:', order);

  const safeId = toPlainString(order?._id) || order?.orderId || order?.id || '';

  const items = Array.isArray(order?.items) ? order.items.map((it: any) => ({
    snapshot: {
      name: it?.snapshot?.name ?? '',
      image: it?.snapshot?.image,
    },
    price: {
      original: Number(it?.price?.original ?? 0),
      sale: Number(it?.price?.sale ?? 0),
    },
    quantity: Number(it?.quantity ?? 0),
    total: Number(it?.total ?? 0),
  })) : [];

  const pricingSrc = order?.pricing || {};
  const shippingSrc = order?.shipping || {};

  return {
    _id: safeId,
    orderId: order?.orderId || safeId,
    status: order?.status || 'CONFIRMED',
    createdAt: order?.createdAt instanceof Date
      ? order.createdAt.toISOString()
      : (order?.createdAt || new Date().toISOString()),
    items,
    pricing: {
      subtotal: Number(pricingSrc.subtotal ?? 0),
      couponDiscount: Number(pricingSrc.couponDiscount ?? 0),
      deliveryCharge: Number(pricingSrc.deliveryCharge ?? 0),
      total: Number(pricingSrc.total ?? 0),
      currency: pricingSrc.currency || 'BDT',
    },
    shipping: {
      name: shippingSrc.name ?? '',
      phone: shippingSrc.phone ?? '',
      email: shippingSrc.email,
      address: shippingSrc.address ?? '',
      area: shippingSrc.area ?? '',
      city: shippingSrc.city ?? '',
      postcode: shippingSrc.postcode,
      division: shippingSrc.division,
    },
    paymentMethod: order?.paymentMethod || 'COD',
    paymentStatus: order?.paymentStatus || 'PENDING',
  };

  // Reference kept for any callers that need to deep-walk fields
  void toPlain;
};

export default function OrderForm({
  items,
  userId,
  onSuccess,
  onClose,
  isModal = false,
  className
}: OrderFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    area: '',
    city: '',
    postcode: '',
    division: '',
    landmark: '',
    deliveryType: 'INSIDE_DHAKA',
    paymentMethod: 'COD',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Calculate order totals
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.price.sale * item.quantity), 0);
    const deliveryCharge = formData.deliveryType === 'INSIDE_DHAKA' ? 60 : 120;
    const total = subtotal + deliveryCharge;
    return { subtotal, deliveryCharge, total };
  }, [items, formData.deliveryType]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (formData.phone.trim() && !/^01[3-9]\d{8}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Invalid phone number';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.area.trim()) newErrors.area = 'Area is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Please fix errors',
        description: 'Please fill in all required fields correctly.',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No items',
        description: 'Your cart is empty. Add some items first.',
      });
      return;
    }

    setLoading(true);

    try {
      const orderInput = {
        userId,
        guestEmail: formData.email || undefined,
        guestPhone: formData.phone,
        items: items.map(item => ({
          productId: item.id.split('-')[0] || item.id,
          variantKey: item.variantKey,
          snapshot: {
            name: item.name,
            slug: item.slug,
            image: item.image,
            sku: item.sku,
            brand: item.brand,
            category: item.category,
            attributes: item.attributes,
          },
          price: item.price,
          quantity: item.quantity,
        })),
        shipping: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address,
          area: formData.area,
          city: formData.city,
          postcode: formData.postcode || undefined,
          division: formData.division || undefined,
          landmark: formData.landmark || undefined,
        },
        deliveryType: formData.deliveryType,
        paymentMethod: formData.paymentMethod,
        meta: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
      };

      console.log('Sending order data:', orderInput);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const order = await response.json();
      
      console.log('Order created response:', order);
      
      // Normalize the order data for the invoice
      const normalizedOrder = normalizeOrderData(order);
      console.log('Normalized order data:', normalizedOrder);
      
      // Set order data and complete state
      setOrderData(normalizedOrder);
      setOrderComplete(true);

      toast({
        title: 'Order placed successfully!',
        description: `Order #${normalizedOrder.orderId} has been created.`,
      });

      if (onSuccess) {
        onSuccess(normalizedOrder._id || normalizedOrder.orderId);
      }

    } catch (error: any) {
      console.error('Order creation error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to place order',
        description: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const orderId = orderData._id || orderData.orderId;
      const response = await fetch(`/api/orders/${orderId}/invoice`);
      if (!response.ok) throw new Error('Failed to generate invoice');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${orderData.orderId || orderData._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to download invoice',
        description: 'Please try again or print from the invoice page.',
      });
    }
  };

  const handleContinue = () => {
    if (isModal && onClose) {
      onClose();
    } else {
      const orderId = orderData._id || orderData.orderId;
      router.push(`/orders/${orderId}`);
    }
  };

  // Debug: Log state changes
  useEffect(() => {
    console.log('Order state:', { orderComplete, orderData });
  }, [orderComplete, orderData]);

  // Success View
  if (orderComplete && orderData) {
    console.log('Rendering OrderInvoice with:', orderData);
    return (
      <OrderInvoice 
        order={orderData}
        onPrint={handlePrintInvoice}
        onDownloadPDF={handleDownloadPDF}
        onContinue={handleContinue}
        isModal={isModal}
      />
    );
  }

  // Form View
  return (
    <div className={cn("w-full max-w-6xl mx-auto", className)}>
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Order Form - Left Side */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ShoppingBag className="h-6 w-6 text-primary" />
                Place Your Order
              </CardTitle>
              <CardDescription>
                Fill in your details to complete the purchase
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={cn(errors.name && "border-red-500")}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="017xxxxxxxx"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={cn(errors.phone && "border-red-500")}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={cn(errors.email && "border-red-500")}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Delivery Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    Delivery Information
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Delivery Type</Label>
                      <RadioGroup
                        value={formData.deliveryType}
                        onValueChange={(value) => 
                          setFormData({ ...formData, deliveryType: value as DeliveryType })
                        }
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="INSIDE_DHAKA" id="inside" />
                          <Label htmlFor="inside" className="cursor-pointer">
                            Inside Dhaka (৳60)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="OUTSIDE_DHAKA" id="outside" />
                          <Label htmlFor="outside" className="cursor-pointer">
                            Outside Dhaka (৳120)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Address *</Label>
                        <Input
                          id="address"
                          placeholder="House #, Street"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className={cn(errors.address && "border-red-500")}
                        />
                        {errors.address && (
                          <p className="text-sm text-red-500">{errors.address}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area">Area *</Label>
                        <Input
                          id="area"
                          placeholder="Mirpur, Gulshan"
                          value={formData.area}
                          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                          className={cn(errors.area && "border-red-500")}
                        />
                        {errors.area && (
                          <p className="text-sm text-red-500">{errors.area}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          placeholder="Dhaka"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className={cn(errors.city && "border-red-500")}
                        />
                        {errors.city && (
                          <p className="text-sm text-red-500">{errors.city}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="division">Division</Label>
                        <Input
                          id="division"
                          placeholder="Dhaka Division"
                          value={formData.division}
                          onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postcode">Postcode</Label>
                        <Input
                          id="postcode"
                          placeholder="1216"
                          value={formData.postcode}
                          onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="landmark">Landmark (Optional)</Label>
                        <Input
                          id="landmark"
                          placeholder="Near mosque, school"
                          value={formData.landmark}
                          onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Method */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Payment Method
                  </h3>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => 
                      setFormData({ ...formData, paymentMethod: value as PaymentMethod })
                    }
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className={cn(
                      "flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all",
                      formData.paymentMethod === 'COD' 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-gray-400"
                    )}>
                      <RadioGroupItem value="COD" id="cod" />
                      <Label htmlFor="cod" className="cursor-pointer flex-1">
                        <div className="font-medium">Cash on Delivery</div>
                        <div className="text-sm text-muted-foreground">
                          Pay when you receive your order
                        </div>
                      </Label>
                    </div>
                    <div className={cn(
                      "flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all",
                      formData.paymentMethod === 'ONLINE' 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-gray-400"
                    )}>
                      <RadioGroupItem value="ONLINE" id="online" disabled />
                      <Label htmlFor="online" className="cursor-pointer flex-1">
                        <div className="font-medium">Online Payment</div>
                        <div className="text-sm text-muted-foreground">
                          Pay with card, mobile banking
                        </div>
                        <Badge variant="secondary" className="mt-1">Coming Soon</Badge>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Order Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions for delivery..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg gap-2"
                  disabled={loading || items.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing Order...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5" />
                      Place Order • {formatCurrency(totals.total)}
                    </>
                  )}
                </Button>

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    Secure Checkout
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Fast Delivery
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Quality Guarantee
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary - Right Side */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <OrderSummary 
              items={items}
              subtotal={totals.subtotal}
              deliveryCharge={totals.deliveryCharge}
              total={totals.total}
            />
          </div>
        </div>
      </div>
    </div>
  );
}