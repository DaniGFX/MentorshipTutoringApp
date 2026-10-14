import React, { useState, useEffect } from 'react';
import logoImg from '../../assets/logo.png';
import { authService } from '../../services/authService.js';

export default function LoginScreen({
  onLogin,
  onNavigateToSignUp,
  onForgotPassword
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    // Hardware-accelerated frame trigger for smooth drawer slide-up
    const timer = setTimeout(() => {
      setIsDrawerOpen(true);
    }, 40);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!cleanPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const { user, profile, error } = await authService.signIn({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (onLogin) {
        onLogin({
          user,
          profile,
          email: profile?.email || cleanEmail,
          role: profile?.account_type || 'student',
          name: profile?.full_name || cleanEmail.split('@')[0],
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50 flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Decorative soft ambient light circles for subtle depth */}
      <div className="absolute -right-16 -top-16 w-56 h-56 bg-sky-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 top-48 w-56 h-56 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none" />
      
      {/* Top Header & Branding Section */}
      <div className="pt-10 pb-6 px-6 text-center flex flex-col items-center">
        {/* App Logo - High contrast on light background */}
        <div className="w-28 h-28 mb-2 flex items-center justify-center">
          <img
            src={logoImg}
            alt="MentorLink Logo"
            className="w-full h-full object-contain drop-shadow-sm"
          />
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome Back!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs font-medium">
          Sign in to continue your journey with MentorLink.
        </p>
      </div>

      {/* White Curved Bottom Sheet Container acting like a native mobile drawer */}
      <div
        className={`bg-white rounded-t-[40px] px-6 sm:px-8 pt-5 pb-8 shadow-[0_-12px_32px_-4px_rgba(15,23,42,0.08)] border-t border-slate-100 flex-1 flex flex-col justify-start transform transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          isDrawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Mobile Drawer Pill Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4"></div>
        
        <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-6 tracking-tight">
          Sign In
        </h2>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-left">
              Email
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl flex items-center px-4 py-3.5 focus-within:bg-white focus-within:border-sky-600 focus-within:ring-4 focus-within:ring-sky-100 transition-all">
              <svg className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm font-medium"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-left">
              Password
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl flex items-center px-4 py-3.5 focus-within:bg-white focus-within:border-sky-600 focus-within:ring-4 focus-within:ring-sky-100 transition-all">
              <svg className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 ml-2 focus:outline-none"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600"
              />
              <span className="text-xs sm:text-sm font-medium text-slate-600">
                Remember me
              </span>
            </label>

            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs sm:text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {/* Primary Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-extrabold text-base shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2 mt-5 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Sign In</span>
            )}
          </button>

        </form>


        {/* Divider: Line - Or - Line */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Or</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        {/* Google Authentication Pill */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (onLogin) onLogin({ email: 'student@mentorlink.ph', role: 'student', name: 'Google Student User' });
            }}
            className="w-full sm:w-64 py-3 px-6 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center gap-3 transition-colors shadow-sm active:scale-95 cursor-pointer"
          >
            {/* Google Multi-colored Vector Logo */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.1 3.665-5.2 3.665-9.12z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.27v3.13C3.25 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.01-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.59l4.01 3.13c.95-2.84 3.6-4.95 6.72-4.95z"
              />
            </svg>
            <span className="font-bold text-slate-800 text-sm">Google</span>
          </button>
        </div>

        {/* Bottom Switcher: Don't have an account? Sign Up */}
        <p className="text-center text-xs sm:text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToSignUp}
            className="font-bold text-sky-600 hover:text-sky-700 hover:underline focus:outline-none"
          >
            Sign Up
          </button>
        </p>

      </div>

    </div>
  );
}
