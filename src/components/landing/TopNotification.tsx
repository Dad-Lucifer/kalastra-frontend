import { useState } from 'react';
import logoImg from '../../assets/kalastra-logo.png';
import { apiRequest } from '../../utils/api';

export default function TopNotification() {
  const [showAppBanner, setShowAppBanner] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [location, setLocation] = useState<{ city: string; state: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckPincode = async () => {
    if (!pincodeInput || pincodeInput.length !== 6) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await apiRequest<any>(`/pincode/${pincodeInput}`);
      const payload = res as any;
      
      if (payload.success && payload.postOffices && payload.postOffices.length > 0) {
        const po = payload.postOffices[0];
        setLocation({ city: po.District, state: po.State });
        setShowModal(false);
      } else {
        setError('Pincode not found');
      }
    } catch (err) {
      setError('Pincode not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-pure-white border-b border-cold-grey-light relative z-[100]">
      {/* App Banner (Mobile only in UI, but we can show it generally or hide on large screens) */}
      {showAppBanner && (
        <div className="flex items-center justify-between px-4 py-3 bg-cold-white border-b border-cold-grey-light">
          <div className="flex items-center gap-3">
            {/* Fake App Icon */}
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              <img src={logoImg} alt="Kalastra App Logo" className="w-full h-full object-contain" />
            </div>
            
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-accent-yellow text-deep-black text-xs font-bold px-5 py-2 uppercase tracking-widest hover:bg-deep-black hover:text-pure-white transition-colors shadow-sm cursor-pointer">
              Open
            </button>
            <button onClick={() => setShowAppBanner(false)} className="text-cold-grey hover:text-deep-black transition-colors cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Pincode Strip */}
      <div className="w-full px-6 py-2 bg-pure-white flex items-center justify-end border-b border-cold-grey-light/50">
        {location ? (
          <span className="text-[10px] uppercase tracking-widest text-deep-black">
            <strong className="font-bold">{location.state}, {location.city}</strong> <span className="mx-2 opacity-50">|</span> <span onClick={() => setShowModal(true)} className="underline decoration-1 underline-offset-4 decoration-cold-grey hover:decoration-deep-black transition-colors cursor-pointer">change</span>
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-widest text-deep-black cursor-pointer" onClick={() => setShowModal(true)}>
            <strong className="font-bold">Enter Pincode</strong> <span className="mx-2 opacity-50">|</span> <span className="underline decoration-1 underline-offset-4 decoration-cold-grey hover:decoration-deep-black transition-colors">check delivery</span>
          </span>
        )}
      </div>

      {/* Pincode Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-deep-black/50 backdrop-blur-sm p-4">
          <div className="bg-pure-white p-6 md:p-8 w-full max-w-sm relative shadow-2xl border border-cold-grey-light">
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-4 right-4 text-cold-grey hover:text-deep-black transition-colors cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <h3 className="text-lg font-bold font-heading uppercase tracking-widest text-deep-black mb-2">Check Delivery</h3>
            <p className="text-xs text-cold-grey tracking-widest uppercase mb-6">Enter your pincode to see availability</p>
            
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-DIGIT PINCODE"
                className="w-full px-4 py-3 bg-cold-white border border-cold-grey-light text-sm font-bold text-deep-black placeholder-cold-grey focus:outline-none focus:border-accent-yellow transition-colors tracking-widest text-center"
              />
              {error && <span className="text-[10px] text-red-500 font-bold text-center tracking-wider uppercase">{error}</span>}
              <button 
                onClick={handleCheckPincode}
                disabled={loading}
                className="w-full bg-accent-yellow text-deep-black py-3 font-bold text-xs tracking-widest uppercase hover:bg-deep-black hover:text-pure-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Checking...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
