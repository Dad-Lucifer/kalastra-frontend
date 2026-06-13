import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCheckoutFlow } from '../context/CheckoutFlowContext';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice, syncing } = useCart();
  const { startCheckout } = useCheckoutFlow();
  const navigate = useNavigate();

  const onProceedToCheckout = () => {
    if (!localStorage.getItem('accessToken')) {
      navigate('/auth');
      return;
    }
    startCheckout();
  };

  return (
    <div className="min-h-screen bg-rich-black relative">
      <div className="h-20 lg:h-24" />

      <section className="relative border-b border-luxury-gold/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(212,175,55,0.06),transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16 lg:py-20">
          <div>
            <Link to="/" className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-luxury-gold/60 hover:text-luxury-gold transition-colors mb-3 sm:mb-4 inline-block">
              ← Back to Home
            </Link>
            <h1 className="font-heading text-3xl sm:text-5xl lg:text-7xl font-bold text-soft-white mt-1 sm:mt-2">
              Your Cart
            </h1>
            <p className="text-sm sm:text-lg text-soft-white/60 mt-2 sm:mt-3 font-light">
              {totalItems === 0 ? 'Your cart is empty.' : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        {syncing ? (
          <div className="flex items-center justify-center py-20 sm:py-32">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 sm:py-32">
            <p className="text-soft-white/50 text-sm sm:text-lg mb-4 sm:mb-6">Your cart is empty.</p>
            <Link
              to="/products/mens-collection"
              className="inline-block px-6 sm:px-8 py-3 sm:py-3.5 bg-luxury-gold text-rich-black font-bold uppercase tracking-[0.2em] text-xs sm:text-sm hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all duration-500"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 space-y-3 sm:space-y-4">
              {items.map((item) => {
                const key = `${item.productId}-${item.size}-${item.color}`;
                return (
                  <div
                    key={key}
                    className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-dark-charcoal border border-luxury-gold/10 hover:border-luxury-gold/30 transition-all duration-300"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-rich-black border border-luxury-gold/10 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-heading text-2xl font-bold text-luxury-gold/30">K</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <Link
                          to={`/products/${item.slug}`}
                          className="font-heading text-base font-bold text-soft-white hover:text-luxury-gold transition-colors"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-soft-white/50 mt-1 uppercase tracking-wider">
                          {item.size} / {item.color}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-1 sm:gap-2">
                        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
                          <div className="flex items-center border border-luxury-gold/20">
                            <button
                              onClick={() => updateQuantity(item.productId, item.size, item.color, -1)}
                              className="px-3 sm:px-3 py-1.5 sm:py-1.5 text-soft-white/60 hover:text-soft-white bg-transparent border-none cursor-pointer text-xs sm:text-sm min-w-[36px] sm:min-w-0 flex items-center justify-center"
                            >−</button>
                            <span className="px-2 sm:px-3 py-1.5 sm:py-1.5 text-xs sm:text-sm text-soft-white min-w-[28px] text-center font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.size, item.color, 1)}
                              className="px-3 sm:px-3 py-1.5 sm:py-1.5 text-soft-white/60 hover:text-soft-white bg-transparent border-none cursor-pointer text-xs sm:text-sm min-w-[36px] sm:min-w-0 flex items-center justify-center"
                            >+</button>
                          </div>
                          <button
                            onClick={() => removeItem(item.productId, item.size, item.color)}
                            className="text-[10px] sm:text-xs text-soft-white/30 hover:text-red-400 transition-colors bg-transparent border-none p-0 cursor-pointer uppercase tracking-wider whitespace-nowrap"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <span className="font-heading text-sm sm:text-base font-bold text-luxury-gold whitespace-nowrap text-right">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 flex justify-between items-center">
                <button
                  onClick={clearCart}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 border border-luxury-gold/20 text-soft-white/50 font-semibold uppercase tracking-[0.1em] text-[10px] sm:text-xs hover:text-red-400 hover:border-red-400/30 transition-all duration-300 bg-transparent cursor-pointer"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            <div className="lg:w-80 shrink-0">
              <div className="bg-dark-charcoal border border-luxury-gold/10 p-4 sm:p-6 sticky top-20 sm:top-28">
                <h3 className="font-heading text-base sm:text-lg font-bold text-soft-white mb-4 sm:mb-6 uppercase tracking-wider">
                  Order Summary
                </h3>

                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between text-soft-white/70">
                    <span>Items ({totalItems})</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-soft-white/70">
                    <span>Shipping</span>
                    <span className="text-green-500">Free</span>
                  </div>
                  <div className="border-t border-luxury-gold/10 pt-2 sm:pt-3 flex justify-between font-heading text-base sm:text-lg font-bold text-luxury-gold">
                    <span>Total</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={onProceedToCheckout}
                  disabled={totalPrice === 0}
                  className="w-full mt-4 sm:mt-6 px-4 sm:px-6 py-3 sm:py-3.5 bg-luxury-gold text-rich-black font-bold uppercase tracking-[0.2em] text-xs sm:text-sm hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Proceed to Checkout
                </button>

                <Link
                  to="/products/mens-collection"
                  className="block w-full mt-2 sm:mt-3 px-4 sm:px-6 py-2.5 sm:py-3 text-center text-[10px] sm:text-xs uppercase tracking-[0.15em] text-soft-white/50 hover:text-luxury-gold transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
