'use client';

import ConfirmDialog from '@/components/admin/ConfirmDialog';
import SecretValueInput from '@/components/admin/SecretValueInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { account } from '@/lib/appwrite';
import { formatDistanceToNow } from 'date-fns';
import {
    Edit3,
    Eye,
    EyeOff,
    FileText,
    History,
    Key,
    Loader2,
    Plus,
    RefreshCcw,
    Save,
    Trash2,
    Upload,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DopplerProject {
    id: string;
    name: string;
    description: string;
}

interface DopplerSecret {
    name: string;
    computed: string;
    raw: string;
}

interface AuditLog {
    id: string;
    text: string;
    user: {
        name: string;
        email: string;
    };
    created_at: string;
}

export default function SecretsPage() {
    const [projects, setProjects] = useState<DopplerProject[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedConfig, setSelectedConfig] = useState('prd');
    const [secrets, setSecrets] = useState<Record<string, DopplerSecret>>({});
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());

    // Add/Edit Dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSecret, setEditingSecret] = useState<{ name: string; value: string } | null>(null);
    const [newSecretName, setNewSecretName] = useState('');
    const [newSecretValue, setNewSecretValue] = useState('');

    // Bulk Edit Dialog
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkContent, setBulkContent] = useState('');
    const [bulkSaving, setBulkSaving] = useState(false);

    // Delete Dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [secretToDelete, setSecretToDelete] = useState<string | null>(null);

    const fetchProjects = async () => {
        try {
            const { jwt } = await account.createJWT();
            const response = await fetch('/api/admin/doppler/projects', {
                headers: { 'X-Appwrite-JWT': jwt },
            });

            if (!response.ok) throw new Error(await response.text());

            const data = await response.json();
            setProjects(data.projects || []);

            // Auto-select first project if available
            if (data.projects?.length > 0 && !selectedProject) {
                setSelectedProject(data.projects[0].name);
            }
        } catch (error: any) {
            console.error('Failed to fetch projects:', error);
            toast.error(error.message || 'Failed to load Doppler projects');
        }
    };

    const fetchSecrets = async () => {
        if (!selectedProject || !selectedConfig) return;

        try {
            setLoading(true);
            const { jwt } = await account.createJWT();
            const response = await fetch(
                `/api/admin/doppler/secrets?project=${selectedProject}&config=${selectedConfig}`,
                { headers: { 'X-Appwrite-JWT': jwt } }
            );

            if (!response.ok) throw new Error(await response.text());

            const data = await response.json();
            setSecrets(data.secrets || {});
        } catch (error: any) {
            console.error('Failed to fetch secrets:', error);
            toast.error(error.message || 'Failed to load secrets');
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        if (!selectedProject) return;

        try {
            const { jwt } = await account.createJWT();
            const response = await fetch(
                `/api/admin/doppler/audit?project=${selectedProject}`,
                { headers: { 'X-Appwrite-JWT': jwt } }
            );

            if (!response.ok) throw new Error(await response.text());

            const data = await response.json();
            setAuditLogs(data.logs || []);
        } catch (error: any) {
            console.error('Failed to fetch audit logs:', error);
        }
    };

    const saveSecret = async () => {
        if (!selectedProject || !selectedConfig) return;

        const name = editingSecret?.name ? newSecretName || editingSecret.name : newSecretName;
        const value = newSecretValue;

        if (!name || !value) {
            toast.error('Secret name and value are required');
            return;
        }

        try {
            const { jwt } = await account.createJWT();

            // If renaming (editingSecret exists and name changed)
            if (editingSecret && editingSecret.name !== name) {
                // Delete old secret first
                await fetch(`/api/admin/doppler/secrets?project=${selectedProject}&config=${selectedConfig}&name=${editingSecret.name}`, {
                    method: 'DELETE',
                    headers: { 'X-Appwrite-JWT': jwt },
                });
            }

            const response = await fetch('/api/admin/doppler/secrets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-JWT': jwt,
                },
                body: JSON.stringify({
                    project: selectedProject,
                    config: selectedConfig,
                    name,
                    value,
                }),
            });

            if (!response.ok) throw new Error(await response.text());

            toast.success(editingSecret ? 'Secret updated' : 'Secret created');
            setDialogOpen(false);
            setEditingSecret(null);
            setNewSecretName('');
            setNewSecretValue('');
            fetchSecrets();
            fetchAuditLogs();
        } catch (error: any) {
            console.error('Failed to save secret:', error);
            toast.error(error.message || 'Failed to save secret');
        }
    };

    const saveBulkSecrets = async () => {
        if (!selectedProject || !selectedConfig || !bulkContent) return;

        try {
            setBulkSaving(true);
            const { jwt } = await account.createJWT();

            // Parse .env format
            const lines = bulkContent.split('\n');
            const newSecrets: Record<string, string> = {};

            lines.forEach(line => {
                const trimmed = line.trim();
                // Skip comments and empty lines
                if (!trimmed || trimmed.startsWith('#')) return;

                const eqIndex = trimmed.indexOf('=');
                if (eqIndex > 0) {
                    const key = trimmed.substring(0, eqIndex).trim();
                    let val = trimmed.substring(eqIndex + 1).trim();

                    // Remove quotes if present
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.substring(1, val.length - 1);
                    }

                    if (key) newSecrets[key] = val;
                }
            });

            if (Object.keys(newSecrets).length === 0) {
                toast.error('No valid secrets found to save');
                return;
            }

            const response = await fetch('/api/admin/doppler/secrets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-JWT': jwt,
                },
                body: JSON.stringify({
                    project: selectedProject,
                    config: selectedConfig,
                    secrets: newSecrets
                }),
            });

            if (!response.ok) throw new Error(await response.text());

            toast.success(`Saved ${Object.keys(newSecrets).length} secrets`);
            setBulkDialogOpen(false);
            setBulkContent('');
            fetchSecrets();
            fetchAuditLogs();
        } catch (error: any) {
            console.error('Failed to save bulk secrets:', error);
            toast.error(error.message || 'Failed to save secrets');
        } finally {
            setBulkSaving(false);
        }
    };

    const deleteSecret = async (secretName: string) => {
        if (!selectedProject || !selectedConfig) return;

        try {
            const { jwt } = await account.createJWT();
            const response = await fetch(
                `/api/admin/doppler/secrets?project=${selectedProject}&config=${selectedConfig}&name=${secretName}`,
                {
                    method: 'DELETE',
                    headers: { 'X-Appwrite-JWT': jwt },
                }
            );

            if (!response.ok) throw new Error(await response.text());

            toast.success('Secret deleted');
            fetchSecrets();
            fetchAuditLogs();
        } catch (error: any) {
            console.error('Failed to delete secret:', error);
            toast.error(error.message || 'Failed to delete secret');
        }
    };

    const syncToVercel = async () => {
        if (!selectedProject || !selectedConfig) return;

        try {
            setSyncing(true);
            const { jwt } = await account.createJWT();
            const response = await fetch('/api/admin/doppler/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-JWT': jwt,
                },
                body: JSON.stringify({
                    project: selectedProject,
                    config: selectedConfig,
                }),
            });

            if (!response.ok) throw new Error(await response.text());

            const data = await response.json();
            toast.success(data.message || 'Synced to Vercel successfully');
        } catch (error: any) {
            console.error('Failed to sync to Vercel:', error);
            toast.error(error.message || 'Failed to sync to Vercel');
        } finally {
            setSyncing(false);
        }
    };

    const toggleReveal = (secretName: string) => {
        const newRevealed = new Set(revealedSecrets);
        if (newRevealed.has(secretName)) {
            newRevealed.delete(secretName);
        } else {
            newRevealed.add(secretName);
        }
        setRevealedSecrets(newRevealed);
    };

    const toggleAllSecrets = () => {
        if (revealedSecrets.size === secretsArray.length) {
            // All revealed, hide all
            setRevealedSecrets(new Set());
        } else {
            // Some or none revealed, reveal all
            setRevealedSecrets(new Set(secretsArray.map(([name]) => name)));
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProject && selectedConfig) {
            fetchSecrets();
            fetchAuditLogs();
        }
    }, [selectedProject, selectedConfig]);

    const secretsArray = Object.entries(secrets);

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                        Doppler <span className="text-[#CC2224]">Secrets</span>
                    </h1>
                    <p className="text-muted-foreground">Manage environment variables and secrets</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            // Pre-fill bulk content with existing secrets
                            const content = secretsArray
                                .map(([key, val]) => `${key}=${val.computed}`)
                                .join('\n');
                            setBulkContent(content);
                            setBulkDialogOpen(true);
                        }}
                        disabled={loading}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Bulk Editor
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleAllSecrets}
                        disabled={loading || secretsArray.length === 0}
                    >
                        {revealedSecrets.size === secretsArray.length ? (
                            <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Hide All
                            </>
                        ) : (
                            <>
                                <Eye className="w-4 h-4 mr-2" />
                                Reveal All
                            </>
                        )}
                    </Button>
                    <Button variant="outline" onClick={fetchSecrets} disabled={loading}>
                        <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={syncToVercel}
                        disabled={syncing || !selectedProject}
                        variant="outline"
                    >
                        {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Sync to Vercel
                    </Button>
                    <Button
                        onClick={() => {
                            setEditingSecret(null);
                            setNewSecretName('');
                            setNewSecretValue('');
                            setDialogOpen(true);
                        }}
                        disabled={!selectedProject}
                        className="bg-[#CC2224] hover:bg-black text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Secret
                    </Button>
                </div>
            </div>

            {/* Project & Config Selectors */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Doppler Project</Label>
                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((project) => (
                                        <SelectItem key={project.id} value={project.name}>
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Environment Config</Label>
                            <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dev">Development</SelectItem>
                                    <SelectItem value="stg">Staging</SelectItem>
                                    <SelectItem value="prd">Production</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="secrets" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="secrets">
                        <Key className="w-4 h-4 mr-2" />
                        Secrets ({secretsArray.length})
                    </TabsTrigger>
                    <TabsTrigger value="audit">
                        <History className="w-4 h-4 mr-2" />
                        Audit Log
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="secrets" className="space-y-4">
                    {loading ? (
                        <Card>
                            <CardContent className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </CardContent>
                        </Card>
                    ) : secretsArray.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <Key className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No secrets found</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Add your first secret to get started
                                </p>
                                <Button onClick={() => setDialogOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Secret
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {secretsArray.map(([name, secret]) => (
                                <Card key={name} className="hover:border-[#CC2224]/50 transition-colors">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Key className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-mono font-bold">{name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type={revealedSecrets.has(name) ? 'text' : 'password'}
                                                        value={secret.computed}
                                                        readOnly
                                                        className="font-mono text-sm"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleReveal(name)}
                                                    >
                                                        {revealedSecrets.has(name) ? (
                                                            <EyeOff className="w-4 h-4" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingSecret({ name, value: secret.computed });
                                                        setNewSecretName(name);
                                                        setNewSecretValue(secret.computed);
                                                        setDialogOpen(true);
                                                    }}
                                                >
                                                    <Edit3 className="w-4 h-4 mr-2" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSecretToDelete(name);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Audit Logs */}
                <TabsContent value="audit" className="space-y-4">
                    {auditLogs.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <History className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No audit logs</h3>
                                <p className="text-sm text-muted-foreground">
                                    Activity logs will appear here
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {auditLogs.map((log) => (
                                <Card key={log.id}>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <p className="text-sm">{log.text}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    by {log.user.name} ({log.user.email})
                                                </p>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Add/Edit Secret Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSecret ? 'Edit Secret' : 'Add New Secret'}</DialogTitle>
                        <DialogDescription>
                            {editingSecret
                                ? 'Update the value or rename this secret'
                                : 'Create a new secret or environment variable'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Secret Name</Label>
                            <Input
                                value={newSecretName}
                                onChange={(e) => setNewSecretName(e.target.value)}
                                placeholder="API_KEY"
                                className="font-mono uppercase"
                            />
                            {editingSecret && newSecretName !== editingSecret.name && (
                                <p className="text-xs text-yellow-500">
                                    Changing name will create a new secret and delete the old one.
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Secret Value</Label>
                            <SecretValueInput
                                value={newSecretValue}
                                onChange={setNewSecretValue}
                                placeholder="Enter secret value"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveSecret} className="bg-[#CC2224] hover:bg-black">
                            {editingSecret ? 'Update' : 'Create'} Secret
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Edit Dialog */}
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Bulk Secret Editor</DialogTitle>
                        <DialogDescription>
                            Paste your .env file content here. Use KEY=VALUE format.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 py-4 min-h-0">
                        <Textarea
                            value={bulkContent}
                            onChange={(e) => setBulkContent(e.target.value)}
                            className="h-full font-mono text-xs whitespace-pre resize-none overflow-y-auto"
                            placeholder="API_KEY=12345&#10;DB_HOST=localhost"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveBulkSecrets} disabled={bulkSaving} className="bg-[#CC2224] hover:bg-black">
                            {bulkSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save All Secrets
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Secret"
                description={`Are you sure you want to delete "${secretToDelete}"? This action cannot be undone.`}
                onConfirm={() => secretToDelete && deleteSecret(secretToDelete)}
                confirmText="Delete Secret"
                variant="destructive"
            />
        </div>
    );
}
