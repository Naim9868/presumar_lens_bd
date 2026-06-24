'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Printer, Edit2, Save, X, Package, User,
  Phone, Mail, MapPin, Truck, CreditCard, Clock,
  CheckCircle2, AlertTriangle, MessageSquare, ExternalLink,
  Shield, ChevronDown, Plus, Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Order, OrderStatus, STATUS_CONFIG, FraudResult } from '@/types/order';

// ── Print styles injected inline ─────────────────────────
const PRINT_STYLES = `
  @media print {
    body > *:not(#invoice-print) { display: none !important; }
    #invoice-print { display: block !important; position: fixed; inset: 0; background: white; z-index: 9999; padding: 32px; }
    @page { margin: 20mm; }
  }
`;

interface TimelineEvent {
  _id: string;
  status: string;
  source: string;
  note?: string;
  createdAt: string;
}

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:          ['CONFIRMED', 'CANCELLED'],
  AWAITING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['PROCESSING', 'CANCELLED'],
  PROCESSING:       ['PACKED', 'CANCELLED'],
  PACKED:           ['READY_TO_SHIP', 'CANCELLED'],
  READY_TO_SHIP:    ['SHIPPED'],
  SHIPPED:          ['IN_TRANSIT', 'DELIVERED'],
  IN_TRANSIT:       ['OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED'],
  DELIVERED:        ['RETURN_REQUESTED', 'REFUNDED'],
  CANCELLED:        ['CONFIRMED'],
  RETURN_REQUESTED: ['RETURNED', 'REFUNDED'],
  RETURNED:         ['REFUNDED'],
  REFUNDED:         [],
};

interface Props { order: Order }

