'use client';

import {
    CheckCircle2,
    Clock,
    Loader2,
    Mail,
    MessageSquare,
    Phone,
    RefreshCw,
    Search,
    XCircle,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Inquiry {
    $id: string;
    name: string;
    email: string;
    phone: string;
    query: string;
    status: string;
    $createdAt: string;
}

const STATUS_CONFIG: Record<string, { color: string, bg: string, label: string }> = {
    'Queued': { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Queued' },
    'In_process': { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'In Process' },
    'Completed': { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Completed' },
    'Discarded': { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Discarded' }
};

// Define legal transitions (Forward Only)
const NEXT_STEPS: Record<string, string[]> = {
    'Queued': ['In_process', 'Discarded'],
    'In_process': ['Completed', 'Discarded'],
    'Completed': [],
    'Discarded': []
};

export default function InquiriesPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/inquiries');
            if (res.ok) {
                const data = await res.json();
                setInquiries(data.documents || []);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error connecting to server");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, currentStatus: string, newStatus: string) => {
        if (!NEXT_STEPS[currentStatus]?.includes(newStatus)) {
            toast.error("Cannot move status backwards");
            return;
        }

        setUpdatingStatus(id);
        try {
            const res = await fetch(`/api/inquiries?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                toast.success(`Moved to ${STATUS_CONFIG[newStatus].label}`);
                setInquiries(prev => prev.map(i => i.$id === id ? { ...i, status: newStatus } : i));
            }
        } catch (error) {
            toast.error("Status update failed");
        } finally {
            setUpdatingStatus(null);
        }
    };


    const filteredInquiries = inquiries.filter(i => {
        const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.email.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'all' || i.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto py-6 px-4">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic leading-none flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-[#CC2224]" />
                        User <span className="text-[#CC2224]">Inquiries</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm mt-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Manage and track user queries with real-time resolution.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#CC2224] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search names or emails..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-card border border-border rounded-2xl pl-12 pr-6 py-3 outline-none focus:border-[#CC2224] transition-all w-full sm:w-64 font-medium shadow-sm hover:border-[#CC2224]/20"
                        />
                    </div>
                    <button
                        onClick={fetchInquiries}
                        disabled={loading}
                        className="p-3 rounded-2xl border border-border bg-card hover:bg-muted transition-all active:scale-95 disabled:opacity-50"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Premium Status Filtering Tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-muted/30 backdrop-blur-sm border border-border/50 rounded-2xl w-fit">
                <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'all' ? 'bg-background text-[#CC2224] shadow-md ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    All <span className="ml-1 opacity-40">({inquiries.length})</span>
                </button>
                {Object.keys(STATUS_CONFIG).map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-background shadow-md ring-1 ring-black/5 ' + STATUS_CONFIG[s].color : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {STATUS_CONFIG[s].label} <span className="ml-1 opacity-40">({inquiries.filter(i => i.status === s).length})</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col h-[40vh] items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#CC2224]" />
                    <p className="text-xs font-black uppercase tracking-widest text-[#CC2224] animate-pulse">Fetching Documents...</p>
                </div>
            ) : filteredInquiries.length === 0 ? (
                <div className="text-center py-32 bg-card/30 rounded-[3rem] border border-dashed border-border/50 backdrop-blur-xs group">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted/50 mb-6 group-hover:scale-110 transition-transform duration-500">
                        <MessageSquare className="w-10 h-10 text-muted-foreground opacity-20" />
                    </div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-foreground/80">Inbox Clear</h3>
                    <p className="text-muted-foreground text-sm font-medium mt-2">No inquiries match the current filter criteria.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredInquiries.map((inquiry) => (
                        <div
                            key={inquiry.$id}
                            className={`group relative rounded-[2.5rem] border border-border bg-card p-10 transition-all duration-500 hover:bg-muted/5 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1.5 ${inquiry.status === 'Completed' || inquiry.status === 'Discarded' ? 'opacity-60 grayscale-[0.3]' : ''}`}
                        >
                            <div className="flex flex-col lg:flex-row gap-10">
                                <div className="space-y-8 flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-3xl bg-[#CC2224] text-white flex items-center justify-center font-black text-2xl italic shadow-xl shadow-[#CC2224]/20 transform -rotate-3 group-hover:rotate-0 transition-transform">
                                                {inquiry.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-2xl leading-none uppercase italic tracking-tighter text-foreground group-hover:text-[#CC2224] transition-colors">{inquiry.name}</h3>
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mt-3">
                                                    <a href={`mailto:${inquiry.email}`} className="flex items-center gap-2 hover:text-[#CC2224] transition-all bg-muted/40 px-3 py-1.5 rounded-xl border border-transparent hover:border-[#CC2224]/20">
                                                        <Mail className="w-3.5 h-3.5" /> {inquiry.email}
                                                    </a>
                                                    <a href={`tel:${inquiry.phone}`} className="flex items-center gap-2 hover:text-[#CC2224] transition-all bg-muted/40 px-3 py-1.5 rounded-xl border border-transparent hover:border-[#CC2224]/20">
                                                        <Phone className="w-3.5 h-3.5" /> {inquiry.phone}
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 shrink-0">
                                            <span className={`text-[11px] font-black uppercase tracking-[0.25em] px-4 py-1.5 rounded-2xl ${STATUS_CONFIG[inquiry.status]?.bg} ${STATUS_CONFIG[inquiry.status]?.color} border border-current/10 shadow-sm`}>
                                                {STATUS_CONFIG[inquiry.status]?.label}
                                            </span>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 bg-muted/30 px-4 py-1.5 rounded-full border border-border/30">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(inquiry.$createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative group/text">
                                        <div className="absolute -left-6 top-0 bottom-0 w-1.5 bg-[#CC2224]/10 rounded-full group-hover:bg-[#CC2224]/30 transition-colors" />
                                        <div className="bg-muted/20 rounded-3xl p-6 border border-border/30 group-hover:border-[#CC2224]/10 transition-colors">
                                            <p className="text-[17px] text-foreground/80 leading-relaxed font-semibold italic">
                                                &ldquo;{inquiry.query}&rdquo;
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex lg:flex-col gap-4 justify-end items-center self-end lg:self-stretch lg:border-l lg:border-border/50 lg:pl-10">
                                    {updatingStatus === inquiry.$id ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="relative">
                                                <Loader2 className="w-8 h-8 animate-spin text-[#CC2224]" />
                                                <div className="absolute inset-0 bg-[#CC2224]/10 rounded-full blur-md animate-pulse" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CC2224] animate-pulse">Processing</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex flex-wrap lg:flex-col gap-3 w-full">
                                                {NEXT_STEPS[inquiry.status]?.length > 0 ? (
                                                    NEXT_STEPS[inquiry.status].map((next) => (
                                                        <button
                                                            key={next}
                                                            onClick={() => handleUpdateStatus(inquiry.$id, inquiry.status, next)}
                                                            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-sm border ${STATUS_CONFIG[next].bg} ${STATUS_CONFIG[next].color} border-current/20 hover:scale-[1.03] active:scale-95 hover:shadow-lg`}
                                                        >
                                                            {next === 'In_process' && <Zap className="w-4 h-4" />}
                                                            {next === 'Completed' && <CheckCircle2 className="w-4 h-4" />}
                                                            {next === 'Discarded' && <XCircle className="w-4 h-4" />}
                                                            Move to {STATUS_CONFIG[next].label}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic px-6 py-4 border border-dashed border-border/50 rounded-2xl">
                                                        Workflow Finalized
                                                    </div>
                                                )}
                                            </div>

                                            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent hidden lg:block my-4 opacity-0" />

                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
