'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { appwriteConfig, databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    Check,
    ChevronRight,
    Heart,
    Navigation,
    Package,
    Share2,
    Store,
    Tag
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────────

type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string;
    imageUrls?: string[];
    locationId: string;
    inStock: boolean;
    brand?: string;
    highlights?: string;
    specifications?: string;
    detailedDescription?: string;
};

type StoreLocation = {
    id: string;
    label: string;
    address: string;
    description?: string;
    imageUrl?: string;       // the 'url' field from Appwrite
};

// One occurrence of this product at a specific store
type StoreEntry = {
    productId: string;
    store: StoreLocation;
    inStock: boolean;
    price: number;
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [storeEntries, setStoreEntries] = useState<StoreEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        const wishlist = JSON.parse(localStorage.getItem('zenzebra_wishlist') || '[]');
        setIsLiked(wishlist.includes(productId));

        const fetchData = async () => {
            try {
                // 1. Main product
                const doc = await databases.getDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.productsCollectionId,
                    productId
                );

                const productData: Product = {
                    id: doc.$id,
                    name: doc.name,
                    description: doc.description,
                    price: doc.price,
                    category: doc.category,
                    imageUrl: doc.imageUrl || doc.url,
                    imageUrls: doc.imageUrls || [],
                    locationId: doc.locationId,
                    inStock: doc.inStock,
                    brand: (doc as any).brand,
                    highlights: (doc as any).highlights,
                    specifications: (doc as any).specifications,
                    detailedDescription: (doc as any).detailedDescription,
                };
                setProduct(productData);

                const validImages = (
                    productData.imageUrls && productData.imageUrls.length > 0
                        ? productData.imageUrls
                        : [productData.imageUrl]
                ).filter(Boolean);
                setSelectedImage(validImages[0] || '');

                // 2. All product docs with the same name (one per store)
                const siblings = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.productsCollectionId,
                    [Query.equal('name', productData.name), Query.limit(20)]
                );

                // 3. Unique location IDs
                const locationIds = Array.from(
                    new Set(siblings.documents.map((d: any) => d.locationId).filter(Boolean))
                );

                // 4. Fetch store docs in parallel — capture all fields
                const storeDocs = await Promise.all(
                    locationIds.map(lid =>
                        databases.getDocument(
                            appwriteConfig.databaseId,
                            appwriteConfig.storesCollectionId,
                            lid
                        ).catch(() => null)
                    )
                );

                const storeMap: Record<string, StoreLocation> = {};
                storeDocs.forEach(s => {
                    if (s) {
                        storeMap[s.$id] = {
                            id: s.$id,
                            label: s.label,
                            address: s.address || '',
                            description: s.description || '',
                            imageUrl: s.url || s.imageUrl || '',   // Appwrite field is 'url'
                        };
                    }
                });

                // 5. Build entries — sort in-stock first
                const entries: StoreEntry[] = siblings.documents
                    .filter((d: any) => d.locationId && storeMap[d.locationId])
                    .map((d: any) => ({
                        productId: d.$id,
                        store: storeMap[d.locationId],
                        inStock: d.inStock,
                        price: d.price,
                    }))
                    .sort((a, b) => (b.inStock ? 1 : 0) - (a.inStock ? 1 : 0));

                setStoreEntries(entries);
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        if (productId) fetchData();
    }, [productId]);

    const handleLike = () => {
        const wishlist = JSON.parse(localStorage.getItem('zenzebra_wishlist') || '[]');
        const newWishlist = isLiked
            ? wishlist.filter((id: string) => id !== productId)
            : [...wishlist, productId];
        localStorage.setItem('zenzebra_wishlist', JSON.stringify(newWishlist));
        setIsLiked(!isLiked);
        toast.success(isLiked ? 'Removed from wishlist' : 'Added to wishlist');
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: product?.name, text: product?.description, url: window.location.href });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied!');
            }
        } catch { /* user cancelled */ }
    };

    // ── Loading / Not found states ─────────────────────────────────────────────

    if (loading) return <ProductLoadingSkeleton />;

    if (!product) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center p-6">
                <Package className="w-14 h-14 text-muted-foreground opacity-20" />
                <h2 className="text-2xl font-semibold text-foreground">Product Not Found</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                    This item may have been removed or the link is incorrect.
                </p>
                <Button onClick={() => router.push('/products')} variant="outline" size="sm" className="mt-2">
                    ← Back to Catalogue
                </Button>
            </div>
        );
    }

    // ── Derived data ───────────────────────────────────────────────────────────

    const allImages = (
        product.imageUrls && product.imageUrls.length > 0
            ? product.imageUrls
            : [product.imageUrl]
    ).filter(Boolean);

    const specRows = product.specifications
        ? product.specifications.split('\n').filter(l => l.includes(':'))
        : [];

    const highlightRows = product.highlights
        ? product.highlights.split('\n').filter(l => l.trim())
        : [];

    const inStockCount = storeEntries.filter(e => e.inStock).length;

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* Navbar spacer */}
            <div className="h-[72px]" />

            {/* Breadcrumb bar */}
            <div className="bg-background/90 backdrop-blur-sm border-b border-border/40">
                <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-2.5 flex items-center justify-between gap-4">
                    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-hidden">
                        <button
                            onClick={() => router.push('/products')}
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Catalogue
                        </button>
                        <ChevronRight className="w-3 h-3 opacity-30 shrink-0" />
                        <span className="opacity-60 shrink-0">{product.category}</span>
                        <ChevronRight className="w-3 h-3 opacity-30 shrink-0" />
                        <span className="text-foreground truncate">{product.name}</span>
                    </nav>
                    <div className="flex items-center gap-1 shrink-0">
                        <button onClick={handleShare} title="Share"
                            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button onClick={handleLike}
                            title={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
                            className={`p-2 rounded-lg transition-colors ${isLiked ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

                    {/* ── Left: Images ── */}
                    <div className="flex gap-3">
                        {allImages.length > 1 && (
                            <div className="flex flex-col gap-2 shrink-0">
                                {allImages.map((url, idx) => (
                                    <button key={idx} onClick={() => setSelectedImage(url)}
                                        className={`w-14 h-14 rounded-lg border overflow-hidden transition-all duration-200 ${selectedImage === url
                                            ? 'border-foreground/60 ring-1 ring-foreground/20'
                                            : 'border-border opacity-40 hover:opacity-75'}`}>
                                        <img src={url} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex-1 bg-[#111111] rounded-2xl overflow-hidden flex items-center justify-center min-h-[360px] md:min-h-[500px] border border-white/5 relative">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={selectedImage}
                                    src={selectedImage}
                                    alt={product.name}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="max-w-full max-h-[460px] object-contain p-8"
                                />
                            </AnimatePresence>
                            {inStockCount === 0 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                                    <span className="text-white/70 text-sm font-medium border border-white/20 px-5 py-2 rounded-full">
                                        Out of Stock Everywhere
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right: Details ── */}
                    <div className="flex flex-col gap-5">

                        {/* Pills */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border/40">
                                {product.category}
                            </span>
                            {product.brand && (
                                <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border/40 flex items-center gap-1">
                                    <Tag className="w-3 h-3" />{product.brand}
                                </span>
                            )}
                        </div>

                        {/* Name + desc */}
                        <div>
                            <h1 className="text-2xl md:text-[1.85rem] font-semibold text-foreground leading-snug">
                                {product.name}
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                        </div>

                        {/* Price */}
                        <div className="border-t border-border/30 pt-5">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">Price</p>
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-lg text-muted-foreground font-medium">₹</span>
                                <span className="text-4xl font-bold text-foreground tracking-tight">
                                    {product.price.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>

                        {/* ── Store Availability (Compact) ── */}
                        <div className="border border-border/30 rounded-xl overflow-hidden bg-card/10">
                            <div className="px-4 py-3 bg-muted/20 border-b border-border/30 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Store className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold text-foreground">Availability</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${inStockCount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                                    {inStockCount > 0 ? `${inStockCount} Stores In Stock` : 'Out of Stock'}
                                </span>
                            </div>

                            <div className="divide-y divide-border/20 max-h-[320px] overflow-y-auto custom-scrollbar">
                                {storeEntries.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                                        No store listings found for this product.
                                    </div>
                                ) : (
                                    storeEntries.map((entry) => (
                                        <div
                                            key={entry.productId}
                                            className={`p-3 flex items-center gap-3 transition-colors ${entry.inStock ? 'hover:bg-muted/10' : 'opacity-50'}`}
                                        >
                                            {/* Store Thumbnail */}
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/40">
                                                {entry.store.imageUrl ? (
                                                    <img src={entry.store.imageUrl} alt={entry.store.label} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                                        <Store className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-medium text-foreground truncate">{entry.store.label}</p>
                                                    <p className="text-xs font-bold text-foreground shrink-0">₹{entry.price.toLocaleString('en-IN')}</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{entry.store.address}</p>
                                                    <span className={`text-[10px] font-medium ${entry.inStock ? 'text-green-500' : 'text-red-400'}`}>
                                                        {entry.inStock ? 'In Stock' : 'Out of Stock'}
                                                    </span>
                                                </div>
                                            </div>

                                            {entry.inStock && (
                                                <button
                                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entry.store.address)}`, '_blank')}
                                                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                                                    title="Get Directions"
                                                >
                                                    <Navigation className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Wishlist CTA */}
                        <Button variant="outline" className="h-11 rounded-xl font-medium w-full" onClick={handleLike}>
                            <Heart className={`w-4 h-4 mr-2 transition-colors ${isLiked ? 'fill-current text-red-500' : ''}`} />
                            {isLiked ? 'Remove from Wishlist' : 'Save to Wishlist'}
                        </Button>
                    </div>
                </div>

                {/* ── Below-fold: Highlights / Specs / Description ── */}
                {(highlightRows.length > 0 || specRows.length > 0 || product.detailedDescription) && (
                    <div className="mt-14 border-t border-border/30 pt-12 space-y-14">

                        {highlightRows.length > 0 && (
                            <section>
                                <h2 className="text-base font-semibold text-foreground mb-5 uppercase tracking-wider">Highlights</h2>
                                <ul className="grid sm:grid-cols-2 gap-3">
                                    {highlightRows.map((line, idx) => (
                                        <motion.li key={idx}
                                            initial={{ opacity: 0, y: 6 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.04 }}
                                            className="flex items-start gap-3 text-sm text-muted-foreground">
                                            <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full border border-border/60 flex items-center justify-center">
                                                <Check className="w-2.5 h-2.5 text-foreground" />
                                            </span>
                                            {line.trim()}
                                        </motion.li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {specRows.length > 0 && (
                            <section>
                                <h2 className="text-base font-semibold text-foreground mb-5 uppercase tracking-wider">Specifications</h2>
                                <div className="rounded-xl border border-border/40 overflow-hidden">
                                    {specRows.map((spec, idx) => {
                                        const colonIdx = spec.indexOf(':');
                                        const key = spec.slice(0, colonIdx).trim();
                                        const val = spec.slice(colonIdx + 1).trim();
                                        return (
                                            <div key={idx} className={`flex items-start gap-4 px-5 py-3.5 text-sm ${idx % 2 === 0 ? 'bg-muted/15' : ''}`}>
                                                <span className="w-36 shrink-0 text-muted-foreground">{key}</span>
                                                <span className="text-foreground">{val}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {product.detailedDescription && (
                            <section>
                                <h2 className="text-base font-semibold text-foreground mb-5 uppercase tracking-wider">About this Product</h2>
                                <p className="text-sm text-muted-foreground leading-loose whitespace-pre-wrap max-w-[680px]">
                                    {product.detailedDescription}
                                </p>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function ProductLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="h-[72px]" />
            <div className="h-12 border-b border-border/40" />
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
                    <div className="space-y-5 pt-2">
                        <Skeleton className="h-5 w-28 rounded-full" />
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="pt-4 space-y-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-10 w-36" />
                        </div>
                        <Skeleton className="h-11 w-full rounded-xl" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                </div>
                <div className="border-t border-border/30 pt-10">
                    <Skeleton className="h-5 w-40 mb-6" />
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
                    </div>
                </div>
            </div>
        </div>
    );
}
