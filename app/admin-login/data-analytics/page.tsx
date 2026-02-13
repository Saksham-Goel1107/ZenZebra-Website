'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { account, appwriteConfig, databases, storage } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { format } from "date-fns";
import { motion } from 'framer-motion';
import {
    FileSpreadsheet,
    Loader2,
    Package,
    RefreshCcw,
    Search,
    ShoppingCart,
    Skull,
    Upload
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import DetailedReportView from '@/components/DetailedReportView';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AnalyticsChatbot from "@/components/AnalyticsChatbot";

interface AnalysisResult {
    $id: string;
    stockFileName: string;
    salesFileName: string;
    deadStockFileName?: string;
    uploadedBy: string;
    status: 'processing' | 'completed' | 'failed';
    analyzedAt: string;
    processedFileId?: string;
    error?: string;
}

export default function ZenZebraAnalyticsPage() {
    const [analyzing, setAnalyzing] = useState(false);
    const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
    const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisResult[]>([]);
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
    const [analysisData, setAnalysisData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('all');

    // Files
    const [stockFile, setStockFile] = useState<File | null>(null);
    const [salesFile, setSalesFile] = useState<File | null>(null);
    const [deadStockFile, setDeadStockFile] = useState<File | null>(null);

    const ANALYTICS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ANALYTICS_COLLECTION_ID || 'analytics_results';
    const BUCKET_ID = appwriteConfig.bucketId;

    const fetchAnalyses = async () => {
        try {
            setLoading(true);
            const response = await databases.listDocuments(
                appwriteConfig.databaseId,
                ANALYTICS_COLLECTION_ID,
                [Query.orderDesc('analyzedAt'), Query.limit(50)]
            );
            const docs = response.documents as unknown as AnalysisResult[];
            setAnalyses(docs);
            setFilteredAnalyses(docs);

            if (docs.length > 0 && !selectedAnalysis) {
                setSelectedAnalysis(docs[0]);
            }
        } catch (error) {
            console.error('Failed to fetch analyses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const lower = searchTerm.toLowerCase();
        const filtered = analyses.filter(a => {
            const matchesSearch = a.stockFileName.toLowerCase().includes(lower) ||
                (a.deadStockFileName && a.deadStockFileName.toLowerCase().includes(lower)) ||
                a.status.toLowerCase().includes(lower) ||
                new Date(a.analyzedAt).toLocaleString().toLowerCase().includes(lower);

            const matchesStatus = statusFilter === 'all' || a.status === statusFilter;

            const analysisDate = new Date(a.analyzedAt);
            const monthStr = !isNaN(analysisDate.getTime()) ? format(analysisDate, 'yyyy-MM') : 'invalid';
            const matchesMonth = monthFilter === 'all' || monthStr === monthFilter;

            return matchesSearch && matchesStatus && matchesMonth;
        });
        setFilteredAnalyses(filtered);
    }, [searchTerm, statusFilter, monthFilter, analyses]);

    const loadAnalysisData = async (fileId: string) => {
        try {
            const resultUrl = storage.getFileDownload(BUCKET_ID, fileId);
            const response = await fetch(resultUrl);
            if (!response.ok) throw new Error("Failed to fetch analysis file");
            const data = await response.json();
            setAnalysisData(data);
        } catch (error) {
            console.error('Failed to load analysis data:', error);
            if (selectedAnalysis?.status === 'completed') {
                toast.error('Failed to load analysis details');
            }
        }
    };

    useEffect(() => {
        fetchAnalyses();
    }, []);

    useEffect(() => {
        if (selectedAnalysis?.processedFileId && selectedAnalysis.status === 'completed') {
            loadAnalysisData(selectedAnalysis.processedFileId);
        } else {
            setAnalysisData(null);
        }
    }, [selectedAnalysis]);

    const handleUpload = async () => {
        if (!stockFile || !salesFile) {
            toast.error('Stock Report and Sales Report are mandatory!');
            return;
        }

        try {
            setAnalyzing(true);
            setUploadProgress(10);
            const stockFileId = ID.unique();
            const salesFileId = ID.unique();
            let deadStockFileId = null;

            await storage.createFile(BUCKET_ID, stockFileId, stockFile);
            setUploadProgress(40);
            await storage.createFile(BUCKET_ID, salesFileId, salesFile);
            setUploadProgress(70);

            if (deadStockFile) {
                deadStockFileId = ID.unique();
                await storage.createFile(BUCKET_ID, deadStockFileId, deadStockFile);
                setUploadProgress(90);
            }

            const { jwt } = await account.createJWT();
            const response = await fetch('/api/admin/analytics/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Appwrite-JWT': jwt },
                body: JSON.stringify({
                    stockFileId, stockFileName: stockFile.name,
                    salesFileId, salesFileName: salesFile.name,
                    deadStockFileId, deadStockFileName: deadStockFile ? deadStockFile.name : null
                }),
            });

            if (!response.ok) throw new Error(await response.text());

            setUploadProgress(100);
            toast.success('Analysis Started! Please check History shortly.');

            setTimeout(() => {
                fetchAnalyses();
                setStockFile(null); setSalesFile(null); setDeadStockFile(null);
                setAnalyzing(false); setUploadProgress(0);
            }, 2000);

        } catch (error: any) {
            toast.error(error.message || 'Upload failed');
            setAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 p-6 space-y-8 animate-in fade-in">
            {/* Header */}
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">ZenZebra <span className="text-[#CC2224]">Analytics</span></h1>
                    <p className="text-muted-foreground">Advanced Intelligence: Sales, Stock, Customers & Dead Inventory</p>
                </div>
                <Button variant="outline" onClick={fetchAnalyses}><RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Activities</Button>
            </div>

            {/* Upload */}
            <Card className="border-2 border-dashed border-[#CC2224]/30 bg-[#CC2224]/5 print:hidden">
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="font-bold text-sm flex items-center gap-2"><Package className="w-4 h-4 text-[#CC2224]" /> Stock Report *</label>
                        <Input type="file" accept=".xlsx" onChange={(e) => setStockFile(e.target.files?.[0] || null)} disabled={analyzing} />
                        {stockFile && <span className="text-xs text-green-600 font-bold">{stockFile.name}</span>}
                    </div>
                    <div className="space-y-2">
                        <label className="font-bold text-sm flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-[#CC2224]" /> Sales Report *</label>
                        <Input type="file" accept=".xlsx" onChange={(e) => setSalesFile(e.target.files?.[0] || null)} disabled={analyzing} />
                        {salesFile && <span className="text-xs text-green-600 font-bold">{salesFile.name}</span>}
                    </div>
                    <div className="space-y-2">
                        <label className="font-bold text-sm flex items-center gap-2"><Skull className="w-4 h-4" /> Dead Stock (Optional)</label>
                        <Input type="file" accept=".xlsx" onChange={(e) => setDeadStockFile(e.target.files?.[0] || null)} disabled={analyzing} />
                        {deadStockFile && <span className="text-xs text-green-600 font-bold">{deadStockFile.name}</span>}
                    </div>
                    <Button onClick={handleUpload} disabled={analyzing || !stockFile || !salesFile} className="bg-[#CC2224] hover:bg-black text-white font-bold w-full">
                        {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        {analyzing ? `Processing ${uploadProgress}%` : 'Run Deep Analysis'}
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="space-y-4 lg:col-span-1 border-r pr-4 h-screen sticky top-0 overflow-hidden flex flex-col print:hidden">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-[#CC2224]" /> History</h3>
                        <span className="text-xs text-muted-foreground">{filteredAnalyses.length} reports</span>
                    </div>
                    <div className="mb-4 space-y-3 px-1">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search name..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={monthFilter} onValueChange={setMonthFilter}>
                                <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Month" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Months</SelectItem>
                                    {Array.from(new Set(analyses.map(a => {
                                        const d = new Date(a.analyzedAt);
                                        return !isNaN(d.getTime()) ? format(d, 'yyyy-MM') : null;
                                    }).filter(Boolean))).sort().reverse().map((m: any) => (
                                        <SelectItem key={m} value={m}>{format(new Date(m + '-01'), 'MMMM yyyy')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {filteredAnalyses.map(analysis => (
                            <div key={analysis.$id} onClick={() => setSelectedAnalysis(analysis)}
                                className={`p-3 rounded-lg border cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${selectedAnalysis?.$id === analysis.$id ? 'border-[#CC2224] bg-red-50 dark:bg-red-950/20' : 'border-transparent bg-card'}`}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${analysis.status === 'completed' ? 'bg-green-100 text-green-700' : analysis.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{analysis.status}</span>
                                    <span className="text-muted-foreground">{new Date(analysis.analyzedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-xs font-medium truncate">{analysis.stockFileName}</div>
                                {analysis.deadStockFileName && <div className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1"><Skull className="w-3 h-3" /> + Dead Stock</div>}
                            </div>
                        ))}
                        {filteredAnalyses.length === 0 && <div className="text-center text-sm text-muted-foreground py-8">No reports found</div>}
                    </div>
                </div>

                {/* Main Dashboard */}
                <div className="lg:col-span-3">
                    {selectedAnalysis ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={selectedAnalysis.$id}>
                            {(selectedAnalysis.status === 'completed' && analysisData) || selectedAnalysis.status === 'failed' ? (
                                <DetailedReportView data={analysisData} analysis={selectedAnalysis} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[400px]">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">Loading Analysis Data...</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed rounded-xl border-zinc-200 dark:border-zinc-800">
                            {analyzing ? (
                                <div className="text-center space-y-4">
                                    <Loader2 className="w-12 h-12 animate-spin text-[#CC2224] mx-auto" />
                                    <h3 className="text-2xl font-bold">Processing Triple Analysis...</h3>
                                    <p className="text-zinc-500">Parsing Sales, Stock, and Dead Inventory...</p>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <FileSpreadsheet className="w-16 h-16 text-zinc-300 mx-auto" />
                                    <h3 className="text-xl font-bold">Select a Report to View</h3>
                                    <p className="text-zinc-500 max-w-sm mx-auto">Upload new reports or select a past report from the sidebar.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* AI Chatbot - Only show when analysis is selected */}
            {selectedAnalysis && analysisData && (
                <AnalyticsChatbot
                    analysisData={analysisData}
                    analysisMetadata={{
                        stockFileName: selectedAnalysis.stockFileName,
                        salesFileName: selectedAnalysis.salesFileName,
                        deadStockFileName: selectedAnalysis.deadStockFileName,
                        analyzedAt: selectedAnalysis.analyzedAt,
                    }}
                />
            )}
        </div>
    );
}
