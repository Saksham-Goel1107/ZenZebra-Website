'use client';

import DetailedReportView from '@/components/DetailedReportView';
import { Button } from '@/components/ui/button';
import { appwriteConfig, databases, storage } from '@/lib/appwrite';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function DedicatedReportPage() {
    const params = useParams();
    const analysisId = params.analysisId as string;

    const [analysis, setAnalysis] = useState<any>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const ANALYTICS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ANALYTICS_COLLECTION_ID || 'analytics_results';
    const BUCKET_ID = appwriteConfig.bucketId;

    useEffect(() => {
        if (!analysisId) return;

        const loadReport = async () => {
            try {
                setLoading(true);
                // 1. Fetch Analysis Metadata
                const doc = await databases.getDocument(
                    appwriteConfig.databaseId,
                    ANALYTICS_COLLECTION_ID,
                    analysisId
                );
                setAnalysis(doc);

                if (doc.status === 'completed' && doc.processedFileId) {
                    // 2. Fetch JSON Data
                    const resultUrl = storage.getFileDownload(BUCKET_ID, doc.processedFileId);
                    const response = await fetch(resultUrl);
                    if (!response.ok) throw new Error("Failed to fetch analysis file");
                    const jsonData = await response.json();
                    setData(jsonData);
                }
            } catch (error: any) {
                console.error("Failed to load report:", error);
                toast.error("Failed to load report data");
            } finally {
                setLoading(false);
            }
        };

        loadReport();
    }, [analysisId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="w-12 h-12 text-[#CC2224] animate-spin" />
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Report Not Found</h1>
                <Link href="/admin-login/data-analytics">
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 p-6 md:p-12">
            <div className="max-w-[1600px] mx-auto space-y-6">
                <Link href="/admin-login/data-analytics" className="print:hidden">
                    <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-[#CC2224]">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>

                <DetailedReportView
                    data={data}
                    analysis={analysis}
                    showFullScreenLink={false}
                />
            </div>
        </div>
    );
}
