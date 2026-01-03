'use client';

import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubTrigger,
  SidebarMenuSubContent,
  SidebarMenuSubButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { dashboardNavItems } from '@/lib/placeholder-data';
import Logo from '@/components/logo';
import { UserNav } from '@/app/dashboard/_components/user-nav';
import type { NestedNavItem, User, Notification, SystemLog } from '@/lib/types';
import React, {useEffect} from 'react';
import { BottomNavBar } from '@/app/dashboard/_components/bottom-nav';
import { MobileHeader } from '@/app/dashboard/_components/mobile-header';
import { ChevronDown, Shield, Loader2, Wallet, DollarSign } from 'lucide-react';
import { doc, getDoc, setDoc, runTransaction, increment, arrayUnion, collection, addDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRankForSpend, RANKS } from '@/lib/service';
import { redirect, usePathname } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Notifications } from '@/components/notifications';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';

// This component now handles creating the user document if it doesn't exist
// AND increments the daily new user count.
function UserInitializer() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore(); // Get firestore instance via hook

  useEffect(() => {
    if (isUserLoading || !user || !firestore) {
      return;
    }
    
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const checkAndCreateUserDoc = async () => {
        try {
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
             await runTransaction(firestore, async (transaction) => {
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                const dailyStatRef = doc(firestore, 'dailyStats', today);
                
                const newUser: Omit<User, 'id'> = {
                    name: user.displayName || `مستخدم #${user.uid.substring(0,6)}`,
                    email: user.email || 'N/A',
                    avatarUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
                    rank: 'مستكشف نجمي',
                    role: 'user',
                    balance: 0,
                    adBalance: 0,
                    totalSpent: 0,
                    apiKey: `hy_${crypto.randomUUID()}`,
                    referralCode: user.uid.substring(0, 8).toUpperCase(),
                    referrerId: null,
                    createdAt: new Date().toISOString(),
                    affiliateEarnings: 0,
                    referralsCount: 0,
                    affiliateLevel: 'برونزي',
                    notificationPreferences: { newsletter: false, orderUpdates: true },
                    notifications: [{
                        id: `welcome-${Date.now()}`,
                        message: 'مرحباً بك في حاجاتي! نحن سعداء بانضمامك إلى رحلتنا الكونية. انقر هنا للذهاب إلى لوحة التحكم.',
                        type: 'success',
                        read: false,
                        createdAt: new Date().toISOString(),
                        href: '/dashboard'
                    }]
                };

                transaction.set(userDocRef, newUser);
                transaction.set(dailyStatRef, { newUsers: increment(1) }, { merge: true });

                 const logData: Omit<SystemLog, 'id'> = {
                    event: 'user_created',
                    level: 'info',
                    message: `New user signed up: ${user.email}`,
                    timestamp: new Date().toISOString(),
                    metadata: { userId: user.uid, email: user.email },
                };
                // This is not transactional but is acceptable for a non-critical log.
                await addDoc(collection(firestore, 'systemLogs'), logData);

            });
          }
        } catch (error) {
             console.error("UserInitializer transaction failed: ", error);
        }
      };

      checkAndCreateUserDoc();
    
  }, [user, isUserLoading, firestore]);

  return null; // This component does not render anything.
}


function DesktopHeader({ isAdmin, userData }: { isAdmin: boolean, userData: User }) {
  const appUser = {
      name: userData.name,
      email: userData.email,
      avatarUrl: userData.avatarUrl || `https://i.pravatar.cc/150?u=${userData.id}`,
      id: userData.id,
  };

  return (
    <header className="sticky top-0 z-10 hidden h-14 items-center justify-end gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:flex">
        <div className="ms-auto flex items-center gap-4 font-sans">
             <div className="flex items-center gap-4 border-s ps-4">
                <div className="flex items-center gap-2">
                     <div className="p-2 bg-muted rounded-md">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                     </div>
                    <div>
                        <div className="text-xs text-muted-foreground">الرصيد الأساسي</div>
                        <div className="font-bold font-mono">${(userData.balance ?? 0).toFixed(2)}</div>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-md">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </div>
                     <div>
                        <div className="text-xs text-muted-foreground">رصيد الإعلانات</div>
                        <div className="font-bold font-mono">${(userData.adBalance ?? 0).toFixed(2)}</div>
                    </div>
                </div>
             </div>
             <ThemeToggle />
             <Notifications userData={userData} />
            <UserNav user={appUser} isAdmin={isAdmin} />
        </div>
    </header>
  );
}