export default function OrderDetailClient({ order: initial }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [order, setOrder] = useState<Order>(initial);
  const [editMode, setEditMode] = useState(sp.get('edit') === 'true');
  const [saving, setSaving] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [fraud, setFraud] = useState<FraudResult | null>(null);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Edit state
  const [editData, setEditData] = useState({
    shipping: { ...order.shipping },
    paymentStatus: order.paymentStatus,
    status: order.status,
  });

  useEffect(() => {
    fetch(`/api/orders/${order._id}/events`).then(r => r.json()).then(d => {
      if (d.events) setTimeline(d.events);
    });
  }, [order._id]);

  const fetchFraud = async () => {
    const res = await fetch(`/api/orders/${order._id}/fraud`);
    const data = await res.json();
    if (data.fraud) setFraud(data.fraud);
  };

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = PRINT_STYLES;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  const handleStatusChange = async (status: OrderStatus) => {
    setStatusDropdown(false);
    try {
      const res = await fetch(`/api/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success || data.order) {
        setOrder(o => ({ ...o, status }));
        toast.success(`Status → ${STATUS_CONFIG[status].label}`);
        // Refresh timeline
        fetch(`/api/orders/${order._id}/events`).then(r => r.json()).then(d => { if (d.events) setTimeline(d.events); });
      } else toast.error(data.error || 'Update failed');
    } catch { toast.error('Failed'); }
    finally { router.refresh();}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping: editData.shipping,
          paymentStatus: editData.paymentStatus,
        }),
      });
      const data = await res.json();
      if (data.success || data.order) {
        setOrder(o => ({ ...o, shipping: editData.shipping, paymentStatus: editData.paymentStatus }));
        setEditMode(false);
        toast.success('Order updated');
      } else toast.error(data.error || 'Failed');
    } catch { toast.error('Failed to save'); }
    finally {
       setSaving(false); 
       router.refresh();
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/orders/${order._id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: noteText }),
      });
      const data = await res.json();
      if (data.success || data.order) {
        toast.success('Note added');
        setNoteText('');
        setShowNoteInput(false);
        // Refresh order
        const oRes = await fetch(`/api/orders/${order._id}`);
        const oData = await oRes.json();
        if (oData.data?.order) setOrder(oData.data.order);
      } else toast.error(data.error || 'Failed');
    } catch { toast.error('Failed'); }
    finally {
       setAddingNote(false); 
       router.refresh();
    }
  };

  const statusCfg = STATUS_CONFIG[order.status];
  const nextStatuses = STATUS_TRANSITIONS[order.status] || [];

  return (
    <>
      {/* Print Invoice (hidden until print) */}
      <div id="invoice-print" style={{ display: 'none' }} ref={printRef}>
        <div style={{ fontFamily: 'serif', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 16, marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>{process.env.NEXT_PUBLIC_STORE_NAME || 'Store'}</h1>
              <p style={{ color: '#666', margin: '4px 0 0' }}>{process.env.NEXT_PUBLIC_STORE_EMAIL || ''}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: 18, fontWeight: 'bold', margin: 0 }}>INVOICE</h2>
              <p style={{ margin: '4px 0 0', color: '#666' }}>#{order.orderId}</p>
              <p style={{ margin: '2px 0 0', color: '#666', fontSize: 12 }}>{format(new Date(order.createdAt), 'dd MMMM yyyy')}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: 8 }}>Bill To:</p>
              <p style={{ margin: 0 }}>{order.shipping.name}</p>
              <p style={{ margin: '2px 0', color: '#666' }}>{order.shipping.phone}</p>
              {order.shipping.email && <p style={{ margin: '2px 0', color: '#666' }}>{order.shipping.email}</p>}
              <p style={{ margin: '2px 0', color: '#666' }}>{order.shipping.address}, {order.shipping.area}, {order.shipping.city}</p>
            </div>
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: 8 }}>Order Info:</p>
              <p style={{ margin: 0 }}>Status: {STATUS_CONFIG[order.status].label}</p>
              <p style={{ margin: '2px 0', color: '#666' }}>Payment: {order.paymentMethod}</p>
              <p style={{ margin: '2px 0', color: '#666' }}>Delivery: {order.delivery.type.replace('_', ' ')}</p>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                {['Product', 'SKU', 'Qty', 'Unit Price', 'Total'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{item.snapshot.name}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#666' }}>{item.snapshot.sku || '—'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{item.quantity}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>৳{item.price.sale.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 'bold' }}>৳{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <div style={{ width: 240 }}>
              {[
                { label: 'Subtotal', value: order.pricing.subtotal },
                { label: 'Delivery', value: order.pricing.deliveryCharge },
                { label: 'Discount', value: -(order.pricing.couponDiscount + order.pricing.campaignDiscount) },
                { label: 'Tax', value: order.pricing.tax },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <span style={{ color: '#666' }}>{label}</span>
                  <span>৳{value.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #000', marginTop: 8, fontWeight: 'bold', fontSize: 16 }}>
                <span>Total</span>
                <span>৳{order.pricing.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #eee', paddingTop: 16, textAlign: 'center', color: '#999', fontSize: 11 }}>
            Thank you for your order! · {process.env.NEXT_PUBLIC_APP_URL || ''}
          </div>
        </div>
      </div>

      {/* Main page */}
      <div className="min-h-screen bg-[#F8F7F4]">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-gray-900">#{order.orderId}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{format(new Date(order.createdAt), 'dd MMMM yyyy, h:mm a')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Status change dropdown */}
              {nextStatuses.length > 0 && !editMode && (
                <div className="relative">
                  <button onClick={() => setStatusDropdown(!statusDropdown)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    Update Status <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {statusDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      {nextStatuses.map(s => {
                        const c = STATUS_CONFIG[s];
                        return (
                          <button key={s} onClick={() => handleStatusChange(s)}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-gray-50 ${c.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} /> {c.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              <button onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Printer className="w-4 h-4" /> Print Invoice
              </button>
              {editMode ? (
                <>
                  <button onClick={() => setEditMode(false)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors">
                  <Edit2 className="w-4 h-4" /> Edit Order
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-6 grid grid-cols-3 gap-5">
          {/* Left col (2/3) */}
          <div className="col-span-2 space-y-5">
            {/* Items */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-700">Order Items</h2>
                <span className="text-xs text-gray-400">({order.items.length})</span>
              </div>
              <div className="divide-y divide-gray-50">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-4">
                    {item.snapshot.image ? (
                      <img src={item.snapshot.image} alt={item.snapshot.name}
                        className="w-14 h-14 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-gray-200" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{item.snapshot.name}</p>
                      {item.snapshot.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {item.snapshot.sku}</p>}
                      {item.variantKey && <p className="text-xs text-gray-400">Variant: {item.variantKey}</p>}
                      {item.snapshot.attributes && Object.entries(item.snapshot.attributes).map(([k, v]) => (
                        <span key={k} className="inline-block mr-2 mt-1 px-2 py-0.5 bg-gray-100 rounded text-[11px] text-gray-600">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">৳{item.total.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">৳{item.price.sale.toLocaleString()} × {item.quantity}</p>
                      {item.price.original > item.price.sale && (
                        <p className="text-xs text-gray-300 line-through">৳{item.price.original.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Pricing summary */}
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                {[
                  { label: 'Subtotal', value: order.pricing.subtotal },
                  { label: 'Delivery Charge', value: order.pricing.deliveryCharge },
                  ...(order.pricing.couponDiscount ? [{ label: `Coupon (${order.coupon?.code})`, value: -order.pricing.couponDiscount }] : []),
                  ...(order.pricing.campaignDiscount ? [{ label: 'Campaign Discount', value: -order.pricing.campaignDiscount }] : []),
                  ...(order.pricing.tax ? [{ label: 'Tax', value: order.pricing.tax }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className={`text-sm ${value < 0 ? 'text-green-600' : 'text-gray-700'}`}>
                      {value < 0 ? '−' : ''}৳{Math.abs(value).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-2">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">৳{order.pricing.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Shipping (editable) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-700">Shipping Address</h2>
              </div>
              <div className="p-5">
                {editMode ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Full Name', key: 'name', type: 'text' },
                      { label: 'Phone', key: 'phone', type: 'text' },
                      { label: 'Email', key: 'email', type: 'email' },
                      { label: 'Address', key: 'address', type: 'text' },
                      { label: 'Area', key: 'area', type: 'text' },
                      { label: 'City', key: 'city', type: 'text' },
                      { label: 'Postcode', key: 'postcode', type: 'text' },
                      { label: 'Division', key: 'division', type: 'text' },
                      { label: 'Landmark', key: 'landmark', type: 'text' },
                    ].map(({ label, key, type }) => (
                      <div key={key} className={key === 'address' ? 'col-span-2' : ''}>
                        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                        <input type={type}
                          value={(editData.shipping as Record<string, string>)[key] || ''}
                          onChange={(e) => setEditData(d => ({ ...d, shipping: { ...d.shipping, [key]: e.target.value } }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: User, label: 'Name', value: order.shipping.name },
                      { icon: Phone, label: 'Phone', value: order.shipping.phone },
                      { icon: Mail, label: 'Email', value: order.shipping.email },
                      { icon: MapPin, label: 'Address', value: `${order.shipping.address}, ${order.shipping.area}, ${order.shipping.city}` },
                      { icon: MapPin, label: 'Division', value: order.shipping.division },
                      { icon: MapPin, label: 'Landmark', value: order.shipping.landmark },
                    ].filter(f => f.value).map(({ icon: Icon, label, value }) => (
                      <div key={label}>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-700">Order Timeline</h2>
              </div>
              <div className="p-5">
                {timeline.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No timeline events yet</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-3.5 top-3 bottom-3 w-px bg-gray-100" />
                    <div className="space-y-4">
                      {timeline.map((event, i) => {
                        const isFirst = i === 0;
                        const cfg = STATUS_CONFIG[event.status as OrderStatus];
                        return (
                          <div key={event._id} className="flex items-start gap-4 relative">
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${isFirst ? `border-violet-500 bg-violet-50` : 'border-gray-200 bg-white'}`}>
                              <div className={`w-2 h-2 rounded-full ${isFirst ? 'bg-violet-500' : cfg?.dot || 'bg-gray-300'}`} />
                            </div>
                            <div className="flex-1 pb-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-800">
                                  {cfg?.label || event.status}
                                </p>
                                <span className="text-[11px] text-gray-400">
                                  {format(new Date(event.createdAt), 'dd MMM, h:mm a')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-gray-400 uppercase font-medium">{event.source}</span>
                                {event.note && <span className="text-xs text-gray-500">· {event.note}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right col (1/3) */}
          <div className="space-y-5">
            {/* Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-700">Payment</h2>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Method</span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${order.paymentMethod === 'COD' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                    {order.paymentMethod}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  {editMode ? (
                    <select value={editData.paymentStatus}
                      onChange={(e) => setEditData(d => ({ ...d, paymentStatus: e.target.value as typeof d.paymentStatus }))}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-400">
                      {['PENDING', 'PAID', 'FAILED', 'REFUNDED'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                      order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                      order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
                      order.paymentStatus === 'REFUNDED' ? 'bg-gray-100 text-gray-600' :
                      'bg-amber-100 text-amber-700'
                    }`}>{order.paymentStatus}</span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-lg font-bold text-gray-900">৳{order.pricing.total.toLocaleString()}</span>
                </div>
                {order.coupon && (
                  <div className="bg-green-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-green-700">🏷 {order.coupon.code}</p>
                    <p className="text-[11px] text-green-600 mt-0.5">
                      {order.coupon.type === 'PERCENTAGE' ? `${order.coupon.value}% off` :
                       order.coupon.type === 'FREE_SHIPPING' ? 'Free shipping' : `৳${order.coupon.value} off`}
                      {' '}· Saved ৳{order.pricing.couponDiscount.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Marketing Source */}
            {order.marketing?.source && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-700">Traffic Source</h2>
                </div>
                <div className="p-5 space-y-2">
                  {[
                    { label: 'Source', value: order.marketing.source },
                    { label: 'Medium', value: order.marketing.medium },
                    { label: 'Campaign', value: order.marketing.campaign },
                    { label: 'Referrer', value: order.marketing.referrer },
                  ].filter(f => f.value).map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{label}</span>
                      <span className="text-xs font-semibold text-gray-700 capitalize">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Courier */}
            {order.shipment && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-700">Courier</h2>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Provider</span>
                    <span className="text-xs font-semibold text-gray-700">{order.shipment.provider}</span>
                  </div>
                  {order.shipment.trackingId && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Tracking ID</span>
                      <span className="text-xs font-mono font-semibold text-gray-700">{order.shipment.trackingId}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Status</span>
                    <span className="text-xs font-semibold text-blue-600">{order.shipment.status}</span>
                  </div>
                  {order.shipment.trackingUrl && (
                    <a href={order.shipment.trackingUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-violet-500 hover:underline font-medium mt-1">
                      Track parcel <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Fraud Score */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2"> 
                  <Shield className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-700">Fraud Detection</h2>
                </div>
                {!fraud && (
                  <button onClick={fetchFraud} className="text-xs text-violet-500 hover:underline font-medium">
                    Check now
                  </button>
                )}
              </div>
              <div className="p-5">
                {fraud ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Risk Score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            fraud.risk === 'high' ? 'bg-red-500' : fraud.risk === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                          }`} style={{ width: `${fraud.score}%` }} />
                        </div>
                        <span className={`text-sm font-bold ${
                          fraud.risk === 'high' ? 'text-red-600' : fraud.risk === 'medium' ? 'text-amber-600' : 'text-green-600'
                        }`}>{fraud.score}/100</span>
                      </div>
                    </div>
                    <div className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                      fraud.risk === 'high' ? 'bg-red-50 text-red-700' :
                      fraud.risk === 'medium' ? 'bg-amber-50 text-amber-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                      {fraud.risk === 'high' ? '🚨 High Risk' : fraud.risk === 'medium' ? '⚠️ Medium Risk' : '✅ Low Risk'}
                    </div>
                    {fraud.flags.length > 0 && (
                      <div className="space-y-1.5">
                        {fraud.flags.map((f, i) => (
                          <div key={i} className={`flex items-start gap-1.5 text-[11px] ${
                            f.severity === 'high' ? 'text-red-600' : f.severity === 'medium' ? 'text-amber-600' : 'text-gray-500'
                          }`}>
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {f.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">Click &quot;Check now&quot; to analyse this order</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-700">Internal Notes</h2>
                </div>
                <button onClick={() => setShowNoteInput(!showNoteInput)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                {showNoteInput && (
                  <div className="space-y-2">
                    <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Write a note..."
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setShowNoteInput(false); setNoteText(''); }}
                        className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                      <button onClick={handleAddNote} disabled={!noteText.trim() || addingNote}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50">
                        {addingNote ? 'Adding...' : 'Add Note'}
                      </button>
                    </div>
                  </div>
                )}
                {order.notes?.length > 0 ? order.notes.map((note) => (
                  <div key={note._id} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-sm text-gray-700 leading-relaxed">{note.text}</p>
                    <p className="text-[11px] text-gray-400 mt-1.5">{format(new Date(note.createdAt), 'dd MMM yyyy, h:mm a')}</p>
                  </div>
                )) : (
                  !showNoteInput && <p className="text-xs text-gray-400 text-center py-2">No notes yet</p>
                )}
              </div>
            </div>

            {/* Meta Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-700">Order Meta</h2>
              </div>
              <div className="p-5 space-y-2">
                {[
                  { label: 'IP Address', value: order.meta?.ip },
                  { label: 'Device', value: order.meta?.device },
                  { label: 'Platform', value: order.meta?.platform },
                  { label: 'Delivery', value: order.delivery.type.replace('_', ' ') },
                  { label: 'SMS Sent', value: order.notifications.sms ? '✓' : '✗' },
                  { label: 'WhatsApp', value: order.notifications.whatsapp ? '✓' : '✗' },
                ].filter(f => f.value).map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">{label}</span>
                    <span className="text-xs text-gray-600 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}