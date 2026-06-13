import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

interface WishlistItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_image: string;
  product_slug: string;
  created_at: string;
}

export default function WishlistPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      navigate('/auth');
      return;
    }
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    setLoading(true);
    const res = await apiRequest('/wishlist');
    setLoading(false);
    if (res.success && Array.isArray(res.data)) {
      setItems(res.data);
    }
  };

  const handleRemove = async (productId: string) => {
    if (removing.has(productId)) return;
    setRemoving((prev) => new Set(prev).add(productId));
    const res = await apiRequest(`/wishlist/${productId}`, { method: 'DELETE' });
    if (res.success) {
      setItems((prev) => prev.filter((item) => item.product_id !== productId));
    }
    setRemoving((prev) => { const next = new Set(prev); next.delete(productId); return next; });
  };

  return (
    <div className="min-h-screen bg-rich-black">
      <div className="h-20 lg:h-24" />

      <section className="relative border-b border-luxury-gold/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(212,175,55,0.06),transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16 lg:py-20">
          <div>
            <Link to="/dashboard" className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-luxury-gold/60 hover:text-luxury-gold transition-colors mb-3 sm:mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="font-heading text-3xl sm:text-5xl lg:text-7xl font-bold text-soft-white mt-1 sm:mt-2">
              My Wishlist
            </h1>
            <p className="text-sm sm:text-lg text-soft-white/60 mt-2 sm:mt-3 font-light">
              {items.length === 0 ? 'Your wishlist is empty.' : `${items.length} item${items.length !== 1 ? 's' : ''} in your wishlist`}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20 sm:py-32">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 sm:py-32">
            <p className="text-soft-white/50 text-sm sm:text-lg mb-4 sm:mb-6">Your wishlist is empty.</p>
            <Link
              to="/products/mens-collection"
              className="inline-block px-6 sm:px-8 py-3 sm:py-3.5 bg-luxury-gold text-rich-black font-bold uppercase tracking-[0.2em] text-xs sm:text-sm hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all duration-500"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="group bg-dark-charcoal border border-luxury-gold/10 hover:border-luxury-gold/40 transition-all duration-500 overflow-hidden flex flex-col"
              >
                <Link to={`/product/${item.product_slug}`} className="block">
                  <div className="aspect-4/3 bg-linear-to-b from-dark-charcoal via-rich-black to-dark-charcoal relative overflow-hidden">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
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
                </Link>

                <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
                  <Link to={`/product/${item.product_slug}`} className="block">
                    <h3 className="font-heading text-sm sm:text-base font-bold text-soft-white group-hover:text-luxury-gold transition-colors duration-300 leading-tight">
                      {item.product_name}
                    </h3>
                  </Link>

                  <span className="font-heading text-base sm:text-lg font-bold text-luxury-gold">
                    ₹{Number(item.product_price).toFixed(2)}
                  </span>

                  <button
                    onClick={() => handleRemove(item.product_id)}
                    disabled={removing.has(item.product_id)}
                    className="w-full mt-1 px-3 py-2 border border-luxury-gold/20 text-soft-white/60 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] hover:text-red-400 hover:border-red-400/30 transition-all duration-300 bg-transparent cursor-pointer disabled:opacity-50"
                  >
                    {removing.has(item.product_id) ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
