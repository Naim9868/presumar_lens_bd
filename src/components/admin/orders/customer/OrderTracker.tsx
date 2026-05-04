// components/customer/OrderTracker.tsx
'use client';

import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { OrderTimeline } from '../OrderTimeline';
import { MapPin, Package, Truck, CheckCircle } from 'lucide-react';

interface OrderTrackerProps {
  orderId: string;
}

export function OrderTracker({ orderId }: OrderTrackerProps) {
  const [order, setOrder] = useState<any>(null);
  const [socket, setSocket] = useState<any>(null);
  
  useEffect(() => {
    // Fetch initial order data
    fetch(`/api/orders/${orderId}/tracking`)
      .then(res => res.json())
      .then(data => setOrder(data));
    
    // Setup WebSocket connection
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || '');
    newSocket.emit('subscribe-order', orderId);
    newSocket.on('order-update', (update) => {
      setOrder((prev: any) => ({ ...prev, ...update }));
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.emit('unsubscribe-order', orderId);
      newSocket.close();
    };
  }, [orderId]);
  
  const getProgressWidth = () => {
    const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = steps.indexOf(order?.status);
    if (currentIndex === -1) return 0;
    return (currentIndex / (steps.length - 1)) * 100;
  };
  
  if (!order) {
    return <div className="text-center py-8">Loading tracking information...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order #{order.orderId}</h2>
            <p className="text-gray-600">Track your order status in real-time</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Estimated Delivery</div>
            <div className="font-semibold text-gray-900">
              {order.estimatedDelivery 
                ? new Date(order.estimatedDelivery).toLocaleDateString()
                : 'Processing'}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Order Progress</span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(getProgressWidth())}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgressWidth()}%` }}
            />
          </div>
        </div>
        
        {/* Status Steps */}
        <div className="grid grid-cols-5 gap-2 mb-8">
          {[
            { status: 'PENDING', label: 'Pending', icon: Package },
            { status: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
            { status: 'PROCESSING', label: 'Processing', icon: Package },
            { status: 'SHIPPED', label: 'Shipped', icon: Truck },
            { status: 'DELIVERED', label: 'Delivered', icon: MapPin },
          ].map((step, index) => {
            const isCompleted = order.status === step.status;
            const isActive = order.status === step.status;
            
            return (
              <div key={index} className="text-center">
                <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  isCompleted 
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  <step.icon size={20} />
                </div>
                <div className={`text-xs font-medium ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Tracking Info */}
        {order.tracking && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Current Location</h3>
            <p className="text-gray-700">{order.tracking.current_location || 'In transit'}</p>
            {order.tracking.estimated_delivery && (
              <p className="text-sm text-gray-600 mt-2">
                Expected delivery: {new Date(order.tracking.estimated_delivery).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
        <OrderTimeline timeline={order.timeline} />
      </div>
    </div>
  );
}