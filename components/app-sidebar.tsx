'use client';

import {
  Activity,
  BarChart3,
  BookOpen,
  Command,
  Handshake,
  Key,
  LogOut,
  MapPin,
  MessageSquare,
  Monitor,
  Moon,
  Rocket,
  Settings2,
  Shield,
  SquareTerminal,
  Sun,
  User,
} from 'lucide-react';
import * as React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { account, isOwner } from '@/lib/appwrite';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const [isSysOwner, setIsSysOwner] = useState(false);

  useEffect(() => {
    const checkOwner = async () => {
      try {
        const user = await account.get();
        const owner = await isOwner(user.$id);
        setIsSysOwner(owner);
      } catch (e) {
        console.error('Owner check failed:', e);
      }
    };
    checkOwner();
  }, []);

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      router.replace('/admin-login');
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { title: 'Dashboard', href: '/admin-login/dashboard', icon: SquareTerminal },
    { title: 'Traffic Analytics', href: '/admin-login/analytics', icon: Activity },
    { title: 'Data Analytics', href: '/admin-login/data-analytics', icon: BarChart3 },
    { title: 'Catalogue', href: '/admin-login/catalogue-dashboard', icon: BookOpen },
    { title: 'Inquiries', href: '/admin-login/inquiries', icon: MessageSquare },
    { title: 'Partner Requests', href: '/admin-login/partner-requests', icon: Handshake },
    { title: 'Locations', href: '/admin-login/locations', icon: MapPin },
    { title: 'Status', href: 'https://status.zenzebra.in', icon: Monitor },
  ];

  // Admin only sections
  const adminItems = [
    { title: 'Deployments', href: '/admin-login/deployments', icon: Rocket },
    { title: 'Secrets', href: '/admin-login/secrets', icon: Key },
    { title: 'Team Management', href: '/admin-login/users', icon: Shield },
    { title: 'Settings', href: '/admin-login/settings', icon: Settings2 },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#CC2224] text-white shadow-[0_0_15px_rgba(204,34,36,0.3)]">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-black italic uppercase tracking-tighter">
                    ZenZebra
                  </span>
                  <span className="truncate text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Command Center
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase font-bold tracking-widest py-4">
            Standard Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.href}
                    className="transition-all duration-300 hover:bg-[#CC2224]/5"
                  >
                    {item.href.startsWith('http') ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer">
                        <item.icon className={pathname === item.href ? 'text-[#CC2224]' : ''} />
                        <span className={pathname === item.href ? 'font-bold text-foreground' : ''}>
                          {item.title}
                        </span>
                      </a>
                    ) : (
                      <Link href={item.href}>
                        <item.icon className={pathname === item.href ? 'text-[#CC2224]' : ''} />
                        <span className={pathname === item.href ? 'font-bold text-foreground' : ''}>
                          {item.title}
                        </span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSysOwner && (
          <SidebarGroup className="animate-in fade-in slide-in-from-left duration-500">
            <SidebarGroupLabel className="text-[10px] uppercase font-bold tracking-widest py-4 text-[#CC2224]/60">
              Classified Access
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname === item.href}
                      className="transition-all duration-300 hover:bg-[#CC2224]/5"
                    >
                      <Link href={item.href}>
                        <item.icon className={pathname === item.href ? 'text-[#CC2224]' : ''} />
                        <span className={pathname === item.href ? 'font-bold text-foreground' : ''}>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="border-t border-border/50 pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip="Interface Theme">
                  <div className="flex relative items-center justify-center size-4 shrink-0">
                    <Sun className="absolute size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
                    <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#CC2224]" />
                  </div>
                  <span className="truncate">Interface Theme</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-48 bg-card border-border">
                <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                  <Sun className="mr-2 h-4 w-4 text-amber-500" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                  <Moon className="mr-2 h-4 w-4 text-[#CC2224]" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                  <Monitor className="mr-2 h-4 w-4 text-blue-500" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Profile"
              className="cursor-pointer"
              isActive={pathname === '/admin-login/profile'}
            >
              <Link href="/admin-login/profile">
                <User />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Log out"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            >
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
