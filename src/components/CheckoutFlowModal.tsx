import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useCheckout } from '../hooks/useCheckout';
import type { ShippingAddress } from '../hooks/useCheckout';
import { apiRequest } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/kalastra-logo.png';

// ─── Types ────────────────────────────────────────────────────────────────────

type AlterAddress = {
  id: string;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

type ModalStep = 'choose' | 'new' | 'summary' | 'success';

interface CheckoutFlowModalProps {
  onClose: () => void;
}

// ─── Delivery Charge Logic ─────────────────────────────────────────────────────

const MUMBAI_PINCODES_START = ['400', '401'];
const MAHARASHTRA_PINCODES_START = [
  '400','401','402','403','404','410','411','412','413','414','415',
  '416','417','418','419','420','421','422','423','424','425','431',
  '440','441','442','443','444','445','446','447',
];

function getDeliveryCharge(pincode: string, state: string): number {
  if (!pincode || pincode.length < 3) return 170;
  const prefix3 = pincode.slice(0, 3);
  const isMumbai = MUMBAI_PINCODES_START.includes(prefix3);
  if (isMumbai) return 60;
  const isMaha = MAHARASHTRA_PINCODES_START.includes(prefix3) || state?.toLowerCase().includes('maharashtra');
  if (isMaha) return 90;
  return 170;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CheckoutFlowModal({ onClose }: CheckoutFlowModalProps) {
  const { items, totalPrice, totalItems } = useCart();
  const { handleCheckout, isCheckingOut } = useCheckout();
  const navigate = useNavigate();

  const [modalStep, setModalStep] = useState<ModalStep>('choose');
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Addresses
  const [defaultAddress, setDefaultAddress] = useState<AlterAddress | null>(null);
  const [alterAddresses, setAlterAddresses] = useState<AlterAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // New Address Form
  const [savingAddress, setSavingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    full_name: '', address_line1: '', address_line2: '', pincode: '', city: '', state: '',
  });

  // Coins state
  const [availableCoins, setAvailableCoins] = useState(0);
  const [coinsToRedeem, setCoinsToRedeem] = useState(0);   // multiple of 100
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [loadingCoins, setLoadingCoins] = useState(true);

  // Delivery charge state
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  useEffect(() => { loadAddresses(); loadCoins(); }, []);

  const loadCoins = async () => {
    setLoadingCoins(true);
    try {
      const res = await apiRequest('/coins') as any;
      if (res.success) setAvailableCoins(res.data?.coins ?? 0);
    } catch (_) { /* non-fatal — coins default to 0 */ }
    finally { setLoadingCoins(false); }
  };

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const profileRes = await apiRequest('/user/profile') as any;
      if (profileRes.success && profileRes.data?.address_line1) {
        const d = profileRes.data;
        setDefaultAddress({
          id: 'primary',
          full_name: d.name || 'My Address',
          address_line1: d.address_line1,
          address_line2: d.address_line2,
          city: d.city,
          state: d.state,
          pincode: d.pincode,
          country: d.country || 'India',
        });
      }
      const altRes = await apiRequest('/addresses') as any;
      if (altRes.success) setAlterAddresses(altRes.data || []);

      const hasDefault = profileRes.success && profileRes.data?.address_line1;
      const hasAlts = altRes.success && altRes.data?.length > 0;
      if (!hasDefault && !hasAlts) setModalStep('new');
    } catch (err) {
      console.error(err);
      setModalStep('new');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setNewAddressForm(prev => ({ ...prev, pincode: val }));
    if (val.length === 6) {
      try {
        const res = await apiRequest<any>(`/pincode/${val}`) as any;
        if (res.success && res.postOffices?.length > 0) {
          const po = res.postOffices[0];
          setNewAddressForm(prev => ({ ...prev, city: po.District, state: po.State }));
        }
      } catch { /* ignore */ }
    }
  };

  const allAddresses: AlterAddress[] = [
    ...(defaultAddress ? [defaultAddress] : []),
    ...alterAddresses,
  ];

  const getSelectedAddressData = (): ShippingAddress | null => {
    const addr = allAddresses.find((a) => a.id === selectedAddressId);
    if (!addr) return null;
    return {
      full_name: addr.full_name,
      line1: addr.address_line1,
      line2: addr.address_line2,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
    };
  };

  const confirmSelectedAddress = () => {
    if (!selectedAddressId) { alert('Please select a delivery address.'); return; }
    const addr = allAddresses.find(a => a.id === selectedAddressId);
    if (addr) {
      const charge = getDeliveryCharge(addr.pincode, addr.state);
      setDeliveryCharge(charge);
    }
    setModalStep('summary');
  };

  const saveNewAddress = async () => {
    const { full_name, address_line1, pincode, city, state } = newAddressForm;
    if (!full_name || !address_line1 || !pincode || !city || !state) {
      alert('Please fill in all required fields.');
      return;
    }
    setSavingAddress(true);
    try {
      const res = await apiRequest('/addresses', {
        method: 'POST',
        body: JSON.stringify({
          full_name, address_line1, address_line2: newAddressForm.address_line2 || undefined,
          city, state, pincode, country: 'India',
        }),
      }) as any;
      if (res.success) {
        await loadAddresses();
        setModalStep('choose');
      } else {
        alert(res.message || 'Failed to save address.');
      }
    } catch { alert('An error occurred while saving the address.'); }
    finally { setSavingAddress(false); }
  };

  // ─── Coins Calculation ──────────────────────────────────────────────────────

  const maxRedeemableCoins = Math.floor(availableCoins / 100) * 100; // e.g. 350 → 300
  const coinsDiscount = (coinsToRedeem / 100) * 10;                  // 100 coins = ₹10
  const coinsUsed = coinsToRedeem;
  const finalAmount = Math.max(0, totalPrice - coinsDiscount + deliveryCharge);

  const stepCoins = (delta: number) => {
    setCoinsToRedeem(prev => {
      const next = prev + delta * 100;
      if (next < 0) return 0;
      if (next > maxRedeemableCoins) return maxRedeemableCoins;
      return next;
    });
  };

  const applyAllCoins = () => setCoinsToRedeem(maxRedeemableCoins);
  const removeCoins   = () => setCoinsToRedeem(0);

  // ─── Payment Trigger ────────────────────────────────────────────────────────

  const proceedToRazorpay = () => {
    const address = getSelectedAddressData();
    if (!address) { alert('Address missing.'); return; }
    handleCheckout(
      address,
      { coinsUsed, coinsDiscount, deliveryCharge },
      (earned: number) => {
        // earned comes directly from the verify response — no extra API call needed
        setEarnedCoins(earned);
        setModalStep('success');
      }
    );
  };

  const currentAddress = getSelectedAddressData();

  // ─── Delivery charge label ──────────────────────────────────────────────────
  const deliveryLabel = deliveryCharge === 0 ? 'Free' :
    deliveryCharge === 60 ? '₹60 (Mumbai)' :
    deliveryCharge === 90 ? '₹90 (Maharashtra)' : '₹170 (Other states)';

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg relative shadow-[0_0_20px_rgba(0,0,0,0.3)] border border-black/10">

        {/* Header */}
        {modalStep !== 'success' && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-black/10">
            <div>
              <h3 className="text-lg font-bold font-heading uppercase tracking-widest text-black leading-none">
                {modalStep === 'summary' ? 'Order Summary' : 'Delivery Details'}
              </h3>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase mt-1">
                {modalStep === 'choose' ? 'Select a delivery address' :
                 modalStep === 'new' ? 'Enter a new address' :
                 'Review your order before payment'}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors cursor-pointer p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">

          {/* ── STEP 1: Choose existing address ─────────────────────────── */}
          {modalStep === 'choose' && (
            <>
              {loadingAddresses ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {allAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-4 p-4 border cursor-pointer transition-all duration-300 ${
                        selectedAddressId === addr.id
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-black/40 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery_address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 accent-black shrink-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-black uppercase tracking-wide">
                          {addr.full_name}
                          {addr.id === 'primary' && (
                            <span className="ml-2 text-[9px] bg-black text-white px-2 py-0.5 font-bold tracking-widest uppercase">Default</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}
                        </p>
                        <p className="text-xs text-gray-600">{addr.city}, {addr.state} — {addr.pincode}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={confirmSelectedAddress}
                  className="w-full bg-black text-white py-3.5 font-bold text-xs tracking-[0.2em] uppercase hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] transition-all cursor-pointer disabled:opacity-50"
                  disabled={!selectedAddressId || loadingAddresses}
                >
                  Deliver Here
                </button>
                <button
                  onClick={() => setModalStep('new')}
                  className="w-full border border-gray-300 text-black py-3.5 font-bold text-xs tracking-[0.2em] uppercase hover:border-black transition-all cursor-pointer"
                >
                  + Add New Address
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Enter new address ────────────────────────────────── */}
          {modalStep === 'new' && (
            <>
              {allAddresses.length > 0 && (
                <button
                  onClick={() => setModalStep('choose')}
                  className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-black uppercase tracking-[0.15em] mb-6 cursor-pointer transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                  Back to saved addresses
                </button>
              )}
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  value={newAddressForm.full_name}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, full_name: e.target.value })}
                  placeholder="FULL NAME *"
                  className="w-full px-4 py-3 bg-white border border-gray-300 text-sm font-bold text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors tracking-widest"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newAddressForm.pincode}
                    onChange={handlePincodeChange}
                    placeholder="PINCODE *"
                    className="w-1/2 px-4 py-3 bg-white border border-gray-300 text-sm font-bold text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors tracking-widest"
                  />
                  <input
                    type="text"
                    value={newAddressForm.city}
                    readOnly
                    placeholder="CITY (AUTO)"
                    className="w-1/2 px-4 py-3 bg-gray-100 border border-gray-200 text-sm font-bold text-gray-500 cursor-not-allowed tracking-widest"
                  />
                </div>
                <input
                  type="text"
                  value={newAddressForm.address_line1}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, address_line1: e.target.value })}
                  placeholder="HOUSE NO., BUILDING, STREET *"
                  className="w-full px-4 py-3 bg-white border border-gray-300 text-sm font-bold text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors tracking-widest"
                />
                <input
                  type="text"
                  value={newAddressForm.address_line2}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, address_line2: e.target.value })}
                  placeholder="LOCALITY / LANDMARK (OPTIONAL)"
                  className="w-full px-4 py-3 bg-white border border-gray-300 text-sm font-bold text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors tracking-widest"
                />
                <button
                  onClick={saveNewAddress}
                  disabled={savingAddress}
                  className="w-full mt-4 bg-black text-white py-3.5 font-bold text-xs tracking-[0.2em] uppercase hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {savingAddress ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Order Summary ────────────────────────────────────── */}
          {modalStep === 'summary' && currentAddress && (
            <div className="flex flex-col gap-5">
              <button
                onClick={() => setModalStep('choose')}
                className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-black uppercase tracking-[0.15em] cursor-pointer transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                Change Address
              </button>

              {/* Delivery address */}
              <div className="bg-gray-50 border border-gray-200 p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em] mb-2 font-semibold">Delivering To:</p>
                <p className="font-bold text-sm text-black uppercase tracking-wide">{currentAddress.full_name}</p>
                <p className="text-xs text-gray-600 mt-1">{currentAddress.line1}{currentAddress.line2 ? `, ${currentAddress.line2}` : ''}</p>
                <p className="text-xs text-gray-600">{currentAddress.city}, {currentAddress.state} — {currentAddress.pincode}</p>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-semibold border-b border-black/10 pb-2">Items ({totalItems})</p>
                <div className="max-h-36 overflow-y-auto pr-1 custom-scrollbar space-y-3">
                  {items.map(item => (
                    <div key={`${item.productId}-${item.size}-${item.color}`} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="flex items-center justify-center h-full font-heading font-bold text-black/30">K</span>
                          )}
                        </div>
                        <div>
                          <p className="text-black font-semibold truncate max-w-[150px]">{item.name}</p>
                          <p className="text-gray-500 text-[10px] uppercase">Qty: {item.quantity} | {item.size} / {item.color}</p>
                        </div>
                      </div>
                      <p className="text-black font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Kalastra Coins Section ───────────────────────────────── */}
              <div className={`border transition-all duration-300 ${
                coinsToRedeem > 0 ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'
              }`}>
                {/* Header row */}
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${
                      coinsToRedeem > 0 ? 'bg-amber-100' : 'bg-gray-100'
                    }`}>
                      🪙
                    </div>
                    <div>
                      <p className="text-xs font-bold text-black uppercase tracking-widest">Kalastra Coins</p>
                      {loadingCoins ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-3 h-3 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
                          <p className="text-[10px] text-gray-400">Fetching balance…</p>
                        </div>
                      ) : (
                        <p className="text-[10px] mt-0.5">
                          <span className={`font-bold ${ availableCoins > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {availableCoins} coins
                          </span>
                          <span className="text-gray-400"> available</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick-action buttons */}
                  {!loadingCoins && maxRedeemableCoins > 0 && (
                    <div className="flex gap-2">
                      {coinsToRedeem < maxRedeemableCoins && (
                        <button
                          onClick={applyAllCoins}
                          className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] bg-amber-500 text-white hover:bg-amber-600 transition-all cursor-pointer"
                        >
                          Use All
                        </button>
                      )}
                      {coinsToRedeem > 0 && (
                        <button
                          onClick={removeCoins}
                          className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] border border-gray-300 text-gray-500 hover:border-black hover:text-black transition-all cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Stepper + info — only show when coins available */}
                {!loadingCoins && maxRedeemableCoins > 0 && (
                  <div className="px-4 pb-4">
                    {/* Stepper row */}
                    <div className="flex items-center gap-3 mb-3">
                      <button
                        onClick={() => stepCoins(-1)}
                        disabled={coinsToRedeem === 0}
                        className="w-9 h-9 flex items-center justify-center border border-gray-300 text-black font-bold text-lg hover:border-black transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        −
                      </button>
                      <div className="flex-1 text-center">
                        <p className="text-2xl font-bold text-black tracking-tight">{coinsToRedeem}</p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider -mt-0.5">coins selected</p>
                      </div>
                      <button
                        onClick={() => stepCoins(1)}
                        disabled={coinsToRedeem >= maxRedeemableCoins}
                        className="w-9 h-9 flex items-center justify-center border border-gray-300 text-black font-bold text-lg hover:border-black transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Info strip */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="bg-gray-50 border border-gray-100 p-2">
                        <p className="text-gray-400 uppercase tracking-wider mb-0.5">Max Usable</p>
                        <p className="font-bold text-black">{maxRedeemableCoins}</p>
                      </div>
                      <div className={`border p-2 ${ coinsToRedeem > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100' }`}>
                        <p className="text-gray-400 uppercase tracking-wider mb-0.5">You Save</p>
                        <p className={`font-bold ${ coinsToRedeem > 0 ? 'text-green-600' : 'text-gray-400' }`}>
                          ₹{coinsDiscount.toFixed(0)}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 p-2">
                        <p className="text-gray-400 uppercase tracking-wider mb-0.5">Left Over</p>
                        <p className="font-bold text-black">{availableCoins - coinsToRedeem}</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-2 text-center">100 coins = ₹10 off &middot; use in multiples of 100</p>
                  </div>
                )}

                {/* Empty / not enough state */}
                {!loadingCoins && maxRedeemableCoins === 0 && (
                  <div className="px-4 pb-4">
                    {availableCoins > 0 ? (
                      <p className="text-[10px] text-gray-400 text-center">
                        Need {100 - availableCoins} more coins to start redeeming (min. 100)
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400 text-center">
                        No coins yet — you'll earn 0–15 coins on this order! 🎉
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ── Price Breakdown ──────────────────────────────────────── */}
              <div className="border-t border-black/10 pt-4 space-y-2.5">
                <div className="flex justify-between text-xs text-gray-600 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>

              {coinsDiscount > 0 && (
                  <div className="flex justify-between text-xs uppercase tracking-widest text-green-600 font-semibold">
                    <span className="flex items-center gap-1">🪙 Coins Discount ({coinsUsed} coins)</span>
                    <span>−₹{coinsDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-gray-600 uppercase tracking-widest">
                  <span>Delivery Charge</span>
                  <span className={deliveryCharge === 0 ? 'text-green-600 font-semibold' : 'text-black font-semibold'}>
                    {deliveryLabel}
                  </span>
                </div>

                <div className="flex justify-between text-base font-heading font-bold text-black uppercase tracking-wider pt-3 border-t border-black/10 mt-1">
                  <span>Total Payable</span>
                  <span>₹{finalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={proceedToRazorpay}
                disabled={isCheckingOut}
                className="w-full bg-black text-white py-4 font-bold text-sm tracking-[0.2em] uppercase hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isCheckingOut ? 'Processing...' : `Pay ₹${finalAmount.toFixed(2)} with Razorpay`}
              </button>
            </div>
          )}

          {/* ── STEP 4: Success ────────────────────────────────────────────── */}
          {modalStep === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <img src={logoImg} alt="Kalastra Logo" className="h-14 w-auto mb-5 drop-shadow-md" />
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-5 shadow-sm border border-green-100">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-black mb-2 font-heading tracking-widest uppercase">
                Thank You, {currentAddress?.full_name?.split(' ')[0] || 'Customer'}!
              </h2>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                Your payment was successful and your order has been confirmed. We'll start preparing it right away.
              </p>

              {/* Coins earned banner */}
              <div className="w-full bg-amber-50 border border-amber-200 rounded p-4 mb-6">
                <p className="text-lg mb-1">🎉</p>
                <p className="text-sm font-bold text-amber-700 uppercase tracking-wider">Coins Earned!</p>
                <p className="text-xs text-amber-600 mt-1">
                  You received <span className="font-bold text-amber-700">{earnedCoins} Kalastra Coins</span> on this order. They have been added to your account credits.
                </p>
              </div>

              <button
                onClick={() => { onClose(); navigate('/user-orders'); }}
                className="w-full bg-black text-white py-4 font-bold text-sm tracking-[0.2em] uppercase hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] transition-all cursor-pointer"
              >
                View My Orders
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
