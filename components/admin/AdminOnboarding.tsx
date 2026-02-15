'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { account } from '@/lib/appwrite';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertOctagon,
    ArrowRight,
    BarChart3,
    Gavel,
    Lock,
    MessageSquare,
    Package,
    Scale,
    Settings,
    ShieldCheck
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface OnboardingProps {
    onComplete: () => void;
}

const LEGAL_DOCUMENTS = [
    {
        id: "section-1",
        title: "1. Proprietary Rights & Ownership",
        content: `This Software, comprising the administrative dashboard, analytics engine, and underlying source code architectures (collectively, the "System"), is the sole and exclusive intellectual property of Saksham Goel (@saksham-goel1107), hereafter referred to as the "Author". This System is an independent, proprietary implementation maintained via the root repository at github.com/saksham-goel1107. Any attempt to replicate, mirror, re-brand, or utilize fragments of this code in external projects without express, notarized written permission from the Author is a violation of international copyright laws and will be prosecuted under the full extent of Intellectual Property statutes.`
    },
    {
        id: "section-2",
        title: "2. Usage License & Revocation",
        content: `Your access to this portal is a conditional, non-transferable, and revocable administrative license. You do not own any part of the System. The Author retains absolute authority to deactivate, modify, or permanently "Kill-Switch" any user session or the entire platform at any moment for security breaches, contract violations, or non-compliance with software governance rules. ZenZebra (the entity) acknowledges that operational continuity is subject to the Author's discretionary oversight.`
    },
    {
        id: "section-3",
        title: "3. Professional Liability & Legal Recourse",
        content: `As an administrative user, you are legally responsible for every byte of data you modify, delete, or export. The Author is NOT liable for any financial losses, data corruption, or business interruptions arising from administrative actions. Furthermore, any malicious intent, data leaks (intentional or through negligence), or unauthorized modification of system settings that result in platform instability will be met with immediate legal action. You hereby agree that the Author reserves the right to file formal legal charges and seek civil damages in the event of system misuse or breach of merchant confidentiality. All access is logged, fingerprinted, and auditable.`
    },
    {
        id: "section-4",
        title: "4. Maintenance Sovereignty",
        content: `Software health, updates, and core logic remain under the absolute control of the Author. Third-party developers or internal staff are strictly prohibited from modifying the production build logic stored in the root repository. Any "shadow-forking" or unauthorized deployment pipelines targeting this infrastructure are deemed hostile acts against the integrity of the Software.`
    },
    {
        id: "section-5",
        title: "5. Data Confidentiality & Anti-Espionage",
        content: `Access to merchant analytics, partner request data, and financial trends is highly confidential. Exporting or sharing this sensitive information with third-party competitors or using it for personal gain beyond the scope of ZenZebra's internal management is strictly prohibited. Such actions constitute corporate espionage and intellectual property theft, subject to stringent legal penalties.`
    },
    {
        id: "section-6",
        title: "6. Zero-Tolerance Policy",
        content: `By entering this dashboard, you accept that your session is actively monitored for security purposes. Any attempt to bypass security protocols, disable Multi-Factor Authentication (MFA), or perform brute-force operations against internal API endpoints will result in an automated and permanent hardware-level ban and revocation of all previous agreements.`
    }
];

