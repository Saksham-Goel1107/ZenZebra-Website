'use client';

import ConfirmDialog from '@/components/admin/ConfirmDialog';
import DeploymentStatusBadge from '@/components/admin/DeploymentStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { account } from '@/lib/appwrite';
import { formatDistanceToNow } from 'date-fns';
import {
    Clock,
    Copy,
    Download,
    ExternalLink,
    GitBranch,
    GitCommit,
    Loader2,
    Play,
    RefreshCcw,
    Rocket,
    Terminal,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Deployment {
    uid: string;
    name: string;
    url: string;
    created: number;
    state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
    creator: {
        uid: string;
        username: string;
    };
    meta: {
        githubCommitRef?: string;
        githubCommitSha?: string;
        githubCommitMessage?: string;
    };
    target?: 'production' | 'staging' | null;
}

export default function VercelDashboard() {
    // --- State: Deployments ---
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [loadingDeployments, setLoadingDeployments] = useState(true);
    const [deploying, setDeploying] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
    const [logs, setLogs] = useState<any>(null);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [deploymentToCancel, setDeploymentToCancel] = useState<string | null>(null);
    const [promoting, setPromoting] = useState(false);

    // --- Fetchers ---

    const fetchDeployments = async () => {
        try {
            setLoadingDeployments(true);
            const { jwt } = await account.createJWT();
            const response = await fetch('/api/admin/vercel/deployments?limit=30', {
                headers: { 'X-Appwrite-JWT': jwt },
            });
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            setDeployments(data.deployments || []);
        } catch (error: any) {
            console.error('Failed to fetch deployments:', error);
            toast.error('Failed to load deployments');
        } finally {
            setLoadingDeployments(false);
        }
    };

    // --- Actions ---

    const triggerDeployment = async (target: string) => {
        try {
            setDeploying(true);
            const { jwt } = await account.createJWT();
            const response = await fetch('/api/admin/vercel/deployments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Appwrite-JWT': jwt },
                body: JSON.stringify({ target }),
            });
            if (!response.ok) throw new Error(await response.text());
            toast.success(`${target === 'production' ? 'Production' : 'Preview'} deployment started!`);
            setTimeout(fetchDeployments, 2000);
        } catch (error: any) {
            console.error('Failed to trigger deployment:', error);
            toast.error(error.message || 'Failed to start deployment');
        } finally {
            setDeploying(false);
        }
    };

    const cancelDeployment = async (deploymentId: string) => {
        try {
            const { jwt } = await account.createJWT();
            const response = await fetch(`/api/admin/vercel/deployments/${deploymentId}`, {
                method: 'DELETE',
                headers: { 'X-Appwrite-JWT': jwt },
            });
            if (!response.ok) throw new Error(await response.text());
            toast.success('Deployment canceled');
            fetchDeployments();
        } catch (error: any) {
            console.error('Failed to cancel deployment:', error);
            toast.error(error.message || 'Failed to cancel deployment');
        }
    };

    const promoteDeployment = async (deploymentId: string) => {
        try {
            setPromoting(true);
            const { jwt } = await account.createJWT();
            const response = await fetch(`/api/admin/vercel/deployments/${deploymentId}`, {
                method: 'PATCH',
                headers: { 'X-Appwrite-JWT': jwt },
            });
            if (!response.ok) throw new Error(await response.text());
            toast.success('Promoting deployment to Production...');
            setTimeout(fetchDeployments, 2000);
        } catch (error: any) {
            console.error('Failed to promote deployment:', error);
            toast.error(error.message || 'Failed to promote deployment');
        } finally {
            setPromoting(false);
        }
    };

    const viewLogs = async (deployment: Deployment) => {
        setSelectedDeployment(deployment);
        setLoadingLogs(true);
        try {
            const { jwt } = await account.createJWT();
            const response = await fetch(`/api/admin/vercel/deployments/${deployment.uid}/logs`, {
                headers: { 'X-Appwrite-JWT': jwt },
            });
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            setLogs(data.logs);
        } catch (error: any) {
            console.error('Failed to fetch logs:', error);
            toast.error('Failed to load deployment logs');
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchDeployments();
        const interval = setInterval(fetchDeployments, 15000);
        return () => clearInterval(interval);
    }, []);

    const filteredDeployments = deployments.filter((d) => {
        if (statusFilter === 'all') return true;
        return d.state.toLowerCase() === statusFilter.toLowerCase();
    });

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                        Vercel <span className="text-[#CC2224]">Manager</span>
                    </h1>
                    <p className="text-muted-foreground">Comprehensive platform control center</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchDeployments()}>
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2">
                        <Label>Status Filter:</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="building">Building</SelectItem>
                                <SelectItem value="error">Error</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => triggerDeployment('preview')}
                            disabled={deploying}
                            variant="outline"
                        >
                            {deploying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                            Deploy Preview
                        </Button>
                        <Button
                            onClick={() => triggerDeployment('production')}
                            disabled={deploying}
                            className="bg-[#CC2224] hover:bg-black text-white"
                        >
                            {deploying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                            Deploy Production
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4">
                    {loadingDeployments && deployments.length === 0 ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>
                    ) : filteredDeployments.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground">No deployments found</div>
                    ) : (
                        filteredDeployments.map((d) => (
                            <Card key={d.uid} className="hover:border-[#CC2224]/50 transition-colors">
                                <CardHeader className="py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <DeploymentStatusBadge status={d.state} />
                                                <span className="font-bold text-sm">{d.name}</span>
                                                {d.target && <span className="text-xs bg-muted px-2 py-0.5 rounded">{d.target}</span>}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-4">
                                                <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {d.meta.githubCommitRef}</span>
                                                <span className="flex items-center gap-1"><GitCommit className="w-3 h-3" /> {d.meta.githubCommitMessage}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(d.created), { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => viewLogs(d)}>
                                                <Terminal className="w-4 h-4 mr-2" /> Logs
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => window.open(`https://${d.url}`, '_blank')}>
                                                <ExternalLink className="w-4 h-4 mr-2" /> Visit
                                            </Button>
                                            {d.state === 'BUILDING' ? (
                                                <Button size="sm" variant="destructive" onClick={() => { setDeploymentToCancel(d.uid); setCancelDialogOpen(true); }}>
                                                    <X className="w-4 h-4 mr-2" /> Cancel
                                                </Button>
                                            ) : d.state === 'READY' && d.target !== 'production' ? (
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => promoteDeployment(d.uid)}
                                                    disabled={promoting}
                                                >
                                                    {promoting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                                                    Promote
                                                </Button>
                                            ) : d.state === 'READY' && d.target === 'production' ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => promoteDeployment(d.uid)}
                                                    disabled={promoting}
                                                    title="Redeploy to Production"
                                                >
                                                    <RefreshCcw className={`w-4 h-4 ${promoting ? 'animate-spin' : ''}`} />
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Logs Dialog */}
            <Dialog open={!!selectedDeployment} onOpenChange={() => setSelectedDeployment(null)}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader className="flex flex-row items-center justify-between space-y-0">
                        <DialogTitle>Deployment Logs - {selectedDeployment?.name}</DialogTitle>
                        <div className="flex gap-2">
                            <Button size="icon" variant="outline" onClick={() => {
                                const text = Array.isArray(logs) ? logs.map((l: any) => l.payload?.text || l.text || '').join('\n') : JSON.stringify(logs, null, 2);
                                navigator.clipboard.writeText(text);
                                toast.success('Logs copied');
                            }}>
                                <Copy className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="outline" onClick={() => {
                                const text = Array.isArray(logs) ? logs.map((l: any) => l.payload?.text || l.text || '').join('\n') : JSON.stringify(logs, null, 2);
                                const blob = new Blob([text], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `logs-${selectedDeployment?.uid}.txt`;
                                a.click();
                            }}>
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto bg-black text-green-400 p-4 rounded-lg font-mono text-xs">
                        {loadingLogs ? (
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mt-10" />
                        ) : logs ? (
                            <pre className="whitespace-pre-wrap">
                                {Array.isArray(logs)
                                    ? logs.map((l: any) => l.payload?.text || l.text || JSON.stringify(l)).join('\n')
                                    : JSON.stringify(logs, null, 2)}
                            </pre>
                        ) : (
                            <p>No logs available</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirm */}
            <ConfirmDialog
                open={cancelDialogOpen}
                onOpenChange={setCancelDialogOpen}
                title="Cancel Deployment"
                description="Are you sure?"
                onConfirm={() => deploymentToCancel && cancelDeployment(deploymentToCancel)}
                confirmText="Yes, Cancel"
                variant="destructive"
            />
        </div>
    );
}
