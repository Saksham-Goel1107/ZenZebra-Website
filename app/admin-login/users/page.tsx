'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { account, appwriteConfig, avatars, isOwner, storage } from '@/lib/appwrite';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Calendar,
    CheckCircle2,
    Filter,
    Loader2,
    Lock,
    Mail,
    Plus,
    RefreshCcw,
    Search,
    Shield,
    Trash2,
    User as UserIcon,
    UserPlus,
    Users as UsersIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface AppwriteUser {
    $id: string;
    name: string;
    email: string;
    registration: string;
    status: boolean;
    emailVerification: boolean;
    prefs: {
        avatarId?: string;
        [key: string]: any;
    };
}


export default function UsersPage() {
    const [users, setUsers] = useState<AppwriteUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const router = useRouter();

    // New user form
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { jwt } = await account.createJWT();
            const response = await fetch('/api/admin/users', {
                headers: {
                    'X-Appwrite-JWT': jwt
                }
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            setUsers(data);
        } catch (error: any) {
            toast.error('Failed to fetch users', {
                description: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkPermission = async () => {
            try {
                const user = await account.get();
                const owner = await isOwner(user.$id);
                if (!owner) {
                    toast.error("Unauthorized Access", { description: "You do not have permission to manage the team." });
                    router.push('/admin-login/catalogue-dashboard');
                    return;
                }
                fetchUsers();
            } catch (error) {
                router.push('/admin-login');
            }
        };
        checkPermission();
    }, [router]);

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const stats = useMemo(() => {
        return {
            total: users.length,
            active: users.filter(u => u.status).length,
            verified: users.filter(u => u.emailVerification).length
        };
    }, [users]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newUser.password.length < 8) {
            toast.error('Password too short', { description: 'Min 8 characters required' });
            return;
        }

        setCreating(true);
        try {
            const { jwt } = await account.createJWT();
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-JWT': jwt
                },
                body: JSON.stringify(newUser),
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            toast.success('Admin user created', {
                description: `${newUser.name} can now log in.`
            });
            setNewUser({ name: '', email: '', password: '' });
            setIsCreateModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast.error('Creation failed', { description: error.message });
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        setDeletingId(userId);
        try {
            const { jwt } = await account.createJWT();
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'X-Appwrite-JWT': jwt
                }
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            toast.success('Access revoked', {
                description: `Removed ${userName} from the team.`
            });
            fetchUsers();
        } catch (error: any) {
            toast.error('Failed to delete', { description: error.message });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 p-4 md:p-8 space-y-10">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[#CC2224]">
                        <div className="p-2 rounded-xl bg-[#CC2224]/10 border border-[#CC2224]/20">
                            <Shield className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">Security Console</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground italic">
                        TEAM <span className="text-[#CC2224]">STRIPE</span>
                    </h1>
                    <p className="text-muted-foreground max-w-md">
                        Manage authorized personnel, monitor access status, and secure your retail environment.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchUsers}
                        disabled={loading}
                        className="border-input bg-card hover:bg-accent text-foreground"
                    >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Sync
                    </Button>

                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#CC2224] hover:bg-[#b01c1e] text-white px-6 shadow-[0_0_20px_rgba(204,34,36,0.3)] hover:shadow-[0_0_30px_rgba(204,34,36,0.5)] transition-all">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Operative
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border text-foreground sm:max-w-[425px] overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#CC2224]" />
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-3 italic uppercase">
                                    <UserPlus className="w-6 h-6 text-[#CC2224]" />
                                    New Registration
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Initial access requires a system-generated password. Operatives should update their credentials upon first entry.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateUser} className="space-y-5 mt-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#CC2224] ml-1">Legal Name</label>
                                    <div className="relative group">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#CC2224] transition-colors" />
                                        <Input
                                            required
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            placeholder="e.g. Victor Zebra"
                                            className="bg-background border-input pl-10 h-12 focus-visible:ring-[#CC2224]/50 focus-visible:border-[#CC2224]/50 text-foreground"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#CC2224] ml-1">System Mail</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#CC2224] transition-colors" />
                                        <Input
                                            required
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            placeholder="operative@zenzebra.in"
                                            className="bg-background border-input pl-10 h-12 focus-visible:ring-[#CC2224]/50 focus-visible:border-[#CC2224]/50 text-foreground"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#CC2224] ml-1">Secure Passkey</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#CC2224] transition-colors" />
                                        <Input
                                            required
                                            type="password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            placeholder="••••••••••••"
                                            className="bg-background border-input pl-10 h-12 focus-visible:ring-[#CC2224]/50 focus-visible:border-[#CC2224]/50 text-foreground"
                                        />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground italic px-1">Minimum 8 characters. Must contain varied complexity.</p>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={creating}
                                    className="w-full bg-[#CC2224] hover:bg-[#b01c1e] text-white h-14 mt-4 text-md font-bold uppercase tracking-widest"
                                >
                                    {creating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Shield className="w-5 h-5 mr-2" />}
                                    Authorize Access
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats QuickView */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card border-border backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 text-[#CC2224]/20 group-hover:text-[#CC2224]/40 transition-colors">
                        <UsersIcon className="w-12 h-12" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Total Personnel</CardDescription>
                        <CardTitle className="text-4xl font-extrabold text-foreground">{stats.total}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-card border-border backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 text-green-500/10 group-hover:text-green-500/20 transition-colors">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Authenticated Now</CardDescription>
                        <CardTitle className="text-4xl font-extrabold text-foreground">{stats.active}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-card border-border backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
                        <Shield className="w-12 h-12" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Verified Identities</CardDescription>
                        <CardTitle className="text-4xl font-extrabold text-foreground">{stats.verified}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Search & Utility Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-card p-4 rounded-2xl border border-border">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#CC2224] transition-colors" />
                    <Input
                        placeholder="Search by operative name or system ID..."
                        className="bg-background border-input pl-11 h-12 focus-visible:ring-[#CC2224]/30 text-foreground"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="border-input bg-background hover:bg-accent text-foreground h-12">
                    <Filter className="w-4 h-4 mr-2" />
                    All Roles
                </Button>
            </div>

            {/* Users Grid */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <motion.div
                                key={`skeleton-${i}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-64 rounded-3xl bg-white/[0.03] border border-white/5 animate-pulse"
                            />
                        ))
                    ) : filteredUsers.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="col-span-full py-32 text-center bg-card border border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center p-8"
                        >
                            <div className="p-6 rounded-full bg-muted mb-6">
                                <Search className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground uppercase italic tracking-wider">No matching operatives</h3>
                            <p className="text-muted-foreground text-sm mt-2 max-w-xs">We couldn't find any team members matching your search criteria. Check spelling or clear filters.</p>
                            <Button
                                variant="link"
                                onClick={() => setSearchQuery('')}
                                className="text-[#CC2224] mt-4 font-bold uppercase tracking-[0.2em] text-xs"
                            >
                                Clear Intelligence Search
                            </Button>
                        </motion.div>
                    ) : (
                        filteredUsers.map((user, index) => (
                            <motion.div
                                layout
                                key={user.$id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="group relative"
                            >
                                <div
                                    className={`
                    absolute -inset-[1px] bg-gradient-to-br from-white/10 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500
                    ${user.status ? 'group-hover:from-green-500/20' : 'group-hover:from-red-500/20'}
                  `}
                                />

                                <div className="relative rounded-[1.95rem] bg-card border border-border p-6 shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl border shadow-lg overflow-hidden ${user.status ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                                    {user.prefs?.avatarId ? (
                                                        <img
                                                            src={storage.getFilePreview(appwriteConfig.bucketId, user.prefs.avatarId).toString()}
                                                            alt={user.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={avatars.getInitials(user.name).toString()}
                                                            alt={user.name}
                                                            className="w-full h-full object-cover opacity-90"
                                                        />
                                                    )}
                                                </div>
                                                {user.status && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0d0d0d] z-10" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground truncate max-w-[140px] leading-tight">
                                                    {user.name || 'Anonymous Operative'}
                                                </h3>
                                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-0.5">
                                                    {user.status ? 'Active Protocol' : 'Access Restricted'}
                                                </p>
                                            </div>
                                        </div>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-card border-border text-foreground text-center">
                                                <DialogHeader>
                                                    <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                                                        <Trash2 className="w-6 h-6 text-red-500" />
                                                    </div>
                                                    <DialogTitle className="text-xl font-bold uppercase italic">Revoke Access?</DialogTitle>
                                                    <DialogDescription className="text-muted-foreground pt-2">
                                                        This will permanently remove <span className="text-foreground font-bold">{user.name}</span> from the system. They will no longer be able to log in to the admin portal.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter className="mt-8 flex gap-3 sm:justify-center">
                                                    <Button variant="ghost" className="text-foreground hover:bg-accent border border-border flex-1">Cancel</Button>
                                                    <Button
                                                        className="bg-red-600 hover:bg-red-700 text-white flex-1"
                                                        onClick={() => handleDeleteUser(user.$id, user.name)}
                                                        disabled={deletingId === user.$id}
                                                    >
                                                        {deletingId === user.$id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                        Confirm Revocation
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    {/* Body Info */}
                                    <div className="mt-6 space-y-3">
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border transition-colors group-hover:bg-accent/50">
                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-xs text-foreground/80 truncate flex-1">{user.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border transition-colors group-hover:bg-accent/50">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-xs text-foreground/80">Registered on {new Date(user.registration).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    </div>

                                    {/* Footer Indicators */}
                                    <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${user.emailVerification ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'}`}>
                                                {user.emailVerification ? 'ID Verified' : 'Pending Verification'}
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors uppercase">
                                            REF: {user.$id.slice(-8)}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
}
