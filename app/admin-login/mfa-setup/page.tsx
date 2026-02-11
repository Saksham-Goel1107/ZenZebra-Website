'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { account } from '@/lib/appwrite';
import { secureError, secureLog } from '@/lib/logger';
import { CheckCircle2, Copy, Loader2, Shield, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function MFASetupPage() {
    const [loading, setLoading] = useState(true);
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const initMFA = async () => {
            try {
                // Check if user is logged in
                const user = await account.get();

                // If MFA is already enabled, redirect
                if (user.mfa) {
                    router.push('/admin-login/catalogue-dashboard');
                    return;
                }

                // Generate MFA secret and QR code
                const mfaType = await account.createMfaAuthenticator('totp' as any);
                setSecret(mfaType.secret);

                // Generate QR code from URI
                const qrDataUrl = await QRCode.toDataURL(mfaType.uri, {
                    width: 256,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                setQrCode(qrDataUrl);
                setLoading(false);
            } catch (error: any) {
                secureError('MFA setup error:', error);
                toast.error('Failed to initialize MFA setup');
                router.push('/admin-login');
            }
        };
        initMFA();
    }, [router]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (verificationCode.length !== 6) {
            toast.error('Please enter a 6-digit code');
            return;
        }

        setVerifying(true);
        try {
            secureLog('Step 1: Verifying TOTP code');

            // Step 1: Verify the TOTP code (this confirms the authenticator is set up correctly)
            const result = await account.updateMfaAuthenticator('totp' as any, verificationCode);
            secureLog('TOTP verification result:', result);

            // Step 2: Enable MFA on the account
            secureLog('Step 2: Enabling MFA on account...');
            await account.updateMFA(true);
            secureLog('MFA enabled successfully on account');

            // Step 3: Get updated user state to confirm
            const user = await account.get();
            secureLog('User state after MFA enable:', {
                userId: user.$id,
                mfaEnabled: user.mfa,
                prefs: user.prefs
            });

            // Step 4: Clear the mfaRequired flag
            await account.updatePrefs({ ...user.prefs, mfaRequired: false });
            secureLog('Cleared mfaRequired flag');

            setSuccess(true);
            toast.success('MFA enabled successfully!');

            setTimeout(() => {
                router.push('/admin-login/catalogue-dashboard');
            }, 2000);
        } catch (error: any) {
            secureError('MFA setup error:', {
                message: error.message,
                type: error.type,
                code: error.code,
                step: error.message?.includes('authenticator') ? 'TOTP Verification' : 'MFA Enable'
            });

            if (error.message?.includes('Invalid')) {
                toast.error('Invalid verification code. Please try again.');
            } else {
                toast.error('Failed to enable MFA: ' + error.message);
            }
            setVerificationCode('');
        } finally {
            setVerifying(false);
        }
    };

    const copySecret = () => {
        navigator.clipboard.writeText(secret);
        toast.success('Secret copied to clipboard');
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505]">
                <Loader2 className="w-8 h-8 animate-spin text-[#CC2224]" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#050505] relative overflow-hidden font-sans p-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#CC2224] opacity-[0.1] blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/[0.03] border border-white/5 mb-4 shadow-xl shadow-[#CC2224]/10">
                        <ShieldCheck className="w-8 h-8 text-[#CC2224]" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Two-Factor Authentication</h2>
                    <p className="text-white/40 mt-2 text-sm">Secure your account with MFA</p>
                </div>

                <div className="bg-[#111] bg-opacity-80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                    {success ? (
                        <div className="text-center space-y-6 relative z-10 py-4 animate-in fade-in zoom-in-95">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-2">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">MFA Enabled!</h3>
                                <p className="text-white/50 text-sm">Your account is now protected. Redirecting...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 relative z-10">
                            {/* Step 1: Scan QR Code */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[#CC2224]">
                                    <div className="w-6 h-6 rounded-full bg-[#CC2224] text-white flex items-center justify-center text-xs font-bold">1</div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider">Scan QR Code</h3>
                                </div>
                                <p className="text-white/50 text-xs">Use Google Authenticator, Authy, or any TOTP app</p>

                                <div className="flex justify-center p-6 bg-white rounded-2xl">
                                    {qrCode && <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />}
                                </div>

                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2 font-bold">Manual Entry Key</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-white text-sm font-mono break-all">{secret}</code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={copySecret}
                                            className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Verify */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[#CC2224]">
                                    <div className="w-6 h-6 rounded-full bg-[#CC2224] text-white flex items-center justify-center text-xs font-bold">2</div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider">Verify Code</h3>
                                </div>

                                <form onSubmit={handleVerify} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium uppercase tracking-wider text-white/50 ml-1">6-Digit Code</label>
                                        <div className="relative group">
                                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#CC2224] transition-colors" />
                                            <Input
                                                type="text"
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-6 pl-12 pr-4 text-white text-center text-2xl tracking-[0.5em] placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-[#CC2224]/50 focus-visible:border-[#CC2224]/50 transition-all font-mono"
                                                placeholder="000000"
                                                required
                                                maxLength={6}
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={verifying || verificationCode.length !== 6}
                                        className="w-full py-6 bg-[#CC2224] hover:bg-[#b01c1e] text-white rounded-xl font-semibold transition-all shadow-[0_8px_20px_rgba(204,34,36,0.25)]"
                                    >
                                        {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enable MFA"}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <p className="text-white/30 text-xs">
                        This is a one-time setup required by your administrator
                    </p>
                </div>
            </div>
        </div>
    );
}
