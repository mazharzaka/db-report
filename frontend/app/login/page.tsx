'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to home
  useEffect(() => {
    try {
      const isAuth = localStorage.getItem('isAuthenticated');
      if (isAuth === 'true') {
        router.replace('/');
      }
    } catch {
      // ignore SSR or localStorage access errors
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password;

    // Hardcoded Enterprise Demo Credentials
    const isValidUser = cleanUser === 'admin' || cleanUser === 'mazhar';
    const isValidPass = cleanPass === 'dreampark2026';

    if (isValidUser && isValidPass) {
      try {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authUser', username.trim());
        localStorage.setItem('authRole', 'Administrator');
        localStorage.setItem('authTime', new Date().toISOString());
      } catch (err) {
        console.error('Failed to save auth state:', err);
      }
      router.replace('/');
    } else {
      setLoading(false);
      setError('اسم المستخدم أو كلمة المرور غير صحيحة. يرجى التأكد وإعادة المحاولة.');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-slate-100 text-slate-900 selection:bg-orange-500/20 selection:text-orange-600 dark:bg-[#09090b] dark:text-slate-100">
      {/* Top Navbar Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-[#121214]">
        <div className="flex items-center gap-3">
          <img
            src="/dreampark-logo.png"
            alt="Dream Park"
            className="h-9 w-auto object-contain"
          />
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">
              منظومة دريم بارك المركزية للعمليات والتحليلات
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Dream Park Theme Park & Zoo — Enterprise ERP Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-zinc-800 dark:bg-[#121214] sm:p-8">
          {/* Card Badge and Header */}
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
              تسجيل الدخول للنظام
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              أدخل بيانات الحساب للوصول إلى لوحة تحليلات وتقارير الكرافانات
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mt-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-zinc-300"
              >
                اسم المستخدم
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin أو mazhar"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-10 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-[#18181b] dark:text-white dark:focus:border-orange-500 dark:focus:bg-[#18181b]"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-zinc-300"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-[#18181b] dark:text-white dark:focus:border-orange-500 dark:focus:bg-[#18181b]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-2.5 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-orange-700 active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
              <ArrowLeft className="h-4 w-4" />
            </button>
          </form>

          {/* Demo Credentials Box */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-zinc-800 dark:bg-[#18181b]">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-zinc-300">
              <KeyRound className="h-3.5 w-3.5 text-orange-500" />
              <span>بيانات تجريبية مصرحة (Demo Credentials):</span>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-slate-600 dark:text-zinc-400" dir="ltr">
              <div className="flex justify-between">
                <span className="text-slate-400">Username:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">admin <span className="font-normal text-slate-400">or</span> mazhar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Password:</span>
                <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">dreampark2026</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-500 dark:border-zinc-800 dark:bg-[#121214] dark:text-zinc-500">
        <span>© 2026 Dream Park Theme Park & Zoo — جميع الحقوق محفوظة</span>
      </footer>
    </div>
  );
}

