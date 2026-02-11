'use client';

import { SystemSettings } from '@/lib/admin-settings';
import { usePathname } from 'next/navigation';
import Footer from './Footer';
import Navbar from './Navbar';

interface PublicLayoutProps {
    children: React.ReactNode;
    settings: SystemSettings;
}

export default function PublicLayout({ children, settings }: PublicLayoutProps) {
    const pathname = usePathname();

    // Hide Navbar/Footer on specific pages
    const isMaintenance = pathname === '/maintenance';
    const isAdminDisabled = pathname === '/admin-disabled';
    // Admin Login usually has its own local layout/navbar, but if we assume RootLayout wraps it:
    // The Admin Sidebar is usually separate. If we want to HIDE public navbar in admin:
    const isAdmin = pathname?.startsWith('/admin-login');

    if (isMaintenance || isAdminDisabled || isAdmin) {
        return <>{children}</>;
    }

    return (
        <>
            <Navbar settings={settings} />
            {children}
            <Footer settings={settings} />
        </>
    );
}
