'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { appwriteConfig, default as client, databases, storage } from '@/lib/appwrite';
import { ID, Query, RealtimeResponseEvent } from 'appwrite';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Building2,
    Edit2,
    FileImage,
    Loader2,
    MapPin,
    MoreVertical,
    Plus,
    Search,
    Store,
    Trash2
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type StoreType = {
    id: string;
    label: string;
    address: string;
    description: string;
    imageUrl?: string;
    active: boolean;
    $updatedAt?: string;
    $createdAt?: string;
};

export default function StoresDashboard() {
    const [stores, setStores] = useState<StoreType[]>([]);
    const [label, setLabel] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [active, setActive] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [file, setFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; store: StoreType | null }>({
        isOpen: false,
        store: null,
    });

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const fetchStores = async () => {
        try {
            const response = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.storesCollectionId,
                [Query.orderDesc('$createdAt')]
            );
            const list: StoreType[] = response.documents.map((doc: any) => ({
                id: doc.$id,
                label: doc.label,
                address: doc.address || '',
                description: doc.description || '',
                imageUrl: doc.url,
                active: doc.active,
                $updatedAt: doc.$updatedAt,
                $createdAt: doc.$createdAt,
            }));
            setStores(list);
        } catch (error) {
            console.error('Error fetching stores:', error);
            toast.error('Failed to load stores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
        const unsubscribe = client.subscribe(
            `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.storesCollectionId}.documents`,
            (response: RealtimeResponseEvent<StoreType>) => {
                if (
                    response.events.some(
                        (e) => e.includes('.create') || e.includes('.update') || e.includes('.delete')
                    )
                ) {
                    fetchStores();
                }
            }
        );
        return () => unsubscribe();
    }, []);

    const filteredStores = useMemo(() => {
        return stores.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [stores, searchQuery]);

    const resetForm = () => {
        setLabel('');
        setAddress('');
        setDescription('');
        setImageUrl('');
        setActive(true);
        setFile(null);
        setEditingId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadImageIfAny = async (): Promise<string> => {
        if (file) {
            if (!file.type.startsWith('image/')) throw new Error('Please upload a valid image file.');
            if (file.size > 10 * 1024 * 1024) throw new Error('Maximum image size (10MB) exceeded.');

            const uploadedFile = await storage.createFile(appwriteConfig.bucketId, ID.unique(), file);
            const fileUrl = storage.getFileView(appwriteConfig.bucketId, uploadedFile.$id);
            return fileUrl.toString();
        }
        if (imageUrl) return imageUrl;
        return '';
    };

    const handleSave = async () => {
        if (!label.trim()) {
            toast.error('Store Name required.');
            return;
        }
        setBusy(true);
        try {
            const finalImageUrl = await uploadImageIfAny();
            const data = {
                label: label.trim(),
                address: address.trim(),
                description: description.trim(),
                url: finalImageUrl,
                active,
            };

            if (editingId) {
                await databases.updateDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.storesCollectionId,
                    editingId,
                    data
                );
                toast.success('Store updated successfully');
            } else {
                await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.storesCollectionId,
                    ID.unique(),
                    data
                );
                toast.success('New store created successfully');
            }
            resetForm();
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Operation failed');
        } finally {
            setBusy(false);
        }
    };

    const startEdit = (store: StoreType) => {
        setEditingId(store.id);
        setLabel(store.label);
        setAddress(store.address);
        setDescription(store.description);
        setImageUrl(store.imageUrl || '');
        setActive(store.active);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Scroll to form on mobile
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const confirmDelete = async () => {
        if (!deleteDialog.store) return;
        try {
            await databases.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.storesCollectionId,
                deleteDialog.store.id
            );
            toast.success(`Removed "${deleteDialog.store.label}"`);
            if (editingId === deleteDialog.store.id) resetForm();
        } catch (e: any) {
            toast.error('Removal failed');
        } finally {
            setDeleteDialog({ isOpen: false, store: null });
        }
    };

    const canSave = useMemo(() => !!label.trim(), [label]);

    return (
        <div className="min-h-screen bg-background p-6 md:p-12 space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Store Locations</h1>
                    <p className="text-muted-foreground mt-2">Manage your physical retail presence.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/50 text-xs font-mono text-muted-foreground border border-border">
                    <Store className="w-3 h-3" />
                    <span>{stores.length} Locations Active</span>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">

                {/* Form Section */}
                <div ref={formRef} className="lg:col-span-5 xl:col-span-4 space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-6">
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            {editingId ? <Edit2 className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
                            {editingId ? 'Edit Store Details' : 'Add New Location'}
                        </h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Store Name</Label>
                                <Input
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    placeholder="e.g. Downtown Flagship"
                                    className="bg-background"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="123 Retail St, City"
                                        className="pl-9 bg-background"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Store hours, special features..."
                                    className="resize-none min-h-[100px] bg-background"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Store Image</Label>
                                <div
                                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${file ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-accent'}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-2 rounded-full bg-background border border-border">
                                            <FileImage className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        {file ? (
                                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                                        ) : (
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">Click to upload image</p>
                                                <p className="text-xs text-muted-foreground">JPG, PNG up to 10MB</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {imageUrl && !file && (
                                    <div className="mt-2 relative h-32 w-full rounded-lg overflow-hidden border border-border">
                                        <img src={imageUrl} alt="Current" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-medium">Current Image</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <Checkbox
                                    id="active"
                                    checked={active}
                                    onCheckedChange={(c) => setActive(c === true)}
                                />
                                <Label htmlFor="active" className="cursor-pointer">Active / Visible to public</Label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    onClick={handleSave}
                                    disabled={!canSave || busy}
                                    className="flex-1"
                                >
                                    {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    {editingId ? 'Save Changes' : 'Create Location'}
                                </Button>
                                {editingId && (
                                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-11 bg-card border-border"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-4">
                        <AnimatePresence>
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <div key={i} className="h-40 rounded-xl bg-card border border-border animate-pulse" />
                                ))
                            ) : filteredStores.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                                    <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p>No stores found matching your search.</p>
                                </div>
                            ) : (
                                filteredStores.map(store => (
                                    <motion.div
                                        layout
                                        key={store.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group bg-card hover:border-primary/30 border border-border rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md"
                                    >
                                        <div className="aspect-video relative bg-muted">
                                            {store.imageUrl ? (
                                                <img src={store.imageUrl} alt={store.label} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                                    <Building2 className="w-12 h-12" />
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 flex gap-2">
                                                <div className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider backdrop-blur-md border ${store.active ? 'bg-green-500/20 border-green-500/30 text-green-100' : 'bg-black/50 border-white/10 text-white/50'}`}>
                                                    {store.active ? 'Active' : 'Hidden'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-foreground truncate max-w-[200px]" title={store.label}>{store.label}</h3>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        <span className="truncate max-w-[180px]" title={store.address}>{store.address}</span>
                                                    </div>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => startEdit(store)}>
                                                            <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-500 focus:text-red-500"
                                                            onClick={() => setDeleteDialog({ isOpen: true, store })}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" /> Delete Location
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5em]">
                                                {store.description || "No description provided."}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>

            <AlertDialog open={deleteDialog.isOpen} onOpenChange={(o) => setDeleteDialog(p => ({ ...p, isOpen: o }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Store Location?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{deleteDialog.store?.label}". Products linked to this store will need to be reassigned.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            Delete Location
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
