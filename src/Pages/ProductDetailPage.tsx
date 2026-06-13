import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useCheckoutFlow } from '../context/CheckoutFlowContext';

interface Review {
  id: string;
  product_id: string;
  user_uid: string;
  user_name: string;
  rating: number;
  review: string;
  created_at: string;
}

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

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
 
    const { addItem, items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const { startCheckout } = useCheckoutFlow();
  const [cartOpen, setCartOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      apiRequest(`/products/${slug}`),
      apiRequest(`/products/${slug}/reviews`),
    ]).then(([productRes, reviewRes]) => {
      setLoading(false);
      if (productRes.success && productRes.data) {
        setProduct(productRes.data);
        setSelectedSize(productRes.data.sizes[0] || '');
        setSelectedColor(productRes.data.colors[0] || '');
        fetchRelated(productRes.data.category_slug, productRes.data.id);
      }
      if (reviewRes.success && reviewRes.data) {
        setReviews(reviewRes.data);
      }
    });
  }, [slug]);

  const fetchRelated = async (categorySlug: string, excludeId: string) => {
    const params = new URLSearchParams();
    params.append('category', categorySlug);
    params.append('limit', '4');
    const res = await apiRequest(`/products?${params.toString()}`);
    if (res.success && res.data) {
      setRelatedProducts(res.data.filter((p: Product) => p.id !== excludeId).slice(0, 4));
    }
  };

  const calcPrice = () => {
    if (!product) return { discounted: 0, final: 0 };
    const discounted = product.discount_percentage > 0
      ? product.selling_price - (product.selling_price * product.discount_percentage) / 100
      : product.selling_price;
    const withGst = discounted + (discounted * product.gst_percentage) / 100;
    return { discounted, final: withGst };
  };

  const handleAddToCart = () => {
    if (!localStorage.getItem('accessToken')) { navigate('/auth'); return; }
    if (!product) return;
    setAddingToCart(true);
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: calcPrice().final,
        size: selectedSize || product.sizes[0] || 'M',
        color: selectedColor || product.colors[0] || 'Black',
        image: product.thumbnail_url || product.images[0]?.url || '',
        slug: product.slug,
      },
      quantity  // pass the user-selected quantity
    );
    setTimeout(() => setAddingToCart(false), 1200);
  };


  const handleSubmitReview = async () => {
    if (!reviewForm.review.trim()) return;
    setSubmittingReview(true);
    setReviewMessage(null);
    const res = await apiRequest(`/products/${slug}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewForm),
    });
    setSubmittingReview(false);
    if (res.success) {
      setReviewMessage('Review submitted!');
      setReviewForm({ rating: 5, review: '' });
      const reviewRes = await apiRequest(`/products/${slug}/reviews`);
      if (reviewRes.success && reviewRes.data) setReviews(reviewRes.data);
    } else {
      setReviewMessage(res.message || 'Failed to submit review.');
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`w-4 h-4 ${star <= rating ? 'text-[#D4AF37]' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  const price = calcPrice();
  const allImages = product.images?.length ? product.images : (product.thumbnail_url ? [{ url: product.thumbnail_url, alt: product.name, order: 0 }] : []);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="h-20 lg:h-24" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to={`/products/${product.category_slug}`} className="text-xs uppercase tracking-[0.15em] text-gray-400 hover:text-[#D4AF37] transition-colors inline-block">
            &larr; Back to {product.category_name}
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            className="relative px-6 py-3 border border-gray-300 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all duration-300"
          >
            <span className="text-sm font-semibold uppercase tracking-[0.15em]">Cart ({totalItems})</span>
          </button>
        </div>

        

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 mt-4">
          {/* LEFT: Gallery */}
          <div className="w-full lg:w-[60%]">
            <div className="relative overflow-hidden rounded-lg bg-gray-50 group">
              {product.discount_percentage > 0 && (
                <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-[#1A1A1A] text-white text-xs font-semibold uppercase tracking-wider">
                  -{product.discount_percentage}%
                </span>
              )}
              <img
                src={allImages[selectedImage]?.url || '/placeholder.png'}
                alt={product.name}
                className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-3 mt-4">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      i === selectedImage ? 'border-[#D4AF37]' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={img.url} alt={img.alt || product.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Info */}
          <div className="w-full lg:w-[40%]">
            <div className="flex items-start justify-between mb-6">
              <h1 className="text-3xl font-light text-[#1A1A1A] tracking-tight">{product.name}</h1>
              <span className="text-2xl font-semibold text-[#1A1A1A] whitespace-nowrap ml-4">
                ₹{price.final.toFixed(2)}
              </span>
            </div>

            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-6">
                {renderStars(Math.round(avgRating))}
                <span className="text-sm text-gray-500">({reviews.length} review{reviews.length > 1 ? 's' : ''})</span>
              </div>
            )}

            <div className="mb-6">
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Color */}
            {product.colors.length > 0 && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Color</p>
                <div className="flex gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                      className={`w-8 h-8 rounded-full transition-all ${
                        selectedColor === color
                          ? 'ring-2 ring-[#D4AF37] ring-offset-2 scale-110'
                          : 'ring-1 ring-gray-300 hover:ring-gray-500'
                      }`}
                      style={{ backgroundColor: color.toLowerCase() }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            {product.sizes.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold">Size</p>
                  <button className="text-xs text-[#D4AF37] hover:text-[#C9A227] transition-colors">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2.5 text-sm font-medium transition-all ${
                        selectedSize === size
                          ? 'bg-[#1A1A1A] text-white border border-[#1A1A1A]'
                          : 'border border-gray-300 text-[#1A1A1A] hover:border-[#D4AF37]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Quantity</p>
              <div className="flex items-center border border-gray-300 w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2.5 text-gray-600 hover:text-[#1A1A1A] transition-colors cursor-pointer"
                >
                  −
                </button>
                <span className="px-6 py-2.5 text-sm font-medium text-[#1A1A1A] min-w-[48px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))}
                  className="px-4 py-2.5 text-gray-600 hover:text-[#1A1A1A] transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={product.stock_status === 'out'}
                className={`w-full h-12 text-sm font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${
                  addingToCart
                    ? 'bg-[#D4AF37] text-white scale-[1.02]'
                    : 'bg-[#1A1A1A] text-white hover:bg-black'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {addingToCart ? '✓ Added to Cart' : 'Add to Cart'}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleAddToCart();
                    navigate('/cart');
                  }}
                  disabled={product.stock_status === 'out'}
                  className="w-1/2 h-12 text-sm font-semibold uppercase tracking-[0.15em] border border-[#D4AF37] text-[#1A1A1A] hover:bg-[#D4AF37] hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => navigate('/cart')}
                  className="w-1/2 h-12 text-sm font-semibold uppercase tracking-[0.15em] border border-gray-300 text-gray-700 hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-all duration-300"
                >
                  View Cart
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <p className="text-sm text-[#1A1A1A] font-medium mb-2">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Fabric & Care */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <p className="text-sm text-[#1A1A1A] font-medium mb-3">Fabric & Care</p>
              <ul className="space-y-2">
                <li className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-400 rounded-full" /> 100% Cotton
                </li>
                <li className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-400 rounded-full" /> Regular Fit
                </li>
                <li className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-400 rounded-full" /> Machine Wash Cold
                </li>
                <li className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-400 rounded-full" /> Imported
                </li>
              </ul>
            </div>

            {/* Accordion */}
            {[
              { id: 'details', label: 'Product Details', content: 'Premium quality materials. Designed for everyday comfort and lasting durability.' },
              { id: 'shipping', label: 'Shipping & Returns', content: 'Free shipping on orders above ₹999. Easy returns within 15 days of delivery.' },
              { id: 'care', label: 'Care Instructions', content: 'Machine wash cold with like colors. Tumble dry low. Do not bleach. Iron on low heat.' },
            ].map((item) => (
              <div key={item.id} className="border-b border-gray-200">
                <button
                  onClick={() => setActiveAccordion(activeAccordion === item.id ? null : item.id)}
                  className="w-full flex items-center justify-between py-4 text-sm text-[#1A1A1A] font-medium hover:text-[#D4AF37] transition-colors cursor-pointer"
                >
                  {item.label}
                  <svg className={`w-4 h-4 transition-transform duration-300 ${activeAccordion === item.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${activeAccordion === item.id ? 'max-h-40 pb-4' : 'max-h-0'}`}>
                  <p className="text-sm text-gray-600">{item.content}</p>
                </div>
              </div>
            ))}

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="border border-gray-200 rounded-lg p-5 text-center hover:border-[#D4AF37] transition-all duration-300">
                <svg className="w-6 h-6 mx-auto mb-2 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <p className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">Free Shipping</p>
                <p className="text-[10px] text-gray-500 mt-1">On orders above ₹999</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-5 text-center hover:border-[#D4AF37] transition-all duration-300">
                <svg className="w-6 h-6 mx-auto mb-2 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">Easy Returns</p>
                <p className="text-[10px] text-gray-500 mt-1">15-day return policy</p>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <div className="border-t border-gray-200 mt-16 pt-12">
          <h2 className="text-2xl font-light text-[#1A1A1A] mb-8">Customer Reviews</h2>

          {reviews.length > 0 && (
            <div className="flex items-center gap-4 mb-8">
              <span className="text-4xl font-semibold text-[#1A1A1A]">{avgRating.toFixed(1)}</span>
              <div>
                {renderStars(Math.round(avgRating))}
                <p className="text-sm text-gray-500 mt-1">{reviews.length} review{reviews.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          )}

          <div className="space-y-0 mb-12">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 py-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[#1A1A1A]">{review.user_name}</span>
                  <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                {renderStars(review.rating)}
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.review}</p>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-sm text-gray-400 py-8">No reviews yet. Be the first to review this product.</p>
            )}
          </div>

          {/* Review Form */}
          <div className="bg-gray-50 rounded-lg p-6 sm:p-8 max-w-xl">
            <h3 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wider mb-4">Write a Review</h3>
            {reviewMessage && (
              <p className={`text-xs font-medium mb-3 ${reviewMessage === 'Review submitted!' ? 'text-green-600' : 'text-red-600'}`}>
                {reviewMessage}
              </p>
            )}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-gray-500 mr-2">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  className="cursor-pointer"
                >
                  <svg className={`w-6 h-6 ${star <= reviewForm.rating ? 'text-[#D4AF37]' : 'text-gray-300'} hover:text-[#D4AF37] transition-colors`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            <textarea
              placeholder="Share your thoughts about this product..."
              value={reviewForm.review}
              onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 text-sm text-[#1A1A1A] outline-none focus:border-[#D4AF37] transition-colors resize-none placeholder:text-gray-400"
            />
            <button
              onClick={handleSubmitReview}
              disabled={submittingReview || !reviewForm.review.trim()}
              className="mt-3 px-8 py-3 bg-[#1A1A1A] text-white text-xs font-semibold uppercase tracking-[0.15em] hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-gray-200 mt-16 pt-12">
            <h2 className="text-2xl font-light text-[#1A1A1A] mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => {
                const relDiscounted = rel.discount_percentage > 0
                  ? rel.selling_price - (rel.selling_price * rel.discount_percentage) / 100
                  : rel.selling_price;
                const relFinal = relDiscounted + (relDiscounted * (rel.gst_percentage || 0)) / 100;
                return (
                  <Link
                    key={rel.id}
                    to={`/product/${rel.slug}`}
                    className="group border border-gray-200 hover:border-[#D4AF37] transition-all duration-300"
                  >
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      <img
                        src={rel.thumbnail_url || rel.images[0]?.url || '/placeholder.png'}
                        alt={rel.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{rel.name}</p>
                      <p className="text-sm font-semibold text-[#1A1A1A] mt-1">₹{relFinal.toFixed(2)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
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
          <div className="flex items-center justify-between px-6 py-5 border-b border-luxury-gold/10">
            <h2 className="font-heading text-xl font-bold text-soft-white">
              Cart ({totalItems})
            </h2>
            <button
              onClick={() => setCartOpen(false)}
              className="text-soft-white/50 hover:text-soft-white text-2xl leading-none bg-transparent border-none p-0 cursor-pointer"
            >
              &times;
            </button>
          </div>

          <div className="flex flex-col h-[calc(100%-140px)] overflow-y-auto px-6 py-6 space-y-4">
            {items.length === 0 ? (
              <p className="text-soft-white/40 text-center py-20">Your cart is empty.</p>
            ) : (
              items.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 pb-4 border-b border-luxury-gold/10">
                  <div className="w-20 h-20 shrink-0 bg-rich-black border border-luxury-gold/10 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-heading text-xl font-bold text-luxury-gold/30">K</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-soft-white truncate">{item.name}</p>
                    <p className="text-xs text-soft-white/50 mt-0.5">
                      {item.size} / {item.color}
                    </p>
                    <p className="text-sm font-bold text-luxury-gold mt-1">₹{item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-luxury-gold/20">
                        <button
                          onClick={() => updateQuantity(item.productId, item.size, item.color, -1)}
                          className="px-2.5 py-1 text-soft-white/60 hover:text-soft-white bg-transparent border-none cursor-pointer text-sm"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 text-sm text-soft-white min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.size, item.color, 1)}
                          className="px-2.5 py-1 text-soft-white/60 hover:text-soft-white bg-transparent border-none cursor-pointer text-sm"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.size, item.color)}
                        className="text-xs text-soft-white/30 hover:text-red-400 transition-colors bg-transparent border-none p-0 cursor-pointer"
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
            <div className="absolute bottom-0 left-0 right-0 px-6 py-5 border-t border-luxury-gold/10 bg-dark-charcoal">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-soft-white/70">Total</span>
                <span className="font-heading text-xl font-bold text-luxury-gold">₹{totalPrice.toFixed(2)}</span>
              </div>
              <button 
                onClick={startCheckout}
                disabled={totalPrice === 0}
                className="w-full px-6 py-3.5 bg-luxury-gold text-rich-black font-bold uppercase tracking-[0.2em] text-sm hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed">
                Checkout
              </button>
              <button
                onClick={clearCart}
                className="w-full mt-2 px-6 py-2.5 border border-luxury-gold/20 text-soft-white/50 font-semibold uppercase tracking-[0.1em] text-xs hover:text-red-400 hover:border-red-400/30 transition-all duration-300 bg-transparent cursor-pointer"
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
