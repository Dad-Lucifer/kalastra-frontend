import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { apiRequest } from '../../utils/api';

// ─── Cache helpers ────────────────────────────────────────────────────────────
// localStorage-backed cache with TTL.
// Cross-tab reads are instant; stale entries are silently evicted on access.

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw) as { ts: number; data: T };
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function cacheSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // localStorage full — skip silently
  }
}

const CACHE_KEY_CATEGORIES = 'kls_nap_categories';
const cacheKeyProducts = (tab: string) => `kls_nap_products_${tab}`;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  selling_price: number;
  discount_percentage: number;
  gst_percentage: number;
  colors: string[];
  thumbnail_url: string;
  category_slug: string;
  stock_quantity: number;
  is_featured: boolean;
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: 'easeOut' } 
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export default function NewAndPopular() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (localStorage.getItem('accessToken')) {
      fetchWishlist();
    }
  }, []);

  const fetchWishlist = async () => {
    const res = await apiRequest('/wishlist');
    if (res.success && Array.isArray(res.data)) {
      const ids = new Set(res.data.map((item: any) => item.product_id));
      setWishlist(ids);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [activeTab, categories]);

  const fetchCategories = async () => {
    // ── Cache read ──
    const cached = cacheGet<Category[]>(CACHE_KEY_CATEGORIES);
    if (cached) {
      setCategories(cached);
      return;
    }
    // ── Network ──
    const res = await apiRequest('/products/categories');
    if (res.success && res.data) {
      setCategories(res.data);
      cacheSet(CACHE_KEY_CATEGORIES, res.data);
    }
  };

  const loadProducts = async () => {
    // Only load if categories are fetched (to avoid race conditions on initial load)
    if (categories.length === 0 && activeTab !== 'ALL') return;

    // ── Cache read (per tab) ──
    const cacheKey = cacheKeyProducts(activeTab);
    const cached = cacheGet<Product[]>(cacheKey);
    if (cached) {
      setProducts(cached);
      setLoading(false);
      return;
    }

    setLoading(true);

    const params = new URLSearchParams();
    params.append('sortBy', 'created_at');
    params.append('sortOrder', 'desc');
    params.append('page', '1');
    params.append('limit', '10');

    // If activeTab is not ALL, find the category based on short names
    const getShortName = (name: string) => name.split(' ')[0].replace(/'s/i, 'S').toUpperCase();

    const activeCategory = categories.find(c => getShortName(c.name) === activeTab);
    if (activeCategory) {
      params.append('category', activeCategory.slug);
    }

    const res = await apiRequest(`/products?${params.toString()}`);
    setLoading(false);
    if (res.success && res.data) {
      const allowedSlugs = categories.map(c => c.slug);

      const seen = new Set<string>();
      const uniqueProducts = res.data.filter((p: Product) => {
        // Only show products that match the active categories strictly
        if (activeTab === 'ALL') {
          if (!allowedSlugs.includes(p.category_slug)) return false;
        } else {
          if (!activeCategory || p.category_slug !== activeCategory.slug) return false;
        }

        // Deduplicate by name to prevent multiple entries of the same product from showing
        const identifier = p.name ? p.name.trim().toLowerCase() : p.id;
        if (seen.has(identifier)) return false;
        seen.add(identifier);
        return true;
      });

      setProducts(uniqueProducts);
      // ── Cache write ──
      cacheSet(cacheKey, uniqueProducts);
    }
  };

  const calcPrice = (product: Product) => {
    const discounted = product.discount_percentage > 0
      ? product.selling_price - (product.selling_price * product.discount_percentage) / 100
      : product.selling_price;
    const withGst = discounted + (discounted * product.gst_percentage) / 100;
    return withGst;
  };

  const formatPrice = (price: number) => {
    return `₹${Math.round(price).toLocaleString('en-IN')}`;
  };

  const getShortName = (name: string) => name.split(' ')[0].replace(/'s/i, 'S').toUpperCase();
  const tabs = ['ALL', ...categories.map(c => getShortName(c.name))];

  const toggleWishlist = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!localStorage.getItem('accessToken')) {
      navigate('/auth');
      return;
    }

    if (isWishlistLoading) return;
    setIsWishlistLoading(true);

    if (wishlist.has(product.id)) {
      const res = await apiRequest(`/wishlist/${product.id}`, { method: 'DELETE' });
      if (res.success) {
        setWishlist(prev => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
      }
    } else {
      const payload = {
        product_id: product.id,
        product_name: product.name,
        product_price: calcPrice(product),
        product_image: product.thumbnail_url,
        product_slug: product.slug
      };
      const res = await apiRequest('/wishlist', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        setWishlist(prev => new Set(prev).add(product.id));
      }
    }
    setIsWishlistLoading(false);
  };

  return (
    <section id="new-popular" className="w-full bg-black py-20 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        
        {/* Section Title */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center mb-12 text-center"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-[1px] bg-[#D4AF37]/50" />
            <span className="text-[#D4AF37] text-xs font-bold tracking-[0.3em] uppercase">
              Latest Drops
            </span>
            <div className="w-8 h-[1px] bg-[#D4AF37]/50" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-black tracking-widest uppercase text-white">
            NEW AND POPULAR
          </h2>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-12">
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-6 px-6 sm:mx-0 sm:px-0">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-none px-6 py-2 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase rounded-full border transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                    : 'bg-transparent border-white/20 text-white/70 hover:border-[#D4AF37]/50 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && products.length === 0 && (
          <div className="flex justify-center py-20">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-10 h-10 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mb-4" />
              <span className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase">Loading...</span>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={!loading ? "visible" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {!loading && products.map((product) => (
              <motion.div 
                key={product.id} 
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className="group cursor-pointer flex flex-col bg-zinc-900 border border-white/5 hover:border-[#D4AF37]/50 transition-colors duration-500 rounded-sm overflow-hidden"
              >
                {/* Product Image Box */}
                <div className="relative aspect-[3/4] bg-black overflow-hidden border-b border-white/5">
                  <Link to={`/product/${product.slug}`} className="absolute inset-0 block">
                    <img 
                      src={product.thumbnail_url} 
                      alt={product.name}
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ${product.stock_quantity > 0 ? 'group-hover:scale-110' : 'opacity-50 grayscale'}`}
                    />
                    
                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {product.stock_quantity === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <span className="border border-[#D4AF37] bg-black/80 text-[#D4AF37] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]">
                          Out of Stock
                        </span>
                      </div>
                    )}
                    {product.discount_percentage > 0 && product.stock_quantity > 0 && (
                      <div className="absolute top-3 left-3 bg-[#D4AF37] text-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg">
                        -{Math.round(product.discount_percentage)}%
                      </div>
                    )}
                  </Link>
                  
                  {/* Wishlist Heart Icon */}
                  <button 
                    onClick={(e) => toggleWishlist(e, product)}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-300 z-10 ${
                      wishlist.has(product.id)
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        : 'bg-black/20 text-white/70 hover:text-[#D4AF37] hover:bg-black/50'
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlist.has(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>

                {/* Product Info */}
                <div className="flex flex-col flex-1 p-4">
                  <h3 className="text-xs sm:text-sm text-white/80 font-medium truncate mb-2 uppercase tracking-widest group-hover:text-white transition-colors" title={product.name}>
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm sm:text-base text-[#D4AF37] font-bold tracking-wider">
                      {formatPrice(calcPrice(product))}
                    </span>
                    {product.discount_percentage > 0 && (
                      <span className="text-[10px] sm:text-xs text-white/40 line-through font-medium tracking-wider">
                        {formatPrice(product.selling_price + (product.selling_price * product.gst_percentage / 100))}
                      </span>
                    )}
                  </div>

                  {/* Color Swatches (if any) */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-auto">
                      {product.colors.slice(0, 3).map((color, idx) => (
                        <div 
                          key={idx} 
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      {product.colors.length > 3 && (
                        <span className="text-[10px] text-white/50 ml-1 font-bold tracking-widest">
                          +{product.colors.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
}
