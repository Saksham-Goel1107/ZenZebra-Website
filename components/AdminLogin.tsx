'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { account } from '@/lib/appwrite';
import { secureError, secureLog } from '@/lib/logger';
import { OAuthProvider } from 'appwrite';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.5201 12.2901C23.5201 11.4701 23.44 10.6801 23.2901 9.92006H11.9601V14.3901H18.4901C18.2301 15.9301 17.3701 17.2901 16.0501 18.2601L16.0203 18.397L19.8277 21.3653L20.0901 21.3901C22.4601 19.1901 23.8301 15.9601 23.5201 12.2901Z" fill="#4285F4" />
        <path d="M11.96 24.0001C15.15 24.0001 17.89 22.9201 19.95 20.9701H19.9499L15.92 17.8201C14.82 18.5901 13.43 18.9902 11.96 18.9902C8.84 18.9902 6.13 16.9201 5.15001 14.1101L5.02324 14.1206L1.10702 17.167L1.06006 17.2901C3.12006 21.4101 7.33003 24.0001 11.96 24.0001Z" fill="#34A853" />
        <path d="M5.15004 14.1101C4.63004 12.5601 4.63004 10.8901 5.15004 9.34005L5.14389 9.20625L1.20038 6.13013L1.11003 6.20005C-0.349969 9.09005 -0.349969 12.5001 1.11003 15.3901L5.15004 14.1101Z" fill="#FBBC05" />
        <path d="M11.96 5.01004C13.62 4.97004 15.23 5.58004 16.48 6.75004L19.98 3.25004C17.78 1.17004 14.92 -0.0199589 11.96 0.000141094C7.33003 0.000141094 3.12006 2.59005 1.06006 6.71005L5.15001 9.90005C6.12001 7.08005 8.83003 5.01004 11.96 5.01004Z" fill="#EA4335" />
    </svg>
);

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // MFA State
    const [mfaRequired, setMfaRequired] = useState(false);
    const [totpCode, setTotpCode] = useState('');
    const [challengeId, setChallengeId] = useState('');

    // Recovery State
    const [recoveryMode, setRecoveryMode] = useState(false);
    const [recoverySent, setRecoverySent] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');

    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const cleanEmail = email.trim();
        try {
            await account.createEmailPasswordSession(cleanEmail, password);

            // Success! But check if MFA is required for this session
            const user = await account.get();
            const prefs = user.prefs || {};

            secureLog('LOGIN SUCCESS - User State:', {
                userId: user.$id,
                email: user.email,
                mfaEnabled: user.mfa,
                prefs: prefs,
                mustResetPassword: prefs.mustResetPassword,
                mfaRequired: prefs.mfaRequired
            });

            if (prefs.mustResetPassword) {
                secureLog('Redirecting to password reset...');
                router.push('/admin-login/reset-password?force=true');
                return;
            }

            // Check if MFA is enabled on the account
            if (user.mfa) {
                secureLog('MFA is enabled, creating challenge...');
                const challenge = await account.createMFAChallenge({ factor: 'totp' as any });
                secureLog('MFA Challenge created:', challenge.$id);
                setChallengeId(challenge.$id);
                setMfaRequired(true);
                setLoading(false);
                return;
            }

            // If MFA is not enabled on account but required by policy
            if (prefs.mfaRequired && !user.mfa) {
                secureLog('MFA setup required, redirecting...');
                router.push('/admin-login/mfa-setup');
                return;
            }

            secureLog('No additional security required, redirecting to dashboard...');

            router.push('/admin-login/catalogue-dashboard');
        } catch (err: any) {
            secureError('CRITICAL LOGIN FAILURE:', {
                message: err.message,
                type: err.type,
                code: err.code,
                email: cleanEmail // Helpful for checking hidden spaces
            });

            // If error is "More factors are required", it means login was correct but we need MFA
            if (err.message?.includes('factors') || err.type === 'user_more_factors_required') {
                secureLog('MFA challenge initiated...');
                try {
                    const challenge = await account.createMFAChallenge({ factor: 'totp' as any });
                    setChallengeId(challenge.$id);
                    setMfaRequired(true);
                    setLoading(false);
                    return;
                } catch (mfaErr: any) {
                    setError('MFA Initialization Failed: ' + (mfaErr as Error).message);
                    setLoading(false);
                    return;
                }
            }

            setError(err.message || 'Login failed. Please check your credentials.');
            setLoading(false);
        }
    };

    const handleMfaVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            secureLog('Verifying MFA challenge...', { challengeId, totpCode });
            await account.updateMFAChallenge({ challengeId, otp: totpCode });
            secureLog('MFA verified, redirecting...');
            router.push('/admin-login/catalogue-dashboard');
        } catch (err: any) {
            secureError('MFA verification error:', err);
            setError(err.message || 'Invalid code. Please try again.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        try {
            account.createOAuth2Session(
                OAuthProvider.Google,
                `${window.location.origin}/admin-login/catalogue-dashboard`,
                `${window.location.origin}/admin-login`
            );
        } catch (e: any) {
            console.error(e);
            setError('Failed to initialize Google Login');
        }
    };

    const handleRequestRecovery = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // The destination URL where users will be sent to set their new password
            const recoveryUrl = `${window.location.origin}/admin-login/reset-password`;
            await account.createRecovery(recoveryEmail, recoveryUrl);
            setRecoverySent(true);
            setLoading(false);
        } catch (err: any) {
            console.error('Recovery error:', err);
            setError(err.message || 'Failed to send recovery email. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#CC2224] opacity-[0.1] blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-blue-500 opacity-[0.05] blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md p-8 relative z-10 mx-4">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/[0.03] border border-white/5 mb-4 shadow-xl shadow-[#CC2224]/10">
                        <ShieldCheck className="w-8 h-8 text-[#CC2224]" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Admin Portal</h2>
                    <p className="text-white/40 mt-2 text-sm">Secure access for authorized personnel only</p>
                </div>

                <div className="bg-[#111] bg-opacity-80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Subtle Grid Pattern Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center relative z-10 animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {mfaRequired ? (
                        <form onSubmit={handleMfaVerify} className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-2">
                                    <Smartphone className="w-6 h-6 text-white/80" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
                                <p className="text-white/50 text-sm">
                                    Enter the 6-digit code from your authenticator app to continue.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Input
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value)}
                                    className="w-full bg-black/40 border-white/10 text-white placeholder:text-white/20 text-center text-2xl tracking-[0.5em] font-mono h-14 focus-visible:ring-[#CC2224] focus-visible:border-[#CC2224]"
                                    placeholder="000000"
                                    maxLength={6}
                                    autoFocus
                                    inputMode="numeric"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || totpCode.length !== 6}
                                className="w-full py-6 bg-[#CC2224] hover:bg-[#b01c1e] text-white rounded-xl font-semibold transition-all"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Login"}
                            </Button>

                            <button
                                type="button"
                                onClick={() => {
                                    setMfaRequired(false);
                                    setTotpCode('');
                                    setError('');
                                }}
                                className="w-full text-xs text-white/30 hover:text-white transition-colors flex items-center justify-center gap-1"
                            >
                                <ArrowLeft className="w-3 h-3" /> Back to login
                            </button>
                        </form>
                    ) : recoveryMode ? (
                        <form onSubmit={handleRequestRecovery} className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-semibold text-white">Reset Password</h3>
                                <p className="text-white/50 text-sm">
                                    {recoverySent
                                        ? "We've sent a recovery link to your email address."
                                        : "Enter your email address and we'll send you a link to reset your password."}
                                </p>
                            </div>

                            {!recoverySent && (
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase tracking-wider text-white/50 ml-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#CC2224] transition-colors" />
                                        <Input
                                            type="email"
                                            value={recoveryEmail}
                                            onChange={(e) => setRecoveryEmail(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-6 pl-12 pr-4 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-[#CC2224]/50 focus-visible:border-[#CC2224]/50 transition-all font-medium"
                                            placeholder="admin@zenzebra.in"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading || recoverySent}
                                className="w-full py-6 bg-[#CC2224] hover:bg-[#b01c1e] text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : recoverySent ? "Email Sent" : "Send Reset Link"}
                            </Button>

                            <button
                                type="button"
                                onClick={() => {
                                    setRecoveryMode(false);
                                    setRecoverySent(false);
                                    setError('');
                                }}
                                className="w-full text-xs text-white/30 hover:text-white transition-colors flex items-center justify-center gap-1"
                            >
                                <ArrowLeft className="w-3 h-3" /> Back to login
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-5 relative z-10 animate-in fade-in slide-in-from-left-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium uppercase tracking-wider text-white/50 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#CC2224] transition-colors" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-6 pl-12 pr-4 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-[#CC2224]/50 focus-visible:border-[#CC2224]/50 transition-all font-medium"
                                        placeholder="admin@zenzebra.in"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-medium uppercase tracking-wider text-white/50">Password</label>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#CC2224] transition-colors" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-6 pl-12 pr-12 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-[#CC2224]/50 focus-visible:border-[#CC2224]/50 transition-all font-medium"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between ml-1">
                                    <button
                                        type="button"
                                        onClick={() => setRecoveryMode(true)}
                                        className="text-[10px] font-bold uppercase tracking-widest text-[#CC2224] hover:text-[#e02b2e] transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full group relative flex items-center justify-center gap-2 py-6 px-4 bg-[#CC2224] hover:bg-[#b01c1e] text-white rounded-xl font-semibold transition-all shadow-[0_8px_20px_rgba(204,34,36,0.25)] hover:shadow-[0_12px_30px_rgba(204,34,36,0.4)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Sign in</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-[#111] px-2 text-white/40 tracking-wider">Or continue with</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleGoogleLogin}
                                className="w-full flex items-center justify-center gap-3 py-6 px-4 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_16px_rgba(255,255,255,0.1)]"
                            >
                                <GoogleIcon />
                                <span>Sign in with Google</span>
                            </Button>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-white/20 mt-8">
                    &copy; {new Date().getFullYear()} ZenZebra. All rights reserved.
                </p>
            </div>
        </div>
    );
}
