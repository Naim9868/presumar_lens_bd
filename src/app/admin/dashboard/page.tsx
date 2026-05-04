// app/admin/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatsCards } from '@/components/admin/orders/StatsCards';
import { AnalyticsChart } from '@/components/admin/orders/AnalyticsChart';
import { ShoppingBag, TrendingUp, Package, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => fetch('/api/orders/stats').then(res => res.json()),
    refetchInterval: 60000,
  });
  
  if (isLoading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your store today.</p>
        </div>
        
        {/* Stats Cards */}
        <StatsCards />
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
            <AnalyticsChart data={data?.monthlyData || []} type="revenue" />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Distribution</h2>
            <div className="space-y-4">
              {data?.statusDistribution?.map((status: any) => (
                <div key={status.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status.name}</span>
                    <span className="font-medium">{status.value} orders</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(status.value / data.overview.totalOrders) * 100}%`,
                        backgroundColor: status.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <ShoppingBag className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{data?.overview?.totalOrders || 0}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">৳{data?.overview?.averageOrderValue?.toLocaleString() || 0}</div>
              <div className="text-sm text-gray-600">Avg. Order Value</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{data?.statusCounts?.pending || 0}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <Package className="h-8 w-8 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{data?.statusCounts?.shipped || 0}</div>
              <div className="text-sm text-gray-600">Shipped</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{data?.statusCounts?.delivered || 0}</div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{data?.statusCounts?.cancelled || 0}</div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}