export function AdminOnboarding({ onComplete }: OnboardingProps) {
    const [view, setView] = useState<'legal' | 'walkthrough' | 'success'>('legal');
    const [showFullTerms, setShowFullTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [walkthroughStep, setWalkthroughStep] = useState(0);

    const handleAcceptTerms = () => {
        setView('walkthrough');
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const user = await account.get();
            const newPrefs = {
                ...user.prefs,
                termsAccepted: true,
                onboarded: true,
                acceptedAt: new Date().toISOString(),
                softwareVersion: 'v3.0.0-ULTRA',
                agreedProtocol: 'AUTHOR-SOVEREIGNTY-V1',
                legalID: `LEG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
            };
            await account.updatePrefs(newPrefs);
            setView('success');
            setTimeout(onComplete, 2200);
        } catch (error) {
            toast.error('Failed to finalize legal pact');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020202] font-sans selection:bg-[#CC2224]/40 overflow-y-auto py-6 px-4 md:py-10 md:px-8">
            {/* Cinematic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[80%] md:w-[50%] h-[50%] bg-[#CC2224] opacity-[0.12] blur-[100px] md:blur-[180px]" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[70%] md:w-[40%] h-[40%] bg-blue-700 opacity-[0.06] blur-[80px] md:blur-[140px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:50px_50px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#020202_90%)]" />
            </div>

            <AnimatePresence mode="wait">
                {view === 'legal' && (
                    <motion.div
                        key="legal"
                        initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.95, filter: 'blur(20px)' }}
                        className="w-full max-w-5xl relative z-10 my-auto"
                    >
                        {!showFullTerms ? (
                            /* Minimalist Initial Legal Screen */
                            <div className="bg-neutral-900/30 backdrop-blur-[40px] border border-white/[0.08] rounded-[2rem] md:rounded-[3.5rem] p-8 md:p-16 shadow-2xl relative overflow-hidden">
                                <div className="space-y-8 md:space-y-10 text-center">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="p-3 rounded-2xl bg-[#CC2224] shadow-[0_0_30px_rgba(204,34,36,0.3)]">
                                            <Gavel className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="space-y-4">
                                            <h1 className="text-3xl md:text-7xl font-black text-white tracking-tighter italic uppercase leading-tight md:leading-none">
                                                System <br className="md:hidden" />
                                                <span className="text-[#CC2224] not-italic">Sovereignty</span>
                                            </h1>
                                            <p className="text-neutral-400 text-sm md:text-xl max-w-xl mx-auto leading-relaxed">
                                                By accessing the ZenZebra Admin Suite, you enter into a binding legal agreement with the Author
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-2xl mx-auto">
                                        <div className="p-4 md:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center gap-4 text-left">
                                            <Lock className="w-4 md:w-5 h-4 md:h-5 text-[#CC2224]" />
                                            <span className="text-[10px] md:text-xs text-neutral-300 font-bold uppercase tracking-wider">Proprietary Assets</span>
                                        </div>
                                        <div className="p-4 md:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center gap-4 text-left">
                                            <Scale className="w-4 md:w-5 h-4 md:h-5 text-[#CC2224]" />
                                            <span className="text-[10px] md:text-xs text-neutral-300 font-bold uppercase tracking-wider">Legal Accountability</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 max-w-md mx-auto pt-4">
                                        <Button
                                            onClick={handleAcceptTerms}
                                            className="h-14 md:h-20 bg-[#CC2224] hover:bg-[#b01c1e] text-white rounded-2xl text-lg md:text-xl font-black italic shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-tight"
                                        >
                                            I Submit to Terms
                                        </Button>
                                        <button
                                            onClick={() => setShowFullTerms(true)}
                                            className="text-white/40 hover:text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 py-2"
                                        >
                                            View Full Agreement <ArrowRight className="w-3 md:w-4 h-3 md:h-4" />
                                        </button>
                                    </div>

                                    <p className="text-[9px] md:text-[10px] text-neutral-600 font-bold uppercase tracking-widest pt-2 md:pt-4 animate-pulse">
                                        Hardware-Level Trace Enabled
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Expanded Legal View */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-neutral-900/50 backdrop-blur-[60px] border border-white/[0.1] rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-3xl my-auto"
                            >
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter">
                                            Full <span className="text-[#CC2224]">Legal Mandate</span>
                                        </h2>
                                        <button
                                            onClick={() => setShowFullTerms(false)}
                                            className="p-2 md:p-3 rounded-full hover:bg-white/5 text-neutral-500 hover:text-white transition-colors"
                                        >
                                            <ArrowRight className="w-4 md:w-5 h-4 md:h-5 rotate-180" />
                                        </button>
                                    </div>

                                    <ScrollArea className="h-[50vh] md:h-[500px] pr-4 custom-scrollbar">
                                        <div className="space-y-10 md:space-y-12 pb-10">
                                            <div className="p-4 md:p-5 rounded-2xl bg-[#CC2224]/5 border border-[#CC2224]/20 flex gap-4">
                                                <AlertOctagon className="w-5 md:w-6 h-5 md:h-6 text-[#CC2224] shrink-0 mt-1" />
                                                <p className="text-[9px] md:text-xs text-[#CC2224] font-bold uppercase tracking-widest leading-loose">
                                                    Notice: Any violation grants the Author right to initiate legal proceedings for IP theft or espionage.
                                                </p>
                                            </div>

                                            {LEGAL_DOCUMENTS.map((doc, i) => (
                                                <div key={doc.id} className="space-y-3">
                                                    <h3 className="text-white text-base md:text-xl font-black uppercase tracking-tighter italic">
                                                        {doc.title}
                                                    </h3>
                                                    <p className="text-neutral-400 text-[11px] md:text-[13px] leading-[1.8] font-medium text-justify">
                                                        {doc.content}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    <div className="pt-6 md:pt-8 border-t border-white/10 mt-6 md:mt-auto">
                                        <Button
                                            onClick={() => setShowFullTerms(false)}
                                            className="w-full h-12 md:h-14 bg-white text-black hover:bg-neutral-200 rounded-xl font-black text-[10px] md:text-sm uppercase tracking-widest"
                                        >
                                            Back to Summary
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {view === 'walkthrough' && (
                    <motion.div
                        key="walkthrough"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-5xl px-4 my-auto"
                    >
                        <div className="bg-neutral-900/40 backdrop-blur-[40px] border border-white/10 rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-16 shadow-3xl relative overflow-hidden">
                            {/* Progress Bar */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                                <motion.div
                                    className="h-full bg-[#CC2224]"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${((walkthroughStep + 1) / 4) * 100}%` }}
                                />
                            </div>

                            <AnimatePresence mode="wait">
                                {walkthroughStep === 0 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                                    >
                                        <div className="space-y-8 text-left">
                                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold uppercase tracking-widest">
                                                <Package className="w-4 h-4" /> Module 01
                                            </div>
                                            <div className="space-y-4">
                                                <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                                                    Inventory & <br /> <span className="text-blue-500 not-italic">Catalogue</span>
                                                </h2>
                                                <p className="text-neutral-400 text-lg leading-relaxed font-medium">
                                                    The Merchandising Core allows you to orchestrate the entire product lifecycle with precision.
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                {[
                                                    'Real-time stock level synchronization',
                                                    'Dynamic collection & category mapping',
                                                    'Multi-variant product configuration',
                                                    'Automated inventory alerts'
                                                ].map((feature, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-neutral-300 text-sm font-bold">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        {feature}
                                                    </div>
                                                ))}
                                            </div>
                                            <Button
                                                onClick={() => setWalkthroughStep(1)}
                                                className="h-16 px-10 bg-white text-black hover:bg-neutral-100 rounded-xl font-black text-lg gap-3"
                                            >
                                                Next Module <ArrowRight className="w-6 h-6" />
                                            </Button>
                                        </div>
                                        <div className="hidden lg:flex justify-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full animate-pulse" />
                                                <div className="relative z-10 w-64 h-64 rounded-[3rem] bg-neutral-950 border-2 border-blue-500/30 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
                                                    <Package className="w-32 h-32 text-blue-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {walkthroughStep === 1 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                                    >
                                        <div className="space-y-8 text-left">
                                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-widest">
                                                <MessageSquare className="w-4 h-4" /> Module 02
                                            </div>
                                            <div className="space-y-4">
                                                <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                                                    Inquiries & <br /> <span className="text-orange-500 not-italic">Hub</span>
                                                </h2>
                                                <p className="text-neutral-400 text-lg leading-relaxed font-medium">
                                                    Centralized communication bridge for customer outreach and partner registration.
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                {[
                                                    'Automated partner request vetting',
                                                    'Direct inquiry response engine',
                                                    'Communication status tracking',
                                                    'Contact lead management'
                                                ].map((feature, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-neutral-300 text-sm font-bold">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                        {feature}
                                                    </div>
                                                ))}
                                            </div>
                                            <Button
                                                onClick={() => setWalkthroughStep(2)}
                                                className="h-16 px-10 bg-white text-black hover:bg-neutral-100 rounded-xl font-black text-lg gap-3"
                                            >
                                                Next Module <ArrowRight className="w-6 h-6" />
                                            </Button>
                                        </div>
                                        <div className="hidden lg:flex justify-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-orange-500/20 blur-[100px] rounded-full animate-pulse" />
                                                <div className="relative z-10 w-64 h-64 rounded-[3rem] bg-neutral-950 border-2 border-orange-500/30 flex items-center justify-center -rotate-3 hover:rotate-0 transition-transform duration-500">
                                                    <MessageSquare className="w-32 h-32 text-orange-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {walkthroughStep === 2 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                                    >
                                        <div className="space-y-8 text-left">
                                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase tracking-widest">
                                                <BarChart3 className="w-4 h-4" /> Module 03
                                            </div>
                                            <div className="space-y-4">
                                                <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                                                    Intelligence <br /> <span className="text-green-500 not-italic">& Data</span>
                                                </h2>
                                                <p className="text-neutral-400 text-lg leading-relaxed font-medium">
                                                    Deep quantitative analysis of business performance and market trends.
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                {[
                                                    'Google Analytics integration',
                                                    'Growth & Trend visualization',
                                                    'Stock performance comparison',
                                                    'Visitor behavioral mapping'
                                                ].map((feature, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-neutral-300 text-sm font-bold">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                        {feature}
                                                    </div>
                                                ))}
                                            </div>
                                            <Button
                                                onClick={() => setWalkthroughStep(3)}
                                                className="h-16 px-10 bg-white text-black hover:bg-neutral-100 rounded-xl font-black text-lg gap-3"
                                            >
                                                Next Module <ArrowRight className="w-6 h-6" />
                                            </Button>
                                        </div>
                                        <div className="hidden lg:flex justify-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-green-500/20 blur-[100px] rounded-full animate-pulse" />
                                                <div className="relative z-10 w-64 h-64 rounded-[3rem] bg-neutral-950 border-2 border-green-500/30 flex items-center justify-center rotate-6 hover:rotate-0 transition-transform duration-500">
                                                    <BarChart3 className="w-32 h-32 text-green-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {walkthroughStep === 3 && (
                                    <motion.div
                                        key="step4"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="space-y-12 py-10"
                                    >
                                        <div className="relative inline-block mx-auto">
                                            <div className="absolute inset-[-40px] bg-[#CC2224]/20 blur-[60px] rounded-full" />
                                            <div className="relative z-10 w-32 h-32 rounded-[2.5rem] bg-[#CC2224]/10 border-2 border-[#CC2224]/30 flex items-center justify-center mx-auto">
                                                <Settings className="w-20 h-20 text-[#CC2224] animate-spin-slow" />
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <h2 className="text-5xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                                Root <br /> <span className="text-[#CC2224] not-italic">Governance</span>
                                            </h2>
                                            <p className="text-neutral-400 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium">
                                                You are now fully briefed on the Goel Software Protocol. The sanctum is ready for your authorization.
                                            </p>
                                        </div>
                                        <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
                                            <Button
                                                onClick={handleFinish}
                                                disabled={loading}
                                                className="h-24 px-16 bg-[#CC2224] text-white hover:bg-[#b01c1e] rounded-[2.5rem] font-black text-3xl italic shadow-[0_30px_60px_-10px_rgba(204,34,36,0.4)] transition-all hover:scale-105 active:scale-95"
                                            >
                                                {loading ? 'Initializing...' : 'Authorize Access'}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {view === 'success' && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(100px)' }}
                        className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 z-[250] px-4"
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="w-32 md:w-48 h-32 md:h-48 rounded-[2rem] md:rounded-[3rem] bg-green-500 flex items-center justify-center mb-8 md:mb-12 shadow-[0_0_80px_-10px_rgba(34,197,94,0.6)]"
                        >
                            <ShieldCheck className="w-16 md:w-24 h-16 md:h-24 text-white" />
                        </motion.div>
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">Agreement <br /> Solidified</h2>
                            <p className="text-green-400 text-base md:text-xl font-bold tracking-widest uppercase opacity-80 animate-pulse">Signature Authenticated</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0%; }
                    100% { top: 100%; }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-scan {
                    animation: scan 4s linear infinite;
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(204, 34, 36, 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(204, 34, 36, 0.6);
                }
            `}</style>
        </div>
    );
}