function NavItems() {
  const pathname = usePathname();

  const renderNavItem = (item: NestedNavItem, idx: number) => {
    const Icon = item.icon;

    if (item.children) {
      return (
        <SidebarMenuSub key={item.label + idx}>
          <SidebarMenuSubTrigger>
            <div className='flex items-center gap-2'>
              {Icon && <Icon className="h-4 w-4" />}
              <span>{item.label}</span>
            </div>
          </SidebarMenuSubTrigger>
          <SidebarMenuSubContent>
            {item.children.map((child, childIdx) => (
               <SidebarMenuItem key={child.href + childIdx}>
                <Link href={child.href || '#'} passHref>
                  <SidebarMenuSubButton isActive={pathname === child.href}>
                      {child.icon && <child.icon className="w-4 h-4" />}
                      <span>{child.label}</span>
                  </SidebarMenuSubButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenuSubContent>
        </SidebarMenuSub>
      );
    }

    return (
        <Link href={item.href || '#'} passHref key={item.href}>
          <SidebarMenuButton isActive={pathname === item.href}>
            {Icon && <Icon className="h-4 w-4" />}
            <span>{item.label}</span>
          </SidebarMenuButton>
        </Link>
    );
  };

  return (
    <>
      {dashboardNavItems.map((item, idx) => <SidebarMenuItem key={item.label + idx}>{renderNavItem(item, idx)}</SidebarMenuItem>)}
    </>
  );
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, `users/${user.uid}`) : null), [firestore, user]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<User>(userDocRef);
    
    React.useEffect(() => {
        if(!isUserLoading && !user) {
            redirect('/auth/login');
        }
    }, [isUserLoading, user]);

    if (isUserLoading || isUserDataLoading || !user || !userData) {
      return (
           <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
      )
    }
  
    const isAdmin = userData.role === 'admin';
    const rank = getRankForSpend(userData.totalSpent);
    const currentRankIndex = RANKS.findIndex(r => r.name === rank.name);
    const nextRank = currentRankIndex < RANKS.length - 1 ? RANKS[currentRankIndex + 1] : null;
    const progressToNextRank = nextRank ? ((userData.totalSpent - rank.spend) / (nextRank.spend - rank.spend)) * 100 : 100;

    return (
        <SidebarProvider>
            <UserInitializer />
            <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row">
                <Sidebar side="right" collapsible="icon" className="hidden md:flex">
                    <SidebarHeader>
                    <div className="flex h-16 items-center justify-between px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                        <Logo className="group-data-[collapsible=icon]:hidden" />
                        <div className="hidden group-data-[collapsible=icon]:block">
                        <Logo/>
                        </div>
                    </div>
                    </SidebarHeader>
                    <SidebarContent>
                      <div className="flex flex-col p-2 items-center gap-2 group-data-[collapsible=icon]:hidden">
                        <Avatar className="h-20 w-20 border-2 border-primary">
                          <AvatarImage src={userData.avatarUrl}/>
                          <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold">{userData.name}</p>
                        <Badge>{rank.name}</Badge>
                        {nextRank && (
                          <div className="w-full text-center mt-2">
                             <Progress value={progressToNextRank} className="h-1"/>
                             <p className="text-xs text-muted-foreground mt-1">أنفق <span className="font-bold text-foreground">${(nextRank.spend - userData.totalSpent).toFixed(2)}</span> للوصول لرتبة {nextRank.name}!</p>
                          </div>
                        )}
                      </div>
                      <SidebarMenu>
                          <NavItems />
                      </SidebarMenu>
                    </SidebarContent>
                    {isAdmin && (
                       <SidebarFooter>
                          <Link href="/admin/dashboard" passHref>
                              <SidebarMenuButton>
                                  <Shield className="h-4 w-4 text-primary" />
                                  <span>لوحة تحكم المسؤول</span>
                              </SidebarMenuButton>
                          </Link>
                      </SidebarFooter>
                    )}
                </Sidebar>
                
                <div className="flex flex-1 flex-col">
                    <MobileHeader isAdmin={isAdmin} userData={userData} />
                    <DesktopHeader isAdmin={isAdmin} userData={userData} />
                    
                    <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-6 md:mb-0 mb-20">
                      {children}
                    </main>
                    
                    <BottomNavBar />
                </div>
            </div>
        </SidebarProvider>
    );
}
