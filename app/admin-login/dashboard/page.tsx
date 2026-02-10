'use client';

import {
    Activity,
    ArrowRight,
    BarChart3,
    BookOpen,
    Globe,
    LayoutDashboard,
    MapPin,
    Plus,
    RefreshCcw,
    TrendingUp,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function GeneralDashboard() {
    const [stats, setStats] = useState({
        activeUsers: '...',
        totalViews: '...',
        growth: '+14.2%'
    });

    useEffect(() => {
        const fetchQuickStats = async () => {
            try {
                const res = await fetch('/api/analytics');
                const data = await res.json();
                if (data.realtime) {
                    const activeCount = data.realtime.reduce((acc: number, curr: any) => acc + curr.users, 0);
                    const totalViews = data.topPages?.reduce((acc: number, curr: any) => acc + curr.views, 0) || 0;
                    setStats(prev => ({
                        ...prev,
                        activeUsers: activeCount.toString(),
                        totalViews: totalViews > 1000 ? (totalViews / 1000).toFixed(1) + 'k' : totalViews.toString()
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch dashboard stats');
            }
        };
        fetchQuickStats();
    }, []);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#111] border border-white/10 p-10 shadow-2xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#CC2224]/5 blur-[120px] pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-4 italic uppercase">
                            Admin <span className="text-[#CC2224]">Overview</span>
                        </h1>
                        <p className="text-white/40 text-lg max-w-xl font-medium">
                            Welcome back to ZenZebra Command. Your curated spaces are performing
                            <span className="text-green-500 mx-2">above target</span> today.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl min-w-[140px]">
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Active Now</p>
                            <p className="text-2xl font-black text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                {stats.activeUsers}
                            </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl min-w-[140px]">
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Weekly Reach</p>
                            <p className="text-2xl font-black text-white">{stats.totalViews}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardLinkCard
                    title="Traffic Analytics"
                    description="Drill down into visitor behavior, device reach, and real-time performance."
                    href="/admin-login/analytics"
                    icon={<BarChart3 className="w-6 h-6 text-[#CC2224]" />}
                    badge="Real-time"
                    color="red"
                />
                <DashboardLinkCard
                    title="Catalogue"
                    description="Upload PDFs and manage product availability across all digital touchpoints."
                    href="/admin-login/catalogue-dashboard"
                    icon={<BookOpen className="w-6 h-6 text-blue-400" />}
                    badge="14 Files"
                    color="blue"
                />
                <DashboardLinkCard
                    title="Locations"
                    description="Coordinate physical brand integration and monitor location-specific stats."
                    href="/admin-login/locations"
                    icon={<MapPin className="w-6 h-6 text-green-400" />}
                    badge="8 Active"
                    color="green"
                />
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 rounded-[2rem] border border-white/10 bg-[#111] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-xl">
                                <Activity className="w-5 h-5 text-white/60" />
                            </div>
                            <h3 className="text-xl font-bold text-white/90">System Activity</h3>
                        </div>
                        <div className="flex items-center gap-2 text-green-500 text-sm font-bold bg-green-500/10 px-3 py-1 rounded-full">
                            <TrendingUp className="w-4 h-4" />
                            <span>{stats.growth} Growth</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <ActivityItem
                            label="Catalogue Sync Complete"
                            description="All PDF viewers updated to v2.4"
                            time="2 Hours Ago"
                            icon={<RefreshCcw className="w-4 h-4 text-blue-400" />}
                        />
                        <ActivityItem
                            label="Traffic Spike: Ambience Mall"
                            description="240% increase in sessions detected"
                            time="4 Hours Ago"
                            icon={<TrendingUp className="w-4 h-4 text-[#CC2224]" />}
                        />
                        <ActivityItem
                            label="User Session Secured"
                            description="MFA successful for account: admin@zenzebra.in"
                            time="Yesterday"
                            icon={<Users className="w-4 h-4 text-green-400" />}
                        />
                    </div>
                </div>

                {/* Shortcuts */}
                <div className="rounded-[2.5rem] bg-[#CC2224] p-1 shadow-[0_0_50px_rgba(204,34,36,0.2)]">
                    <div className="h-full w-full bg-[#111] rounded-[2.4rem] p-8 space-y-6 flex flex-col justify-center">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Quick<br />Actions</h3>
                        <p className="text-white/40 text-sm">Common administrative tasks</p>

                        <div className="space-y-4 pt-4">
                            <QuickActionLink
                                href="/admin-login/catalogue-dashboard"
                                label="Upload New PDF"
                                icon={<Plus className="w-5 h-5" />}
                            />
                            <QuickActionLink
                                href="/admin-login/profile"
                                label="Security Settings"
                                icon={<LayoutDashboard className="w-5 h-5" />}
                            />
                            <QuickActionLink
                                href="/admin-login/analytics"
                                label="View Full Report"
                                icon={<Globe className="w-5 h-5" />}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardLinkCard({ title, description, href, icon, badge, color }: { title: string; description: string; href: string; icon: React.ReactNode; badge: string, color: string }) {
    const colorClasses = {
        red: 'group-hover:text-[#CC2224] group-hover:bg-[#CC2224]/10',
        blue: 'group-hover:text-blue-400 group-hover:bg-blue-400/10',
        green: 'group-hover:text-green-400 group-hover:bg-green-400/10'
    }[color as 'red' | 'blue' | 'green'];

    return (
        <Link href={href} className="group relative block">
            <div className="h-full rounded-[2rem] border border-white/10 bg-[#111] p-8 transition-all duration-500 hover:border-white/20 hover:translate-y-[-4px] active:scale-[0.98]">
                <div className={`mb-8 inline-flex p-4 rounded-2xl bg-white/5 transition-all duration-500 ${colorClasses}`}>
                    {icon}
                </div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-white transition-colors">{title}</h3>
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">{badge}</span>
                </div>
                <p className="text-sm text-white/40 leading-relaxed font-medium">
                    {description}
                </p>
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Open {title}</span>
                    <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </Link>
    );
}

function QuickActionLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-[#CC2224] hover:text-white transition-all group border border-white/5 active:scale-95 duration-300"
        >
            <div className="flex items-center gap-3">
                <span className="p-2 bg-white/5 rounded-lg group-hover:bg-white/20">{icon}</span>
                <span className="font-bold text-sm uppercase tracking-tighter">{label}</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
        </Link>
    );
}

function ActivityItem({ label, description, time, icon }: { label: string; description: string; time: string; icon: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all group">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-bold text-sm tracking-tight">{label}</span>
                    <span className="text-xs text-white/30 font-medium">{description}</span>
                </div>
            </div>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest whitespace-nowrap ml-4">
                {time}
            </span>
        </div>
    );
}
