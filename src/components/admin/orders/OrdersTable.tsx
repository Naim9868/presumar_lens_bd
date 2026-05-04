'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Trash2, ChevronLeft, ChevronRight, Phone, MapPin, Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Pricing {
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
}

interface Shipping {
  name: string;
  phone: string;
  address: string;
  area: string;
  city: string;
}

interface Delivery {
  type: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';
  courier?: string;
  trackingId?: string;
}

interface Order {
  _id: string;
  orderId: string;
  items: OrderItem[];
  pricing: Pricing;
  status: string;
  customStatus?: string;
  payment: {
    method: 'COD' | 'ONLINE';
    status: 'PAID' | 'UNPAID' | 'FAILED';
    transactionId?: string;
  };
  shipping: Shipping;
  delivery: Delivery;
  createdAt: string;
}

interface OrdersTableProps {
  orders: Order[];
  selectedOrders: string[];
  onSelectOrders: (orders: string[]) => void;
  isLoading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange?: (page: number) => void;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PROCESSING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  SHIPPED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function OrdersTable({ 
  orders, 
  selectedOrders, 
  onSelectOrders, 
  isLoading,
  pagination,
  onPageChange 
}: OrdersTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString()}`;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectOrders(filteredOrders.map(order => order._id));
    } else {
      onSelectOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      onSelectOrders([...selectedOrders, orderId]);
    } else {
      onSelectOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const originalOrder = localOrders.find(o => o._id === orderId);
    
    setUpdatingId(orderId);
    
    // Optimistic update
    setLocalOrders(prevOrders => 
      prevOrders.map(o => 
        o._id === orderId ? { ...o, status: newStatus } : o
      )
    );

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          note: `Order status updated to ${newStatus}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      toast.success(`Order status updated to ${newStatus}`);
      
    } catch (error) {
      // Revert on error
      if (originalOrder) {
        setLocalOrders(prevOrders => 
          prevOrders.map(o => 
            o._id === orderId ? originalOrder : o
          )
        );
      }
      toast.error('Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    const originalOrders = [...localOrders];
    
    setLocalOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
    onSelectOrders(selectedOrders.filter(id => id !== orderId));

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      toast.success('Order deleted successfully');
      
    } catch (error) {
      setLocalOrders(originalOrders);
      toast.error('Failed to delete order');
    }
  };

  const filteredOrders = localOrders.filter(order => {
    const matchesSearch = search === '' || 
      order.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      order.shipping?.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.shipping?.phone?.includes(search);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = pagination?.pages || 1;
  const currentPage = pagination?.page || 1;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by order ID, customer name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="all">All Status</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Items</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredOrders.map((order) => {
                  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                  
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={(e) => handleSelectOrder(order._id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order._id}`}>
                          <span className="font-mono text-sm text-amber-600 hover:text-amber-700 hover:underline cursor-pointer">
                            {order.orderId?.slice(-8) || order._id.slice(-8)}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{order.shipping?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone size={10} />
                            {order.shipping?.phone || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />
                            {order.shipping?.city || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                            {order.items?.map(item => item.name).join(', ') || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {order.items?.length || 0} item(s) • Total Qty: {totalItems}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatPrice(order.pricing?.total || 0)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Delivery: {formatPrice(order.pricing?.deliveryCharge || 0)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          disabled={updatingId === order._id}
                          className={`text-xs px-2 py-1 rounded-lg border-0 font-medium cursor-pointer ${statusColors[order.status] || statusColors.PENDING} disabled:opacity-50 disabled:cursor-wait focus:ring-2 focus:ring-amber-500`}
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="View Order"
                          >
                            <Eye size={16} className="text-gray-500" />
                          </Link>
                          <button
                            onClick={() => handleDelete(order._id)}
                            disabled={updatingId === order._id}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Order"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && totalPages > 1 && onPageChange && (
            <div className="px-4 py-3 border-t dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * (pagination.limit || 20)) + 1} to {Math.min(currentPage * (pagination.limit || 20), pagination.total)} of {pagination.total} orders
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          currentPage === pageNum
                            ? 'bg-amber-600 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}