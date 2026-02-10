'use client';

import { account } from '@/lib/appwrite';
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await account.createEmailPasswordSession(email, password);
            router.push('/admin-login/catalogue-dashboard');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
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

                <div className="bg-[#111] bg-opacity-80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-white/50 nl-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#CC2224] transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#CC2224]/50 focus:ring-1 focus:ring-[#CC2224]/50 transition-all font-medium"
                                    placeholder="admin@zenzebra.in"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-white/50 nl-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#CC2224] transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#CC2224]/50 focus:ring-1 focus:ring-[#CC2224]/50 transition-all font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full group relative flex items-center justify-center gap-2 py-4 px-4 bg-[#CC2224] hover:bg-[#b01c1e] text-white rounded-xl font-semibold transition-all shadow-[0_8px_20px_rgba(204,34,36,0.25)] hover:shadow-[0_12px_30px_rgba(204,34,36,0.4)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Sign in to Dashboard</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-white/20 mt-8">
                    &copy; {new Date().getFullYear()} ZenZebra. All rights reserved.
                </p>
            </div>
        </div>
    );
}
