// components/admin/OrderTimeline.tsx
'use client';

import { CheckCircle, Clock, Truck, Package, XCircle } from 'lucide-react';

const statusIcons = {
  PENDING: Clock,
  CONFIRMED: Package,
  PROCESSING: Package,
  SHIPPED: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
};

const statusColors = {
  PENDING: 'text-yellow-500 bg-yellow-50',
  CONFIRMED: 'text-green-500 bg-green-50',
  PROCESSING: 'text-blue-500 bg-blue-50',
  SHIPPED: 'text-purple-500 bg-purple-50',
  DELIVERED: 'text-green-500 bg-green-50',
  CANCELLED: 'text-red-500 bg-red-50',
};

export function OrderTimeline({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return <div className="text-gray-500 text-center py-8">No timeline events</div>;
  }
  
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {timeline.map((event, index) => {
          const Icon = statusIcons[event.status] || Clock;
          const colorClass = statusColors[event.status] || 'text-gray-500 bg-gray-50';
          
          return (
            <li key={index}>
              <div className="relative pb-8">
                {index !== timeline.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {event.status}
                    </div>
                    {event.note && (
                      <div className="mt-0.5 text-sm text-gray-500">
                        {event.note}
                      </div>
                    )}
                    <div className="mt-0.5 text-xs text-gray-400">
                      {new Date(event.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}