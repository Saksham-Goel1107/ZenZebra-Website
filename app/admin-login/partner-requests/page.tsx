'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const PartnerRequestsDashboard = dynamic(() => import('@/components/admin/PartnerRequestsDashboard'), {
    ssr: false,
});

export default function PartnerRequestsPage() {
    return (
        <Suspense>
            <PartnerRequestsDashboard />
        </Suspense>
    );
}
