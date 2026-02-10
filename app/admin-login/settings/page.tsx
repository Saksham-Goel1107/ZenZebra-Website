'use client';

import {
    Bell,
    Globe,
    Save,
    Shield,
    Zap
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const [busy, setBusy] = useState(false);

    const handleSave = () => {
        setBusy(true);
        setTimeout(() => {
            setBusy(false);
            toast.success("Global settings updated successfully");
        }, 1200);
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2 uppercase italic">
                        System <span className="text-[#CC2224]">Settings</span>
                    </h1>
                    <p className="text-white/40 font-medium">Configure global application behavior and security.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={busy}
                    className="flex items-center gap-2 bg-[#CC2224] hover:bg-[#b01c1e] text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-[#CC2224]/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {busy ? 'Saving Changes...' : 'Save Settings'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Navigation Sidebar for Settings (Internal) */}
                <div className="space-y-2">
                    <SettingsTab active icon={<Globe />} label="General & SEO" />
                    <SettingsTab icon={<Shield />} label="Security & Access" />
                    <SettingsTab icon={<Bell />} label="Notifications" />
                    <SettingsTab icon={<Zap />} label="Performance" />
                </div>

                {/* Settings Panel */}
                <div className="lg:col-span-2 space-y-8">
                    {/* General Section */}
                    <Section title="General Configuration" description="Manage your site's public identity and metadata.">
                        <div className="space-y-6">
                            <InputGroup label="Website Title" placeholder="ZenZebra - Curated Lifestyle" />
                            <InputGroup label="Meta Description" placeholder="World's first lifestyle-integrated brand..." area />
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 group">
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-sm">Maintenance Mode</span>
                                    <span className="text-xs text-white/30">Disable public access while performing updates</span>
                                </div>
                                <Switch />
                            </div>
                        </div>
                    </Section>

                    {/* Security Section */}
                    <Section title="Security Enforcement" description="Configure authentication policies and data protection.">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-sm">Force 2FA for Admins</span>
                                    <span className="text-xs text-white/30">Require Multi-Factor Authentication for all portal access</span>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-sm">Session Timeout</span>
                                    <span className="text-xs text-white/30">Automatically log out inactive administrators</span>
                                </div>
                                <select
                                    defaultValue="24 Hours"
                                    className="bg-black/40 border-white/10 rounded-xl px-3 py-1 text-xs font-bold text-white/60 focus:ring-1 focus:ring-[#CC2224] outline-none"
                                >
                                    <option>1 Hour</option>
                                    <option>4 Hours</option>
                                    <option>12 Hours</option>
                                    <option>24 Hours</option>
                                </select>                            </div>
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <div className="rounded-[2rem] border border-white/10 bg-[#111] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#CC2224]/5 blur-[80px] pointer-events-none group-hover:bg-[#CC2224]/10 transition-all duration-1000" />
            <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/40 mb-8 max-w-md">{description}</p>
                {children}
            </div>
        </div>
    );
}

function SettingsTab({ label, icon, active = false }: { label: string; icon: React.ReactNode; active?: boolean }) {
    return (
        <button className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${active ? 'bg-[#CC2224] text-white shadow-xl shadow-[#CC2224]/20' : 'hover:bg-white/5 text-white/40 hover:text-white border border-transparent hover:border-white/5'}`}>
            <span className={`p-2 rounded-xl transition-colors ${active ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                {icon}
            </span>
            <span className="font-bold text-sm uppercase tracking-tighter">{label}</span>
        </button>
    );
}

function InputGroup({ label, placeholder, area = false }: { label: string; placeholder: string; area?: boolean }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">{label}</label>
            {area ? (
                <textarea
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm placeholder:text-white/10 focus:ring-1 focus:ring-[#CC2224]/50 focus:border-[#CC2224]/50 transition-all min-h-[100px] outline-none resize-none"
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type="text"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm placeholder:text-white/10 focus:ring-1 focus:ring-[#CC2224]/50 focus:border-[#CC2224]/50 transition-all outline-none"
                    placeholder={placeholder}
                />
            )}
        </div>
    );
}

function Switch({ defaultChecked = false }: { defaultChecked?: boolean }) {
    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/40 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CC2224] peer-checked:after:bg-white peer-checked:after:shadow-lg"></div>
        </label>
    );
}
