import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import BottomMobileNav from '../components/landing/BottomMobileNav';

// ─── Types ────────────────────────────────────────────────────────────────────

type DeliveryStatus = 'order_confirmed' | 'out_for_delivery' | 'delivered';

interface OrderItem {
  product_id: string;
  product_name?: string;
  name?: string;
  slug?: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

interface Order {
  id: string;
  created_at: string;
  updated_at?: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  delivery_status: DeliveryStatus;
  items: OrderItem[];
  shipping_address: {
    full_name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
}

export default function UserOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      navigate('/auth');
      return;
    }
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const res = await apiRequest('/user/orders');
    setLoading(false);
    if (res.success && Array.isArray(res.data)) {
      const now = new Date().getTime();
      const visibleOrders = res.data.filter((order: Order) => {
        if (order.delivery_status === 'delivered') {
          const lastUpdate = new Date(order.updated_at || order.created_at).getTime();
          const hoursSince = (now - lastUpdate) / (1000 * 60 * 60);
          return hoursSince <= 24;
        }
        return true;
      });
      setOrders(visibleOrders);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusDisplay = (status: DeliveryStatus) => {
    switch (status) {
      case 'order_confirmed':
        return { label: 'Order Confirmed', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
      case 'out_for_delivery':
        return { label: 'Out for Delivery', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
      case 'delivered':
        return { label: 'Delivered', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
      default:
        return { label: 'Processing', color: 'text-cold-grey', bg: 'bg-cold-grey/10', border: 'border-cold-grey/20' };
    }
  };

  return (
    <div className="min-h-screen bg-rich-black flex flex-col font-outfit">
      <Navbar />
      
      {/* Spacer for fixed Navbar */}
      <div className="h-20 lg:h-24" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
        
        {/* Header */}
        <div className="mb-10 sm:mb-16">
          <Link to="/dashboard" className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-luxury-gold/60 hover:text-luxury-gold transition-colors mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="relative">
            <div className="absolute -left-4 sm:-left-6 top-1 sm:top-2 bottom-1 sm:bottom-2 w-1 sm:w-1.5 bg-gradient-to-b from-[#FFDF73] to-[#997A15] rounded-r-full shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black gold-gradient-text font-cinzel tracking-tight drop-shadow-lg">
              Order History
            </h1>
            <p className="text-sm text-soft-white/60 mt-3 font-light tracking-wide max-w-xl">
              Track the status of your recent purchases, view order details, and stay updated on your deliveries.
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-32">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6">
              <div className="absolute inset-0 border-2 border-luxury-gold/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-t-luxury-gold border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(212,175,55,0.3)]" />
              <div className="absolute inset-2 sm:inset-3 border-2 border-[#FFDF73]/20 rounded-full" />
              <div className="absolute inset-2 sm:inset-3 border-2 border-b-[#FFDF73] border-r-transparent border-t-transparent border-l-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
            </div>
            <p className="text-luxury-gold text-[10px] sm:text-xs uppercase tracking-[0.35em] font-cinzel animate-pulse font-bold text-center">
              Fetching Records...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 sm:py-32 glass-panel border border-luxury-gold/10 rounded-2xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-full bg-dark-charcoal border border-luxury-gold/30 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.15)]">
              <span className="text-luxury-gold text-2xl opacity-80">📦</span>
            </div>
            <p className="text-soft-white/60 text-sm sm:text-base uppercase tracking-[0.2em] font-cinzel font-bold mb-6">
              No orders placed yet
            </p>
            <Link
              to="/products/mens-collection"
              className="inline-block px-8 py-3.5 bg-luxury-gold text-rich-black font-bold uppercase tracking-[0.2em] text-xs hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {orders.map((order) => {
              const status = getStatusDisplay(order.delivery_status);
              return (
                <div key={order.id} className="glass-panel rounded-xl sm:rounded-2xl border border-luxury-gold/15 overflow-hidden group hover:border-luxury-gold/40 transition-all duration-500 shadow-lg">
                  
                  {/* Order Header */}
                  <div className="bg-dark-charcoal/80 border-b border-luxury-gold/10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-soft-white/40 mb-1">Order Placed</p>
                        <p className="text-sm font-bold text-soft-white font-mono">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="hidden sm:block w-px h-8 bg-luxury-gold/10" />
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-soft-white/40 mb-1">Total</p>
                        <p className="text-sm font-bold text-luxury-gold font-mono">₹{order.total_amount.toFixed(2)}</p>
                      </div>
                      <div className="hidden sm:block w-px h-8 bg-luxury-gold/10" />
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-soft-white/40 mb-1">Order #</p>
                        <p className="text-xs sm:text-sm font-bold text-soft-white font-mono opacity-80">{order.id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center self-start sm:self-center shrink-0">
                      <span className={`px-3 py-1.5 text-[10px] font-black tracking-widest uppercase rounded-md border ${status.bg} ${status.color} ${status.border} shadow-sm`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-5 sm:p-6 flex flex-col lg:flex-row gap-8">
                    
                    {/* Items List */}
                    <div className="flex-1 space-y-4">
                      {order.items.map((item, idx) => {
                        const displayName = item.product_name || item.name || 'Product';
                        return (
                          <div key={idx} className="flex items-start sm:items-center gap-4">
                            <Link to={item.slug ? `/product/${item.slug}` : '#'} className="shrink-0 block">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={displayName}
                                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover border border-luxury-gold/15 rounded-lg group-hover:border-luxury-gold/40 transition-colors"
                                />
                              ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-rich-black border border-luxury-gold/15 flex items-center justify-center rounded-lg">
                                  <span className="text-luxury-gold/30 text-xl font-cinzel font-bold">K</span>
                                </div>
                              )}
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link to={item.slug ? `/product/${item.slug}` : '#'} className="block hover:opacity-80 transition-opacity">
                                <h3 className="text-sm sm:text-base font-bold text-soft-white leading-tight mb-1 line-clamp-2">
                                  {displayName}
                                </h3>
                              </Link>
                              <div className="text-xs text-soft-white/50 flex flex-wrap items-center gap-2 mt-1.5 uppercase tracking-wider">
                                {item.size && <span>Size: {item.size}</span>}
                                {item.size && item.color && <span className="w-1 h-1 bg-luxury-gold/30 rounded-full" />}
                                {item.color && <span>Color: {item.color}</span>}
                                <span className="w-1 h-1 bg-luxury-gold/30 rounded-full" />
                                <span className="font-bold text-soft-white/80">Qty: {item.quantity}</span>
                              </div>
                              <div className="mt-2 text-sm font-bold text-luxury-gold font-mono">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Shipping Address */}
                    <div className="lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-luxury-gold/10 pt-6 lg:pt-0 lg:pl-8">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-soft-white/50 mb-3">
                        Shipping Address
                      </h4>
                      <p className="text-sm font-bold text-soft-white tracking-wide mb-1">
                        {order.shipping_address.full_name}
                      </p>
                      <p className="text-xs text-soft-white/70 leading-relaxed space-y-0.5">
                        <span className="block">{order.shipping_address.line1}</span>
                        {order.shipping_address.line2 && <span className="block">{order.shipping_address.line2}</span>}
                        <span className="block">{order.shipping_address.city}, {order.shipping_address.state} — {order.shipping_address.pincode}</span>
                        <span className="block">{order.shipping_address.country}</span>
                      </p>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
      <BottomMobileNav />
    </div>
  );
}
