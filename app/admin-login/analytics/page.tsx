'use client';

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Clock,
  Globe,
  Info,
  Monitor,
  RefreshCcw,
  Smartphone,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';

type AnalyticsData = {
  overview: {
    totalUsers: number;
    newUsers: number;
    sessions: number;
    avgSessionDuration: number;
    engagementRate: number;
    bounceRate: number;
  };
  realtime: {
    device: string;
    country: string;
    city: string;
    users: number;
  }[];
  daily: {
    date: string;
    users: number;
    newUsers: number;
    sessions: number;
    engagementDuration: number;
  }[];
  topPages: {
    title: string;
    path: string;
    views: number;
    users: number;
    engagementDuration: number;
    engagementRate: number;
  }[];
  acquisition: {
    source: string;
    medium: string;
    sessions: number;
    users: number;
    engagementRate: number;
  }[];
  tech: {
    browser: string;
    os: string;
    device: string;
    resolution: string;
    users: number;
  }[];
  geo: {
    country: string;
    city: string;
    language: string;
    users: number;
  }[];
  isMock: boolean;
  error?: string;
  details?: string;
  message?: string;
};

type AuthStatus = {
  authorized: boolean;
  configured: boolean;
  message?: string;
};

const COLORS = ['#CC2224', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);

  const fetchAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/google/status');
      const status = await res.json();
      setAuthStatus(status);
    } catch (error) {
      console.error('Failed to check auth status:', error);
    }
  };

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to connect to analytics service');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
    fetchData();
    const interval = setInterval(() => fetchData(true), 60000); // Auto-refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm animate-pulse">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length < 8) return dateStr;
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2 uppercase italic">
            Traffic <span className="text-primary">Analytics</span>
          </h1>
          <div className="flex items-center gap-3 text-muted-foreground text-sm">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Live Insights from GA4
            </span>
            {data?.isMock && (
              <span className="flex items-center gap-1.5 text-yellow-600 bg-yellow-500/10 px-2.5 py-0.5 rounded-md border border-yellow-500/20 font-medium">
                <Info className="w-3 h-3" /> Demo Mode
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(204,34,36,0.2)]"
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Auth Warning */}
      {authStatus && !authStatus.authorized && data?.isMock && (
        <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="p-3 bg-blue-500/20 rounded-2xl shrink-0">
            <Globe className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground mb-1">Connect Google Analytics</h3>
            <p className="text-muted-foreground text-sm">
              {authStatus.configured
                ? 'OAuth is configured. Authorize access to view real-time data.'
                : 'Authorize with your Google account to see live traffic.'}
            </p>
          </div>
          <a
            href="/api/auth/google"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap active:scale-95 shadow-lg shadow-blue-500/20"
          >
            Authorize Access
          </a>
        </div>
      )}

      {/* Error Display */}
      {data?.error && (
        <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-3xl flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-foreground text-lg">Connection Error</h3>
            <p className="text-muted-foreground mt-1">{data.error}</p>
            {data.details && (
              <code className="block mt-3 bg-muted p-3 rounded-lg text-xs font-mono text-destructive break-all border border-destructive/10">
                {data.details}
              </code>
            )}
          </div>
        </div>
      )}

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Users (28d)"
          value={data?.overview?.totalUsers || 0}
          subValue={`${data?.overview?.newUsers || 0} New`}
          icon={<Users className="w-5 h-5 text-primary" />}
          trend="High Traffic"
        />
        <StatCard
          title="Total Sessions"
          value={data?.overview?.sessions || 0}
          subValue={`${Math.round(data?.overview?.engagementRate ? data.overview.engagementRate * 100 : 0)}% Engaged`}
          icon={<Activity className="w-5 h-5 text-blue-400" />}
          trend="Steady"
        />
        <StatCard
          title="Avg. Session Time"
          value={formatTime(data?.overview?.avgSessionDuration || 0)}
          subValue="Per User"
          icon={<Clock className="w-5 h-5 text-green-400" />}
          trend="Good Retention"
        />
        <StatCard
          title="Realtime Users"
          value={(data?.realtime || []).reduce((acc, curr) => acc + curr.users, 0)}
          subValue="Right Now"
          icon={<BarChart3 className="w-5 h-5 text-purple-400" />}
          trend="Live"
          pulse
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Trend Chart */}
        <div className="lg:col-span-2 rounded-[2.5rem] border border-border bg-card text-card-foreground p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] pointer-events-none" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">
                Traffic Growth
              </h3>
              <p className="text-muted-foreground text-sm font-medium">
                Daily user trends over last 28 days
              </p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.daily || []}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CC2224" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#CC2224" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--muted-foreground)/0.1)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '16px',
                    color: 'hsl(var(--foreground))',
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#CC2224"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSessions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Realtime & Device Breakdown */}
        <div className="flex flex-col gap-6">
          {/* Realtime Card */}
          <div className="flex-1 rounded-[2.5rem] border border-border bg-card text-card-foreground p-8 shadow-sm relative overflow-hidden">
            <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter mb-6 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              Realtime
            </h3>
            <div className="space-y-4">
              {(data?.realtime || []).slice(0, 5).map((user, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-xl text-muted-foreground shadow-sm">
                      {user.device === 'mobile' ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <Monitor className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground capitalize">
                        {user.city || 'Unknown City'}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.country}</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-foreground">
                    {user.users}{' '}
                    <span className="text-[10px] text-muted-foreground font-normal uppercase">
                      Active
                    </span>
                  </span>
                </div>
              ))}
              {(data?.realtime || []).length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  No active users right now
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Pages */}
        <div className="rounded-[2.5rem] border border-border bg-card text-card-foreground p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">
                Top Content
              </h3>
              <p className="text-muted-foreground text-sm font-medium">Most viewed pages</p>
            </div>
            <ArrowUpRight className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <div className="space-y-4">
            {(data?.topPages || []).map((page, i) => (
              <div
                key={i}
                className="group p-4 rounded-2xl bg-muted/30 hover:bg-muted/60 border border-border/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-foreground text-sm truncate max-w-[70%]">
                    {page.title}
                  </h4>
                  <span className="text-primary font-black text-lg">{page.views}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="bg-background px-2 py-1 rounded-md font-mono border border-border">
                    {page.path}
                  </span>
                  <span>{Math.round(page.engagementRate * 100)}% Engaged</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-orange-500"
                    style={{
                      width: `${Math.min((page.views / ((data?.topPages || [])[0]?.views || 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acquisition & Tech */}
        <div className="flex flex-col gap-6">
          <div className="flex-1 rounded-[2.5rem] border border-border bg-card text-card-foreground p-8 shadow-sm">
            <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter mb-2">
              User Source
            </h3>
            <p className="text-muted-foreground text-sm font-medium mb-6">
              Where users are coming from
            </p>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={(data?.acquisition || []).slice(0, 5)}
                  margin={{ left: 0, right: 30 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="hsl(var(--muted-foreground)/0.1)"
                  />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="source" hide />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Bar dataKey="users" fill="#CC2224" radius={[0, 8, 8, 0]} barSize={20}>
                    {/* @ts-ignore */}
                    {(data?.acquisition || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#CC2224' : '#b01c1e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {(data?.acquisition || []).slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-foreground/80 capitalize">
                      {item.source} <span className="text-muted-foreground">/ {item.medium}</span>
                    </span>
                  </div>
                  <span className="font-bold text-foreground">{item.users}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-border bg-card text-card-foreground p-8 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-muted rounded-2xl">
                <Monitor className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Top Browser</h3>
                <p className="text-muted-foreground text-sm">
                  {data?.tech[0]?.browser || 'Unknown'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-2xl font-black text-foreground">
                {data?.tech[0]?.users || 0}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Users
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subValue,
  icon,
  trend,
  pulse = false,
}: {
  title: string;
  value: string | number;
  subValue: string;
  icon: React.ReactNode;
  trend: string;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-[2rem] border border-border bg-card text-card-foreground p-6 hover:border-primary/30 transition-all duration-500 group overflow-hidden relative shadow-sm hover:shadow-lg">
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] pointer-events-none group-hover:bg-primary/10 transition-all duration-700 ${pulse ? 'animate-pulse' : ''}`}
      />
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="p-3 bg-muted rounded-2xl group-hover:scale-110 transition-transform duration-500 text-foreground">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-lg">
          {trend}
        </span>
      </div>
      <div className="relative z-10">
        <p className="text-3xl font-black text-foreground tracking-tighter mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-xs font-bold text-primary mt-2">{subValue}</p>
      </div>
    </div>
  );
}
