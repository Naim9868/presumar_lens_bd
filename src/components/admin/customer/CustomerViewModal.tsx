// src/components/admin/CustomerViewModal.tsx
'use client';

import { useState } from 'react';
import { X, Phone, Mail, MapPin, Package, DollarSign, Calendar, User, Users, Clock, FileText, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  addresses: any[];
  stats: {
    ordersCount: number;
    totalSpent: number;
    firstOrderAt?: Date;
    lastOrderAt?: Date;
  };
  account: {
    hasLogin: boolean;
    convertedAt?: Date;
  };
  notes: {
    text: string;
    createdBy: string;
    createdAt: Date;
  }[];
  smsHistory: {
    message: string;
    sentAt: Date;
    type: 'bulk' | 'single';
    status: 'sent' | 'failed' | 'pending';
  }[];
  status: 'ACTIVE' | 'BLOCKED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function CustomerViewModal({ isOpen, onClose, customer }: CustomerViewModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'notes' | 'sms'>('info');

  if (!isOpen || !customer) return null;

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '—';
    try {
      return format(new Date(date), 'MMM d, yyyy h:mm a');
    } catch {
      return '—';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      BLOCKED: 'bg-red-100 text-red-800',
      ARCHIVED: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{customer.phone}</span>
                {customer.email && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-sm text-gray-500">{customer.email}</span>
                  </>
                )}
                {getStatusBadge(customer.status)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-gray-200">
          {[
            { id: 'info', label: 'Information' },
            { id: 'orders', label: 'Orders' },
            { id: 'notes', label: 'Notes' },
            { id: 'sms', label: 'SMS History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Package className="w-4 h-4" />
                    Total Orders
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{customer.stats.ordersCount}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <DollarSign className="w-4 h-4" />
                    Total Spent
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${customer.stats.totalSpent.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    Last Order
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(customer.stats.lastOrderAt)}</p>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-gray-500">Account Type</span>
                    <p className="text-sm font-medium text-gray-900">
                      {customer.account.hasLogin ? 'Registered User' : 'Guest User'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Member Since</span>
                    <p className="text-sm font-medium text-gray-900">{formatDate(customer.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              {customer.addresses && customer.addresses.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Addresses</h4>
                  <div className="space-y-3">
                    {customer.addresses.map((addr, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                        <p className="text-sm text-gray-600">{addr.area}, {addr.city}</p>
                        {addr.phone && (
                          <p className="text-sm text-gray-600">Phone: {addr.phone}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Order history will appear here</p>
              <p className="text-sm text-gray-400 mt-1">Total {customer.stats.ordersCount} orders</p>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {customer.notes && customer.notes.length > 0 ? (
                customer.notes.map((note, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700">{note.text}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {note.createdBy || 'Admin'}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No notes available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sms' && (
            <div className="space-y-4">
              {customer.smsHistory && customer.smsHistory.length > 0 ? (
                customer.smsHistory.map((sms, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700">{sms.message}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(sms.sentAt)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sms.type === 'bulk' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {sms.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sms.status === 'sent' ? 'bg-green-100 text-green-700' :
                        sms.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sms.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No SMS history available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}