import { useState, useEffect } from 'react';
import { apiRequest, setTokens } from '../utils/api';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface AdminAuthPageProps {
  onLoginSuccess: () => void;
}

type TabType = 'login' | 'signup';

export default function AdminAuthPage({ onLoginSuccess }: AdminAuthPageProps) {
  const [tab, setTab] = useState<TabType>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; list?: string[] } | null>(null);

  // Forms state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // OTP verification sub-view
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Handle Resend OTP Timer
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const handleTabChange = (newTab: TabType) => {
    setTab(newTab);
    setMessage(null);
    setPassword('');
    setOtpCode('');
  };

  const showMessage = (type: 'success' | 'error', text: string, list?: string[]) => {
    setMessage({ type, text, list });
  };

  // 1. ADMIN SIGNUP REQUEST
  const handleAdminSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      email,
      password,
      name,
      ...(phone ? { phone } : {}),
    };

    const res = await apiRequest('/admin/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.success) {
      showMessage('success', res.message || 'Admin account created! OTP code sent to your email.');
      setOtpEmail(email);
      setIsVerifyingOtp(true);
      setResendTimer(60);
    } else {
      showMessage('error', res.message || 'Signup failed', res.errors);
    }
  };

  // 2. VERIFY OTP REQUEST
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await apiRequest('/admin/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: otpEmail || email,
        code: otpCode,
      }),
    });

    setLoading(false);
    if (res.success) {
      showMessage('success', 'Email verified successfully! Admin account activated. You can now log in.');
      setIsVerifyingOtp(false);
      setTab('login');
      setPassword('');
      setOtpCode('');
    } else {
      showMessage('error', res.message || 'Verification failed');
    }
  };

  // 3. RESEND OTP
  const handleResendOtp = async () => {
    setLoading(true);
    setMessage(null);

    const res = await apiRequest('/admin/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email: otpEmail || email }),
    });

    setLoading(false);
    if (res.success) {
      showMessage('success', 'A new OTP confirmation code has been sent to your email.');
      setResendTimer(60);
    } else {
      showMessage('error', res.message || 'Failed to resend code');
    }
  };

  // 4. ADMIN LOGIN REQUEST
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await apiRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);
    if (res.success && res.data) {
      const { accessToken, idToken, refreshToken, user } = res.data;
      setTokens(accessToken, idToken, refreshToken);

      // Store admin user info
      localStorage.setItem('adminUser', JSON.stringify(user));

      showMessage('success', `Welcome back, ${user.name}! Role: ${user.role}`);
      setTimeout(() => onLoginSuccess(), 1500);
    } else {
      showMessage('error', res.message || 'Admin login failed');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-10 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4AF37] opacity-[0.03] rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#D4AF37] opacity-[0.02] rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0A0A0A]/80 backdrop-blur-xl border border-[#D4AF37]/10 shadow-[0_0_50px_rgba(0,0,0,0.9)] rounded-sm p-10 relative z-10 transition-all duration-500">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-5">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-light tracking-[0.2em] text-[#FDFBF7] uppercase">Admin Portal</h2>
          <div className="h-[1px] w-12 bg-[#D4AF37]/40 mx-auto mt-4 mb-3"></div>
          <p className="text-[10px] tracking-widest text-[#FDFBF7]/40 uppercase">Kalasatra Security</p>
        </div>

        {message && (
          <div className={`mb-8 px-4 py-3 text-[11px] uppercase tracking-wider text-center border-l-2 ${message.type === 'success'
              ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5'
              : 'border-red-500 text-red-400 bg-red-900/10'
            }`}>
            <span>{message.text}</span>
            {message.list && message.list.length > 0 && (
              <ul className="mt-2 space-y-1 list-none opacity-80">
                {message.list.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
          </div>
        )}

        {isVerifyingOtp ? (
          <form onSubmit={handleVerifyOtp} className="space-y-8 animate-fade-in">
            <div className="text-center space-y-3 mb-8">
              <h3 className="text-[11px] tracking-[0.2em] text-[#D4AF37] uppercase">Verify Identity</h3>
              <p className="text-[11px] text-[#FDFBF7]/50 leading-relaxed tracking-wider">
                Code dispatched to <br/><span className="text-[#FDFBF7] mt-1 inline-block">{otpEmail || email}</span>
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                maxLength={6}
                placeholder="• • • • • •"
                className="w-full px-0 py-4 bg-transparent border-b border-[#FDFBF7]/10 text-[#D4AF37] text-2xl text-center tracking-[16px] font-light outline-none focus:border-[#D4AF37] transition-all duration-500 placeholder-[#FDFBF7]/10"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>

            <button type="submit" className="group relative w-full py-4 mt-4 bg-[#D4AF37] text-[#050505] text-[10px] tracking-[0.2em] font-bold uppercase hover:bg-[#FDFBF7] transition-all duration-500 overflow-hidden cursor-pointer border-none" disabled={loading}>
              <span className="relative z-10 flex items-center justify-center">
                {loading ? <span className="w-3 h-3 border-2 border-[#050505] border-t-transparent rounded-full animate-spin mr-3" /> : null}
                {loading ? 'Verifying...' : 'Authenticate'}
              </span>
            </button>

            {/* Resend / Back */}
            <div className="flex flex-col items-center gap-5 mt-8">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || resendTimer > 0}
                className="text-[9px] bg-transparent border-none tracking-widest uppercase text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors disabled:opacity-30 cursor-pointer"
              >
                {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={() => setIsVerifyingOtp(false)}
                className="text-[9px] bg-transparent border-none tracking-widest uppercase text-[#FDFBF7]/30 hover:text-[#FDFBF7]/70 transition-colors cursor-pointer"
              >
                Return to Login
              </button>
            </div>
          </form>
        ) : (
          <div className="animate-fade-in">
            <div className="flex mb-10 border-b border-[#FDFBF7]/10">
              <button
                onClick={() => handleTabChange('login')}
                className={`flex-1 pb-4 text-[10px] tracking-[0.2em] uppercase transition-all duration-500 bg-transparent border-none cursor-pointer ${tab === 'login'
                    ? 'text-[#D4AF37] border-b border-[#D4AF37]'
                    : 'text-[#FDFBF7]/30 hover:text-[#FDFBF7]/60'
                  }`}
              >
                Authorize
              </button>
              <button
                onClick={() => handleTabChange('signup')}
                className={`flex-1 pb-4 text-[10px] tracking-[0.2em] uppercase transition-all duration-500 bg-transparent border-none cursor-pointer ${tab === 'signup'
                    ? 'text-[#D4AF37] border-b border-[#D4AF37]'
                    : 'text-[#FDFBF7]/30 hover:text-[#FDFBF7]/60'
                  }`}
              >
                Register
              </button>
            </div>

            {tab === 'login' && (
              <form onSubmit={handleAdminLogin} className="space-y-8">
                <div className="space-y-2 group">
                  <label className="block text-[9px] tracking-[0.25em] text-[#FDFBF7]/40 uppercase group-focus-within:text-[#D4AF37] transition-colors">Admin Email</label>
                  <input
                    type="email"
                    placeholder="admin@kalasatra.com"
                    className="w-full px-0 py-3 bg-transparent border-b border-[#FDFBF7]/10 text-[#FDFBF7] text-sm placeholder-[#FDFBF7]/10 outline-none focus:border-[#D4AF37]/50 transition-all duration-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 group relative">
                  <label className="block text-[9px] tracking-[0.25em] text-[#FDFBF7]/40 uppercase group-focus-within:text-[#D4AF37] transition-colors">Passcode</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-0 py-3 pr-10 bg-transparent border-b border-[#FDFBF7]/10 text-[#FDFBF7] text-sm placeholder-[#FDFBF7]/10 outline-none focus:border-[#D4AF37]/50 transition-all duration-500"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute top-1/2 right-0 -translate-y-1/2 text-[#FDFBF7]/20 hover:text-[#D4AF37] transition-colors bg-transparent border-none cursor-pointer"
                    >
                      {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full mt-10 py-4 bg-[#D4AF37] text-[#050505] text-[10px] tracking-[0.2em] font-bold uppercase hover:bg-[#FDFBF7] hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-500 cursor-pointer border-none" disabled={loading}>
                  <span className="flex items-center justify-center">
                    {loading ? <span className="w-3 h-3 border-2 border-[#050505] border-t-transparent rounded-full animate-spin mr-3" /> : null}
                    {loading ? 'Establishing Link...' : 'Access Portal'}
                  </span>
                </button>

                <div className="text-center mt-8">
                  <p className="text-[9px] tracking-[0.2em] text-[#FDFBF7]/30 uppercase">
                    Pending Verification?{' '}
                    <span
                      onClick={() => {
                        setOtpEmail(email);
                        setIsVerifyingOtp(true);
                      }}
                      className="text-[#D4AF37]/70 hover:text-[#D4AF37] cursor-pointer transition-colors ml-1"
                    >
                      Verify Now
                    </span>
                  </p>
                </div>
              </form>
            )}

            {tab === 'signup' && (
              <form onSubmit={handleAdminSignup} className="space-y-8">
                <div className="space-y-2 group">
                  <label className="block text-[9px] tracking-[0.25em] text-[#FDFBF7]/40 uppercase group-focus-within:text-[#D4AF37] transition-colors">Designation</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full px-0 py-3 bg-transparent border-b border-[#FDFBF7]/10 text-[#FDFBF7] text-sm placeholder-[#FDFBF7]/10 outline-none focus:border-[#D4AF37]/50 transition-all duration-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 group">
                  <label className="block text-[9px] tracking-[0.25em] text-[#FDFBF7]/40 uppercase group-focus-within:text-[#D4AF37] transition-colors">Admin Email</label>
                  <input
                    type="email"
                    placeholder="admin@kalasatra.com"
                    className="w-full px-0 py-3 bg-transparent border-b border-[#FDFBF7]/10 text-[#FDFBF7] text-sm placeholder-[#FDFBF7]/10 outline-none focus:border-[#D4AF37]/50 transition-all duration-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 group">
                  <label className="block text-[9px] tracking-[0.25em] text-[#FDFBF7]/40 uppercase group-focus-within:text-[#D4AF37] transition-colors">Secure Line</label>
                  <input
                    type="tel"
                    placeholder="+1 234 567 890 (Optional)"
                    className="w-full px-0 py-3 bg-transparent border-b border-[#FDFBF7]/10 text-[#FDFBF7] text-sm placeholder-[#FDFBF7]/10 outline-none focus:border-[#D4AF37]/50 transition-all duration-500"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2 group relative">
                  <label className="block text-[9px] tracking-[0.25em] text-[#FDFBF7]/40 uppercase group-focus-within:text-[#D4AF37] transition-colors">Passcode</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-0 py-3 pr-10 bg-transparent border-b border-[#FDFBF7]/10 text-[#FDFBF7] text-sm placeholder-[#FDFBF7]/10 outline-none focus:border-[#D4AF37]/50 transition-all duration-500"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute top-1/2 right-0 -translate-y-1/2 text-[#FDFBF7]/20 hover:text-[#D4AF37] transition-colors bg-transparent border-none cursor-pointer"
                    >
                      {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                  <p className="text-[8px] text-[#FDFBF7]/20 mt-3 uppercase tracking-[0.15em] leading-relaxed">
                    Min 8 chars • Uppercase • Lowercase • Number • Symbol
                  </p>
                </div>

                <button type="submit" className="w-full mt-10 py-4 bg-[#D4AF37] text-[#050505] text-[10px] tracking-[0.2em] font-bold uppercase hover:bg-[#FDFBF7] hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-500 cursor-pointer border-none" disabled={loading}>
                  <span className="flex items-center justify-center">
                    {loading ? <span className="w-3 h-3 border-2 border-[#050505] border-t-transparent rounded-full animate-spin mr-3" /> : null}
                    {loading ? 'Initializing...' : 'Request Clearance'}
                  </span>
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
