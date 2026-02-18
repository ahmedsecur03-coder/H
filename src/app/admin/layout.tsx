
'use client';

import Link from 'next/link';
import { Bell, Shield, Loader2 } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubTrigger,
  SidebarMenuSubContent,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { adminNavItems } from '@/lib/placeholder-data';
import Logo from '@/components/logo';
import { UserNav } from '@/app/dashboard/_components/user-nav';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter, usePathname, redirect } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { doc, collectionGroup, query, getDocs } from 'firebase/firestore';
import type { User, NestedNavItem } from '@/lib/types';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';


function AdminNotifications() {
    const firestore = useFirestore();
    const [counts, setCounts] = useState({ deposits: 0, withdrawals: 0, tickets: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firestore) return;
        
        const fetchCounts = async () => {
            setIsLoading(true);
            try {
                const depositsQuery = query(collectionGroup(firestore, 'deposits'));
                const withdrawalsQuery = query(collectionGroup(firestore, 'withdrawals'));
                const ticketsQuery = query(collectionGroup(firestore, 'tickets'));
                
                const [depositsSnap, withdrawalsSnap, ticketsSnap] = await Promise.all([
                    getDocs(depositsQuery),
                    getDocs(withdrawalsQuery),
                    getDocs(ticketsQuery),
                ]);

                const pendingDeposits = depositsSnap.docs.filter(doc => doc.data().status === 'معلق').length;
                const pendingWithdrawals = withdrawalsSnap.docs.filter(doc => doc.data().status === 'معلق').length;
                const openTickets = ticketsSnap.docs.filter(doc => doc.data().status !== 'مغلقة').length;

                setCounts({
                    deposits: pendingDeposits,
                    withdrawals: pendingWithdrawals,
                    tickets: openTickets,
                });
            } catch (error) {
                console.error("Failed to fetch admin counts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCounts();
        const interval = setInterval(fetchCounts, 60000);
        return () => clearInterval(interval);
    }, [firestore]);
    
    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

    const notificationItems = [
        { key: 'deposits', count: counts.deposits, label: 'إيداعات معلقة', href: '/admin/deposits' },
        { key: 'withdrawals', count: counts.withdrawals, label: 'سحوبات معلقة', href: '/admin/withdrawals' },
        { key: 'tickets', count: counts.tickets, label: 'تذاكر نشطة', href: '/dashboard/support' },
    ].filter(item => item.count > 0);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {totalCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive flex items-center justify-center text-xs text-destructive-foreground font-bold">
                            {totalCount}
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>طلبات الإدارة</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoading ? (
                    <div className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>
                ) : notificationItems.length > 0 ? (
                    notificationItems.map(item => (
                        <DropdownMenuItem key={item.key} asChild>
                            <Link href={item.href} className="flex justify-between items-center cursor-pointer">
                                <span>{item.label}</span>
                                <span className="font-bold text-primary">{item.count}</span>
                            </Link>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">لا توجد طلبات معلقة.</div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function AdminHeader({ userData }: { userData: User }) {
  const adminUser = {
    name: userData.name || "Admin",
    email: userData.email || "admin@example.com",
    avatarUrl: userData.avatarUrl || `https://i.pravatar.cc/150?u=${userData.id}`,
    id: userData.id || 'N/A'
  };

  return (
     <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="md:hidden">
            <SidebarTrigger />
        </div>
        <div className="ms-auto flex items-center gap-2">
            <ThemeToggle />
            <AdminNotifications />
            <UserNav user={adminUser} isAdmin={true} />
        </div>
    </header>
  );
}


function AdminNavItems() {
    const pathname = usePathname();

    const renderNavItem = (item: NestedNavItem, index: number) => {
        const Icon = item.icon;

        if (item.children) {
            return (
                 <SidebarMenuSub key={`${item.label}-${index}`}>
                    <SidebarMenuSubTrigger>
                        <div className='flex items-center gap-2'>
                            {Icon && <Icon className="h-5 w-5" />}
                            <span>{item.label}</span>
                        </div>
                    </SidebarMenuSubTrigger>
                    <SidebarMenuSubContent>
                        {item.children.map((child) => (
                           <SidebarMenuItem key={child.href}>
                            <Link href={child.href || '#'}>
                              <SidebarMenuSubButton asChild isActive={pathname === child.href}>
                                 <span>
                                     {child.icon && <child.icon className="w-5 h-5" />}
                                     <span>{child.label}</span>
                                 </span>
                              </SidebarMenuSubButton>
                            </Link>
                           </SidebarMenuItem>
                        ))}
                    </SidebarMenuSubContent>
                </SidebarMenuSub>
            );
        }

        return (
            <SidebarMenuItem key={item.href}>
                <Link href={item.href || '#'}>
                    <SidebarMenuButton isActive={pathname === item.href}>
                        {Icon && <Icon className="h-5 w-5" />}
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        );
    };

    return <>{adminNavItems.map((item, index) => renderNavItem(item, index))}</>;
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, `users/${user.uid}`) : null), [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<User>(userDocRef);
  
  const isLoading = isUserLoading || isUserDataLoading;
  
  useEffect(() => {
    if (!isLoading && (!user || (userData && userData.role !== 'admin'))) {
      redirect('/auth/login');
    }
  }, [user, isLoading, userData]);


  if (isLoading || !user || !userData || userData.role !== 'admin') {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row">
        <Sidebar side="right" className="hidden md:flex">
            <SidebarHeader>
              <div className="flex h-16 items-center justify-between px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                  <Logo className="group-data-[collapsible=icon]:hidden" />
                  <div className="hidden group-data-[collapsible=icon]:block"><Logo/></div>
              </div>
            </SidebarHeader>
            <SidebarContent>
            <SidebarMenu><AdminNavItems /></SidebarMenu>
            </SidebarContent>
        </Sidebar>
        
        <div className="flex flex-1 flex-col">
            <AdminHeader userData={userData} />
            <main className="flex-1 p-4 sm:px-6 sm:py-6 overflow-auto">
              {children}
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
