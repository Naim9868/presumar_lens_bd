'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Tag, Calendar, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch coupons (implement your API call)
  // useEffect(() => {
  //   fetchCoupons();
  // }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    // Implement delete logic
    toast.success('Coupon deleted successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Coupons</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage discount coupons and promotional codes</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
          >
            <Plus size={18} />
            Add Coupon
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Coupons</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Tag className="w-10 h-10 text-amber-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Coupons</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Percent className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Used</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Savings</p>
                <p className="text-2xl font-bold">৳0</p>
              </div>
              <Tag className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Discount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Min Purchase</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Valid Until</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Usage</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No coupons found. Click "Add Coupon" to create your first coupon.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}