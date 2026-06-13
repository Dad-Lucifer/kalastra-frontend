import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

interface Coupon {
  id: string;
  code: string;
  coins: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export default function CouponPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [coins, setCoins] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadCoupons = async () => {
    setLoading(true);
    const res = await apiRequest('/admin/coupons');
    if (res.success && res.data) {
      setCoupons(res.data);
    }
    setLoading(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!code.trim() || !coins || !startDate || !endDate) {
      setMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      setMessage({ type: 'error', text: 'Expiration must follow commencement.' });
      return;
    }

    setSubmitting(true);
    const res = await apiRequest('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify({
        code: code.trim(),
        coins: parseInt(coins),
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      }),
    });
    setSubmitting(false);

    if (res.success) {
      setMessage({ type: 'success', text: `Decree "${code.trim().toUpperCase()}" sealed!` });
      setCode('');
      setCoins('');
      setStartDate('');
      setEndDate('');
      loadCoupons();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to forge decree.' });
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!confirm(`Revoke decree "${couponCode}" permanently?`)) return;
    const res = await apiRequest(`/admin/coupons/${id}`, { method: 'DELETE' });
    if (res.success) {
      setMessage({ type: 'success', text: `Decree "${couponCode}" revoked.` });
      loadCoupons();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to revoke decree.' });
    }
  };

  return (
    <div className="font-outfit text-[#FDFBF7]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12 relative">
          <div className="relative">
            <div className="absolute -left-4 sm:-left-6 top-1 sm:top-2 bottom-1 sm:bottom-2 w-1 sm:w-1.5 bg-gradient-to-b from-[#FFDF73] to-[#997A15] rounded-r-full shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
            <h1 className="text-2xl sm:text-5xl font-black gold-gradient-text font-cinzel tracking-tight drop-shadow-lg">
              Decrees & Bounties
            </h1>
            <p className="text-xs sm:text-sm text-[#A08BA6] mt-2 sm:mt-3 font-light tracking-wide">
              Forge and manage Kalasatra coin coupons for your patrons.
            </p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 sm:mb-8 px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-[10px] sm:text-xs font-bold tracking-widest uppercase flex items-center gap-3 sm:gap-4 animate-fade-in border shadow-lg ${
              message.type === 'success'
                ? 'bg-[#0f0518]/80 text-[#10B981] border-[#10B981]/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] backdrop-blur-md'
                : 'bg-[#0f0518]/80 text-[#F43F5E] border-[#F43F5E]/30 shadow-[0_0_20px_rgba(244,63,94,0.2)] backdrop-blur-md'
            }`}
          >
            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 shrink-0 rounded-full animate-pulse ${message.type === 'success' ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-[#F43F5E] shadow-[0_0_8px_#F43F5E]'}`} />
            {message.text}
          </div>
        )}

        {/* ─── Create Coupon Form ─── */}
        <div className="glass-panel rounded-2xl sm:rounded-[2rem] p-5 sm:p-12 mb-10 sm:mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-bl from-[#D4AF37]/15 to-transparent rounded-bl-full blur-[30px] sm:blur-[50px] pointer-events-none" />
          
          <h2 className="text-sm sm:text-lg font-bold text-[#FDFBF7] uppercase tracking-[0.2em] sm:tracking-[0.25em] font-cinzel mb-6 sm:mb-10 flex items-center gap-3 sm:gap-4">
            <span className="w-4 sm:w-8 h-px bg-[#D4AF37]/50" />
            Forge New Decree
          </h2>
          
          <form onSubmit={handleCreate} className="space-y-5 sm:space-y-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#A08BA6]">Decree Cipher (Code) *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. KALASATRA50"
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-[#0a0310]/60 border border-[#D4AF37]/20 rounded-xl text-[#FDFBF7] text-xs sm:text-sm placeholder-[#A08BA6]/40 outline-none focus:border-[#D4AF37]/80 focus:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all uppercase tracking-widest font-mono shadow-inner"
                  required
                />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#A08BA6]">Bounty (Coins) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
                    <span className="text-[#D4AF37] font-bold">¢</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={coins}
                    onChange={(e) => setCoins(e.target.value)}
                    placeholder="100"
                    className="w-full pl-8 sm:pl-10 pr-4 sm:pr-5 py-3 sm:py-4 bg-[#0a0310]/60 border border-[#D4AF37]/20 rounded-xl text-[#FDFBF7] text-xs sm:text-sm placeholder-[#A08BA6]/40 outline-none focus:border-[#D4AF37]/80 focus:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all font-mono shadow-inner"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#A08BA6]">Commencement (Start) *</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-[#0a0310]/60 border border-[#D4AF37]/20 rounded-xl text-[#FDFBF7] text-xs sm:text-sm outline-none focus:border-[#D4AF37]/80 focus:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all [color-scheme:dark] font-mono shadow-inner"
                  required
                />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#A08BA6]">Expiration (End) *</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-[#0a0310]/60 border border-[#D4AF37]/20 rounded-xl text-[#FDFBF7] text-xs sm:text-sm outline-none focus:border-[#D4AF37]/80 focus:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all [color-scheme:dark] font-mono shadow-inner"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end pt-5 sm:pt-8 border-t border-[#D4AF37]/10">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto group relative px-8 sm:px-12 py-3.5 sm:py-4 bg-[#0a0310] overflow-hidden rounded-xl border border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed hover-lift cursor-pointer"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#D4AF37] to-[#FFDF73] opacity-10 group-hover:opacity-30 transition-opacity duration-300" />
                <span className="relative z-10 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37] group-hover:text-[#FFDF73] transition-colors duration-300">
                  {submitting ? 'Forging...' : 'Seal Decree'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* ─── Coupons List ─── */}
        <div className="glass-panel rounded-2xl sm:rounded-[2rem] overflow-hidden relative shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="px-5 sm:px-10 py-5 sm:py-8 border-b border-[#D4AF37]/20 bg-gradient-to-r from-[#0a0310]/80 to-[#1a0b2e]/30 flex justify-between items-center">
            <h2 className="text-sm sm:text-base font-bold text-[#FDFBF7] uppercase tracking-[0.2em] sm:tracking-[0.25em] font-cinzel flex items-center gap-3 sm:gap-4">
              Active Registry
              {coupons.length > 0 && <span className="text-[#0f0518] font-bold text-[10px] sm:text-xs bg-gradient-to-r from-[#D4AF37] to-[#FFDF73] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]">{coupons.length}</span>}
            </h2>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 sm:py-32">
               <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6 sm:mb-8">
                 <div className="absolute inset-0 border-2 border-[#D4AF37]/20 rounded-full" />
                 <div className="absolute inset-0 border-2 border-t-[#D4AF37] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(212,175,55,0.3)]" />
                 <div className="absolute inset-2 sm:inset-3 border-2 border-[#FFDF73]/20 rounded-full" />
                 <div className="absolute inset-2 sm:inset-3 border-2 border-b-[#FFDF73] border-r-transparent border-t-transparent border-l-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
               </div>
               <p className="text-[#D4AF37] text-[10px] sm:text-xs uppercase tracking-[0.35em] font-cinzel animate-pulse font-bold text-center px-4">Consulting Archives...</p>
             </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-20 sm:py-32 px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-[#0a0310] border border-[#D4AF37]/30 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                <span className="text-[#D4AF37] text-2xl sm:text-3xl opacity-80">📜</span>
              </div>
              <p className="text-[#A08BA6] text-xs sm:text-sm uppercase tracking-[0.25em] font-cinzel font-bold">The registry is bare.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden divide-y divide-[#D4AF37]/10">
                {coupons.map((coupon) => {
                  const now = new Date();
                  const start = new Date(coupon.start_date);
                  const end = new Date(coupon.end_date);
                  const isExpired = now > end;
                  const isFuture = now < start;
                  
                  return (
                    <div key={coupon.id} className="p-5 flex flex-col gap-4 bg-[#0a0310]/30 hover:bg-[#D4AF37]/5 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono font-bold text-[#FDFBF7] text-base tracking-widest drop-shadow-[0_0_8px_rgba(253,251,247,0.3)]">{coupon.code}</span>
                          <div className="flex items-center">
                             {isExpired && (
                               <span className="px-2 py-0.5 text-[8px] font-black tracking-widest uppercase bg-[#F43F5E]/10 text-[#F43F5E] rounded border border-[#F43F5E]/20">Expired</span>
                             )}
                             {isFuture && (
                               <span className="px-2 py-0.5 text-[8px] font-black tracking-widest uppercase bg-[#3B82F6]/10 text-[#3B82F6] rounded border border-[#3B82F6]/20">Scheduled</span>
                             )}
                             {!isExpired && !isFuture && (
                               <span className="px-2 py-0.5 text-[8px] font-black tracking-widest uppercase bg-[#10B981]/10 text-[#10B981] rounded border border-[#10B981]/30">Active</span>
                             )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-[#0a0310] px-3 py-1.5 rounded-lg border border-[#D4AF37]/20">
                           <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#FFDF73] to-[#B8922A] flex items-center justify-center">
                             <span className="text-[#0a0310] text-[8px] font-black">¢</span>
                           </div>
                           <span className="text-[#D4AF37] font-black text-sm font-mono">{coupon.coins}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 bg-[#0a0310]/40 p-3 rounded-xl border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-[#A08BA6] mb-1">Start</span>
                          <span className="text-xs text-[#FDFBF7] font-mono">{formatDate(coupon.start_date)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-[#A08BA6] mb-1">End</span>
                          <span className="text-xs text-[#FDFBF7] font-mono">{formatDate(coupon.end_date)}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        className="w-full py-2.5 mt-1 bg-[#F43F5E]/10 text-[#F43F5E] text-[10px] font-black uppercase tracking-[0.25em] rounded-lg border border-[#F43F5E]/30 hover:bg-[#F43F5E] hover:text-[#0f0518] transition-all"
                      >
                        Revoke Decree
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#D4AF37]/20 bg-[#0a0310]/60">
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-[#A08BA6]">Cipher</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-[#A08BA6]">Bounty</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-[#A08BA6]">Commencement</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-[#A08BA6]">Expiration</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-[#A08BA6] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D4AF37]/10">
                    {coupons.map((coupon) => {
                      const now = new Date();
                      const start = new Date(coupon.start_date);
                      const end = new Date(coupon.end_date);
                      const isExpired = now > end;
                      const isFuture = now < start;
                      return (
                        <tr key={coupon.id} className="hover:bg-[#D4AF37]/5 transition-colors duration-300 group">
                          <td className="px-10 py-7">
                             <div className="flex flex-col gap-2">
                               <span className="font-mono font-bold text-[#FDFBF7] text-base tracking-widest drop-shadow-[0_0_8px_rgba(253,251,247,0.3)]">{coupon.code}</span>
                               <div className="flex items-center">
                                 {isExpired && (
                                   <span className="px-2.5 py-1 text-[9px] font-black tracking-widest uppercase bg-[#F43F5E]/10 text-[#F43F5E] rounded-md border border-[#F43F5E]/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">Expired</span>
                                 )}
                                 {isFuture && (
                                   <span className="px-2.5 py-1 text-[9px] font-black tracking-widest uppercase bg-[#3B82F6]/10 text-[#3B82F6] rounded-md border border-[#3B82F6]/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">Scheduled</span>
                                 )}
                                 {!isExpired && !isFuture && (
                                   <span className="px-2.5 py-1 text-[9px] font-black tracking-widest uppercase bg-[#10B981]/10 text-[#10B981] rounded-md border border-[#10B981]/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">Active</span>
                                 )}
                               </div>
                             </div>
                          </td>
                          <td className="px-10 py-7">
                             <div className="flex items-center gap-3">
                               <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FFDF73] to-[#B8922A] flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.5)] border border-[#FFDF73]/50">
                                 <span className="text-[#0a0310] text-[11px] font-black">¢</span>
                               </div>
                               <span className="text-[#D4AF37] font-black text-xl font-mono tracking-wide">{coupon.coins}</span>
                             </div>
                          </td>
                          <td className="px-10 py-7 text-[#A08BA6] text-sm font-mono tracking-wide">{formatDate(coupon.start_date)}</td>
                          <td className="px-10 py-7 text-[#A08BA6] text-sm font-mono tracking-wide">{formatDate(coupon.end_date)}</td>
                          <td className="px-10 py-7 text-right">
                            <button
                              onClick={() => handleDelete(coupon.id, coupon.code)}
                              className="px-5 py-2.5 bg-[#0a0310]/50 text-[#F43F5E] text-[10px] font-black uppercase tracking-[0.25em] rounded-lg border border-[#F43F5E]/30 hover:bg-[#F43F5E]/10 hover:border-[#F43F5E] hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:text-[#fb7185] transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
