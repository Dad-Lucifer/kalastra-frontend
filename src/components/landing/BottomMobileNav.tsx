import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const decodeJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export default function BottomMobileNav() {
  const { totalItems } = useCart();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const idToken = localStorage.getItem('idToken');
  const isLoggedIn = !!localStorage.getItem('accessToken');
  const tokenPayload = isLoggedIn && idToken ? decodeJwt(idToken) : null;
  const userName = tokenPayload?.name || tokenPayload?.email || 'User';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        // Was setProfileOpen(false)
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-pure-white border-t border-cold-grey-light">
      <div className="flex items-center justify-between px-2 xs:px-4 sm:px-6 py-1.5 sm:py-2 max-w-screen-sm mx-auto">
        
        {/* Home */}
        <Link to="/" className="flex flex-col items-center gap-0.5 min-w-0 flex-1 p-1.5 sm:p-2 bg-cold-white rounded-none border border-cold-grey-light">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-deep-black w-4 h-4 sm:w-5 sm:h-5">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span className="text-[8px] xs:text-[10px] font-bold text-deep-black uppercase tracking-wider leading-none">Home</span>
        </Link>

        {/* Explore */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('open-sidebar'));
          }}
          className="flex flex-col items-center gap-0.5 min-w-0 flex-1 p-1.5 sm:p-2 text-cold-grey hover:text-deep-black transition-colors bg-transparent border-none cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="11"></line>
            <line x1="11" y1="14" x2="11" y2="14"></line>
          </svg>
          <span className="text-[8px] xs:text-[10px] font-bold uppercase tracking-wider leading-none">Explore</span>
        </button>

        {/* NEW */}
        <Link to="/new" className="flex flex-col items-center justify-center min-w-0 flex-1 p-1.5 sm:p-2">
          <span className="text-xs xs:text-sm sm:text-base font-heading font-bold text-deep-black tracking-widest uppercase border-b-2 border-deep-black leading-none pb-0.5 whitespace-nowrap">NEW</span>
        </Link>

        {/* Cart */}
        <Link to="/cart" className="flex flex-col items-center gap-0.5 min-w-0 flex-1 p-1.5 sm:p-2 text-cold-grey hover:text-deep-black transition-colors relative">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
            <path d="M3 6h18"></path>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          {totalItems > 0 && (
            <span className="absolute -top-0.5 right-1 sm:right-3 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-accent-yellow text-deep-black text-[8px] sm:text-[10px] font-bold rounded-none flex items-center justify-center border border-deep-black">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
          <span className="text-[8px] xs:text-[10px] font-bold uppercase tracking-wider leading-none">Cart</span>
        </Link>

        {/* Profile */}
        <div className="relative min-w-0 flex-1" ref={dropdownRef}>
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className="flex flex-col items-center gap-0.5 p-1.5 sm:p-2 text-cold-grey hover:text-deep-black transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="text-[8px] xs:text-[10px] font-bold uppercase tracking-wider max-w-full truncate leading-none">{userName}</span>
            </Link>
          ) : (
            <Link to="/auth" className="flex flex-col items-center gap-0.5 p-1.5 sm:p-2 text-cold-grey hover:text-deep-black transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="text-[8px] xs:text-[10px] font-bold uppercase tracking-wider leading-none">Profile</span>
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
