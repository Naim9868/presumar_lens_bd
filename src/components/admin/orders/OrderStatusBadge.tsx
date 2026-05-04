// components/admin/OrderStatusBadge.tsx
'use client';

import { Clock, Package, Truck, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const statusConfig = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
    borderColor: 'border-yellow-200',
  },
  CONFIRMED: {
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    borderColor: 'border-green-200',
  },
  PROCESSING: {
    label: 'Processing',
    icon: RefreshCw,
    color: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-200',
  },
  SHIPPED: {
    label: 'Shipped',
    icon: Truck,
    color: 'bg-purple-100 text-purple-800',
    borderColor: 'border-purple-200',
  },
  DELIVERED: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'bg-emerald-100 text-emerald-800',
    borderColor: 'border-emerald-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    borderColor: 'border-red-200',
  },
};

interface OrderStatusBadgeProps {
  status: keyof typeof statusConfig;
  customStatus?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function OrderStatusBadge({ status, customStatus, size = 'md' }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  const displayText = customStatus || config.label;
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${config.color} ${config.borderColor} border`}>
      <Icon className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />
      {displayText}
    </span>
  );
}