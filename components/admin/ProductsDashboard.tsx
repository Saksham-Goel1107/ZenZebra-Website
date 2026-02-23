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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { appwriteConfig, default as client, databases, storage } from '@/lib/appwrite';
import { ID, Query, RealtimeResponseEvent } from 'appwrite';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Edit2,
    FileImage,
    Loader2,
    MoreHorizontal,
    Package,
    Plus,
    Search,
    ShoppingCart,
    Store,
    Trash2,
    X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Separator } from '../ui/separator';

type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string; // Keep for compatibility or main image
    imageUrls?: string[]; // Multiple images
    locationId: string; // Store ID
    inStock: boolean;
    brand?: string;
    highlights?: string;
    specifications?: string;
    detailedDescription?: string;
    $updatedAt?: string;
    $createdAt?: string;
};

type StoreLocation = {
    id: string;
    label: string;
};

const CATEGORIES = [
    'Bags',
    'Beverages',
    'Cosmetics',
    'Fragrances',
    'Snack Corner',
    'Skincare',
    'Teddy',
    'Crochet',
    'Style Studio',
    'Live Menu',
    'Clothing'
];

export default function ProductsDashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [stores, setStores] = useState<StoreLocation[]>([]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [inStock, setInStock] = useState(true);

    // Advanced Details
    const [brand, setBrand] = useState('');
    const [highlights, setHighlights] = useState('');
    const [specifications, setSpecifications] = useState('');
    const [detailedDescription, setDetailedDescription] = useState('');

    // Admin filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');

    const [files, setFiles] = useState<File[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; product: Product | null }>({
        isOpen: false,
        product: null,
    });

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const fetchStores = async () => {
        try {
            const response = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.storesCollectionId,
                [Query.limit(100), Query.orderAsc('label')]
            );
            setStores(response.documents.map((d: any) => ({ id: d.$id, label: d.label })));
        } catch (error) {
            console.error('Error fetching stores:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.productsCollectionId,
                [Query.orderDesc('$createdAt'), Query.limit(100)]
            );
            const list: Product[] = response.documents.map((doc: any) => ({
                id: doc.$id,
                name: doc.name,
                description: doc.description,
                price: doc.price,
                category: doc.category,
                imageUrl: doc.url || doc.imageUrl,
                imageUrls: doc.imageUrls || [],
                locationId: doc.locationId,
                inStock: doc.inStock,
                brand: doc.brand,
                highlights: doc.highlights,
                specifications: doc.specifications,
                detailedDescription: doc.detailedDescription,
                $updatedAt: doc.$updatedAt,
                $createdAt: doc.$createdAt,
            }));
            setProducts(list);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
        fetchProducts();

        const unsubscribe = client.subscribe(
            `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.productsCollectionId}.documents`,
            (response: RealtimeResponseEvent<Product>) => {
                if (
                    response.events.some(
                        (e) => e.includes('.create') || e.includes('.update') || e.includes('.delete')
                    )
                ) {
                    fetchProducts();
                }
            }
        );
        return () => unsubscribe();
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStore = filterStore === 'all' || p.locationId === filterStore;
            const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
            return matchesSearch && matchesStore && matchesCategory;
        });
    }, [products, searchQuery, filterStore, filterCategory]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setPrice('');
        setCategory('');

        setImageUrls([]);
        setInStock(true);
        setFiles([]);
        setEditingId(null);
        setBrand('');
        setHighlights('');
        setSpecifications('');
        setDetailedDescription('');
        setSelectedStoreIds([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadImages = async (): Promise<string[]> => {
        const uploadedUrls: string[] = [];
        for (const f of files) {
            if (!f.type.startsWith('image/')) continue;
            try {
                const uploadedFile = await storage.createFile(appwriteConfig.bucketId, ID.unique(), f);
                const url = storage.getFileView(appwriteConfig.bucketId, uploadedFile.$id);
                if (url) uploadedUrls.push(url.toString());
            } catch (err) {
                console.error('File upload failed child:', err);
                toast.error(`Failed to upload ${f.name}`);
            }
        }
        // Filter out any null/empty strings from existing imageUrls and concat with new ones
        return [...imageUrls.filter(u => u && (u.startsWith('http') || u.startsWith('https'))), ...uploadedUrls];
    };

    const handleSave = async () => {
        if (!name.trim() || selectedStoreIds.length === 0) {
            toast.error('Product Name and at least one Store Location are required.');
            return;
        }
        setBusy(true);
        try {
            const finalImageUrls = await uploadImages();
            const data = {
                name: name.trim(),
                description: description.trim(),
                price: parseFloat(price) || 0,
                category: category.trim(),
                url: finalImageUrls[0] || '', // Attribute in Appwrite is 'url'
                imageUrls: finalImageUrls,
                inStock,
                brand: brand.trim(),
                highlights: highlights.trim(),
                specifications: specifications.trim(),
                detailedDescription: detailedDescription.trim(),
            };

            if (editingId) {
                // 1. Update the original document
                await databases.updateDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.productsCollectionId,
                    editingId,
                    { ...data, locationId: selectedStoreIds[0] }
                );

                // 2. If multiple stores are selected during edit, create for others
                // (Only for those that don't match the primary store being edited)
                const otherStores = selectedStoreIds.slice(1);
                if (otherStores.length > 0) {
                    await Promise.all(otherStores.map(sid =>
                        databases.createDocument(
                            appwriteConfig.databaseId,
                            appwriteConfig.productsCollectionId,
                            ID.unique(),
                            { ...data, locationId: sid }
                        )
                    ));
                }
                toast.success('Product updated and added to selected stores');
            } else {
                // Batch create for each selected store (New Product Flow)
                await Promise.all(selectedStoreIds.map(sid =>
                    databases.createDocument(
                        appwriteConfig.databaseId,
                        appwriteConfig.productsCollectionId,
                        ID.unique(),
                        { ...data, locationId: sid }
                    )
                ));
                toast.success(`Product added to ${selectedStoreIds.length} stores`);
            }
            resetForm();
            await fetchProducts();
        } catch (e: any) {
            console.error(e);
            let msg = e?.message || 'Operation failed';
            if (msg.includes('Unknown attribute')) {
                msg += '. Please ensure attributes (url, imageUrls, brand, highlights, specifications, detailedDescription) are added to your Products collection in Appwrite.';
            }
            toast.error(msg);
        } finally {
            setBusy(false);
        }
    };

    const startEdit = (product: Product) => {
        setEditingId(product.id);
        setName(product.name);
        setDescription(product.description);
        setPrice(product.price.toString());
        setCategory(product.category);
        setSelectedStoreIds([product.locationId]);
        setImageUrls(product.imageUrls || (product.imageUrl ? [product.imageUrl] : []));
        setInStock(product.inStock);
        setBrand(product.brand || '');
        setHighlights(product.highlights || '');
        setSpecifications(product.specifications || '');
        setDetailedDescription(product.detailedDescription || '');
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Scroll to form on mobile
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const confirmDelete = async () => {
        if (!deleteDialog.product) return;
        try {
            await databases.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.productsCollectionId,
                deleteDialog.product.id
            );
            toast.success(`Removed "${deleteDialog.product.name}"`);
            if (editingId === deleteDialog.product.id) resetForm();
            await fetchProducts(); // Refresh list immediately
        } catch (e: any) {
            toast.error('Removal failed');
        } finally {
            setDeleteDialog({ isOpen: false, product: null });
        }
    };

    const canSave = useMemo(() => !!name.trim() && selectedStoreIds.length > 0, [name, selectedStoreIds]);

    const handleBulkStockToggle = async (productName: string, targetStock: boolean) => {
        const matches = products.filter(p => p.name.toLowerCase() === productName.toLowerCase());
        setBusy(true);
        try {
            await Promise.all(matches.map(p =>
                databases.updateDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.productsCollectionId,
                    p.id,
                    { inStock: targetStock }
                )
            ));
            toast.success(`Stock updated for ${productName} across ${matches.length} stores`);
            await fetchProducts();
        } catch (err) {
            toast.error('Failed to update bulk stock');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 md:p-12 space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Product Inventory</h1>
                    <p className="text-muted-foreground mt-2">Manage products across all store locations.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/50 text-xs font-mono text-muted-foreground border border-border">
                    <ShoppingCart className="w-3 h-3" />
                    <span>{products.length} Products Found</span>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">

                {/* Form Section */}
                <div ref={formRef} className="lg:col-span-4 xl:col-span-4 space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-6">
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            {editingId ? <Edit2 className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
                            {editingId ? 'Edit Product' : 'Add New Product'}
                        </h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Product Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Ergonomic Chair"
                                    className="bg-background"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-bold flex justify-between items-center">
                                    Store Presence
                                    <span className="text-[10px] text-muted-foreground font-normal">{selectedStoreIds.length} selected</span>
                                </Label>
                                <div className="border border-border/60 rounded-lg p-3 bg-background/50 max-h-[160px] overflow-y-auto space-y-2.5 custom-scrollbar">
                                    {stores.map((store) => (
                                        <div key={store.id} className="flex items-center space-x-2 group">
                                            <Checkbox
                                                id={`store-${store.id}`}
                                                checked={selectedStoreIds.includes(store.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedStoreIds(p => [...p, store.id]);
                                                    else setSelectedStoreIds(p => p.filter(id => id !== store.id));
                                                }}
                                            />
                                            <label
                                                htmlFor={`store-${store.id}`}
                                                className="text-xs font-medium leading-none cursor-pointer group-hover:text-primary transition-colors"
                                            >
                                                {store.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground">Select multiple stores to create initial stock across locations.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Price</Label>
                                    <Input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="bg-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="w-full bg-background">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Details about this product..."
                                    className="bg-background min-h-[100px] resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Product Images</Label>
                                <div
                                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${files.length > 0 ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-accent'}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => {
                                            const newFiles = Array.from(e.target.files || []);
                                            setFiles(prev => [...prev, ...newFiles]);
                                        }}
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-2 rounded-full bg-background border border-border">
                                            <FileImage className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Click to upload multiple images</p>
                                            <p className="text-xs text-muted-foreground">JPG, PNG, WebP (Max 10MB each)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview / Existing Images */}
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                    {imageUrls.map((url, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-md overflow-hidden border border-border group">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {files.map((f, idx) => (
                                        <div key={`new-${idx}`} className="relative aspect-square rounded-md overflow-hidden border border-border group bg-muted/20">
                                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">New</div>
                                            <button
                                                onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <Checkbox
                                    id="instock"
                                    checked={inStock}
                                    onCheckedChange={(c) => setInStock(c === true)}
                                />
                                <Label htmlFor="instock" className="cursor-pointer">Mark as In Stock</Label>
                            </div>

                            <Separator />

                            <div className="space-y-4 pt-2">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Advanced Product Details</h3>

                                <div className="space-y-2">
                                    <Label>Brand / Manufacturer</Label>
                                    <Input
                                        value={brand}
                                        onChange={(e) => setBrand(e.target.value)}
                                        placeholder="e.g. ZenStyles"
                                        className="bg-background"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Key Highlights (One per line)</Label>
                                    <Textarea
                                        value={highlights}
                                        onChange={(e) => setHighlights(e.target.value)}
                                        placeholder="Premium cotton blend\nHandcrafted details..."
                                        className="bg-background min-h-[80px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Detailed Specifications (Key: Value per line)</Label>
                                    <Textarea
                                        value={specifications}
                                        onChange={(e) => setSpecifications(e.target.value)}
                                        placeholder="Material: Leather\nColor: Onyx Black..."
                                        className="bg-background min-h-[100px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Long Story / Detailed Content</Label>
                                    <Textarea
                                        value={detailedDescription}
                                        onChange={(e) => setDetailedDescription(e.target.value)}
                                        placeholder="The full story behind this piece..."
                                        className="bg-background min-h-[150px]"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    onClick={handleSave}
                                    disabled={!canSave || busy}
                                    className="flex-1"
                                >
                                    {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    {editingId ? 'Save Changes' : 'Add Product'}
                                </Button>
                                {editingId && (
                                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-8 xl:col-span-8 space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-11 bg-card border-border"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={filterStore} onValueChange={setFilterStore}>
                                <SelectTrigger className="w-[150px] bg-card border-border h-11">
                                    <SelectValue placeholder="All Stores" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Stores</SelectItem>
                                    {stores.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="w-[150px] bg-card border-border h-11">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {CATEGORIES.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <div key={i} className="h-32 rounded-xl bg-card border border-border animate-pulse" />
                                ))
                            ) : filteredProducts.length === 0 ? (
                                <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                                    <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p>No products found matching your filters.</p>
                                </div>
                            ) : (
                                filteredProducts.map(product => {
                                    const storeName = stores.find(s => s.id === product.locationId)?.label || 'Unknown Store';
                                    return (
                                        <motion.div
                                            layout
                                            key={product.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="bg-card border border-border rounded-xl p-4 flex gap-4 group hover:border-primary/20 transition-all shadow-sm hover:shadow-md"
                                        >
                                            <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden shrink-0 relative">
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                                        <Package className="w-8 h-8" />
                                                    </div>
                                                )}
                                                {!product.inStock && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Sold Out</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 flex flex-col justify-between overflow-hidden">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-semibold text-foreground truncate max-w-[150px]" title={product.name}>{product.name}</h3>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => startEdit(product)}>
                                                                    <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-red-500 focus:text-red-500"
                                                                    onClick={() => setDeleteDialog({ isOpen: true, product })}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" /> Remove Product
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                        <Store className="w-3 h-3" />
                                                        <span className="truncate max-w-[160px]">{storeName}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                                    <span className="font-bold text-foreground">₹{product.price.toLocaleString()}</span>

                                                    {/* Quick Cross-Store Stock Manager */}
                                                    <div className="flex items-center gap-2">
                                                        {products.filter(p => p.name.toLowerCase() === product.name.toLowerCase()).length > 1 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-2 text-[10px] hover:bg-primary/10 hover:text-primary font-bold uppercase transition-all"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleBulkStockToggle(product.name, !product.inStock);
                                                                }}
                                                                disabled={busy}
                                                            >
                                                                Sync All
                                                            </Button>
                                                        )}
                                                        <span
                                                            className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${product.inStock ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                databases.updateDocument(
                                                                    appwriteConfig.databaseId,
                                                                    appwriteConfig.productsCollectionId,
                                                                    product.id,
                                                                    { inStock: !product.inStock }
                                                                ).then(() => fetchProducts());
                                                            }}
                                                        >
                                                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>

            <AlertDialog open={deleteDialog.isOpen} onOpenChange={(o) => setDeleteDialog(p => ({ ...p, isOpen: o }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Product?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Permanently delete "{deleteDialog.product?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            Delete Product
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
