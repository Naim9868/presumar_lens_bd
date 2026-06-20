// src/components/admin/CustomerTable.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Eye,
  Edit2,
  Trash2,
  MessageSquare,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Customer } from '@/types/customer';

interface CustomerTableProps {
  customers: Customer[];
  selectedCustomers: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectCustomer: (id: string) => void;
  onViewCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onArchiveCustomer: (customer: Customer) => void;
  onSendSMS: (customer: Customer) => void;
  onEditNote: (customer: Customer) => void;
  loading: boolean;
}

export default function CustomerTable({
  customers,
  selectedCustomers,
  onSelectAll,
  onSelectCustomer,
  onViewCustomer,
  onEditCustomer,
  onArchiveCustomer,
  onSendSMS,
  onEditNote,
  loading,
}: CustomerTableProps) {
  const [expandedSMS, setExpandedSMS] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Blocked
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  const getAccountBadge = (hasLogin: boolean) => {
    return hasLogin ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Users className="w-3 h-3" />
        Registered
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Guest
      </span>
    );
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '—';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return '—';
    }
  };

  const formatDateTime = (date: Date | string | undefined) => {
    if (!date) return '—';
    try {
      return format(new Date(date), 'MMM d, yyyy h:mm a');
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-amber-500"></div>
          <p className="text-gray-500 mt-2">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-500">Try adjusting your filters or search terms.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedCustomers.length === customers.length && customers.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Spent
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SMS
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(customer._id)}
                    onChange={() => onSelectCustomer(customer._id)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    {customer.addresses && customer.addresses.length > 0 && (
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {customer.addresses[0]?.address}, {customer.addresses[0]?.city}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600 truncate max-w-[150px]">{customer.email}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-gray-900">
                    {customer.stats.ordersCount}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-gray-900">
                    ${customer.stats.totalSpent.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">
                    {formatDate(customer.stats.lastOrderAt)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {getAccountBadge(customer.account.hasLogin)}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(customer.status)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onEditNote(customer)}
                    className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    {customer.notes?.length || 0}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <button
                      onClick={() => setExpandedSMS(expandedSMS === customer._id ? null : customer._id)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      {customer.smsHistory?.length || 0}
                      {expandedSMS === customer._id ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                    {expandedSMS === customer._id && customer.smsHistory && customer.smsHistory.length > 0 && (
                      <div className="absolute z-10 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-h-48 overflow-y-auto">
                        {customer.smsHistory.map((sms, idx) => (
                          <div key={idx} className="mb-2 last:mb-0 pb-2 last:pb-0 border-b last:border-b-0 border-gray-100">
                            <p className="text-xs text-gray-600">{sms.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">{formatDateTime(sms.sentAt)}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                sms.type === 'bulk' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {sms.type}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                sms.status === 'sent' ? 'bg-green-100 text-green-700' :
                                sms.status === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {sms.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onViewCustomer(customer)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditCustomer(customer)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSendSMS(customer)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                      title="Send SMS"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onArchiveCustomer(customer)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Archive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}