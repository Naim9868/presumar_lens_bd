'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import OrderForm from '@/components/order/OrderForm';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  ShoppingCart, 
  ChevronRight, 
  Package, 
  Truck, 
  Shield, 
  Lock, 
  CheckCircle,
  Clock,
  CreditCard,
  MapPin,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [isClient, setIsClient] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (isClient && cartItems.length === 0) {
      router.push('/cart');
    }
  }, [cartItems, router, isClient]);

  // const subtotal = getCartSubtotal?.() || 0;
  // const discount = getCartDiscount?.() || 0;
  // const shipping = subtotal > 50 ? 0 : 5.99;
  // const total = subtotal - discount + shipping;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 md:py-12">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="hover:bg-gray-200/50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Secure Checkout</h1>
              <p className="text-sm text-gray-500 mt-0.5">Complete your order with confidence</p>
            </div>
          </div>
          
          {/* Trust Badge */}
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
            <Lock className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Secure Checkout</span>
            <span className="w-px h-6 bg-gray-300" />
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">100% Protected</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Form - Left Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Progress Steps */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex items-center justify-between max-w-md mx-auto">
                {[
                  { label: 'Cart', icon: ShoppingCart, active: true },
                  { label: 'Checkout', icon: CreditCard, active: true },
                  { label: 'Confirmation', icon: CheckCircle, active: false },
                ].map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                        ${step.active 
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                          : 'bg-gray-200 text-gray-500'
                        }
                      `}>
                        {step.icon && <step.icon className="h-5 w-5" />}
                      </div>
                      <span className={`text-xs mt-1 font-medium ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < 2 && (
                      <div className="w-12 sm:w-16 h-0.5 bg-gray-200 mx-2">
                        <div className="h-full w-1/2 bg-amber-500"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Order Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              <OrderForm 
                items={cartItems}
                onSuccess={(orderId) => {
                  router.push(`/orders/${orderId}`);
                }}
              />
            </div>
          </div>

          {/* Order Summary - Right Column */}
          {/* <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6"> */}
              {/* Summary Card */}
              {/* <Card className="border-0 shadow-lg bg-white rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-amber-500" />
                    Order Summary
                  </h2>
                </div>
                
                <CardContent className="p-6 space-y-4"> */}
                  {/* Cart Items Preview */}
                  {/* <div className="max-h-48 overflow-y-auto space-y-3 pr-2">
                    {cartItems.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.price.sale * item.quantity)}
                        </span>
                      </div>
                    ))}
                    {cartItems.length > 4 && (
                      <p className="text-xs text-gray-500 text-center">
                        + {cartItems.length - 4} more items
                      </p>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-2"> */}
                    {/* Subtotal */}
                    {/* <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                    </div> */}
                    
                    {/* Discount */}
                    {/* {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    
                    {/* Shipping */}
                    {/* <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      {shipping === 0 ? (
                        <span className="text-green-600 font-medium">Free</span>
                      ) : (
                        <span className="font-medium text-gray-900">{formatCurrency(shipping)}</span>
                      )}
                    </div> */} 
                    
                    {/* Free shipping progress */}
                    {/* {shipping > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Add {formatCurrency(50 - subtotal)} more for free shipping</span>
                          <span>{Math.round((subtotal / 50) * 100)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((subtotal / 50) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div> */}

                  {/* Total */}
                  {/* <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-amber-600">{formatCurrency(total)}</span>
                    </div>
                    {subtotal > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Including taxes and fees
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card> */}

              {/* Trust Badges */}
              {/* <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-gray-200 shadow-sm">
                  <Lock className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">Secure</p>
                  <p className="text-[10px] text-gray-400">Encrypted</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-gray-200 shadow-sm">
                  <Truck className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">Fast</p>
                  <p className="text-[10px] text-gray-400">Delivery</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-gray-200 shadow-sm">
                  <Shield className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">Protected</p>
                  <p className="text-[10px] text-gray-400">Guarantee</p>
                </div>
              </div> */}

              {/* Continue Shopping */}
              {/* <Link 
                href="/products"
                className="block text-center text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div> */}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            By placing your order, you agree to our{' '}
            <Link href="/terms" className="text-amber-600 hover:text-amber-700">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-amber-600 hover:text-amber-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}