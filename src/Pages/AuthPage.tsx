import { useState, useEffect } from 'react';
import { apiRequest, setTokens } from '../utils/api';
import {FaEye, FaEyeSlash} from "react-icons/fa";
import logoImg from '../assets/kalastra-logo.png';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

type TabType = 'login' | 'signup' | 'forgot' | 'reset';

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [tab, setTab] = useState<TabType>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; list?: string[] } | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

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
    setNewPassword('');
    setOtpCode('');
  };

  const showMessage = (type: 'success' | 'error', text: string, list?: string[]) => {
    setMessage({ type, text, list });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const fullPhone = phone ? `+91${phone.replace(/^\+91/, '')}` : '';
    const payload = {
      email,
      password,
      name,
      ...(fullPhone ? { phone: fullPhone } : {}),
    };

    const res = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.success) {
      showMessage('success', res.message || 'Signup successful! OTP code sent to your email.');
      setOtpEmail(email);
      setIsVerifyingOtp(true);
      setResendTimer(60);
    } else {
      showMessage('error', res.message || 'Signup failed', res.errors);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: otpEmail || email,
        code: otpCode,
      }),
    });

    setLoading(false);
    if (res.success) {
      showMessage('success', 'Email verified successfully! You can now log in.');
      setIsVerifyingOtp(false);
      setTab('login');
      setPassword('');
      setOtpCode('');
    } else {
      showMessage('error', res.message || 'Verification failed');
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setMessage(null);

    const res = await apiRequest('/auth/resend-otp', {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);
    if (res.success && res.data) {
      const { accessToken, idToken, refreshToken } = res.data;
      setTokens(accessToken, idToken, refreshToken);
      onLoginSuccess();
    } else {
      const detail = (res as any).cognitoCode ? ` [${(res as any).cognitoCode}: ${(res as any).detail}]` : '';
      showMessage('error', (res.message || 'Login failed') + detail);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    if (res.success) {
      showMessage('success', 'Password reset code has been sent to your email.');
      setTab('reset');
    } else {
      showMessage('error', res.message || 'Request failed');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        code: otpCode,
        newPassword,
      }),
    });

    setLoading(false);
    if (res.success) {
      showMessage('success', 'Password has been reset successfully. Please log in.');
      setTab('login');
      setPassword('');
      setNewPassword('');
      setOtpCode('');
    } else {
      showMessage('error', res.message || 'Password reset failed');
    }
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <section className="relative min-h-svh flex items-center justify-center overflow-hidden bg-cold-white px-4 py-20">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-cold-grey-light),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--color-cold-grey-light),transparent_70%)]" />
        <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-accent-yellow/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-accent-yellow/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[480px] animate-fade-in-up">
        <div className="relative border border-deep-black bg-pure-white p-8 sm:p-10 shadow-[8px_8px_0px_0px_rgba(11,12,16,1)]">
          <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-cold-grey-light to-transparent" />
          <div className="absolute -bottom-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-cold-grey-light to-transparent" />

          <div className="text-center mb-8 flex flex-col items-center">
            <div className="h-28 mb-4 w-full flex justify-center">
              <img src={logoImg} alt="Kalasatra Logo" className="h-full max-w-full object-contain" />
            </div>
            <p className="text-sm text-cold-grey tracking-wider uppercase font-bold">
              Premium Streetwear
            </p>
          </div>

          {message && (
            <div
              className={`relative flex flex-col gap-1 px-4 py-3 mb-6 text-sm border ${
                message.type === 'error'
                  ? 'bg-red-950/30 border-red-500/25 text-red-400'
                  : 'bg-luxury-gold/8 border-luxury-gold/25 text-luxury-gold'
              }`}
            >
              <span>{message.text}</span>
              {message.list && message.list.length > 0 && (
                <ul className="list-disc pl-5 mt-1 space-y-0.5">
                  {message.list.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </div>
          )}

          {isVerifyingOtp ? (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
              <div className="text-center space-y-3">
                <h3 className="font-heading text-xl font-bold text-deep-black">Verify Your Email</h3>
                <p className="text-sm text-cold-grey">
                  We sent a 6-digit verification code to{' '}
                  <span className="text-deep-black font-bold">{otpEmail || email}</span>
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest text-cold-grey font-bold">
                  Verification OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full px-5 py-3 bg-pure-white border border-cold-grey-light text-deep-black text-center text-xl font-bold tracking-[8px] placeholder:text-cold-grey outline-none focus:border-deep-black transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full px-10 py-3.5 bg-accent-yellow text-deep-black border border-deep-black font-bold uppercase tracking-widest text-sm transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(11,12,16,1)] hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading && (
                    <span className="inline-block w-4 h-4 border-2 border-rich-black/30 border-t-rich-black rounded-full animate-spin" />
                  )}
                  {loading ? 'Confirming...' : 'Confirm Registration'}
                </span>
                <span className="absolute inset-0 bg-pure-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left disabled:scale-x-0" />
              </button>

              <div className="text-center text-sm text-cold-grey font-bold">
                Didn't get the code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || resendTimer > 0}
                  className="text-deep-black font-bold hover:text-cold-grey transition-colors bg-transparent border-none p-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend Code'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsVerifyingOtp(false)}
                className="w-full px-5 py-3 border border-cold-grey-light text-deep-black font-bold uppercase tracking-widest text-xs hover:border-deep-black transition-all duration-300 bg-pure-white cursor-pointer"
              >
                Back to Auth Form
              </button>
            </form>
          ) : (
            <>
              {(tab === 'login' || tab === 'signup') && (
                <div className="flex p-1 mb-6 border border-cold-grey-light bg-cold-white">
                  <button
                    onClick={() => handleTabChange('login')}
                    className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                      tab === 'login'
                        ? 'bg-deep-black text-pure-white shadow-sm'
                        : 'text-cold-grey hover:text-deep-black bg-transparent'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleTabChange('signup')}
                    className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                      tab === 'signup'
                        ? 'bg-deep-black text-pure-white shadow-sm'
                        : 'text-cold-grey hover:text-deep-black bg-transparent'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {tab === 'login' && (
                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest text-cold-grey font-bold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-5 py-3 bg-pure-white border border-cold-grey-light text-deep-black text-sm placeholder:text-cold-grey outline-none focus:border-deep-black transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-2 relative">
                    <label className="text-xs uppercase tracking-widest text-cold-grey font-bold">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-5 py-3 pr-12 bg-pure-white border border-cold-grey-light text-deep-black text-sm placeholder:text-cold-grey outline-none focus:border-deep-black transition-colors"
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-cold-grey hover:text-deep-black transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm font-bold">
                    <label className="flex items-center gap-2 text-cold-grey cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-accent-yellow bg-pure-white border-cold-grey-light" />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTabChange('forgot')}
                      className="text-deep-black font-bold hover:text-cold-grey transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full px-10 py-3.5 bg-accent-yellow text-deep-black border border-deep-black font-bold uppercase tracking-widest text-sm transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(11,12,16,1)] hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading && (
                        <span className="inline-block w-4 h-4 border-2 border-rich-black/30 border-t-rich-black rounded-full animate-spin" />
                      )}
                      {loading ? 'Logging in...' : 'Log In'}
                    </span>
                    <span className="absolute inset-0 bg-pure-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left disabled:scale-x-0" />
                  </button>

                 
                </form>
              )}

              {tab === 'signup' && (
                <form onSubmit={handleSignup} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest text-cold-grey font-bold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-5 py-3 bg-pure-white border border-cold-grey-light text-deep-black text-sm placeholder:text-cold-grey outline-none focus:border-deep-black transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest text-cold-grey font-bold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-5 py-3 bg-pure-white border border-cold-grey-light text-deep-black text-sm placeholder:text-cold-grey outline-none focus:border-deep-black transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest text-cold-grey font-bold">
                      Phone Number
                    </label>
                    <div className="flex items-center w-full bg-pure-white border border-cold-grey-light focus-within:border-deep-black transition-colors">
                      <span className="px-5 py-3 text-deep-black font-bold border-r border-cold-grey-light bg-cold-white">
                        +91
                      </span>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-5 py-3 text-deep-black text-sm placeholder:text-cold-grey outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 relative">
                    <label className="text-xs uppercase tracking-widest text-cold-grey font-bold">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-5 py-3 pr-12 bg-pure-white border border-cold-grey-light text-deep-black text-sm placeholder:text-cold-grey outline-none focus:border-deep-black transition-colors"
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-cold-grey hover:text-deep-black transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                      </button>
                    </div>
                    <p className="text-[11px] text-soft-white/40 mt-1">
                      Min 8 characters. Must contain uppercase, lowercase, number, and special character.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full px-10 py-3.5 bg-accent-yellow text-deep-black border border-deep-black font-bold uppercase tracking-widest text-sm transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(11,12,16,1)] hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading && (
                        <span className="inline-block w-4 h-4 border-2 border-rich-black/30 border-t-rich-black rounded-full animate-spin" />
                      )}
                      {loading ? 'Creating...' : 'Create Account'}
                    </span>
                    <span className="absolute inset-0 bg-pure-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left disabled:scale-x-0" />
                  </button>
                </form>
              )}

              {tab === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
                  <div className="text-center space-y-2 mb-2">
                    <h3 className="font-heading text-lg font-bold text-soft-white">Forgot Password</h3>
                    <p className="text-sm text-soft-white/60">Enter your email and we'll send you an OTP to reset your password.</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest text-cold-grey font-bold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-5 py-3 bg-pure-white border border-cold-grey-light text-deep-black text-sm placeholder:text-cold-grey outline-none focus:border-deep-black transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full px-10 py-3.5 bg-accent-yellow text-deep-black border border-deep-black font-bold uppercase tracking-widest text-sm transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(11,12,16,1)] hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading && (
                        <span className="inline-block w-4 h-4 border-2 border-rich-black/30 border-t-rich-black rounded-full animate-spin" />
                      )}
                      {loading ? 'Sending...' : 'Send Reset Code'}
                    </span>
                    <span className="absolute inset-0 bg-pure-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left disabled:scale-x-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('login')}
                    className="w-full px-5 py-3 border border-cold-grey-light text-deep-black font-bold uppercase tracking-widest text-xs hover:border-deep-black transition-all duration-300 bg-pure-white cursor-pointer"
                  >
                    Back to Login
                  </button>
                </form>
              )}

              {tab === 'reset' && (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                  <div className="text-center space-y-2 mb-2">
                    <h3 className="font-heading text-lg font-bold text-soft-white">Reset Password</h3>
                    <p className="text-sm text-soft-white/60">Enter the code sent to your email and your new password.</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest text-cold-grey font-bold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-5 py-3 bg-pure-white border border-cold-grey-light text-deep-black text-sm placeholder:text-cold-grey outline-none focus:border-deep-black transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest text-cold-grey font-bold">
                      Reset OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full px-5 py-3 bg-pure-white border border-cold-grey-light text-deep-black text-sm placeholder:text-cold-grey outline-none focus:border-deep-black transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-2 relative">
                    <label className="text-xs uppercase tracking-widest text-cold-grey font-bold">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full px-5 py-3 pr-12 bg-pure-white border border-cold-grey-light text-deep-black text-sm placeholder:text-cold-grey outline-none focus:border-deep-black transition-colors"
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-cold-grey hover:text-deep-black transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full px-10 py-3.5 bg-accent-yellow text-deep-black border border-deep-black font-bold uppercase tracking-widest text-sm transition-all duration-300 hover:shadow-[4px_4px_0px_0px_rgba(11,12,16,1)] hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading && (
                        <span className="inline-block w-4 h-4 border-2 border-rich-black/30 border-t-rich-black rounded-full animate-spin" />
                      )}
                      {loading ? 'Updating...' : 'Update Password'}
                    </span>
                    <span className="absolute inset-0 bg-pure-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left disabled:scale-x-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('login')}
                    className="w-full px-5 py-3 border border-cold-grey-light text-deep-black font-bold uppercase tracking-widest text-xs hover:border-deep-black transition-all duration-300 bg-pure-white cursor-pointer"
                  >
                    Back to Login
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <div className="absolute -bottom-4 -left-4 right-10 h-px bg-cold-grey-light pointer-events-none" />
        <div className="absolute -top-4 -right-4 bottom-10 w-px bg-cold-grey-light pointer-events-none" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-cold-grey-light" />
    </section>
  );
}
