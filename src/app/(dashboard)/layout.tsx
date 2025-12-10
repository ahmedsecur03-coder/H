
"use client";

import Link from 'next/link';
import {
  Bell,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubContent,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { dashboardNavItems } from '@/lib/placeholder-data';
import Logo from '@/components/logo';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserNav } from './_components/user-nav';
import type { NestedNavItem, User as UserType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function Header() {
  const { user } = useUser();
  const firestore = useFirestore();
   const appUser = {
      name: user?.displayName || `مستخدم #${user?.uid.substring(0, 6)}`,
      email: user?.email || "مستخدم مجهول",
      avatarUrl: user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`,
  };
  
   const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData } = useDoc<UserType>(userDocRef);


  return (
    <header className="sticky top-0 z-10 flex h-auto items-start flex-col gap-4 bg-background/80 backdrop-blur-sm px-4 pt-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-6">
      <div className='flex items-center justify-between w-full'>
        <div className='flex items-center gap-4'>
         <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className='text-2xl font-bold text-foreground'>أهلاً بك، {userData?.name || 'Hagaaty'}!</h1>
            <p className='text-muted-foreground'>هنا ملخص سريع لحسابك. انطلق واستكشف خدماتنا.</p>
          </div>
        </div>
       <div className="flex items-center gap-4 ml-auto">
         <UserNav user={appUser} />
       </div>
      </div>
       <div className="grid grid-cols-2 gap-4 ml-auto w-fit">
        <Card className='w-fit border-primary/50 bg-card/50'>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الرصيد الأساسي</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${(userData?.balance ?? 0).toFixed(2)}</div>
            </CardContent>
        </Card>
        <Card className='w-fit border-accent/50 bg-card/50'>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">رصيد الإعلانات</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${(userData?.adBalance ?? 0).toFixed(2)}</div>
            </CardContent>
        </Card>
       </div>
    </header>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
        router.push('/');
    }
  }, [user, isUserLoading, router]);

  // While loading, show a skeleton layout to prevent flashing content.
  if (isUserLoading || !user) {
    return (
        <div className="flex min-h-screen w-full">
            <div className="hidden md:block w-64 bg-muted/40 border-l p-4">
                <div className="flex h-12 items-center justify-center px-4 mb-4">
                     <Logo />
                </div>
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            </div>
            <div className="flex-1">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <Skeleton className="h-8 w-8 md:hidden" />
                    <div className="relative flex-1 md:grow-0">
                       <Skeleton className="h-9 w-full md:w-[200px] lg:w-[320px]" />
                    </div>
                    <div className="flex items-center gap-2 mr-auto">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                   <Skeleton className="w-full h-[80vh]" />
                </main>
            </div>
        </div>
    );
  }

  const renderNavItems = (items: NestedNavItem[]) => {
    return items.map((item) => (
      <SidebarMenuItem key={item.href || item.label}>
        {item.children ? (
          <SidebarMenuSub>
            <SidebarMenuButton
              tooltip={{
                children: item.label,
                className: 'font-body',
                side: 'left',
              }}
              className='justify-between'
            >
              <div className='flex items-center gap-2'>
                {item.icon && <item.icon />}
                <span>{item.label}</span>
              </div>
            </SidebarMenuButton>
            <SidebarMenuSubContent>
              {item.children.map((child) => (
                <SidebarMenuSubButton key={child.href} asChild>
                  <Link href={child.href}>
                    {child.label}
                  </Link>
                </SidebarMenuSubButton>
              ))}
            </SidebarMenuSubContent>
          </SidebarMenuSub>
        ) : (
          <SidebarMenuButton
            asChild
            tooltip={{
              children: item.label,
              className: 'font-body',
              side: 'left',
            }}
          >
            <Link href={item.href || '#'}>
               {item.icon && <item.icon />}
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    ));
  };


  return (
    <SidebarProvider>
      <Sidebar side="right" collapsible="icon">
        <SidebarHeader>
          <div className="flex h-16 items-center justify-between px-4 group-data-[collapsible=icon]:hidden">
             <Logo />
             <Button variant="outline" size="sm" className='bg-card' asChild>
                <Link href="/admin/dashboard">الانتقال للوحة المسؤول</Link>
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {renderNavItems(dashboardNavItems)}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
