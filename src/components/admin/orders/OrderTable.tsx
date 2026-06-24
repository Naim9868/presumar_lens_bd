'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    MoreVertical, Eye, Edit2, Trash2, MessageSquare, Truck,
    Shield, Send, ChevronDown, AlertTriangle, CheckCircle,
    XCircle, Package, MapPin, Phone, Mail, User, ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Order, OrderStatus, STATUS_CONFIG, FraudResult } from '@/types/order';

const COURIERS = ['STEADFAST', 'PATHAO', 'REDX', 'PAPERFLY'];

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
    facebook: { label: 'FB', cls: 'bg-blue-100 text-blue-700' },
    instagram: { label: 'IG', cls: 'bg-pink-100 text-pink-700' },
    tiktok: { label: 'TT', cls: 'bg-gray-900 text-white' },
    google: { label: 'G', cls: 'bg-red-100 text-red-700' },
    youtube: { label: 'YT', cls: 'bg-red-100 text-red-700' },
    whatsapp: { label: 'WA', cls: 'bg-green-100 text-green-700' },
    telegram: { label: 'TG', cls: 'bg-sky-100 text-sky-700' },
    organic: { label: 'ORG', cls: 'bg-emerald-100 text-emerald-700' },
    direct: { label: 'DIR', cls: 'bg-gray-100 text-gray-600' },
};

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    AWAITING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['PACKED', 'CANCELLED'],
    PACKED: ['READY_TO_SHIP', 'CANCELLED'],
    READY_TO_SHIP: ['SHIPPED'],
    SHIPPED: ['IN_TRANSIT', 'DELIVERED'],
    IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED'],
    DELIVERED: ['RETURN_REQUESTED', 'REFUNDED'],
    CANCELLED: ['CONFIRMED'],
    RETURN_REQUESTED: ['RETURNED', 'REFUNDED'],
    RETURNED: ['REFUNDED'],
    REFUNDED: [],
};

interface Props {
    orders: Order[];
    loading: boolean;
    onStatusUpdate: (orderId: string, status: OrderStatus) => void;
    onAddNote: (order: Order) => void;
    onRefresh: () => void;
}

