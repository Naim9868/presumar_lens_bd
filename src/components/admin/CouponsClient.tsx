'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Tag,
  Percent,
  Calendar,
  Search,
  Edit2,
  Trash2,
  Power,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Truck,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProductPicker, {
  PickerProduct,
} from '@/components/admin/ProductPicker';

type CouponType = 'FIXED' | 'PERCENTAGE' | 'FREE_SHIPPING';

interface ICoupon {
  _id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  startDate?: string | null;
  endDate?: string | null;
  active: boolean;
  description?: string;
  allowedProducts?: string[];
  allowedCategories?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Stats {
  total: number;
  active: number;
  used: number;
  savings: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const emptyForm = {
  _id: '' as string | null,
  code: '',
  type: 'PERCENTAGE' as CouponType,
  value: 10 as number | string,
  minOrder: '' as string | number,
  maxDiscount: '' as string | number,
  usageLimit: '' as string | number,
  perUserLimit: 1,
  startDate: '',
  endDate: '',
  active: true,
  description: '',
  allowedProducts: [] as PickerProduct[],
};

function toDateInput(v?: string | null) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatBDT(n: number) {
  return `৳${Number(n || 0).toLocaleString('en-BD')}`;
}

export default function CouponsClient() {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    used: 0,
    savings: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    pages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all'
  );
  const [typeFilter, setTypeFilter] = useState<'all' | CouponType>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const buildQuery = (page: number) => {
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('limit', '25');
    if (search.trim()) sp.set('search', search.trim());
    if (statusFilter === 'active') sp.set('active', 'true');
    if (statusFilter === 'inactive') sp.set('active', 'false');
    return sp.toString();
  };

  const fetchCoupons = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/coupons?${buildQuery(page)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to load coupons');
      }
      const filtered =
        typeFilter === 'all'
          ? data.data.coupons
          : data.data.coupons.filter((c: ICoupon) => c.type === typeFilter);
      setCoupons(filtered);
      setStats(data.data.stats);
      setPagination(data.data.pagination);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCoupons(1);
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEdit = (c: ICoupon) => {
    setForm({
      _id: c._id,
      code: c.code,
      type: c.type,
      value: c.value,
      minOrder: c.minOrder ?? '',
      maxDiscount: c.maxDiscount ?? '',
      usageLimit: c.usageLimit ?? '',
      perUserLimit: c.perUserLimit ?? 1,
      startDate: toDateInput(c.startDate),
      endDate: toDateInput(c.endDate),
      active: c.active,
      description: c.description ?? '',
      // Hydrate the picker with the IDs already on the coupon. The picker will
      // resolve names/images from the search endpoint when the modal opens.
      allowedProducts: (c.allowedProducts || []).map((id) => ({
        _id: id,
        name: '',
        image: '',
      })),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error('Code is required');
    if (!form.type) return toast.error('Type is required');
    if (form.type !== 'FREE_SHIPPING' && Number(form.value) <= 0)
      return toast.error('Value must be greater than 0');
    if (form.type === 'PERCENTAGE' && Number(form.value) > 100)
      return toast.error('Percentage value cannot exceed 100');

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minOrder:
          form.minOrder === '' ? undefined : Number(form.minOrder),
        maxDiscount:
          form.maxDiscount === '' ? undefined : Number(form.maxDiscount),
        usageLimit:
          form.usageLimit === '' ? undefined : Number(form.usageLimit),
        perUserLimit: Number(form.perUserLimit) || 1,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        active: form.active,
        description: form.description || undefined,
        allowedProducts: form.allowedProducts.map((p) => p._id),
      };

      const url = form._id
        ? `/api/admin/coupons/${form._id}`
        : `/api/admin/coupons`;
      const method = form._id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Save failed');
      }
      toast.success(form._id ? 'Coupon updated' : 'Coupon created');
      setIsModalOpen(false);
      fetchCoupons(pagination.page);
    } catch (err: any) {
      toast.error(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c: ICoupon) => {
    setTogglingId(c._id);
    try {
      const res = await fetch(`/api/admin/coupons/${c._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !c.active }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Toggle failed');
      }
      toast.success(c.active ? 'Coupon deactivated' : 'Coupon activated');
      fetchCoupons(pagination.page);
    } catch (err: any) {
      toast.error(err?.message || 'Toggle failed');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (c: ICoupon) => {
    if (
      !confirm(
        `Delete coupon "${c.code}"? This cannot be undone.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/coupons/${c._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Delete failed');
      }
      toast.success('Coupon deleted');
      const nextPage =
        coupons.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;
      fetchCoupons(nextPage);
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed');
    }
  };

  const formatDate = (v?: string | null) => {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB');
  };

  const renderDiscount = (c: ICoupon) => {
    if (c.type === 'FIXED') return `${formatBDT(c.value)} off`;
    if (c.type === 'PERCENTAGE') return `${c.value}% off`;
    return <span className="inline-flex items-center gap-1"><Truck className="w-4 h-4" /> Free shipping</span>;
  };

  const usageLabel = (c: ICoupon) =>
    c.usageLimit ? `${c.usedCount} / ${c.usageLimit}` : `${c.usedCount}`;

  const expiryState = (c: ICoupon) => {
    if (!c.endDate) return null;
    const end = new Date(c.endDate).getTime();
    if (isNaN(end)) return null;
    if (end < Date.now()) return { label: 'Expired', cls: 'bg-red-100 text-red-700' };
    if (end - Date.now() < 7 * 24 * 60 * 60 * 1000)
      return { label: 'Ending soon', cls: 'bg-amber-100 text-amber-700' };
    return null;
  };

  const visibleCoupons = useMemo(
    () =>
      typeFilter === 'all'
        ? coupons
        : coupons.filter((c) => c.type === typeFilter),
    [coupons, typeFilter]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Coupons
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage discount coupons and promotional codes
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
        >
          <Plus size={18} />
          Add Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Coupons</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Tag className="w-10 h-10 text-amber-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Coupons</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
            <Percent className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Used</p>
              <p className="text-2xl font-bold">{stats.used}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Savings</p>
              <p className="text-2xl font-bold">{formatBDT(stats.savings)}</p>
            </div>
            <Tag className="w-10 h-10 text-purple-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or description…"
            className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
          />
        </form>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="all">All types</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed</option>
            <option value="FREE_SHIPPING">Free shipping</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Type / Discount</th>
                <th className="px-6 py-3">Min Order</th>
                <th className="px-6 py-3">Restriction</th>
                <th className="px-6 py-3">Validity</th>
                <th className="px-6 py-3">Usage</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" />
                    Loading coupons…
                  </td>
                </tr>
              ) : visibleCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No coupons found. Click "Add Coupon" to create your first coupon.
                  </td>
                </tr>
              ) : (
                visibleCoupons.map((c) => {
                  const exp = expiryState(c);
                  return (
                    <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-3 align-top">
                        <div className="font-mono font-semibold text-gray-900 dark:text-white">
                          {c.code}
                        </div>
                        {c.description && (
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2 max-w-xs">
                            {c.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 align-top">
                        <div className="text-sm font-medium">{renderDiscount(c)}</div>
                        {c.type === 'PERCENTAGE' && c.maxDiscount ? (
                          <div className="text-xs text-gray-500">
                            Cap: {formatBDT(c.maxDiscount)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-3 align-top text-sm">
                        {c.minOrder ? formatBDT(c.minOrder) : '—'}
                      </td>
                      <td className="px-6 py-3 align-top text-sm">
                        {(() => {
                          const productCount = c.allowedProducts?.length ?? 0;
                          const categoryCount = c.allowedCategories?.length ?? 0;
                          if (productCount === 0 && categoryCount === 0) {
                            return (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                                All products
                              </span>
                            );
                          }
                          return (
                            <div className="flex flex-col gap-1">
                              {productCount > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 w-fit">
                                  {productCount} product{productCount === 1 ? '' : 's'}
                                </span>
                              )}
                              {categoryCount > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 w-fit">
                                  {categoryCount} categor{categoryCount === 1 ? 'y' : 'ies'}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-3 align-top text-sm">
                        <div>{formatDate(c.startDate)} → {formatDate(c.endDate)}</div>
                        {exp && (
                          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${exp.cls}`}>
                            {exp.label}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 align-top text-sm">
                        {usageLabel(c)}
                      </td>
                      <td className="px-6 py-3 align-top">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            c.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {c.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3 align-top">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggle(c)}
                            disabled={togglingId === c._id}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                            title={c.active ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-2 rounded hover:bg-red-50 text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t dark:border-gray-700 text-sm">
            <div className="text-gray-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchCoupons(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg disabled:opacity-50 dark:border-gray-700"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={() => fetchCoupons(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages || isLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg disabled:opacity-50 dark:border-gray-700"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl my-8 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold">
                {form._id ? 'Edit Coupon' : 'New Coupon'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={saving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. SUMMER25"
                    className="w-full px-3 py-2 border rounded-lg font-mono dark:bg-gray-900 dark:border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as CouponType })
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed amount</option>
                    <option value="FREE_SHIPPING">Free shipping</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {form.type === 'PERCENTAGE'
                      ? 'Discount (%) *'
                      : form.type === 'FIXED'
                      ? 'Discount (৳) *'
                      : 'Value (ignored)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={form.type === 'PERCENTAGE' ? 100 : undefined}
                    value={form.value}
                    onChange={(e) =>
                      setForm({ ...form, value: Number(e.target.value) })
                    }
                    disabled={form.type === 'FREE_SHIPPING'}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Max discount cap (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.maxDiscount}
                    onChange={(e) =>
                      setForm({ ...form, maxDiscount: e.target.value })
                    }
                    disabled={form.type !== 'PERCENTAGE'}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Min order (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.minOrder}
                    onChange={(e) =>
                      setForm({ ...form, minOrder: e.target.value })
                    }
                    placeholder="Optional"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Usage limit (total)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.usageLimit}
                    onChange={(e) =>
                      setForm({ ...form, usageLimit: e.target.value })
                    }
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Per-user limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.perUserLimit}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        perUserLimit: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) =>
                        setForm({ ...form, active: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    End date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Internal note for staff or customer-facing description"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Package className="w-4 h-4" />
                    Restrict to specific products
                  </span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Leave empty to apply coupon to all products. Add products to
                  make the coupon valid only on those items.
                </p>
                <ProductPicker
                  selected={form.allowedProducts}
                  onChange={(products) =>
                    setForm({ ...form, allowedProducts: products })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 border rounded-lg dark:border-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {form._id ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
