import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../../utils/api';
import { useCart } from '../../context/CartContext';
import logoImg from '../../assets/kalastra-logo.png';
import SidebarMenu from './SidebarMenu';

const decodeJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  thumbnail_url: string;
  selling_price: number;
  discount_percentage: number;
  category_name: string;
}

export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { totalItems } = useCart();

  // Profile
  const [profileData, setProfileData] = useState<{ name: string; email: string } | null>(null);
  const idToken = localStorage.getItem('idToken');
  const isLoggedIn = !!localStorage.getItem('accessToken');
  const tokenPayload = isLoggedIn && idToken ? decodeJwt(idToken) : null;
  const userName = profileData?.name || tokenPayload?.name || tokenPayload?.email || 'User';
  const userEmail = profileData?.email || tokenPayload?.email || '';

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Profile fetch
  useEffect(() => {
    if (isLoggedIn && !profileData) {
      apiRequest('/auth/me').then(res => {
        if (res.success && res.data?.user) {
          setProfileData({ name: res.data.user.name, email: res.data.user.email });
        }
      });
    }
  }, [isLoggedIn]);

  // Scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sidebar
  useEffect(() => {
    const fn = () => setIsSidebarOpen(true);
    window.addEventListener('open-sidebar', fn);
    return () => window.removeEventListener('open-sidebar', fn);
  }, []);

  // Debounced search — 300ms, min 2 chars
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setDropdownOpen(false);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    debounceTimer.current = setTimeout(async () => {
      const res = await apiRequest(`/products?search=${encodeURIComponent(q)}&limit=5`);
      setSearchLoading(false);
      if (res.success && Array.isArray(res.data)) {
        setResults(res.data.slice(0, 5));
      } else {
        setResults([]);
      }
      setDropdownOpen(true);
      setActiveIndex(-1);
    }, 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [query]);

  // Mobile search open/close
  useEffect(() => {
    if (mobileSearchOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => mobileInputRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSearchOpen]);

  // ── Navigation helpers — navigate FIRST then clear UI state ───────────────
  const goToProduct = (slug: string) => {
    navigate(`/product/${slug}`);
    setQuery('');
    setDropdownOpen(false);
    setMobileSearchOpen(false);
    setResults([]);
  };

  const goToViewAll = () => {
    // Navigate to landing page new-popular section
    navigate('/#new-popular');
    // Fallback: if already on /, just scroll
    setTimeout(() => {
      const el = document.getElementById('new-popular');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    setQuery('');
    setDropdownOpen(false);
    setMobileSearchOpen(false);
    setResults([]);
  };

  // Keyboard nav
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('');
      setDropdownOpen(false);
      setMobileSearchOpen(false);
      return;
    }
    if (!dropdownOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) goToProduct(results[activeIndex].slug);
      else if (query.trim()) goToViewAll();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('idToken');
    setProfileOpen(false);
    navigate('/');
  };

  const calcFinalPrice = (price: number, disc: number) =>
    Math.round(disc > 0 ? price - (price * disc) / 100 : price);

  return (
    <>
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* ── Mobile Search Full-Screen Overlay ────────────────────────────── */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="lg:hidden fixed inset-0 z-[60] bg-black flex flex-col"
          >
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-[#D4AF37]/20 shrink-0">
              <div className="flex-1 flex items-center gap-3 bg-zinc-900 border border-[#D4AF37]/20 rounded-lg px-4 py-3">
                {searchLoading
                  ? <div className="w-4 h-4 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin shrink-0" />
                  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#D4AF37]/50 shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                }
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search products…"
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                />
                {query && (
                  <button onClick={() => { setQuery(''); setResults([]); setDropdownOpen(false); }} className="text-white/30 hover:text-white transition-colors">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
              <button onClick={() => setMobileSearchOpen(false)} className="text-white/60 hover:text-white text-sm font-bold tracking-wider shrink-0 transition-colors">
                Cancel
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
              {query.trim().length < 2 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/10"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <p className="text-xs text-white/30 tracking-widest uppercase">Type to search products</p>
                </div>
              ) : searchLoading ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <div className="w-5 h-5 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                  <span className="text-xs text-white/40 tracking-widest uppercase">Searching…</span>
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2">
                  <p className="text-sm text-white/40">No results for</p>
                  <p className="text-sm font-bold text-[#D4AF37]">"{query}"</p>
                </div>
              ) : (
                <>
                  {results.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => goToProduct(product.slug)}
                      className="w-full flex items-center gap-4 px-5 py-4 border-b border-white/5 text-left cursor-pointer active:bg-white/5"
                    >
                      <div className="w-14 h-14 shrink-0 bg-zinc-900 overflow-hidden rounded-sm border border-white/10">
                        {product.thumbnail_url
                          ? <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><span className="text-[#D4AF37]/40 font-black text-xl">K</span></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{product.name}</p>
                        <p className="text-[10px] text-[#D4AF37]/60 uppercase tracking-wider mt-0.5">{product.category_name}</p>
                        <p className="text-sm font-bold text-[#D4AF37] mt-1">₹{calcFinalPrice(product.selling_price, product.discount_percentage)}</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20 shrink-0"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </button>
                  ))}
                  <button
                    onClick={goToViewAll}
                    className="w-full py-4 text-center text-[10px] font-bold tracking-[0.2em] uppercase text-[#D4AF37] border-t border-[#D4AF37]/10 cursor-pointer"
                  >
                    View New &amp; Popular →
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
        className={`sticky top-0 z-40 transition-all duration-500 border-b ${
          scrolled
            ? 'bg-black/80 backdrop-blur-md border-[#D4AF37]/30 shadow-[0_4px_30px_rgba(212,175,55,0.1)]'
            : 'bg-black border-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4">

            {/* Hamburger */}
            <div className="flex items-center">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-[#D4AF37] hover:text-white transition-colors focus:outline-none cursor-pointer">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Logo */}
            <Link to="/" className="hidden lg:flex flex-1 justify-center items-center group relative">
              <div className="flex items-center gap-3 justify-center">
                <img src={logoImg} alt="Kalastra Logo" className="h-12 lg:h-16 w-auto object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.3)] transition-all duration-700 group-hover:scale-110 group-hover:rotate-6" />
                <span className="text-3xl lg:text-4xl tracking-[0.4em] uppercase font-black text-[#D4AF37] drop-shadow-[0_2px_15px_rgba(212,175,55,0.3)] transition-all duration-700 group-hover:tracking-[0.5em] group-hover:drop-shadow-[0_0_25px_rgba(212,175,55,0.8)] group-hover:text-white">
                  KALASTRA
                </span>
              </div>
            </Link>

            {/* Right section */}
            <div className="flex flex-1 lg:flex-none items-center justify-end gap-3 lg:gap-8 w-full lg:w-auto">

              {/* Desktop Search */}
              <div ref={searchRef} className="relative hidden lg:block lg:w-72 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {searchLoading
                    ? <div className="w-4 h-4 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#D4AF37]/50 group-focus-within:text-[#D4AF37] transition-colors"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  }
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (results.length > 0) setDropdownOpen(true); }}
                  placeholder='SEARCH "BAGGY JEANS"'
                  className="w-full pl-10 pr-8 py-2 border-b border-[#D4AF37]/20 bg-transparent text-xs font-bold tracking-widest text-[#D4AF37] focus:outline-none focus:border-[#D4AF37] transition-all placeholder-[#D4AF37]/30"
                />
                {query && (
                  <button
                    onClick={() => { setQuery(''); setResults([]); setDropdownOpen(false); inputRef.current?.focus(); }}
                    className="absolute inset-y-0 right-0 pr-1 flex items-center text-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}

                {/* Desktop Dropdown */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-[#D4AF37]/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 overflow-hidden rounded-sm"
                    >
                      {searchLoading ? (
                        <div className="flex items-center justify-center py-8 gap-3">
                          <div className="w-4 h-4 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                          <span className="text-xs text-white/40 tracking-widest uppercase">Searching…</span>
                        </div>
                      ) : results.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="text-sm text-white/40">No results for</p>
                          <p className="text-sm font-bold text-[#D4AF37] mt-1">"{query}"</p>
                        </div>
                      ) : (
                        <>
                          {results.map((product, idx) => (
                            <button
                              key={product.id}
                              onMouseEnter={() => setActiveIndex(idx)}
                              onMouseDown={e => { e.preventDefault(); goToProduct(product.slug); }}
                              className={`w-full flex items-center gap-4 px-4 py-3 text-left border-b border-white/5 last:border-0 cursor-pointer transition-colors ${activeIndex === idx ? 'bg-[#D4AF37]/10' : 'hover:bg-white/5'}`}
                            >
                              <div className="w-12 h-12 shrink-0 bg-zinc-800 overflow-hidden rounded-sm border border-white/10">
                                {product.thumbnail_url
                                  ? <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center"><span className="text-[#D4AF37]/40 font-black text-lg">K</span></div>
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{product.name}</p>
                                <p className="text-[10px] text-[#D4AF37]/60 uppercase tracking-wider mt-0.5">{product.category_name}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-bold text-[#D4AF37]">₹{calcFinalPrice(product.selling_price, product.discount_percentage)}</p>
                                {product.discount_percentage > 0 && (
                                  <p className="text-[10px] text-white/30 line-through">₹{Math.round(product.selling_price)}</p>
                                )}
                              </div>
                            </button>
                          ))}
                          <button
                            onMouseDown={e => { e.preventDefault(); goToViewAll(); }}
                            className="w-full py-3 text-center text-[10px] font-bold tracking-[0.2em] uppercase text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors border-t border-[#D4AF37]/10 cursor-pointer"
                          >
                            View New &amp; Popular →
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Search Icon */}
              <button onClick={() => setMobileSearchOpen(true)} className="lg:hidden text-[#D4AF37] hover:text-white transition-colors p-1 cursor-pointer">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>

              {/* Desktop Icons */}
              <div className="hidden lg:flex items-center gap-6">

                {/* Profile */}
                <div className="relative" ref={dropdownRef}>
                  {isLoggedIn ? (
                    <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 text-[#D4AF37] hover:text-white transition-colors cursor-pointer">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span className="text-xs font-bold tracking-widest uppercase max-w-[100px] truncate">{userName}</span>
                    </button>
                  ) : (
                    <button onClick={() => navigate('/auth')} className="text-[#D4AF37] hover:text-white transition-colors cursor-pointer">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </button>
                  )}
                  <AnimatePresence>
                    {profileOpen && isLoggedIn && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-4 w-56 bg-zinc-900 border border-[#D4AF37]/20 shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-2 z-50 rounded-sm"
                      >
                        <div className="px-5 py-3 border-b border-[#D4AF37]/10 mb-2">
                          <p className="text-sm font-bold tracking-wider text-[#D4AF37] truncate">{userName}</p>
                          <p className="text-[10px] tracking-widest text-white/50 truncate uppercase mt-1">{userEmail}</p>
                        </div>
                        <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="block w-full text-left px-5 py-3 text-xs font-bold tracking-widest uppercase text-white hover:text-[#D4AF37] hover:bg-black transition-colors">
                          My Profile
                        </Link>
                        <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-xs font-bold tracking-widest uppercase text-red-400 hover:text-red-300 hover:bg-black transition-colors cursor-pointer">
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Cart */}
                <button onClick={() => navigate('/cart')} className="text-[#D4AF37] hover:text-white transition-colors relative cursor-pointer">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                    <path d="M3 6h18"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  {totalItems > 0 && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#D4AF37] text-black text-[9px] font-black rounded-full flex items-center justify-center animate-cart-bounce">
                      {totalItems > 99 ? '99+' : totalItems}
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>
    </>
  );
}
