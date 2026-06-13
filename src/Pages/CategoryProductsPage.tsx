import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useCheckoutFlow } from '../context/CheckoutFlowContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  selling_price: number;
  discount_percentage: number;
  gst_percentage: number;
  colors: string[];
  sizes: string[];
  images: Array<{ url: string; alt: string; order: number }>;
  thumbnail_url: string;
  stock_quantity: number;
  stock_status: string;
  category_name: string;
  category_slug: string;
}

const categoryMeta: Record<string, { title: string; subtitle: string }> = {
  'mens-collection': { title: "Men's Collection", subtitle: 'Bold. Sharp. Unapologetic.' },
  'womens-collection': { title: "Women's Collection", subtitle: 'Elegance meets edge.' },
  'kids-collection': { title: "Kids Collection", subtitle: 'Mini style, maximum attitude.' },
};

export default function CategoryProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const searchQuery = new URLSearchParams(location.search).get('search') || '';
  const { addItem, items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const { startCheckout } = useCheckoutFlow();
  const [cartOpen, setCartOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created_at-desc');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 99999]);

  const [draftSortBy, setDraftSortBy] = useState('created_at-desc');
  const [draftSelectedSizes, setDraftSelectedSizes] = useState<string[]>([]);
  const [draftSelectedColors, setDraftSelectedColors] = useState<string[]>([]);
  const [draftPriceRange, setDraftPriceRange] = useState<[number, number]>([0, 99999]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { size: string; color: string }>>({});
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [rippleIds, setRippleIds] = useState<Set<string>>(new Set());
  const [cartBump, setCartBump] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [wishlistToggling, setWishlistToggling] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    const res = await apiRequest('/wishlist');
    if (res.success && Array.isArray(res.data)) {
      setWishlist(new Set(res.data.map((item: any) => item.product_id)));
    }
  };

  const toggleWishlist = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!localStorage.getItem('accessToken')) {
      navigate('/auth');
      return;
    }
    const pid = product.id;
    if (wishlistToggling.has(pid)) return;
    setWishlistToggling((prev) => new Set(prev).add(pid));
    try {
      if (wishlist.has(pid)) {
        const res = await apiRequest(`/wishlist/${pid}`, { method: 'DELETE' });
        if (res.success) {
          setWishlist((prev) => { const next = new Set(prev); next.delete(pid); return next; });
        }
      } else {
        const price = calcPrice(product);
        const res = await apiRequest('/wishlist', {
          method: 'POST',
          body: JSON.stringify({
            product_id: pid,
            product_name: product.name,
            product_price: price.final,
            product_image: product.thumbnail_url || product.images[0]?.url || '',
            product_slug: product.slug,
          }),
        });
        if (res.success) {
          setWishlist((prev) => new Set(prev).add(pid));
        }
      }
    } finally {
      setWishlistToggling((prev) => { const next = new Set(prev); next.delete(pid); return next; });
    }
  };

  const meta = searchQuery
    ? { title: `Search: "${searchQuery}"`, subtitle: `Showing results for "${searchQuery}"` }
    : categoryMeta[categorySlug || ''] || { title: 'All Products', subtitle: 'Explore our full collection' };

  useEffect(() => {
    loadProducts();
  }, [categorySlug, sortBy, selectedSizes, selectedColors, priceRange, page, searchQuery]);

  const loadProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categorySlug) params.append('category', categorySlug);
    const [sortField, sortOrder] = sortBy.split('-');
    params.append('sortBy', sortField);
    params.append('sortOrder', sortOrder);
    if (selectedSizes.length) params.append('sizes', selectedSizes.join(','));
    if (selectedColors.length) params.append('colors', selectedColors.join(','));
    params.append('minPrice', priceRange[0].toString());
    params.append('maxPrice', priceRange[1].toString());
    params.append('page', page.toString());
    params.append('limit', '12');

    if (searchQuery) params.append('search', searchQuery);
    const res = await apiRequest(`/products?${params.toString()}`);
    setLoading(false);
    if (res.success && res.data) {
      setProducts(res.data);
      setTotalPages(res.pagination?.totalPages || 1);
    }
  };

  const toggleSize = (size: string) => {
    setDraftSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]);
  };

  const toggleColor = (color: string) => {
    setDraftSelectedColors((prev) => prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]);
  };

  const handleApplyFilters = () => {
    setSortBy(draftSortBy);
    setSelectedSizes(draftSelectedSizes);
    setSelectedColors(draftSelectedColors);
    setPriceRange(draftPriceRange);
    setPage(1);
    setMobileFiltersOpen(false);
    if (window.innerWidth >= 1024) {
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setDraftSelectedSizes([]);
    setDraftSelectedColors([]);
    setDraftPriceRange([0, 99999]);
    setDraftSortBy('created_at-desc');
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange([0, 99999]);
    setSortBy('created_at-desc');
    setPage(1);
  };

  const calcPrice = (product: Product) => {
    const discounted = product.discount_percentage > 0
      ? product.selling_price - (product.selling_price * product.discount_percentage) / 100
      : product.selling_price;
    const withGst = discounted + (discounted * product.gst_percentage) / 100;
    return { discounted, final: withGst };
  };

  const handleAddToCart = (product: Product) => {
    if (!localStorage.getItem('accessToken')) {
      navigate('/auth');
      return;
    }
    const variant = selectedVariants[product.id];
    addItem({
      productId: product.id,
      name: product.name,
      price: calcPrice(product).final,
      size: variant?.size || product.sizes[0] || 'M',
      color: variant?.color || product.colors[0] || 'Black',
      image: product.thumbnail_url || product.images[0]?.url || '',
      slug: product.slug,
    });
    setAnimatingIds((prev) => new Set(prev).add(product.id));
    setRippleIds((prev) => new Set(prev).add(product.id));
    setCartBump((prev) => prev + 1);
    setTimeout(() => {
      setAnimatingIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 800);
    setTimeout(() => {
      setRippleIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 600);
  };

  const handleBuyNow = (product: Product) => {
    if (!localStorage.getItem('accessToken')) {
      navigate('/auth');
      return;
    }
    handleAddToCart(product);
    setCartOpen(true);
  };

  const allSizes = [...new Set(products.flatMap((p) => p.sizes))];
  const allColors = [...new Set(products.flatMap((p) => p.colors))];

  const hasActiveFilters = selectedSizes.length > 0 || selectedColors.length > 0 || priceRange[0] > 0 || priceRange[1] < 99999;
  const hasActiveDraftFilters = draftSelectedSizes.length > 0 || draftSelectedColors.length > 0 || draftPriceRange[0] > 0 || draftPriceRange[1] < 99999;

  const renderFilters = (isMobile = false) => (
    <>
      <div>
        <h3 className={`text-xs uppercase tracking-[0.2em] font-bold mb-4 ${isMobile ? 'text-deep-black' : 'text-luxury-gold'}`}>Sort</h3>
        <select
          value={draftSortBy}
          onChange={(e) => setDraftSortBy(e.target.value)}
          className={`w-full px-4 py-3 border text-sm outline-none transition-colors rounded-lg shadow-sm ${
            isMobile 
              ? 'bg-white border-gray-200 text-deep-black focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]' 
              : 'bg-dark-charcoal border-luxury-gold/20 text-soft-white focus:border-luxury-gold/60'
          }`}
        >
          <option value="created_at-desc">Newest</option>
          <option value="selling_price-asc">Price: Low to High</option>
          <option value="selling_price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A-Z</option>
        </select>
      </div>

      <div>
        <h3 className={`text-xs uppercase tracking-[0.2em] font-bold mb-4 ${isMobile ? 'text-deep-black' : 'text-luxury-gold'}`}>Price Range</h3>
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Min"
            value={draftPriceRange[0] || ''}
            onChange={(e) => setDraftPriceRange([Number(e.target.value) || 0, draftPriceRange[1]])}
            className={`w-full px-4 py-3 border text-sm outline-none transition-colors rounded-lg shadow-sm ${
              isMobile 
                ? 'bg-white border-gray-200 text-deep-black placeholder:text-gray-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]' 
                : 'bg-dark-charcoal border-luxury-gold/20 text-soft-white placeholder:text-soft-white/30 focus:border-luxury-gold/60'
            }`}
          />
          <span className={`self-center ${isMobile ? 'text-gray-500' : 'text-soft-white/40'}`}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={draftPriceRange[1] === 99999 ? '' : draftPriceRange[1]}
            onChange={(e) => setDraftPriceRange([draftPriceRange[0], Number(e.target.value) || 99999])}
            className={`w-full px-4 py-3 border text-sm outline-none transition-colors rounded-lg shadow-sm ${
              isMobile 
                ? 'bg-white border-gray-200 text-deep-black placeholder:text-gray-400 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]' 
                : 'bg-dark-charcoal border-luxury-gold/20 text-soft-white placeholder:text-soft-white/30 focus:border-luxury-gold/60'
            }`}
          />
        </div>
      </div>

      {allSizes.length > 0 && (
        <div>
          <h3 className={`text-xs uppercase tracking-[0.2em] font-bold mb-4 ${isMobile ? 'text-deep-black' : 'text-luxury-gold'}`}>Size</h3>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border rounded-md transition-all duration-300 ${
                  draftSelectedSizes.includes(size)
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md'
                    : isMobile
                      ? 'bg-white text-gray-600 border-gray-200 hover:border-[#D4AF37] hover:text-black'
                      : 'bg-transparent text-soft-white/60 border-luxury-gold/20 hover:border-luxury-gold/50 hover:text-soft-white'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {allColors.length > 0 && (
        <div>
          <h3 className={`text-xs uppercase tracking-[0.2em] font-bold mb-4 ${isMobile ? 'text-deep-black' : 'text-luxury-gold'}`}>Color</h3>
          <div className="flex flex-wrap gap-3">
            {allColors.map((color) => (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                title={color}
                className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all duration-300 ${
                  draftSelectedColors.includes(color)
                    ? 'border-[#D4AF37] scale-110 shadow-md'
                    : isMobile ? 'border-gray-200 hover:scale-110' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: color.toLowerCase() }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-rich-black">
      {/* Navbar spacer */}

      {/* Header */}
      <section className="relative border-b border-luxury-gold/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(212,175,55,0.06),transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-10">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <Link to="/" className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-luxury-gold/60 hover:text-luxury-gold transition-colors mb-2 sm:mb-4 inline-block">
                ← Back to Home
              </Link>
              <h1 className="font-heading text-3xl sm:text-5xl lg:text-7xl font-bold text-soft-white mt-1 sm:mt-2 leading-tight">
                {meta.title}
              </h1>
              <p className="text-sm sm:text-lg text-soft-white/60 mt-2 sm:mt-3 font-light">{meta.subtitle}</p>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="shrink-0 relative px-4 sm:px-6 py-2.5 sm:py-3 border border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold hover:text-rich-black transition-all duration-300"
            >
              <span className="text-[10px] sm:text-sm font-semibold uppercase tracking-[0.15em]">Cart</span>
              {totalItems > 0 && (
                <span
                  key={cartBump}
                  className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-luxury-gold text-rich-black text-[10px] sm:text-xs font-bold flex items-center justify-center animate-cart-bounce"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* ─── Mobile Filter Toggle ─── */}
          <div className="lg:hidden flex items-center justify-between gap-3 mb-4">
            <button
              onClick={() => {
                setDraftSortBy(sortBy);
                setDraftSelectedSizes(selectedSizes);
                setDraftSelectedColors(selectedColors);
                setDraftPriceRange(priceRange);
                setMobileFiltersOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-cold-white border border-gray-200 shadow-sm rounded-full text-sm font-bold text-deep-black hover:shadow-md hover:border-[#D4AF37] transition-all active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4 text-deep-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm4 6a1 1 0 011-1h8a1 1 0 010 2H8a1 1 0 01-1-1zm2 6a1 1 0 011-1h4a1 1 0 010 2h-4a1 1 0 01-1-1z" />
              </svg>
              FILTERS
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)] animate-pulse" />}
            </button>
            
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
              <select
                value={sortBy}
                onChange={(e) => { 
                  setSortBy(e.target.value); 
                  setDraftSortBy(e.target.value);
                  setPage(1); 
                }}
                className="px-4 py-2.5 bg-cold-white border border-gray-200 shadow-sm rounded-full text-deep-black text-xs font-bold uppercase outline-none focus:border-[#D4AF37] transition-all"
              >
                <option value="created_at-desc">NEWEST</option>
                <option value="selling_price-asc">PRICE: LOW-HIGH</option>
                <option value="selling_price-desc">PRICE: HIGH-LOW</option>
                <option value="name-asc">A-Z</option>
              </select>
            </div>
          </div>

          {/* ─── Mobile Filters Drawer ─── */}
          <AnimatePresence>
            {mobileFiltersOpen && (
              <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                  onClick={() => setMobileFiltersOpen(false)} 
                />
                <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="relative w-full max-h-[85vh] bg-cold-white rounded-t-[2rem] overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-cold-white shrink-0">
                    <h3 className="text-base font-black text-deep-black uppercase tracking-widest">Filters</h3>
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-deep-black transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-cold-white">
                    {renderFilters(true)}
                  </div>
                  <div className="p-6 border-t border-gray-200 bg-cold-white shrink-0">
                    <button
                      onClick={handleApplyFilters}
                      className="w-full px-6 py-4 bg-[#D4AF37] text-black text-sm font-black tracking-widest uppercase rounded-full shadow-[0_4px_20px_rgba(212,175,55,0.4)] active:scale-95 transition-all"
                    >
                      Show Results
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ─── Desktop Sidebar Filters ─── */}
          <aside className="hidden lg:block lg:w-64 shrink-0 space-y-6 sticky top-32 h-fit">
            <div className="flex items-center justify-between pb-4 border-b border-luxury-gold/10">
              <h3 className="text-sm font-black text-soft-white uppercase tracking-widest">Filters</h3>
              {hasActiveDraftFilters && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-400 transition-colors cursor-pointer bg-transparent border-none"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="space-y-8 pb-2">
              {renderFilters(false)}
            </div>
            <button
              onClick={handleApplyFilters}
              className="w-full mt-4 px-6 py-3.5 bg-[#D4AF37] text-black text-sm font-black tracking-widest uppercase rounded-sm shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_4px_25px_rgba(212,175,55,0.4)] active:scale-95 transition-all cursor-pointer border-none"
            >
              Apply Filters
            </button>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-10 h-10 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-32">
                <p className="text-soft-white/50 text-lg">No products found.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {products.map((product) => {
                    const price = calcPrice(product);
                    const variant = selectedVariants[product.id];
                    return (
                      <Link
                        to={`/product/${product.slug}`}
                        key={product.id}
                        className="group relative 
                        h-fit bg-dark-charcoal border border-luxury-gold/10 hover:border-luxury-gold/40 transition-all duration-500 overflow-hidden flex flex-col"
                      >
                        {product.discount_percentage > 0 && (
                          <span className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10 px-2 sm:px-3 py-0.5 sm:py-1 bg-red-600/90 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                            -{product.discount_percentage}%
                          </span>
                        )}

                        <button
                          onClick={(e) => toggleWishlist(product, e)}
                          disabled={wishlistToggling.has(product.id)}
                          className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-rich-black/70 hover:bg-rich-black border border-luxury-gold/20 hover:border-luxury-gold/60 rounded-full transition-all duration-300 disabled:opacity-50 cursor-pointer"
                        >
                          <svg
                            className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${
                              wishlist.has(product.id) ? 'scale-110' : 'scale-100'
                            }`}
                            viewBox="0 0 24 24"
                            fill={wishlist.has(product.id) ? '#D4AF37' : 'none'}
                            stroke={wishlist.has(product.id) ? '#D4AF37' : 'rgba(255,255,255,0.5)'}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>

                        <div className="aspect-4/3 bg-linear-to-b relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          {product.thumbnail_url || product.images[0]?.url ? (
                            <img
                              src={product.thumbnail_url || product.images[0]?.url}
                              alt={product.name}
                              className="w-full h-full object-cover transition-all duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-14 h-14 rounded-full border-2 border-luxury-gold/30 flex items-center justify-center">
                                <span className="font-heading text-2xl font-bold text-luxury-gold/50">K</span>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-linear-to-t from-dark-charcoal via-transparent to-transparent" />
                        </div>

                        <div className="p-3 sm:p-4 flex flex-col flex-1 gap-1.5 sm:gap-2">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-luxury-gold/60 font-semibold">
                            {product.category_name}
                          </p>
                          <h3 className="font-heading text-sm sm:text-base font-bold text-soft-white group-hover:text-luxury-gold transition-colors duration-300 leading-tight">
                            {product.name}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-soft-white/50 line-clamp-1 leading-relaxed">
                            {product.description}
                          </p>

                          {product.sizes.length > 0 && (
                            <div>
                              <p className="text-[10px] text-soft-white/40 uppercase tracking-wider mb-1">Size</p>
                              <div className="flex flex-wrap gap-1">
                                {product.sizes.map((size) => (
                                  <button
                                    key={size}
                                    onClick={() =>
                                      setSelectedVariants((prev) => ({
                                        ...prev,
                                        [product.id]: { ...prev[product.id], size, color: variant?.color || product.colors[0] || 'Black' },
                                      }))
                                    }
                                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] font-semibold border transition-all ${
                                      (variant?.size || product.sizes[0]) === size
                                        ? 'bg-luxury-gold text-rich-black border-luxury-gold'
                                        : 'bg-transparent text-soft-white/50 border-luxury-gold/15 hover:border-luxury-gold/40'
                                    }`}
                                  >
                                    {size}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {product.colors.length > 0 && (
                            <div>
                              <p className="text-[10px] text-soft-white/40 uppercase tracking-wider mb-1">Color</p>
                              <div className="flex flex-wrap gap-1.5">
                                {product.colors.map((color) => (
                                  <button
                                    key={color}
                                    onClick={() =>
                                      setSelectedVariants((prev) => ({
                                        ...prev,
                                        [product.id]: { ...prev[product.id], color, size: variant?.size || product.sizes[0] || 'M' },
                                      }))
                                    }
                                    title={color}
                                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 transition-all ${
                                      (variant?.color || product.colors[0]) === color
                                        ? 'border-luxury-gold scale-110'
                                        : 'border-transparent hover:scale-110'
                                    }`}
                                    style={{ backgroundColor: color.toLowerCase() }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-luxury-gold/10 mt-1">
                            <div>
                              {product.discount_percentage > 0 ? (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="font-heading text-base sm:text-lg font-bold text-luxury-gold">
                                    ₹{price.final.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-soft-white/40 line-through">
                                    ₹{product.selling_price.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-heading text-base sm:text-lg font-bold text-luxury-gold">
                                  ₹{price.final.toFixed(2)}
                                </span>
                              )}
                              <p className={`text-[10px] font-semibold ${
                                product.stock_status === 'in_stock' ? 'text-green-500' :
                                product.stock_status === 'low' ? 'text-yellow-500' : 'text-red-500'
                              }`}>
                                {product.stock_status === 'in_stock' ? 'In Stock' :
                                 product.stock_status === 'low' ? 'Low Stock' : 'Out of Stock'}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-1.5 sm:gap-2 mt-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleAddToCart(product); }}
                              disabled={product.stock_status === 'out'}
                              className="relative flex-1 px-2 sm:px-3 py-2 sm:py-2.5 border-2 border-luxury-gold text-luxury-gold font-bold uppercase tracking-[0.12em] text-[9px] sm:text-[10px] hover:bg-luxury-gold hover:text-rich-black transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
                            >
                              <span className={`transition-transform duration-300 inline-block ${animatingIds.has(product.id) ? 'scale-110' : ''}`}>
                                Add to Cart
                              </span>
                              {rippleIds.has(product.id) && (
                                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <span className="w-8 h-8 rounded-full border-4 border-[#D4AF37] animate-ping absolute" />
                                </span>
                              )}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleBuyNow(product); }}
                              disabled={product.stock_status === 'out'}
                              className="flex-1 px-2 sm:px-3 py-2 sm:py-2.5 bg-[#D4AF37] text-rich-black font-bold uppercase tracking-[0.12em] text-[9px] sm:text-[10px] hover:bg-gold-light transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 sm:gap-3 mt-8 sm:mt-12">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] border border-[#D4AF37]/30 text-luxury-gold hover:bg-luxury-gold hover:text-rich-black transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex gap-1 sm:gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-semibold transition-all duration-300 ${
                            page === p
                              ? 'bg-[#D4AF37] text-rich-black'
                              : 'border border-[#D4AF37]/20 text-soft-white/60 hover:border-[#D4AF37]/50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] border border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold hover:text-rich-black transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Cart Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-500 ${
          cartOpen ? 'visible' : 'invisible'
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-500 ${
            cartOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setCartOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-md bg-[#e1e1e1] border-l border-luxury-gold/20 transition-transform duration-500 ${
            cartOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-luxury-gold/10">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-soft-white">
              Cart ({totalItems})
            </h2>
            <button
              onClick={() => setCartOpen(false)}
              className="text-soft-white/50 hover:text-soft-white text-2xl leading-none bg-transparent border-none p-0 cursor-pointer"
            >
              &times;
            </button>
          </div>

          <div className="flex flex-col h-[calc(100%-130px)] overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
            {items.length === 0 ? (
              <p className="text-soft-white/40 text-center py-20">Your cart is empty.</p>
            ) : (
              items.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3 sm:gap-4 pb-4 border-b border-luxury-gold/10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-rich-black border border-luxury-gold/10 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-heading text-lg sm:text-xl font-bold text-luxury-gold/30">K</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-soft-white truncate">{item.name}</p>
                    <p className="text-[10px] sm:text-xs text-soft-white/50 mt-0.5">
                      {item.size} / {item.color}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-luxury-gold mt-1">₹{item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2 sm:gap-3 mt-2">
                      <div className="flex items-center border border-luxury-gold/20">
                        <button
                          onClick={() => updateQuantity(item.productId, item.size, item.color, -1)}
                          className="px-2 sm:px-2.5 py-1 text-soft-white/60 hover:text-soft-white bg-transparent border-none cursor-pointer text-xs sm:text-sm"
                        >
                          −
                        </button>
                        <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-soft-white min-w-[20px] sm:min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.size, item.color, 1)}
                          className="px-2 sm:px-2.5 py-1 text-soft-white/60 hover:text-soft-white bg-transparent border-none cursor-pointer text-xs sm:text-sm"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.size, item.color)}
                        className="text-[10px] sm:text-xs text-soft-white/30 hover:text-red-400 transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 py-4 sm:py-5 border-t border-luxury-gold/10 bg-dark-charcoal">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs sm:text-sm text-soft-white/70">Total</span>
                <span className="font-heading text-lg sm:text-xl font-bold text-luxury-gold">₹{totalPrice.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => startCheckout()}
                disabled={totalPrice === 0}
                className="w-full px-6 py-3 sm:py-3.5 bg-luxury-gold text-rich-black font-bold uppercase tracking-[0.2em] text-xs sm:text-sm hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed">
                Checkout
              </button>
              <button
                onClick={clearCart}
                className="w-full mt-2 px-6 py-2 sm:py-2.5 border border-luxury-gold/20 text-soft-white/50 font-semibold uppercase tracking-[0.1em] text-[10px] sm:text-xs hover:text-red-400 hover:border-red-400/30 transition-all duration-300 bg-transparent cursor-pointer"
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
