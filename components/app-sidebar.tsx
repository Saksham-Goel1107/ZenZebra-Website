"use client"

import {
    BookOpen,
    Command,
    LogOut,
    MapPin,
    Settings2,
    SquareTerminal,
    User
} from "lucide-react"
import * as React from "react"

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
} from "@/components/ui/sidebar"
import { account } from "@/lib/appwrite"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        try {
            await account.deleteSession('current');
            router.replace('/admin-login');
        } catch (e) {
            console.error(e);
        }
    };

    const navItems = [
        { title: "Dashboard", href: "/admin-login/dashboard", icon: SquareTerminal },
        { title: "Catalogue", href: "/admin-login/catalogue-dashboard", icon: BookOpen },
        { title: "Locations", href: "/admin-login/locations", icon: MapPin },
        { title: "Settings", href: "/admin-login/settings", icon: Settings2 },
    ]

    return (
        <Sidebar collapsible="icon" {...props} className="dark">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin-login/catalogue-dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">ZenZebra</span>
                                    <span className="truncate text-xs text-muted-foreground">Admin Portal</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.title}
                                        isActive={pathname === item.href}
                                    >
                                        <Link href={item.href}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip="Profile"
                            className="cursor-pointer"
                            isActive={pathname === "/admin-login/profile"}
                        >
                            <Link href="/admin-login/profile">
                                <User />
                                <span>Profile</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} tooltip="Log out" className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer">
                            <LogOut />
                            <span>Log out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
