'use client';

import { appwriteConfig, databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Check,
    ChevronDown,
    Heart,
    MapPin,
    Package,
    Search,
    Store
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

// --- Types ---

type StoreType = {
    id: string;
    label: string;
    address: string;
    imageUrl?: string;
    description?: string;
    active: boolean;
};

type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string;
    inStock: boolean;
    locationId: string;
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
    'Clothing',
];

// --- Main Component ---

export default function ProductFinder() {
    // Data State
    const [stores, setStores] = useState<StoreType[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Loading State
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);

    // Modal State
    const [showStoreDetails, setShowStoreDetails] = useState<StoreType | null>(null);
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [showWishlistOnly, setShowWishlistOnly] = useState(false);

    // --- Data Fetching ---

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.storesCollectionId,
                    [Query.equal('active', true), Query.orderAsc('label')]
                );
                const list: StoreType[] = response.documents.map((doc: any) => ({
                    id: doc.$id,
                    label: doc.label,
                    address: doc.address,
                    description: doc.description,
                    imageUrl: doc.url,
                    active: doc.active,
                }));
                setStores(list);
            } catch (error) {
                console.error('Failed to fetch stores:', error);
            } finally {
                setLoadingInitial(false);
            }
        };
        fetchStores();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoadingProducts(true);
            try {
                const queries = [
                    Query.orderDesc('inStock'),
                    Query.orderAsc('name'),
                    Query.limit(200),
                ];

                if (selectedStore) {
                    queries.push(Query.equal('locationId', selectedStore.id));
                }

                const response = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.productsCollectionId,
                    queries
                );
                const list: Product[] = response.documents.map((doc: any) => ({
                    id: doc.$id,
                    name: doc.name,
                    description: doc.description,
                    price: doc.price,
                    category: doc.category,
                    imageUrl: doc.url || doc.imageUrl,
                    inStock: doc.inStock,
                    locationId: doc.locationId,
                }));
                setProducts(list);

                // Load Wishlist
                const savedWishlist = JSON.parse(localStorage.getItem('zenzebra_wishlist') || '[]');
                setWishlist(savedWishlist);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchProducts();
    }, [selectedStore]);

    // --- Filtering Logic ---

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch =
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory =
                selectedCategories.length === 0 || selectedCategories.includes(product.category);

            const matchesWishlist = !showWishlistOnly || wishlist.includes(product.id);

            return matchesSearch && matchesCategory && matchesWishlist;
        });
    }, [products, searchQuery, selectedCategories, showWishlistOnly, wishlist]);

    const toggleCategory = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
        );
    };

    // --- Grouping Logic (Unique by Name) ---

    const groupedProducts = useMemo(() => {
        const groups: Record<string, (Product & { wishlisted?: boolean; allIds?: string[]; storeCount?: number; isGrouped?: boolean })[]> = {};

        filteredProducts.forEach(p => {
            const key = p.name.toLowerCase().trim();
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });

        return Object.values(groups).map(items => {
            const representative = items.find(i => i.inStock) || items[0];
            const allIds = items.map(i => i.id);
            const isInWishlist = allIds.some(id => wishlist.includes(id));
            const anyInStock = items.some(i => i.inStock);

            return {
                ...representative,
                allIds,
                storeCount: items.length,
                isGrouped: items.length > 1,
                inStock: anyInStock,
                wishlisted: isInWishlist
            };
        });
    }, [filteredProducts, wishlist]);

    const toggleWishlist = (e: React.MouseEvent, ids: string[]) => {
        e.preventDefault();
        e.stopPropagation();

        const currentlySaved = ids.some(id => wishlist.includes(id));
        let newWishlist: string[];

        if (currentlySaved) {
            newWishlist = wishlist.filter(id => !ids.includes(id));
        } else {
            newWishlist = [...wishlist, ids[0]];
        }

        setWishlist(newWishlist);
        localStorage.setItem('zenzebra_wishlist', JSON.stringify(newWishlist));
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pb-24 selection:bg-primary/10">

            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[-10%] w-[30vw] h-[30vw] bg-brand-blue/5 rounded-full blur-[100px]" />
            </div>

            {/* Navbar Spacer — matches fixed navbar height (~72px) */}
            <div className="h-[72px]" />

            <main className="container mx-auto px-4 md:px-6 max-w-[1400px] relative z-10 space-y-8">

                {/* Header Section */}
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                                {showWishlistOnly ? 'My Wishlist' : 'Collection'}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {groupedProducts.length} {showWishlistOnly ? 'saved unique items' : 'unique products'}
                                {showWishlistOnly && wishlist.length === 0 && ' — save items by tapping ♥'}
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-[340px] group/search">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setShowWishlistOnly(false); }}
                                    className="pl-12 h-11 bg-white/40 dark:bg-white/5 backdrop-blur-md border-border/40 hover:border-primary/20 focus:border-primary/40 transition-all rounded-xl text-sm placeholder:text-muted-foreground/50"
                                />
                            </div>

                            {/* Wishlist toggle */}
                            <Button
                                variant={showWishlistOnly ? 'default' : 'outline'}
                                size="sm"
                                className={`h-11 px-4 gap-2 rounded-xl border-border/40 whitespace-nowrap ${showWishlistOnly ? 'bg-red-500/90 text-white border-red-500 hover:bg-red-500' : 'hover:bg-muted/60'}`}
                                onClick={() => { setShowWishlistOnly(p => !p); setSearchQuery(''); setSelectedCategories([]); }}
                            >
                                <Heart className={`w-4 h-4 ${showWishlistOnly ? 'fill-current' : ''}`} />
                                Wishlist
                                {wishlist.length > 0 && (
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${showWishlistOnly ? 'bg-white/20' : 'bg-muted'}`}>
                                        {wishlist.length}
                                    </span>
                                )}
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-11 px-4 gap-2 rounded-xl border-border/40 bg-background/50 backdrop-blur-sm hover:bg-muted/60">
                                        <MapPin className="w-4 h-4 text-primary/80" />
                                        <span className="max-w-[120px] truncate">
                                            {selectedStore ? selectedStore.label : 'All Stores'}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl border-border/60 shadow-lg backdrop-blur-xl bg-background/90">
                                    <DropdownMenuItem onClick={() => setSelectedStore(null)} className="h-9 rounded-lg cursor-pointer">
                                        <span className="font-medium">All Stores</span>
                                        {selectedStore === null && <Check className="w-4 h-4 ml-auto text-primary" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border/50" />
                                    <ScrollArea className="h-[200px]">
                                        {stores.map((store) => (
                                            <DropdownMenuItem
                                                key={store.id}
                                                onClick={() => setSelectedStore(store)}
                                                className="h-9 rounded-lg cursor-pointer"
                                            >
                                                <span>{store.label}</span>
                                                {selectedStore?.id === store.id && <Check className="w-4 h-4 ml-auto text-primary" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </ScrollArea>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-2.5 overflow-x-auto pb-4 no-scrollbar mask-gradient-x -mx-4 px-4 md:mx-0 md:px-0">
                        <Button
                            variant={selectedCategories.length === 0 ? "default" : "ghost"}
                            onClick={() => setSelectedCategories([])}
                            className={`rounded-full h-8 px-4 text-xs font-medium border transition-all ${selectedCategories.length === 0
                                ? 'border-primary'
                                : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                }`}
                        >
                            All
                        </Button>
                        {CATEGORIES.map((cat) => (
                            <Button
                                key={cat}
                                variant={selectedCategories.includes(cat) ? "secondary" : "ghost"}
                                onClick={() => toggleCategory(cat)}
                                className={`rounded-full h-8 px-4 text-xs font-medium border transition-all whitespace-nowrap ${selectedCategories.includes(cat)
                                    ? 'bg-secondary text-foreground border-secondary-foreground/10'
                                    : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                    }`}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="min-h-[50vh]">
                    {loadingProducts ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="flex gap-5 p-4 border border-border/40 rounded-2xl bg-card/40">
                                    <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
                                    <div className="space-y-3 flex-1 py-1">
                                        <Skeleton className="h-5 w-2/3 rounded-lg" />
                                        <Skeleton className="h-4 w-1/3 rounded-lg" />
                                        <Skeleton className="h-8 w-16 rounded-lg mt-auto" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : groupedProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {groupedProducts.map((product) => (
                                    <Link key={product.id} href={`/products/${product.id}`} className="block group">
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            whileHover={{ y: -4, backgroundColor: "rgba(var(--card), 0.8)" }}
                                            className="cursor-pointer bg-card/30 backdrop-blur-sm border border-border/40 rounded-2xl p-4 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 flex items-center gap-5 h-full relative overflow-hidden"
                                        >
                                            {/* Glow Effect */}
                                            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/20 transition-colors duration-700" />

                                            <div className="w-24 h-24 shrink-0 relative bg-white rounded-xl overflow-hidden shadow-sm">
                                                {product.imageUrl ? (
                                                    <img
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        loading="lazy"
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                                        <Package className="w-8 h-8" />
                                                    </div>
                                                )}

                                                {/* Wishlist Button on Card */}
                                                <button
                                                    onClick={(e) => toggleWishlist(e, product.allIds || [product.id])}
                                                    className={`absolute top-1 right-1 p-1.5 rounded-full backdrop-blur-md border border-white/20 transition-all duration-300 z-10 ${product.wishlisted ? 'bg-red-500 text-white shadow-lg' : 'bg-black/20 text-white hover:bg-black/40'}`}
                                                >
                                                    <Heart className={`w-3 h-3 ${product.wishlisted ? 'fill-current' : ''}`} />
                                                </button>
                                            </div>

                                            <div className="flex flex-col justify-between flex-1 h-24 py-0.5">
                                                <div>
                                                    <h3 className="font-semibold text-lg leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                        {product.category}
                                                    </p>
                                                </div>

                                                <div className="flex items-end justify-between">
                                                    <span className="text-lg font-medium tracking-tight text-foreground">
                                                        ₹{product.price.toLocaleString()}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        {product.isGrouped ? (
                                                            <span className="flex items-center gap-1">
                                                                <Store className="w-3 h-3 opacity-60" />
                                                                {product.storeCount} Stores
                                                            </span>
                                                        ) : (
                                                            stores.find(s => s.id === product.locationId)?.label
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border/40 rounded-3xl bg-card/20">
                            <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                                <Search className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-medium mb-1">No products found</h3>
                            <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategories([]);
                                    setSelectedStore(null);
                                }}
                                className="rounded-full px-6"
                            >
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </main>

            {/* Product modal removed in favor of full page view */}

            {/* Premium Store Details Modal (Vertical Layout) */}
            <Dialog open={!!showStoreDetails} onOpenChange={(open) => !open && setShowStoreDetails(null)}>
                <DialogContent className="w-[90vw] max-w-[600px] max-h-[85vh] p-0 bg-background rounded-2xl shadow-2xl gap-0 outline-none border border-border/20 overflow-hidden">

                    <div className="flex flex-col h-full w-full">
                        {/* Store Hero Image (Top) */}
                        <div className="relative w-full h-[250px] bg-slate-100 shrink-0">
                            {showStoreDetails?.imageUrl ? (
                                <img
                                    src={showStoreDetails.imageUrl}
                                    alt={showStoreDetails.label}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                    <Store className="w-16 h-16 text-muted-foreground/30" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <h2 className="text-3xl font-bold text-white tracking-tight">{showStoreDetails?.label}</h2>
                            </div>
                        </div>

                        {/* Store Info (Bottom) */}
                        <div className="p-8 space-y-8 overflow-y-auto">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex text-amber-400 text-lg">
                                        {[1, 2, 3, 4, 5].map(i => <span key={i}>★</span>)}
                                    </div>
                                    <span className="text-sm font-bold text-primary">OFFICIAL PARTNER</span>
                                </div>
                                <div className="px-3 py-1 bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/20">
                                    Verified Location
                                </div>
                            </div>

                            <div className="space-y-6">
                                <section className="space-y-3">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="w-3 h-3 text-primary" /> Delivery & Pickup Address
                                    </h4>
                                    <p className="text-lg text-foreground font-medium leading-relaxed">
                                        {showStoreDetails?.address}
                                    </p>
                                </section>

                                {showStoreDetails?.description && (
                                    <section className="space-y-3">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">About this Breakspot</h4>
                                        <p className="text-base text-foreground/70 leading-relaxed font-light">
                                            {showStoreDetails.description}
                                        </p>
                                    </section>
                                )}
                            </div>

                            <div className="pt-4">
                                <Button
                                    className="w-full h-14 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/10 transition-all"
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showStoreDetails?.address || '')}`, '_blank')}
                                >
                                    Get Instant Directions
                                </Button>
                                <p className="mt-4 text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest opacity-60">
                                    Open during regular business hours
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
