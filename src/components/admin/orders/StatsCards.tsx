// components/admin/StatsCards.tsx
'use client';

import { useEffect, useState } from 'react';
import { LucideIcon, ShoppingBag, DollarSign, Package, TrendingUp, Users, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  color: string;
}

function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className={`h-4 w-4 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(trend)}% from last month
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export function StatsCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['order-stats'],
    queryFn: () => fetch('/api/orders/stats').then(res => res.json()),
    refetchInterval: 30000,
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }
  
  const stats = [
    {
      title: 'Total Orders',
      value: data?.overview?.totalOrders?.toLocaleString() || '0',
      icon: ShoppingBag,
      trend: 12,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Revenue',
      value: `৳${data?.overview?.totalRevenue?.toLocaleString() || '0'}`,
      icon: DollarSign,
      trend: 8,
      color: 'bg-green-500',
    },
    {
      title: 'Pending Orders',
      value: data?.statusCounts?.pending || '0',
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'Delivered Orders',
      value: data?.statusCounts?.delivered || '0',
      icon: Package,
      trend: 15,
      color: 'bg-purple-500',
    },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
}