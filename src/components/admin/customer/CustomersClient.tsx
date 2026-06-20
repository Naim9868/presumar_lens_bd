// src/components/admin/CustomersClient.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  Calendar,
  Plus,
  Upload,
  Download,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Import components
import CustomerStats from './CustomerStats';
import CustomerFilters from './CustomerFilters';
import CustomerTable from './CustomerTable';
import SMSModal from './SMSModal';
import NoteModal from './NoteModal';
import CustomerViewModal from './CustomerViewModal';
import CustomerEditModal from './CustomerEditModal';
import { Customer } from '@/types/customer';


interface CustomersClientProps {
  initialCustomers: Customer[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  initialStats: {
    totalCustomers: number;
    returningCustomers: number;
    guestCustomers: number;
    avgOrderValue: number;
    customerLifetimeValue: number;
  };
}

export default function CustomersClient({
  initialCustomers,
  initialPagination,
  initialStats,
}: CustomersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [customers, setCustomers] = useState(initialCustomers);
  const [pagination, setPagination] = useState(initialPagination);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  
  // Modal states
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [smsMode, setSmsMode] = useState<'single' | 'bulk'>('single');

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    accountType: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const [pageLimit, setPageLimit] = useState(initialPagination.limit);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch customers when filters change
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pageLimit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && filters.status !== 'ALL' && { status: filters.status }),
        ...(filters.accountType && filters.accountType !== 'all' && { accountType: filters.accountType }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      const response = await fetch(`/api/customers?${params}`);
      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setCustomers(data.customers);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pageLimit, filters, pathname]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchCustomers();
  };

  // Handle limit change
  const handleLimitChange = (newLimit: number) => {
    setPageLimit(newLimit);
    setPagination(prev => ({ ...prev, page: 1, limit: newLimit }));
    fetchCustomers();
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle select all customers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(customers.map(c => c._id));
    } else {
      setSelectedCustomers([]);
    }
  };

  // Handle select single customer
  const handleSelectCustomer = (id: string) => {
    setSelectedCustomers(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  // Handle bulk SMS
  const handleBulkSMS = () => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select at least one customer');
      return;
    }
    setSmsMode('bulk');
    setShowSMSModal(true);
  };

  // Handle single SMS
  const handleSingleSMS = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSmsMode('single');
    setShowSMSModal(true);
  };

  // Handle note edit
  const handleEditNote = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowNoteModal(true);
  };

  // Handle view customer
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  // Handle delete/archive customer
  const handleArchiveCustomer = async (customer: Customer) => {
    if (!confirm(`Archive customer "${customer.name}"?`)) return;

    try {
      const response = await fetch(`/api/customers/${customer._id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Customer archived successfully');
        fetchCustomers();
      } else {
        toast.error(data.error || 'Failed to archive customer');
      }
    } catch (error) {
      console.error('Error archiving customer:', error);
      toast.error('Failed to archive customer');
    }
  };

  // Handle send SMS
  const handleSendSMS = async (message: string, customerIds?: string[]) => {
    try {
      const ids = customerIds || (selectedCustomer ? [selectedCustomer._id] : selectedCustomers);
      
      if (ids.length === 1) {
        // Single SMS
        const response = await fetch(`/api/customers/${ids[0]}/sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, type: smsMode }),
        });
        const data = await response.json();
        
        if (data.success) {
          toast.success('SMS sent successfully');
          fetchCustomers();
        } else {
          toast.error(data.error || 'Failed to send SMS');
        }
      } else {
        // Bulk SMS
        const response = await fetch('/api/customers/bulk-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerIds: ids, message }),
        });
        const data = await response.json();
        
        if (data.success) {
          toast.success(data.message);
          setSelectedCustomers([]);
          fetchCustomers();
        } else {
          toast.error(data.error || 'Failed to send bulk SMS');
        }
      }
      
      setShowSMSModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error('Failed to send SMS');
    }
  };

  // Handle add note
  const handleAddNote = async (customerId: string, note: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: note }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Note added successfully');
        fetchCustomers();
      } else {
        toast.error(data.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const totalPages = pagination.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <CustomerStats stats={stats} />

      {/* Filters */}
      <CustomerFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        selectedCount={selectedCustomers.length}
        onBulkSMS={handleBulkSMS}
        onRefresh={fetchCustomers}
        loading={loading}
      />

      {/* Customer Table */}
      <CustomerTable
        customers={customers}
        selectedCustomers={selectedCustomers}
        onSelectAll={handleSelectAll}
        onSelectCustomer={handleSelectCustomer}
        onViewCustomer={handleViewCustomer}
        onEditCustomer={handleEditCustomer}
        onArchiveCustomer={handleArchiveCustomer}
        onSendSMS={handleSingleSMS}
        onEditNote={handleEditNote}
        loading={loading}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={pageLimit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {[10, 20, 50, 100].map(limit => (
                <option key={limit} value={limit}>{limit}</option>
              ))}
            </select>
          </div>
          <span className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    pagination.page === pageNum
                      ? 'bg-amber-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === totalPages}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <SMSModal
        isOpen={showSMSModal}
        onClose={() => {
          setShowSMSModal(false);
          setSelectedCustomer(null);
        }}
        onSend={handleSendSMS}
        mode={smsMode}
        customerCount={smsMode === 'single' && selectedCustomer ? 1 : selectedCustomers.length}
        customerName={selectedCustomer?.name}
      />

      <NoteModal
        isOpen={showNoteModal}
        onClose={() => {
          setShowNoteModal(false);
          setSelectedCustomer(null);
        }}
        onSave={(note) => handleAddNote(selectedCustomer?._id || '', note)}
        customerName={selectedCustomer?.name}
        existingNotes={selectedCustomer?.notes || []}
      />

      <CustomerViewModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
      />

      <CustomerEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSave={fetchCustomers}
      />
    </div>
  );
}