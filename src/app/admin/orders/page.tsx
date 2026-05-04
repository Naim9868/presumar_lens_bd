'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrdersTable } from '@/components/admin/orders/OrdersTable';
import { BulkActionModal } from '@/components/admin/orders/BulkActionModal';
import { Download, Filter, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// API fetch functions
const fetchOrders = async ({ status, search, page = 1, limit = 20 }: { 
  status: string; 
  search: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (status && status !== 'all' && status !== '') params.append('status', status);
  if (search) params.append('search', search);
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  
  const response = await fetch(`/api/orders?${params.toString()}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch orders');
  }
  
  // Return the data structure from your API
  return {
    orders: data.orders || [],
    pagination: data.pagination || { page, limit, total: 0, pages: 1 }
  };
};

const fetchStats = async () => {
  const response = await fetch('/api/orders/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  return response.json();
};

// Stats Cards Component
function StatsCards({ stats, isLoading }: { stats: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const statusCounts = stats?.statusCounts || {};
  const overview = stats?.overview || {};

  const cards = [
    {
      title: 'Total Orders',
      value: overview.totalOrders || 0,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Total Revenue',
      value: `৳${(overview.totalRevenue || 0).toLocaleString()}`,
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      title: 'Pending Orders',
      value: statusCounts.pending || 0,
      color: 'bg-yellow-500',
      change: 'Needs attention',
    },
    {
      title: 'Delivered Orders',
      value: statusCounts.delivered || 0,
      color: 'bg-purple-500',
      change: '+15%',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
              {card.change && (
                <p className={`text-xs mt-2 ${card.change.includes('+') ? 'text-green-600' : 'text-yellow-600'}`}>
                  {card.change}
                </p>
              )}
            </div>
            <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center opacity-80`}>
              {idx === 0 && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
              {idx === 1 && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              {idx === 2 && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              {idx === 3 && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper functions for CSV export
const convertToCSV = (data: any[]) => {
  if (!data || data.length === 0) return '';
  
  const headers = [
    'Order ID', 'Customer Name', 'Phone', 'City', 'Address',
    'Subtotal', 'Delivery Charge', 'Discount', 'Total',
    'Payment Method', 'Payment Status', 'Order Status', 'Items Count', 'Date'
  ];
  
  const csvRows = [headers.join(',')];
  
  for (const order of data) {
    const values = [
      order.orderId,
      `"${order.shipping?.name || 'N/A'}"`,
      order.shipping?.phone || 'N/A',
      order.shipping?.city || 'N/A',
      `"${order.shipping?.address || 'N/A'}"`,
      order.pricing?.subtotal || 0,
      order.pricing?.deliveryCharge || 0,
      order.pricing?.discount || 0,
      order.pricing?.total || 0,
      order.payment?.method || 'N/A',
      order.payment?.status || 'N/A',
      order.status || 'N/A',
      order.items?.length || 0,
      new Date(order.createdAt).toLocaleDateString()
    ];
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export default function AdminOrdersPage() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Fetch orders
  const { 
    data: ordersData, 
    isLoading: ordersLoading, 
    refetch: refetchOrders,
    error: ordersError 
  } = useQuery({
    queryKey: ['orders', statusFilter, debouncedSearchTerm, currentPage],
    queryFn: () => fetchOrders({ 
      status: statusFilter, 
      search: debouncedSearchTerm,
      page: currentPage,
      limit: 20
    }),
    staleTime: 30000,
  });
  
  // Fetch stats
  const { 
    data: statsData, 
    isLoading: statsLoading, 
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['orders-stats'],
    queryFn: fetchStats,
    staleTime: 60000,
  });
  
  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ orderIds, action }: { orderIds: string[]; action: string }) => {
      const response = await fetch('/api/orders/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds, action }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update orders');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-stats'] });
      setSelectedOrders([]);
      toast.success(data.message || 'Orders updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update orders');
    },
  });
  
  const exportOrders = () => {
    if (!ordersData?.orders || ordersData.orders.length === 0) {
      toast.error('No orders to export');
      return;
    }
    const csv = convertToCSV(ordersData.orders);
    downloadCSV(csv, `orders_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Orders exported successfully');
  };
  
  const handleRefresh = () => {
    refetchOrders();
    refetchStats();
    toast.success('Data refreshed');
  };
  
  const handleBulkAction = (action: string) => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders to update');
      return;
    }
    bulkUpdateMutation.mutate({ orderIds: selectedOrders, action });
  };
  
  const handleClearFilters = () => {
    setStatusFilter('');
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
  };
  
  if (ordersError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to Load Orders</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{(ordersError as Error).message}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track all customer orders</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportOrders}
              disabled={!ordersData?.orders?.length}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Download size={18} />
              Export
            </button>
            <button
              onClick={handleRefresh}
              disabled={ordersLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
            >
              <RefreshCw size={18} className={ordersLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <StatsCards stats={statsData} isLoading={statsLoading} />
        
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by order ID, customer name, or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button 
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <Filter size={18} />
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Orders Table */}
        <OrdersTable
          orders={ordersData?.orders || []}
          selectedOrders={selectedOrders}
          onSelectOrders={setSelectedOrders}
          isLoading={ordersLoading}
          pagination={{
            page: currentPage,
            limit: 20,
            total: ordersData?.pagination?.total || 0,
            pages: ordersData?.pagination?.pages || 1,
          }}
          onPageChange={setCurrentPage}
        />
        
        {/* Bulk Actions Modal */}
        {selectedOrders.length > 0 && (
          <BulkActionModal
            selectedCount={selectedOrders.length}
            onAction={handleBulkAction}
            onClear={() => setSelectedOrders([])}
            isLoading={bulkUpdateMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}