function FraudBadge({ score, risk }: { score: number; risk: string }) {
    const cls = risk === 'high' ? 'bg-red-100 text-red-700' : risk === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
    const icon = risk === 'high' ? '🚨' : risk === 'medium' ? '⚠️' : '✓';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${cls}`}>
            {icon} {score}
        </span>
    );
}

function StatusBadge({ status, orderId, onUpdate }: { status: OrderStatus; orderId: string; onUpdate: (id: string, s: OrderStatus) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const cfg = STATUS_CONFIG[status];
    const transitions = STATUS_TRANSITIONS[status] || [];

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => transitions.length > 0 && setOpen(!open)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border} transition-colors ${transitions.length > 0 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
                {transitions.length > 0 && <ChevronDown className="w-3 h-3" />}
            </button>
            {open && transitions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Change to</p>
                    {transitions.map((s) => {
                        const c = STATUS_CONFIG[s];
                        return (
                            <button key={s} onClick={() => { onUpdate(orderId, s); setOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-gray-50 ${c.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                                {c.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ActionsMenu({ order, onAddNote, onRefresh }: { order: Order; onAddNote: (o: Order) => void; onRefresh: () => void }) {
    const [open, setOpen] = useState(false);
    const [courierHover, setCourierHover] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleCheckFraud = async () => {
        setOpen(false);
        const res = await fetch(`/api/orders/${order._id}/fraud`);
        const data = await res.json();
        if (data.fraud) {
            const { risk, score, flags } = data.fraud as FraudResult;
            toast(`Fraud: ${risk.toUpperCase()} (${score}/100)\n${flags.map(f => f.message).join(', ')}`, {
                duration: 5000,
                icon: risk === 'high' ? '🚨' : risk === 'medium' ? '⚠️' : '✅',
            });
        }
    };

    const handleSendToCourier = async (provider: string) => {
        setOpen(false);
        try {
            const res = await fetch('/api/shipments/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order._id, provider }),
            });
            const data = await res.json();
            if (data.success || data.shipment) {
                toast.success(`Booked with ${provider}`);
                onRefresh();
            } else toast.error(data.error || 'Booking failed');
        } catch { toast.error('Failed to book courier'); }
    };

    const handleSendToMeta = async () => {
        setOpen(false);
        try {
            await fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'purchase',
                    sessionId: `admin-${order._id}`,
                    value: order.pricing.total,
                    orderId: order._id,
                    fbclid: order.marketing?.fbclid,
                }),
            });
            toast.success('Event sent to Meta');
        } catch { toast.error('Failed to send event'); }
    };

    const handleDelete = async () => {
        if (!confirm(`Delete order ${order.orderId}? This cannot be undone.`)) return;
        setOpen(false);
        try {
            const res = await fetch(`/api/orders/${order._id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) { toast.success('Order deleted'); onRefresh(); }
            else toast.error(data.error || 'Failed');
        } catch { toast.error('Failed to delete'); }
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(!open)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <MoreVertical className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                    <button onClick={handleCheckFraud}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                        <Shield className="w-4 h-4 text-amber-500" /> Check Fraud
                    </button>

                    {/* Send to Courier with submenu */}
                    <div className="relative" onMouseEnter={() => setCourierHover(true)} onMouseLeave={() => setCourierHover(false)}>
                        <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 justify-between">
                            <span className="flex items-center gap-2.5"><Truck className="w-4 h-4 text-blue-500" /> Send to Courier</span>
                            <ChevronDown className="w-3 h-3 -rotate-90 text-gray-400" />
                        </button>
                        {courierHover && (
                            <div className="absolute right-full top-0 mr-1 w-36 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                                {COURIERS.map(c => (
                                    <button key={c} onClick={() => handleSendToCourier(c)}
                                        className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                                        {c}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={handleSendToMeta}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                        <Send className="w-4 h-4 text-blue-600" /> Send to Meta
                    </button>
                    <button onClick={() => { setOpen(false); onAddNote(order); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                        <MessageSquare className="w-4 h-4 text-green-500" /> Add Note
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button onClick={() => { setOpen(false); router.push(`/admin/orders/${order._id}`); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                        <Eye className="w-4 h-4 text-gray-500" /> View
                    </button>
                    <button onClick={() => { setOpen(false); router.push(`/admin/orders/${order._id}?edit=true`); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                        <Edit2 className="w-4 h-4 text-violet-500" /> Edit
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button onClick={handleDelete}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5">
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

export default function OrderTable({ orders, loading, onStatusUpdate, onAddNote, onRefresh }: Props) {
    const router = useRouter();

    if (loading) {
        return (
            <div className="w-full overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            {['Order', 'Customer', 'Products', 'Status', 'Total', 'Courier', 'Fraud', ''].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <tr key={i} className="border-b border-gray-50">
                                {Array.from({ length: 8 }).map((_, j) => (
                                    <td key={j} className="px-4 py-4">
                                        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (!orders.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-gray-400 font-medium">No orders found</p>
                <p className="text-gray-300 text-sm mt-1">Try adjusting your filters</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50/70 border-t border-b border-gray-400">
                        {['Order Info', 'Customer', 'Products', 'Status', 'Payment', 'Courier', 'Fraud', 'Actions'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap first:pl-5 last:pr-5">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {orders.map((order) => {
                        const src = order.marketing?.source?.toLowerCase();
                        const srcBadge = src ? SOURCE_BADGE[src] : SOURCE_BADGE.direct;
                        const fraud = order.fraudScore;

                        return (
                            <tr key={order._id} className="hover:bg-gray-50/50 border-b border-gray-300 transition-colors group">
                                {/* 1. Order Info */}
                                <td className="px-4 py-3.5 pl-5">
                                    <div className="space-y-1">
                                        <button onClick={() => router.push(`/admin/orders/${order._id}`)}
                                            className="text-sm font-bold text-violet-600 hover:text-violet-800 hover:underline flex items-center gap-1">
                                            #{order.orderId}
                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                        {srcBadge && (
                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${srcBadge.cls}`}>
                                                {srcBadge.label}
                                            </span>
                                        )}
                                        <p className="text-[11px] text-gray-400">{format(new Date(order.createdAt), 'dd MMM yy, h:mm a')}</p>
                                        <p className="text-[11px] text-gray-300">Updated {format(new Date(order.updatedAt), 'dd MMM, h:mm a')}</p>
                                    </div>
                                </td>

                                {/* 2. Customer */}
                                <td className="px-4 py-3.5">
                                    <div className="space-y-1 min-w-[160px]">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                            <span className="text-sm font-semibold text-gray-800 truncate max-w-[130px]">{order.shipping.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                            <span className="text-xs text-gray-500">{order.shipping.phone}</span>
                                        </div>
                                        {order.shipping.email && (
                                            <div className="flex items-center gap-1.5">
                                                <Mail className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                                <span className="text-xs text-gray-400 truncate max-w-[130px]">{order.shipping.email}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                            <span className="text-xs text-gray-400 truncate max-w-[130px]">{order.shipping.area}, {order.shipping.city}</span>
                                        </div>
                                        <button onClick={() => onAddNote(order)}
                                            className="flex items-center gap-1 text-[11px] text-violet-500 hover:text-violet-700 font-medium mt-0.5">
                                            <MessageSquare className="w-3 h-3" />
                                            {order.notes?.length ? `${order.notes.length} note${order.notes.length > 1 ? 's' : ''}` : 'Add note'}
                                        </button>
                                    </div>
                                </td>

                                {/* 3. Products */}
                                <td className="px-4 py-3.5">
                                    <div className="space-y-1.5 min-w-[160px] max-w-[220px]">
                                        {order.items.slice(0, 2).map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-2">

                                                {item.snapshot?.image ? (
                                                    <img
                                                        src={item.snapshot.image}
                                                        alt={item.snapshot?.name || 'Product'}
                                                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                        <Package className="w-3.5 h-3.5 text-gray-300" />
                                                    </div>
                                                )}

                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-gray-700 truncate">
                                                        {item.snapshot?.name || 'Unnamed Product'}
                                                    </p>

                                                    <p className="text-[11px] text-gray-400">
                                                        ×{item.quantity} · ৳{item.price?.sale?.toLocaleString?.() || 0}
                                                    </p>
                                                </div>

                                            </div>
                                        ))}
                                        {order.items.length > 2 && (
                                            <p className="text-[11px] text-gray-400 pl-10">+{order.items.length - 2} more items</p>
                                        )}
                                    </div>
                                </td>

                                {/* 4. Status */}
                                <td className="px-4 py-3.5">
                                    <StatusBadge status={order.status} orderId={order._id} onUpdate={onStatusUpdate} />
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        {order.delivery.type === 'INSIDE_DHAKA' ? '🏙 Dhaka' : '🗺 Outside Dhaka'}
                                    </p>
                                </td>

                                {/* 5. Payment */}
                                <td className="px-4 py-3.5">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-gray-900">৳{order.pricing.total.toLocaleString()}</p>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${order.paymentMethod === 'COD' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {order.paymentMethod}
                                        </span>
                                        <div>
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${order.paymentStatus === 'PAID' ? 'text-green-600' :
                                                    order.paymentStatus === 'FAILED' ? 'text-red-500' :
                                                        order.paymentStatus === 'REFUNDED' ? 'text-gray-500' : 'text-amber-500'
                                                }`}>
                                                {order.paymentStatus === 'PAID' ? <CheckCircle className="w-3 h-3" /> :
                                                    order.paymentStatus === 'FAILED' ? <XCircle className="w-3 h-3" /> :
                                                        <AlertTriangle className="w-3 h-3" />}
                                                {order.paymentStatus}
                                            </span>
                                        </div>
                                        {order.coupon && (
                                            <p className="text-[11px] text-green-600">🏷 {order.coupon.code}</p>
                                        )}
                                    </div>
                                </td>

                                {/* 6. Courier */}
                                <td className="px-4 py-3.5">
                                    {order.shipment ? (
                                        <div className="space-y-1">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold">
                                                <Truck className="w-3 h-3" />
                                                {order.shipment.provider}
                                            </span>
                                            {order.shipment.trackingId && (
                                                <p className="text-[11px] text-gray-500 font-mono">{order.shipment.trackingId}</p>
                                            )}
                                            <p className="text-[11px] text-gray-400">{order.shipment.status}</p>
                                            {order.shipment.trackingUrl && (
                                                <a href={order.shipment.trackingUrl} target="_blank" rel="noreferrer"
                                                    className="text-[11px] text-violet-500 hover:underline flex items-center gap-0.5">
                                                    Track <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-gray-300 font-medium">Not booked</span>
                                    )}
                                </td>

                                {/* 7. Fraud */}
                                <td className="px-4 py-3.5">
                                    {fraud ? (
                                        <div className="space-y-1">
                                            <FraudBadge score={fraud.score} risk={fraud.risk} />
                                            {fraud.flags.slice(0, 2).map((f, i) => (
                                                <p key={i} className="text-[10px] text-gray-400 leading-tight">{f.message.slice(0, 30)}…</p>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-gray-300">—</span>
                                    )}
                                </td>

                                {/* 8. Actions */}
                                <td className="px-4 py-3.5 pr-5">
                                    <ActionsMenu order={order} onAddNote={onAddNote} onRefresh={onRefresh} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}