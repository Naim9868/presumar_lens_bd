'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Truck, CreditCard, ShoppingBag, ChevronRight, CheckCircle } from 'lucide-react';
import { createOrder } from '@/app/actions/order.actions';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import toast from 'react-hot-toast';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
  cartItems?: any[];
}

export function OrderFormModal({ isOpen, onClose, product, cartItems = [] }: OrderFormModalProps) {
  const router = useRouter();
  const { clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'INSIDE_DHAKA' | 'OUTSIDE_DHAKA'>('INSIDE_DHAKA');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    area: '',
    city: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const items = product ? [product] : cartItems;
  const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const deliveryCharge = deliveryType === 'INSIDE_DHAKA' ? 60 : 120;
  const total = subtotal + deliveryCharge;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!/^01[3-9]\d{8}$/.test(formData.phone)) newErrors.phone = 'Invalid Bangladesh phone number';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.area.trim()) newErrors.area = 'Area is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  setIsSubmitting(true);
  
  // Prepare the items array correctly - this is the key fix
  const orderItems = items.map(item => ({
    productId: item.id || item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity || 1,
    image: item.image || item.thumbnail || '',
    variantId: item.sku || item.variantId || null,
  }));
  
  // Prepare the order data as an object, not FormData
  const orderData = {
    items: orderItems,
    shipping: {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      area: formData.area,
      city: formData.city,
    },
    deliveryType: deliveryType,
    paymentMethod: paymentMethod,
    discount: 0,
    userId: null,
  };
  
  console.log('Submitting order:', orderData); // Debug log
  
  const result = await createOrder(orderData);
  
  setIsSubmitting(false);
  
  if (result.success) {
    toast.success('Order placed successfully!');
    if (!product) clearCart();
    onClose();
    router.push(`/order-confirmation?id=${result.orderId}`);
  } else {
    toast.error(result.error || 'Failed to create order');
  }
};

  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300"
      />
      
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl z-50 animate-in slide-in-from-right duration-300 overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
              Complete Your Order
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Please fill in your details to proceed
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ShoppingBag size={18} className="text-amber-600" />
              Order Summary
            </h3>
            <div className="space-y-2 text-sm">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {item.name} x {item.quantity || 1}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ৳{((item.price) * (item.quantity || 1)).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="border-t border-amber-200 dark:border-gray-700 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600 dark:text-gray-400">Delivery Charge</span>
                  <span className="text-gray-900 dark:text-white">৳{deliveryCharge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-amber-200 dark:border-gray-700">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="font-bold text-amber-600 text-lg">৳{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Delivery Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Delivery Location
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType('INSIDE_DHAKA')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  deliveryType === 'INSIDE_DHAKA'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'
                }`}
              >
                <MapPin className={`w-6 h-6 mx-auto mb-2 ${deliveryType === 'INSIDE_DHAKA' ? 'text-amber-600' : 'text-gray-400'}`} />
                <div className="font-medium text-gray-900 dark:text-white">Inside Dhaka</div>
                <div className="text-sm text-gray-500">Delivery: ৳60</div>
                <div className="text-xs text-green-600 mt-1">1-2 days</div>
              </button>
              
              <button
                type="button"
                onClick={() => setDeliveryType('OUTSIDE_DHAKA')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  deliveryType === 'OUTSIDE_DHAKA'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'
                }`}
              >
                <Truck className={`w-6 h-6 mx-auto mb-2 ${deliveryType === 'OUTSIDE_DHAKA' ? 'text-amber-600' : 'text-gray-400'}`} />
                <div className="font-medium text-gray-900 dark:text-white">Outside Dhaka</div>
                <div className="text-sm text-gray-500">Delivery: ৳120</div>
                <div className="text-xs text-green-600 mt-1">3-5 days</div>
              </button>
            </div>
          </div>
          
          {/* Shipping Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Shipping Information
            </h3>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:bg-gray-800 dark:text-white transition`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number (01XXXXXXXXX)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:bg-gray-800 dark:text-white transition`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              
              <div>
                <textarea
                  placeholder="Full Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.address ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:bg-gray-800 dark:text-white transition`}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Area/Thana"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.area ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                    } focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:bg-gray-800 dark:text-white transition`}
                  />
                  {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area}</p>}
                </div>
                
                <div>
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.city ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                    } focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:bg-gray-800 dark:text-white transition`}
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Payment Method
            </label>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-amber-300 transition">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Cash on Delivery</div>
                    <div className="text-sm text-gray-500">Pay when you receive the product</div>
                  </div>
                </div>
                <CreditCard size={24} className="text-gray-400" />
              </label>
              
              <label className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-amber-300 transition">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="ONLINE"
                    checked={paymentMethod === 'ONLINE'}
                    onChange={() => setPaymentMethod('ONLINE')}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Online Payment</div>
                    <div className="text-sm text-gray-500">Credit Card, Mobile Banking, SSLCommerz</div>
                  </div>
                </div>
                <CreditCard size={24} className="text-gray-400" />
              </label>
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white py-4 rounded-xl font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                Place Order
                <ChevronRight size={18} />
              </div>
            )}
          </button>
          
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By placing this order, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </>
  );
}