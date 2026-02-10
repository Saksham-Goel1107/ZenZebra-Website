'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { appwriteConfig, default as client, databases, storage } from '@/lib/appwrite';
import { ID, Query, RealtimeResponseEvent } from 'appwrite';
import { Edit2, FileUp, Film, Image as ImageIcon, Loader2, MapPin, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from "sonner";

type HomeLocation = {
    id: string;
    title: string;
    description: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    active: boolean;
    order: number;
    $updatedAt?: string;
    $createdAt?: string;
};

export default function LocationsDashboard() {
    const [locations, setLocations] = useState<HomeLocation[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaType, setMediaType] = useState<'image' | 'video'>('video');
    const [active, setActive] = useState(true);
    const [order, setOrder] = useState(0);

    const [file, setFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; location: HomeLocation | null }>({ isOpen: false, location: null });

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const formRef = useRef<HTMLDivElement | null>(null);

    const fetchHomeLocations = async () => {
        try {
            const response = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.homeLocationsCollectionId,
                [Query.orderAsc('order'), Query.orderDesc('$createdAt')]
            );
            const list: HomeLocation[] = response.documents.map((doc: any) => ({
                id: doc.$id,
                title: doc.title,
                description: doc.description,
                mediaUrl: doc.mediaUrl,
                mediaType: doc.mediaType,
                active: doc.active,
                order: doc.order || 0,
                $updatedAt: doc.$updatedAt,
                $createdAt: doc.$createdAt,
            }));
            setLocations(list);
        } catch (error) {
            console.error('Error fetching home locations:', error);
            // If collection doesn't exist, we might get an error.
            // In a real app, you'd ensure the collection exists.
        }
    };

    useEffect(() => {
        fetchHomeLocations();
        // Realtime subscription
        const unsubscribe = client.subscribe(
            `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.homeLocationsCollectionId}.documents`,
            (response: RealtimeResponseEvent<HomeLocation>) => {
                if (response.events.includes('databases.*.collections.*.documents.*.create') ||
                    response.events.includes('databases.*.collections.*.documents.*.update') ||
                    response.events.includes('databases.*.collections.*.documents.*.delete')) {
                    fetchHomeLocations();
                }
            }
        );
        return () => {
            unsubscribe();
        }
    }, []);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setMediaUrl('');
        setMediaType('video');
        setActive(true);
        setOrder(0);
        setFile(null);
        setEditingId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const uploadMediaIfAny = async (): Promise<string> => {
        if (file) {
            // Basic validation based on selected mediaType
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');

            if (mediaType === 'video' && !isVideo) throw new Error('Please upload a video file.');
            if (mediaType === 'image' && !isImage) throw new Error('Please upload an image file.');

            if (file.size > 50 * 1024 * 1024) throw new Error('File must be 50 MB or smaller.');

            const uploadedFile = await storage.createFile(
                appwriteConfig.bucketId,
                ID.unique(),
                file
            );

            const fileUrl = storage.getFileView(appwriteConfig.bucketId, uploadedFile.$id);
            return fileUrl.toString();
        }
        if (mediaUrl) return mediaUrl;
        throw new Error('A media file or URL is required.');
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Please enter a title.');
            return;
        }
        setBusy(true);
        try {
            const finalMediaUrl = await uploadMediaIfAny();

            const data = {
                title: title.trim(),
                description: description.trim(),
                mediaUrl: finalMediaUrl,
                mediaType,
                active,
                order: Number(order),
            };

            if (editingId) {
                await databases.updateDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.homeLocationsCollectionId,
                    editingId,
                    data
                );
                toast.success("Location updated successfully");
            } else {
                await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.homeLocationsCollectionId,
                    ID.unique(),
                    data
                );
                toast.success("Location added successfully");
            }
            await fetchHomeLocations();
            resetForm();
        } catch (e: unknown) {
            console.error(e);
            toast.error((e as Error)?.message || 'Failed to save');
        } finally {
            setBusy(false);
        }
    };

    const startEdit = (loc: HomeLocation) => {
        setEditingId(loc.id);
        setTitle(loc.title);
        setDescription(loc.description);
        setMediaUrl(loc.mediaUrl);
        setMediaType(loc.mediaType);
        setActive(loc.active);
        setOrder(loc.order);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        if (formRef.current) {
            setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    };

    const handleDeleteClick = (location: HomeLocation) => {
        setDeleteDialog({ isOpen: true, location });
    };

    const confirmDelete = async () => {
        if (!deleteDialog.location) return;

        try {
            await databases.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.homeLocationsCollectionId,
                deleteDialog.location.id
            );
            toast.success(`Deleted "${deleteDialog.location.title}"`);
            await fetchHomeLocations();
            if (editingId === deleteDialog.location.id) resetForm();
        } catch (e: unknown) {
            console.error(e);
            toast.error((e as Error).message || "Failed to delete");
        } finally {
            setDeleteDialog({ isOpen: false, location: null });
        }
    };

    const canSave = useMemo(() => !!title.trim() && (!!mediaUrl || !!file), [title, mediaUrl, file]);

    return (
        <div className="space-y-8 pb-12">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Home Page Locations</h1>
                    <p className="text-white/40">Manage the "Spotted in the Wild" section on your homepage</p>
                </div>
            </div>

            {/* Editor Card */}
            <div ref={formRef} className="rounded-3xl border border-white/10 bg-[#111] p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#CC2224]/5 blur-[100px] pointer-events-none" />

                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
                    <div className="p-2.5 bg-[#CC2224]/10 rounded-xl text-[#CC2224]">
                        {editingId ? <Edit2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                    </div>
                    <h2 className="text-xl font-semibold text-white/90">
                        {editingId ? 'Edit Location' : 'Add New Location'}
                    </h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-white/60">Location Title</Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Awfis, Ambience Mall - Gurugram"
                                className="bg-black/40 border-white/10 text-white placeholder:text-white/20 h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/60">Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Give a short detail about this location..."
                                className="bg-black/40 border-white/10 text-white placeholder:text-white/20 min-h-[100px] resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-white/60">Display Order</Label>
                                <Input
                                    type="number"
                                    value={order}
                                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                                    className="bg-black/40 border-white/10 text-white"
                                />
                            </div>
                            <div className="flex items-end pb-2">
                                <div className="flex items-center gap-3 px-1">
                                    <Checkbox
                                        id="active-status"
                                        checked={active}
                                        onCheckedChange={(checked) => setActive(checked === true)}
                                        className="border-white/20 data-[state=checked]:bg-[#CC2224] data-[state=checked]:border-[#CC2224]"
                                    />
                                    <Label htmlFor="active-status" className="cursor-pointer text-white/80 font-medium whitespace-nowrap">
                                        Active on Website
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-white/60">Media Type</Label>
                            <Select value={mediaType} onValueChange={(val: 'image' | 'video') => setMediaType(val)}>
                                <SelectTrigger className="bg-black/40 border-white/10 text-white h-12">
                                    <SelectValue placeholder="Select media type" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                    <SelectItem value="video" className="focus:bg-[#CC2224] focus:text-white">
                                        <div className="flex items-center gap-2">
                                            <Film className="w-4 h-4" />
                                            <span>Video</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="image" className="focus:bg-[#CC2224] focus:text-white">
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" />
                                            <span>Image</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/60">
                                Media File {editingId && '(Upload to replace)'}
                            </Label>
                            <div className={`relative group border-2 border-dashed rounded-xl transition-all h-[160px] flex items-center justify-center ${file ? 'border-[#CC2224]/50 bg-[#CC2224]/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={mediaType === 'video' ? "video/*" : "image/*"}
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="p-4 flex flex-col items-center text-center">
                                    {file ? (
                                        <>
                                            <FileUp className="w-8 h-8 text-[#CC2224] mb-2" />
                                            <p className="text-sm font-medium text-white truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-xs text-white/40 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-white/5 rounded-full mb-3">
                                                {mediaType === 'video' ? <Film className="w-6 h-6 text-white/30" /> : <ImageIcon className="w-6 h-6 text-white/30" />}
                                            </div>
                                            <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors font-medium">
                                                Click or drag {mediaType} file here
                                            </p>
                                            {mediaUrl && (
                                                <p className="text-[10px] text-[#CC2224] mt-2 font-bold uppercase tracking-wider">
                                                    Current Media Loaded
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 flex gap-4">
                    <Button
                        disabled={!canSave || busy}
                        onClick={handleSave}
                        className="flex-1 md:flex-none bg-[#CC2224] hover:bg-[#b01c1e] text-white font-bold h-12 px-10 rounded-xl shadow-lg shadow-[#CC2224]/20 transition-all active:scale-95"
                    >
                        {busy ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            editingId ? 'Update Location' : 'Publish Location'
                        )}
                    </Button>

                    {editingId && (
                        <Button
                            variant="outline"
                            onClick={resetForm}
                            className="bg-white/5 hover:bg-white/10 text-white/80 border-transparent hover:text-white h-12 px-8 rounded-xl transition-all"
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white/90 flex items-center gap-2">
                    Published Locations
                    <span className="text-sm font-medium text-white/30 bg-white/5 px-2 py-0.5 rounded-md">{locations.length}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {locations.map((loc) => (
                        <div key={loc.id} className="group rounded-2xl border border-white/10 bg-[#111] overflow-hidden hover:border-[#CC2224]/30 transition-all">
                            <div className="relative aspect-video bg-black overflow-hidden">
                                {loc.mediaType === 'video' ? (
                                    <video src={loc.mediaUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <img src={loc.mediaUrl} alt={loc.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                )}
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <button
                                        onClick={() => startEdit(loc)}
                                        className="p-2 rounded-lg bg-black/60 backdrop-blur-md text-white/70 hover:text-white hover:bg-[#CC2224] transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(loc)}
                                        className="p-2 rounded-lg bg-black/60 backdrop-blur-md text-white/70 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                {!loc.active && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white/60 border border-white/10 italic">
                                            Inactive
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-white text-lg truncate pr-2">{loc.title}</h4>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter">Order: {loc.order}</span>
                                </div>
                                <p className="text-sm text-white/40 line-clamp-2 min-h-[40px] mb-4">
                                    {loc.description}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        {loc.mediaType === 'video' ? <Film className="w-3 h-3 text-white/20" /> : <ImageIcon className="w-3 h-3 text-white/20" />}
                                        <span className="text-[10px] font-bold text-white/20 uppercase">{loc.mediaType}</span>
                                    </div>
                                    <span className="text-[10px] text-white/20 font-medium">
                                        {loc.$updatedAt ? new Date(loc.$updatedAt).toLocaleDateString() : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {locations.length === 0 && (
                        <div className="col-span-full py-20 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center">
                            <div className="p-5 bg-white/5 rounded-full mb-4">
                                <MapPin className="w-10 h-10 text-white/20" />
                            </div>
                            <h4 className="text-white font-bold">No locations found</h4>
                            <p className="text-white/40 text-sm mt-1">Start by adding your first "Spotted in the Wild" location above.</p>
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog(prev => ({ ...prev, isOpen: false }))}>
                <AlertDialogContent className="bg-[#111] border-white/10 text-white rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Delete Location?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                            This will permanently remove <span className="font-bold text-white">"{deleteDialog.location?.title}"</span> from the homepage. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-3">
                        <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl transition-all">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white border-none rounded-xl transition-all">Delete Forever</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
