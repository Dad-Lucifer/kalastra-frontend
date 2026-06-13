import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { apiRequest } from '../utils/api';
import { loadRazorpayScript } from '../utils/razorpay';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShippingAddress {
  full_name:    string;
  line1:        string;
  line2?:       string;
  city:         string;
  state:        string;
  pincode:      string;
  country?:     string;
}

export interface CheckoutExtras {
  coinsUsed: number;
  coinsDiscount: number;
  deliveryCharge: number;
}

export const useCheckout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const navigate = useNavigate();

  /**
   * handleCheckout
   * @param shippingAddress  - delivery address selected by user
   * @param extras           - { coinsUsed, coinsDiscount, deliveryCharge }
   * @param onSuccess        - callback invoked when payment verification succeeds
   */
  const handleCheckout = async (
    shippingAddress?: ShippingAddress,
    extras?: CheckoutExtras,
    onSuccess?: (earnedCoins: number) => void
  ) => {
    // Guard: if caller accidentally passed an event object (e.g. onClick={handleCheckout}
    // without the arrow wrapper), discard it — it would cause a circular JSON error.
    if (
      shippingAddress !== null &&
      shippingAddress !== undefined &&
      (typeof (shippingAddress as any).preventDefault === 'function' ||
       typeof (shippingAddress as any).nativeEvent !== 'undefined' ||
       (shippingAddress as any) instanceof Event)
    ) {
      shippingAddress = undefined;
    }

    if (!localStorage.getItem('accessToken')) {
      navigate('/auth');
      return;
    }

    if (totalPrice <= 0) return;

    setIsCheckingOut(true);

    try {
      // ── 1. Load Razorpay SDK ───────────────────────────────────────────────
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        alert('Razorpay SDK failed to load. Are you online?');
        setIsCheckingOut(false);
        return;
      }

      // ── 2. Create Razorpay Order on backend ───────────────────────────────
      const coinsUsed = extras?.coinsUsed ?? 0;
      const coinsDiscount = extras?.coinsDiscount ?? 0;
      const deliveryCharge = extras?.deliveryCharge ?? 0;
      const finalAmount = Math.max(0, totalPrice - coinsDiscount + deliveryCharge);

      const orderRes = await apiRequest('/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount: finalAmount }),
      });

      if (!orderRes.success || !orderRes.data) {
        alert(orderRes.message || 'Failed to create order');
        setIsCheckingOut(false);
        return;
      }

      const razorpayOrder = orderRes.data;

      // ── 3. Snapshot cart items for the order record ───────────────────────
      // Captured HERE so if user modifies cart while payment modal is open
      // we still record what was actually purchased.
      const orderItems = items.map((item) => ({
        product_id:   item.productId,
        product_name: item.name,
        slug:         item.slug,
        price:        item.price,
        quantity:     item.quantity,
        size:         item.size,
        color:        item.color,
        image:        item.image,
      }));

      // ── 4. Open Razorpay Checkout ─────────────────────────────────────────
      const options = {
        key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:      razorpayOrder.amount,
        currency:    razorpayOrder.currency,
        name:        'Kalasatra',
        description: 'Store Purchase',
        order_id:    razorpayOrder.id,

        handler: async function (response: any) {
          // ── 5. Verify payment + persist order ───────────────────────────
          // IMPORTANT: Destructure ONLY the three known-safe string fields
          // from the Razorpay response object BEFORE JSON.stringify.
          // In dev/sandbox, Razorpay attaches DOM references and React fiber
          // properties to the response object, which causes a circular
          // structure error if the full object is serialised.
          const razorpay_order_id   = String(response.razorpay_order_id   ?? '');
          const razorpay_payment_id = String(response.razorpay_payment_id ?? '');
          const razorpay_signature  = String(response.razorpay_signature  ?? '');

          const verifyRes = await apiRequest('/payment/verify', {
            method: 'POST',
            body: JSON.stringify({
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,

              // Order metadata saved to order_confirmed table
              amount:           finalAmount,
              items:            orderItems,
              shipping_address: shippingAddress ?? null,
              coins_used:       coinsUsed,
              coins_discount:   coinsDiscount,
              delivery_charge:  deliveryCharge,
            }),
          });

          if (verifyRes.success) {
            clearCart();
            if (onSuccess) onSuccess(verifyRes.data?.earned_coins ?? 0);
          } else {
            alert(verifyRes.message || 'Payment Verification Failed');
          }

          setIsCheckingOut(false);
        },

        prefill: {
          name:    shippingAddress?.full_name || 'Customer',
          email:   '',   // populated from user profile if available
          contact: '',
        },

        theme: {
          color: '#D4AF37', // Kalasatra gold
        },

        modal: {
          confirm_close: false,
          escape:        true,
          handleback:    true,
          ondismiss: function () {
            setIsCheckingOut(false);
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

      paymentObject.on('payment.failed', function (response: any) {
        setIsCheckingOut(false);
        alert('Payment Failed: ' + response.error.description);
      });

    } catch (error) {
      console.error(error);
      alert('An error occurred during checkout');
      setIsCheckingOut(false);
    }
  };

  return { handleCheckout, isCheckingOut };
};
