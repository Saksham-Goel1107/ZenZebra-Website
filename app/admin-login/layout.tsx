'use client';

import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { account } from '@/lib/appwrite';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check if we're on the login page exactly
  const isLoginPage = pathname === '/admin-login';

  useEffect(() => {
    // If we're on the login page, we don't need auth check or sidebar
    if (isLoginPage) {
      setReady(true);
      return;
    }

    const init = async () => {
      try {
        await account.get();
        // Check sidebar state from cookie
        const match = document.cookie.match(new RegExp('(^| )sidebar_state=([^;]+)'));
        const savedState = match ? match[2] === 'true' : true;
        setSidebarOpen(savedState);
        setReady(true);
      } catch (error) {
        router.replace('/admin-login');
      }
    };
    init();
  }, [isLoginPage, router]);

  if (!ready) return null;

  // Don't wrap login page in sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Determine breadcrumb based on path
  const isProfile = pathname.includes('/profile');
  const isDashboard = pathname.includes('/catalogue-dashboard');
  const isAnalytics = pathname.includes('/analytics');

  const getBreadcrumbLabel = () => {
    if (isProfile) return 'My Profile';
    if (isDashboard) return 'Catalogue Dashboard';
    if (isAnalytics) return 'Traffic Analytics';
    if (pathname.includes('/locations')) return 'Home Locations';
    if (pathname.includes('/dashboard')) return 'Overview';
    return 'Admin';
  };

  return (
    <div className="dark min-h-screen bg-background text-white">
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1 h-9 w-9 bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 hover:text-white transition-all shadow-sm" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/admin-login/catalogue-dashboard">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {getBreadcrumbLabel()}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
