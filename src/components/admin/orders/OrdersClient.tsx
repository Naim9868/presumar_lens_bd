'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, RefreshCw, Download, ChevronDown,
  ChevronLeft, ChevronRight, X, Calendar,
  Package, TrendingUp, Clock, CheckCircle2, SlidersHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Order, OrderStats, OrderStatus, STATUS_CONFIG } from '@/types/order';
import OrderTable from './OrderTable';
import OrderNoteModal from './OrderNoteModal';

const STATUS_ORDER: OrderStatus[] = [
  'PENDING','AWAITING_PAYMENT','CONFIRMED','PROCESSING','PACKED',
  'READY_TO_SHIP','SHIPPED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED',
  'CANCELLED','RETURN_REQUESTED','RETURNED','REFUNDED',
];

interface Props {
  initialOrders: Order[];
  initialPagination: { page: number; limit: number; total: number; pages: number };
  initialStats: OrderStats;
}

const defaultPagination = { page: 1, limit: 20, total: 0, pages: 0 };
const defaultStats: OrderStats = {
  totalOrders: 0,
  totalRevenue: 0,
  pendingOrders: 0,
  deliveredOrders: 0,
  statusBreakdown: {} as Record<OrderStatus, number>,
};

export default function OrdersClient({ 
  initialOrders = [], 
  initialPagination = defaultPagination, 
  initialStats = defaultStats 
}: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [pagination, setPagination] = useState(initialPagination || defaultPagination);
  const [stats, setStats] = useState<OrderStats>(initialStats || defaultStats);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pageLimit, setPageLimit] = useState(initialPagination?.limit || 20);
  const [currentPage, setCurrentPage] = useState(initialPagination?.page || 1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sortBy, setSortBy] = useState('-createdAt');
  const [noteModal, setNoteModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrders = useCallback(async (page = currentPage) => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({
        page: String(page), 
        limit: String(pageLimit), 
        sort: sortBy,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(dateFrom && { startDate: dateFrom }),
        ...(dateTo && { endDate: dateTo }),
      });
      
      const response = await fetch(`/api/orders?${sp}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      // Handle the response structure - check for both formats
      if (data.success && data.data) {
        // Using successResponse format
        setOrders(data.data);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else if (data.orders) {
        // Direct response format
        setOrders(data.orders);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        // Fallback: try to use data as orders array
        setOrders(Array.isArray(data) ? data : []);
      }

      // Also fetch stats if not already included
      if (!data.stats) {
        const statsResponse = await fetch('/api/orders?statsOnly=true');
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats);
        } else if (statsData.stats) {
          setStats(statsData.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch orders');
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  }, [pageLimit, sortBy, search, statusFilter, dateFrom, dateTo, currentPage]);

  // Initial fetch and filter changes
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { 
      setCurrentPage(1); 
      fetchOrders(1); 
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  useEffect(() => { 
    setCurrentPage(1); 
    fetchOrders(1); 
  }, [statusFilter, dateFrom, dateTo, pageLimit, sortBy]);

  useEffect(() => { 
    if (currentPage > 0) {
      fetchOrders(currentPage); 
    }
  }, [currentPage]);

  const handleRefresh = () => { 
    setRefreshing(true); 
    fetchOrders(currentPage); 
  };

  const handleExportCSV = () => {
    const url = new URL('/api/orders', window.location.origin);
    url.searchParams.set('export', 'csv');
    if (statusFilter) url.searchParams.set('status', statusFilter);
    if (search) url.searchParams.set('search', search);
    if (dateFrom) url.searchParams.set('startDate', dateFrom);
    if (dateTo) url.searchParams.set('endDate', dateTo);
    window.open(url.toString(), '_blank');
  };

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success || data.order) {
        toast.success(`Updated to ${STATUS_CONFIG[status].label}`);
        fetchOrders(currentPage);
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update status'); 
    }
  };

  const handleNoteSubmit = async (text: string) => {
    if (!noteModal.order) return;
    try {
      const res = await fetch(`/api/orders/${noteModal.order._id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success || data.order) {
        toast.success('Note added');
        setNoteModal({ open: false, order: null });
        fetchOrders(currentPage);
      } else {
        toast.error(data.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Note add error:', error);
      toast.error('Failed to add note'); 
    }
  };

  const clearFilters = () => { 
    setSearch(''); 
    setStatusFilter(''); 
    setDateFrom(''); 
    setDateTo(''); 
  };
  
  const hasActiveFilters = !!(search || statusFilter || dateFrom || dateTo);

  // Calculate total safely
  const totalOrders = pagination?.total || 0;
  const totalPages = pagination?.pages || 0;

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">{totalOrders.toLocaleString()} total orders</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">
                <Download className="w-4 h-4" />
                Export <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                <button onClick={handleExportCSV} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Export as CSV</button>
                <button onClick={() => toast('PDF export coming soon')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Export as PDF</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Four Main Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: stats.totalOrders?.toLocaleString() || '0', icon: Package, color: 'text-violet-600', bg: 'bg-violet-50', sub: 'All time' },
            { label: 'Total Revenue', value: `৳${(stats.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Completed payments' },
            { label: 'Pending Orders', value: stats.pendingOrders?.toLocaleString() || '0', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Need attention' },
            { label: 'Delivered', value: stats.deliveredOrders?.toLocaleString() || '0', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', sub: 'Successfully fulfilled' },
          ].map(({ label, value, icon: Icon, color, bg, sub }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1.5 tracking-tight">{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Filter Pills */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Filter by Status</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${!statusFilter ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
              All ({stats.totalOrders || 0})
            </button>
            {STATUS_ORDER.map((status) => {
              const cfg = STATUS_CONFIG[status];
              const count = stats.statusBreakdown?.[status] || 0;
              if (!count && statusFilter !== status) return null;
              const isActive = statusFilter === status;
              return (
                <button key={status} onClick={() => setStatusFilter(prev => prev === status ? '' : status)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isActive ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? cfg.dot : 'bg-gray-300'}`} />
                  {cfg.label}
                  <span className={`font-bold ${isActive ? cfg.color : 'text-gray-400'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, customer name, phone..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all shadow-sm ${showFilterPanel || hasActiveFilters ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-amber-400" />}
          </button>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm">
            <option value="-createdAt">Newest first</option>
            <option value="createdAt">Oldest first</option>
            <option value="-pricing.total">Highest value</option>
            <option value="pricing.total">Lowest value</option>
            <option value="-updatedAt">Recently updated</option>
          </select>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Date Range</h3>
              {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-violet-600 hover:underline font-medium">Clear all</button>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[{ label: 'Date From', value: dateFrom, onChange: setDateFrom }, { label: 'Date To', value: dateTo, onChange: setDateTo }].map(({ label, value, onChange }) => (
                <div key={label}>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <span className="text-sm text-gray-500">{loading ? 'Loading...' : `${totalOrders} orders`}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Show</span>
              <select value={pageLimit} onChange={(e) => { setPageLimit(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400">
                {[10,20,50,100].map(n => <option key={n} value={n}>{n} per page</option>)}
              </select>
            </div>
          </div>

          <OrderTable orders={orders} loading={loading}
            onStatusUpdate={handleStatusUpdate}
            onAddNote={(order) => setNoteModal({ open: true, order })}
            onRefresh={() => fetchOrders(currentPage)} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {((currentPage-1)*pageLimit)+1}–{Math.min(currentPage*pageLimit, totalOrders)} of {totalOrders}
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1||loading}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const total = totalPages;
                  let p: number;
                  if (total<=5) p=i+1;
                  else if (currentPage<=3) p=i+1;
                  else if (currentPage>=total-2) p=total-4+i;
                  else p=currentPage-2+i;
                  return (
                    <button key={p} onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage===p ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages||loading}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <OrderNoteModal isOpen={noteModal.open} order={noteModal.order}
        onClose={() => setNoteModal({ open: false, order: null })}
        onSubmit={handleNoteSubmit} />
    </div>
  );
}