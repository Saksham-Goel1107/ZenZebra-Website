'use client';

import { AdminOnboarding } from '@/components/admin/AdminOnboarding';
import { AppSidebar } from '@/components/app-sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { getSystemSettings } from '@/lib/admin-settings';
import { account, isOwner } from '@/lib/appwrite';
import { ShieldX } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isUserOwner, setIsUserOwner] = useState(false);
  const [ownerOnlyModeActive, setOwnerOnlyModeActive] = useState(false);

  // Check if we're on a page that doesn't require authentication (Login, Reset Password, or MFA Setup)
  const isPublicAdminPage =
    pathname === '/admin-login' ||
    pathname === '/admin-login/reset-password' ||
    pathname === '/admin-login/mfa-setup';

  useEffect(() => {
    // If we're on the login page, we don't need auth check or sidebar
    if (isPublicAdminPage) {
      setReady(true);
      return;
    }

    const init = async () => {
      try {
        const [user, settings] = await Promise.all([
          account.get(),
          getSystemSettings()
        ]);

        const ownerStatus = await isOwner(user.$id);
        setIsUserOwner(ownerStatus);
        setOwnerOnlyModeActive(!!settings.ownerOnlyMode);

        // 1. Security Check: Forced Password Reset
        if (user.prefs?.mustResetPassword) {
          router.replace('/admin-login/reset-password?force=true');
          return;
        }

        // 2. Security Check: MFA Setup Required
        if (user.prefs?.mfaRequired && !user.mfa) {
          router.replace('/admin-login/mfa-setup');
          return;
        }

        // 3. Onboarding Check
        if (!user.prefs?.onboarded || !user.prefs?.termsAccepted) {
          setNeedsOnboarding(true);
        }

        // 4. State Sync
        const match = document.cookie.match(new RegExp('(^| )sidebar_state=([^;]+)'));
        const savedState = match ? match[2] === 'true' : true;
        setSidebarOpen(savedState);
        setReady(true);
      } catch (error) {
        router.replace('/admin-login');
      }
    };
    init();
  }, [isPublicAdminPage, router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#CC2224]"></div>
      </div>
    );
  }

  // Handle Owner Only Mode
  if (ownerOnlyModeActive && !isUserOwner && !isPublicAdminPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(204,34,36,0.08),transparent_70%)]" />
        <div className="max-w-md w-full text-center space-y-8 relative z-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-neutral-900 border border-white/5 shadow-2xl mb-4">
            <ShieldX className="w-12 h-12 text-[#CC2224] animate-pulse" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight">Access <span className="text-[#CC2224]">Restricted</span></h1>
            <p className="text-neutral-400 text-lg leading-relaxed">
              The Super-Admin has enabled <span className="text-white font-bold">Owner Only Mode</span>.
              Your administrative privileges are temporarily suspended.
            </p>
          </div>
          <div className="pt-6">
            <Button
              onClick={async () => {
                await account.deleteSession('current');
                router.replace('/admin-login');
              }}
              className="h-14 px-8 bg-white hover:bg-neutral-200 text-black rounded-2xl font-bold transition-all hover:scale-105"
            >
              Sign Out
            </Button>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 font-bold">
            ZenZebra Security Protocol Alpha-V1
          </p>
        </div>
      </div>
    );
  }

  // Handle Onboarding
  if (needsOnboarding && !isPublicAdminPage) {
    return <AdminOnboarding onComplete={() => setNeedsOnboarding(false)} />;
  }

  // Don't wrap login page in sidebar
  if (isPublicAdminPage) {
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
    if (pathname.includes('/deployments')) return 'Vercel Deployments';
    if (pathname.includes('/secrets')) return 'Doppler Secrets';
    if (pathname.includes('/inquiries')) return 'User Inquiries';
    if (pathname.includes('/locations')) return 'Home Locations';
    if (pathname.includes('/users')) return 'Team Management';
    if (pathname.includes('/dashboard')) return 'Overview';
    return 'Admin';
  };

  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in transition-colors duration-300">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <SidebarProvider defaultOpen={sidebarOpen}>
          <AppSidebar />
          <SidebarInset className="min-w-0 transition-all duration-300 ease-in-out">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 transition-colors">
              <SidebarTrigger className="-ml-1 h-9 w-9 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all shadow-sm" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/admin-login/catalogue-dashboard">Admin</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{getBreadcrumbLabel()}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
    </div>
  );
}
