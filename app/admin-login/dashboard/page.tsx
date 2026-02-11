'use client';

import {
    Activity,
    ArrowRight,
    BarChart3,
    BookOpen,
    Globe,
    LayoutDashboard,
    Loader2,
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
    });

    const [activities, setActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch Analytics
                const analyticsRes = await fetch('/api/analytics');
                const analyticsData = await analyticsRes.json();

                if (analyticsData.realtime) {
                    const activeCount = analyticsData.realtime.reduce((acc: number, curr: any) => acc + curr.users, 0);
                    const totalViews = analyticsData.topPages?.reduce((acc: number, curr: any) => acc + curr.views, 0) || 0;
                    setStats(prev => ({
                        ...prev,
                        activeUsers: activeCount.toString(),
                        totalViews: totalViews > 1000 ? (totalViews / 1000).toFixed(1) + 'k' : totalViews.toString()
                    }));
                }

                // Fetch Inquiries for Activity
                const inquiriesRes = await fetch('/api/inquiries');
                const inquiriesData = await inquiriesRes.json();

                if (inquiriesData.documents) {
                    const latestActivities = inquiriesData.documents
                        .slice(0, 5)
                        .map((doc: any) => ({
                            label: `Inquiry: ${doc.name}`,
                            description: doc.status === 'Queued' ? 'New inquiry received' : `Status updated to ${doc.status.replace('_', ' ')}`,
                            time: formatActivityTime(doc.$updatedAt || doc.$createdAt),
                            icon: getStatusIcon(doc.status)
                        }));
                    setActivities(latestActivities);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data');
            } finally {
                setLoadingActivities(false);
            }
        };
        fetchDashboardData();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Queued': return <Plus className="w-4 h-4 text-primary" />;
            case 'In_process': return <TrendingUp className="w-4 h-4 text-amber-400" />;
            case 'Completed': return <RefreshCcw className="w-4 h-4 text-green-400" />;
            default: return <Activity className="w-4 h-4 text-blue-400" />;
        }
    };

    const formatActivityTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just Now';
        if (diffInHours < 24) return `${diffInHours} Hours Ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-card border border-border p-10 shadow-lg group">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] pointer-events-none group-hover:bg-primary/10 transition-all duration-1000" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 text-primary mb-3">
                            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                <LayoutDashboard className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Operations Console</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-4 italic uppercase">
                            COMMAND <span className="text-primary">CENTER</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xl font-medium">
                            Operational overview and real-time system performance monitor.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-muted/50 border border-border p-5 rounded-3xl backdrop-blur-xl min-w-[140px] shadow-sm">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Now</p>
                            <div className="text-2xl font-black text-foreground flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                {stats.activeUsers === '...' ? <Loader2 className="w-5 h-5 animate-spin opacity-20" /> : stats.activeUsers}
                            </div>
                        </div>
                        <div className="bg-muted/50 border border-border p-5 rounded-3xl backdrop-blur-xl min-w-[140px] shadow-sm">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Weekly Reach</p>
                            <div className="text-2xl font-black text-foreground">
                                {stats.totalViews === '...' ? <Loader2 className="w-5 h-5 animate-spin opacity-20" /> : stats.totalViews}
                            </div>
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
                    icon={<BarChart3 className="w-6 h-6 text-primary" />}
                    badge="Real-time"
                    color="red"
                />
                <DashboardLinkCard
                    title="Catalogue"
                    description="Upload PDFs and manage product availability across all digital touchpoints."
                    href="/admin-login/catalogue-dashboard"
                    icon={<BookOpen className="w-6 h-6 text-blue-400" />}
                    badge="Active"
                    color="blue"
                />
                <DashboardLinkCard
                    title="User Inquiries"
                    description="Respond to customer queries and track resolution progress."
                    href="/admin-login/inquiries"
                    icon={<Users className="w-6 h-6 text-green-400" />}
                    badge="Managed"
                    color="green"
                />
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 rounded-[2rem] border border-border bg-card p-8 shadow-lg relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-xl">
                                <Activity className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">System Activity</h3>
                        </div>
                    </div>

                    <div className="space-y-3 min-h-[200px]">
                        {loadingActivities ? (
                            <div className="flex items-center justify-center h-48 opacity-20">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                                <Activity className="w-8 h-8 mb-2 opacity-10" />
                                <p className="text-xs font-bold uppercase tracking-widest">No recent activity</p>
                            </div>
                        ) : (
                            activities.map((item, idx) => (
                                <ActivityItem
                                    key={idx}
                                    label={item.label}
                                    description={item.description}
                                    time={item.time}
                                    icon={item.icon}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Shortcuts */}
                <div className="rounded-[2.5rem] bg-primary p-1 shadow-[0_0_50px_rgba(204,34,36,0.2)]">
                    <div className="h-full w-full bg-card rounded-[2.4rem] p-8 space-y-6 flex flex-col justify-center">
                        <h3 className="text-2xl font-black text-foreground italic uppercase tracking-tighter">Quick<br />Actions</h3>
                        <p className="text-muted-foreground text-sm">Common administrative tasks</p>

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
        red: 'group-hover:text-primary group-hover:bg-primary/10',
        blue: 'group-hover:text-blue-400 group-hover:bg-blue-400/10',
        green: 'group-hover:text-green-400 group-hover:bg-green-400/10'
    }[color as 'red' | 'blue' | 'green'];

    return (
        <Link href={href} className="group relative block">
            <div className="h-full rounded-[2rem] border border-border bg-card p-8 transition-all duration-500 hover:border-border/80 hover:translate-y-[-4px] active:scale-[0.98] shadow-sm hover:shadow-lg">
                <div className={`mb-8 inline-flex p-4 rounded-2xl bg-muted transition-all duration-500 ${colorClasses}`}>
                    {icon}
                </div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-foreground transition-colors">{title}</h3>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded-md">{badge}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {description}
                </p>
                <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest group-hover:text-foreground">Open {title}</span>
                    <ArrowRight className="w-5 h-5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </Link>
    );
}

function QuickActionLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 hover:bg-primary hover:text-primary-foreground transition-all group border border-border/50 hover:border-primary active:scale-95 duration-300"
        >
            <div className="flex items-center gap-3">
                <span className="p-2 bg-muted rounded-lg group-hover:bg-primary-foreground/20 text-foreground group-hover:text-primary-foreground transition-colors">{icon}</span>
                <span className="font-bold text-sm uppercase tracking-tighter text-foreground group-hover:text-primary-foreground transition-colors">{label}</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 text-primary-foreground" />
        </Link>
    );
}

function ActivityItem({ label, description, time, icon }: { label: string; description: string; time: string; icon: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all group">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-xl group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-foreground font-bold text-sm tracking-tight">{label}</span>
                    <span className="text-xs text-muted-foreground font-medium">{description}</span>
                </div>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap ml-4">
                {time}
            </span>
        </div>
    );
}
