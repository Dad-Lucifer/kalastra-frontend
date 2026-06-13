import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/api';

type DeliveryStatus = 'order_confirmed' | 'out_for_delivery' | 'delivered';
type DateFilter = 'all' | 'today' | 'last_week' | 'this_month' | 'last_month';

interface OrderItem {
  product_id: string;
  product_name?: string;
  name?: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

interface Order {
  id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  shipping_address: {
    full_name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  items: OrderItem[];
  total_amount: number;
  payment_method: string;
  payment_status: string;
  delivery_status: DeliveryStatus;
  created_at: string;
}

const STATUS_CONFIG: Record<
  DeliveryStatus,
  { label: string; color: string; bg: string; border: string; glow: string; icon: string }
> = {
  order_confirmed: {
    label: 'Confirmed',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.35)',
    glow: 'rgba(59,130,246,0.25)',
    icon: '✦',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    glow: 'rgba(245,158,11,0.25)',
    icon: '◈',
  },
  delivered: {
    label: 'Delivered',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.35)',
    glow: 'rgba(16,185,129,0.25)',
    icon: '◉',
  },
};

const DATE_FILTER_OPTIONS: { id: DateFilter; label: string }[] = [
  { id: 'all', label: 'All Orders' },
  { id: 'today', label: 'Today' },
  { id: 'last_week', label: 'Last 7 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
];

function getDateRange(filter: DateFilter): { from: Date | null; to: Date | null } {
  const now = new Date();
  switch (filter) {
    case 'today': {
      const from = new Date(now); from.setHours(0, 0, 0, 0);
      const to   = new Date(now); to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case 'last_week': {
      const from = new Date(now); from.setDate(now.getDate() - 6); from.setHours(0, 0, 0, 0);
      return { from, to: now };
    }
    case 'this_month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: now };
    }
    case 'last_month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from, to };
    }
    default:
      return { from: null, to: null };
  }
}

function applyDateFilter(orders: Order[], filter: DateFilter): Order[] {
  const { from, to } = getDateRange(filter);
  if (!from) return orders;
  return orders.filter((o) => {
    const d = new Date(o.created_at);
    return d >= from && (!to || d <= to);
  });
}

