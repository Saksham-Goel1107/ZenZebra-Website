'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { account } from '@/lib/appwrite';
import { secureError, secureLog } from '@/lib/logger';
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');
  const isForced = searchParams.get('force') === 'true';

  useEffect(() => {
    if (!isForced && (!userId || !secret)) {
      setError('Invalid or expired reset link. Please request a new one.');
    }
  }, [userId, secret, isForced]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isForced) {
        // Handle forced reset for logged-in user via API
        secureLog('Initiating forced password reset...');
        const { jwt } = await account.createJWT();
        const response = await fetch('/api/admin/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-JWT': jwt,
          },
          body: JSON.stringify({ newPassword: password }),
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || 'Failed to reset password');
        }

        secureLog('Password reset successful, clearing flag...');
      } else {
        // Standard recovery flow
        secureLog('Using recovery flow...');
        await account.updateRecovery(userId!, secret!, password);
      }

      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push('/admin-login');
      }, 3000);
    } catch (err: any) {
      secureError('RESET ERROR DETAILS:', {
        message: err.message,
        type: err.type,
        code: err.code,
        isForced,
        passwordLength: password.length,
      });
      setError(err.message || 'Failed to update password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#CC2224] opacity-[0.1] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md p-8 relative z-10 mx-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/[0.03] border border-white/5 mb-4 shadow-xl shadow-[#CC2224]/10">
            <ShieldCheck className="w-8 h-8 text-[#CC2224]" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Set New Password</h2>
          <p className="text-white/40 mt-2 text-sm">
            Please enter a strong password for your account
          </p>
        </div>

        <div className="bg-[#111] bg-opacity-80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center relative z-10 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center space-y-6 relative z-10 py-4 animate-in fade-in zoom-in-95">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-2">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Password Updated!</h3>
                <p className="text-white/50 text-sm">
                  Your password has been changed successfully. Redirecting to login...
                </p>
              </div>
              <Button
                onClick={() => router.push('/admin-login')}
                className="w-full py-6 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold transition-all"
              >
                Go to Login Now
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleReset}
              className="space-y-5 relative z-10 animate-in fade-in slide-in-from-bottom-4"
            >
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-white/50 ml-1">
                  New Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#CC2224] transition-colors" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-6 pl-12 pr-12 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-[#CC2224]/50 focus-visible:border-[#CC2224]/50 transition-all font-medium"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-white/50 ml-1">
                  Confirm New Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#CC2224] transition-colors" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-6 pl-12 pr-4 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-[#CC2224]/50 focus-visible:border-[#CC2224]/50 transition-all font-medium"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || (!isForced && (!userId || !secret))}
                className="w-full py-6 bg-[#CC2224] hover:bg-[#b01c1e] text-white rounded-xl font-semibold transition-all shadow-[0_8px_20px_rgba(204,34,36,0.25)] mt-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#CC2224] animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