function fmtCurrency(v: number) {
  return '₹' + Math.round(v).toLocaleString('en-IN');
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-8">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/15" />
        <div className="absolute inset-0 rounded-full border-2 border-t-[#D4AF37] border-r-transparent border-b-transparent border-l-transparent animate-spin shadow-[0_0_20px_rgba(212,175,55,0.3)]" />
        <div className="absolute inset-3 rounded-full border-2 border-b-[#FFDF73] border-r-transparent border-t-transparent border-l-transparent animate-spin shadow-[0_0_15px_rgba(255,223,115,0.3)]" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
      </div>
      <p className="text-[#D4AF37] text-xs uppercase tracking-[0.4em] font-cinzel animate-pulse font-bold">
        Loading Manifest...
      </p>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const res = await apiRequest('/admin/orders');
    if (res.success && res.data) setOrders(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const updateStatus = async (id: string, status: DeliveryStatus) => {
    const res = await apiRequest(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ delivery_status: status }),
    });
    if (res.success) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, delivery_status: status } : o));
    }
  };

  const filtered = applyDateFilter(orders, dateFilter)
    .filter((o) => statusFilter === 'all' || o.delivery_status === statusFilter)
    .filter((o) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.user_name?.toLowerCase().includes(q) ||
        o.user_email?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="font-outfit text-[#FDFBF7]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 relative">
          <div className="relative">
            <div className="absolute -left-4 sm:-left-6 top-1 bottom-1 w-1 sm:w-1.5 bg-gradient-to-b from-[#FFDF73] to-[#997A15] rounded-r-full shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
            <h1 className="text-2xl sm:text-5xl font-black gold-gradient-text font-cinzel tracking-tight drop-shadow-lg">
              Order Manifest
            </h1>
            <p className="text-xs sm:text-sm text-[#A08BA6] mt-2 font-light tracking-wide">
              {filtered.length} entries located in the sanctum.
            </p>
          </div>
          <button
            onClick={loadOrders}
            className="group relative self-start sm:self-auto px-7 py-3 bg-[#0f0518]/50 backdrop-blur-md overflow-hidden rounded-xl border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-[#FFDF73] opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <span className="relative z-10 text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37] group-hover:text-[#FFDF73] transition-colors duration-300">
              ↻ Refresh
            </span>
          </button>
        </div>

        {/* Filters Panel */}
        <div className="glass-panel rounded-2xl p-5 sm:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#D4AF37]/8 to-transparent rounded-bl-full blur-3xl pointer-events-none" />

          {/* Date Filter */}
          <div className="mb-6">
            <p className="text-[9px] font-cinzel font-black uppercase tracking-[0.3em] text-[#A08BA6] mb-3">Time Period</p>
            <div className="flex flex-wrap gap-2">
              {DATE_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDateFilter(opt.id)}
                  className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border transition-all duration-300 cursor-pointer ${
                    dateFilter === opt.id
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#FFDF73] text-[#0f0518] border-[#FFDF73]/50 shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                      : 'bg-transparent border-white/10 text-[#A08BA6] hover:border-[#D4AF37]/40 hover:text-[#D4AF37]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status + Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2 flex-wrap">
              {(['all', ...Object.keys(STATUS_CONFIG)] as Array<DeliveryStatus | 'all'>).map((s) => {
                const cfg = s !== 'all' ? STATUS_CONFIG[s as DeliveryStatus] : null;
                const active = statusFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.12em] border transition-all duration-300 cursor-pointer ${active ? '' : 'bg-[#0a0310]/40 border-white/10 text-[#A08BA6] hover:border-[#D4AF37]/30 hover:text-[#D4AF37]'}`}
                    style={
                      active
                        ? { color: cfg?.color || '#D4AF37', backgroundColor: cfg?.bg || 'rgba(212,175,55,0.12)', border: `1px solid ${cfg?.border || 'rgba(212,175,55,0.35)'}`, boxShadow: `0 0 12px ${cfg?.glow || 'rgba(212,175,55,0.25)'}` }
                        : {}
                    }
                  >
                    {s === 'all' ? 'All Statuses' : STATUS_CONFIG[s as DeliveryStatus].label}
                  </button>
                );
              })}
            </div>

            <div className="relative sm:ml-auto sm:w-72">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A08BA6] text-sm">⌕</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 bg-[#0a0310]/60 border border-[#D4AF37]/20 rounded-xl text-[#FDFBF7] text-xs placeholder-[#A08BA6]/40 outline-none focus:border-[#D4AF37]/60 focus:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          {loading ? (
            <Spinner />
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 px-4">
              <p className="text-[#A08BA6] text-sm uppercase tracking-[0.25em] font-cinzel font-bold">
                No orders match.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D4AF37]/15 bg-[#0a0310]/50">
                    {['Order ID', 'Customer', 'Items', 'Total', 'Actions'].map((h) => (
                      <th key={h} className="px-6 py-4 text-[9px] font-cinzel font-black uppercase tracking-[0.3em] text-[#A08BA6]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4AF37]/8">
                  {filtered.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr
                        className="hover:bg-[#D4AF37]/5 transition-colors duration-200 cursor-pointer group"
                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      >
                        {/* Order ID */}
                        <td className="px-6 py-4">
                          <p className="text-[#D4AF37]/80 text-[10px] font-mono tracking-widest uppercase font-bold">
                            #{order.id.split('-')[0]}
                          </p>
                          <span className="text-[#A08BA6] text-[10px] font-mono mt-1 block">{fmtDate(order.created_at)}</span>
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4">
                          <p className="text-[#FDFBF7] font-semibold text-xs">{order.user_name}</p>
                          <p className="text-[#A08BA6] text-[10px] font-mono mt-0.5">{order.user_email}</p>
                        </td>

                        {/* Items */}
                        <td className="px-6 py-4">
                          <p className="text-[#FDFBF7]/70 text-[10px] truncate max-w-[200px]">
                            {order.items.map(i => `${i.product_name || i.name} (x${i.quantity})`).join(', ')}
                          </p>
                        </td>

                        {/* Total */}
                        <td className="px-6 py-4">
                          <span className="text-[#D4AF37] font-black text-xs font-mono">{fmtCurrency(order.total_amount)}</span>
                        </td>

                        {/* Fast Status Actions */}
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            {Object.values(STATUS_CONFIG).map((s) => {
                              const isActive = order.delivery_status === Object.keys(STATUS_CONFIG).find(k => STATUS_CONFIG[k as DeliveryStatus] === s);
                              const statusId = Object.keys(STATUS_CONFIG).find(k => STATUS_CONFIG[k as DeliveryStatus] === s) as DeliveryStatus;
                              return (
                                <button
                                  key={s.label}
                                  onClick={() => updateStatus(order.id, statusId)}
                                  className={`px-2 py-1 text-[9px] uppercase tracking-widest border transition-all cursor-pointer font-bold rounded-sm ${
                                    isActive
                                      ? 'bg-[#D4AF37] text-[#0f0518] border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.4)] scale-105'
                                      : 'bg-transparent text-[#A08BA6] border-[#D4AF37]/20 hover:border-[#D4AF37]/60 hover:text-[#D4AF37]'
                                  }`}
                                  title={`Set to ${s.label}`}
                                >
                                  {isActive ? s.icon : s.label.charAt(0)}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Info */}
                      {expandedId === order.id && (
                        <tr className="bg-[#0a0310]/40 border-b border-[#D4AF37]/10">
                          <td colSpan={5} className="px-6 py-6 p-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-bl-full blur-2xl pointer-events-none" />
                              
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-3 font-cinzel border-b border-[#D4AF37]/10 pb-1">Shipping</p>
                                {(() => {
                                  try {
                                    const addr = typeof order.shipping_address === 'string' 
                                      ? JSON.parse(order.shipping_address) 
                                      : order.shipping_address;
                                      
                                    if (!addr) {
                                      return <p className="text-[#A08BA6] text-[10px]">No shipping address provided.</p>;
                                    }

                                    const line1 = addr.line1 || addr.address_line1 || '';
                                    const line2 = addr.line2 || addr.address_line2 || '';

                                    return (
                                      <>
                                        <p className="text-[#FDFBF7] font-semibold text-xs mb-1">{addr.full_name || order.user_name}</p>
                                        <p className="text-[#A08BA6] text-[10px] leading-relaxed">
                                          {line1}<br />
                                          {line2 && <>{line2}<br /></>}
                                          {addr.city && addr.state ? `${addr.city}, ${addr.state} — ${addr.pincode}` : addr.pincode}
                                        </p>
                                      </>
                                    );
                                  } catch (e) {
                                    return <p className="text-[#A08BA6] text-[10px]">Invalid address format.</p>;
                                  }
                                })()}
                              </div>

                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-3 font-cinzel border-b border-[#D4AF37]/10 pb-1">Payment</p>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[10px] text-[#A08BA6] uppercase tracking-widest">{order.payment_method}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${order.payment_status === 'paid' ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30' : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'}`}>
                                    {order.payment_status}
                                  </span>
                                </div>
                                {order.user_phone && <p className="text-[#A08BA6] text-[10px] font-mono">Phone: {order.user_phone}</p>}
                              </div>

                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-3 font-cinzel border-b border-[#D4AF37]/10 pb-1">Breakdown</p>
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                  {order.items.map((i, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                      <span className="text-[#FDFBF7] truncate pr-2">
                                        {i.product_name || i.name} 
                                        {i.size && <span className="text-[#A08BA6] ml-1">[{i.size}]</span>}
                                      </span>
                                      <span className="text-[#A08BA6] shrink-0">x{i.quantity} <span className="text-[#D4AF37] ml-1 font-mono">{fmtCurrency(i.price * i.quantity)}</span></span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

