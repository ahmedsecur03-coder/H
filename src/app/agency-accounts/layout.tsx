'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Poppins, PT_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { ThemeProvider } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/ui/icons';
import { doc, getDoc } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { LogIn, UserPlus, Menu, X, ArrowUp, ChevronDown, Loader2 } from 'lucide-react';
import Logo from '@/components/logo';
import { UserNav } from '@/app/dashboard/_components/user-nav';
import { publicNavItems, dashboardNavItems } from '@/lib/placeholder-data';
import { usePathname, redirect } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetDescription
} from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import type { NestedNavItem, User } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
    SidebarProvider, 
    Sidebar, 
    SidebarHeader, 
    SidebarContent, 
    SidebarMenu, 
    SidebarMenuItem, 
    SidebarMenuButton, 
    SidebarMenuSub,
    SidebarMenuSubContent,
    SidebarMenuSubButton,
    SidebarMenuSubTrigger,
    SidebarFooter
} from '@/components/ui/sidebar';
import { MobileHeader } from '@/app/dashboard/_components/mobile-header';
import { BottomNavBar } from '@/app/dashboard/_components/bottom-nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getRankForSpend, RANKS } from '@/lib/service';
import { Progress } from '@/components/ui/progress';
import { Notifications } from '@/components/notifications';
import { Shield, Wallet, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


const fontSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});

const fontHeadline = Poppins({
  subsets: ['latin'],
  weight: ['800'],
  variable: '--font-headline',
});

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
        <NavigationMenuLink asChild>
            <Link
                href={props.href || ''}
                ref={ref}
                className={cn(
                    "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                    className
                )}
                {...props}
            >
                <div className="text-sm font-medium leading-none">{title}</div>
                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    {children}
                </p>
            </Link>
        </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"

function PublicHeader() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const [userData, setUserData] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
      const fetchUserData = async () => {
          if (user && firestore) {
              const userDocRef = doc(firestore, 'users', user.uid);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                  setUserData(userDoc.data() as User);
              }
          } else {
            setUserData(null);
          }
      };
      if(!isUserLoading){
        fetchUserData();
      }
  }, [user, firestore, isUserLoading]);

   const appUser = user ? {
      name: userData?.name || user.displayName || `User`,
      email: userData?.email || user.email || "Registered User",
      avatarUrl: userData?.avatarUrl || user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
      id: user.uid
  } : null;

  const isAdmin = userData?.role === 'admin';

  const renderMobileNavItem = (item: NestedNavItem, isSubItem = false) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    if (item.children) {
      return (
        <Collapsible key={item.label} className="w-full">
          <CollapsibleTrigger asChild>
             <div className={cn("flex w-full items-center justify-between rounded-md p-2 hover:bg-muted text-lg font-medium", isActive && "bg-muted")}>
                 <div className="flex items-center gap-4">
                     {Icon && <Icon className="h-5 w-5" />}
                    <span>{item.label}</span>
                </div>
                 <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="ps-8 mt-2 space-y-2">
            {item.children.map(child => renderMobileNavItem(child, true))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <SheetClose asChild key={item.href}>
        <Link
          href={item.href || '#'}
          className={cn(
            'flex items-center gap-4 rounded-md p-2',
            isActive ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground',
            isSubItem ? 'text-base' : 'text-lg font-medium'
          )}
        >
          {Icon && <Icon className="h-5 w-5" />}
          {item.label}
        </Link>
      </SheetClose>
    );
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all duration-300",
      scrolled ? "bg-background/80 backdrop-blur-lg border-b border-border" : "bg-transparent"
    )}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
         <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
               {publicNavItems.map((item) => (
                <NavigationMenuItem key={item.label}>
                  {item.children ? (
                    <React.Fragment>
                      <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                          {item.children.map((component) => (
                             <ListItem key={component.label} href={component.href || ''} title={component.label}>
                               {component.description}
                             </ListItem>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </React.Fragment>
                  ) : (
                    <NavigationMenuLink asChild active={pathname === item.href} className={navigationMenuTriggerStyle()}>
                        <Link href={item.href || '#'}>
                            {item.label}
                        </Link>
                    </NavigationMenuLink>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            {isUserLoading ? (
                 <Loader2 className="animate-spin text-primary" />
              ) : user && appUser ? (
                  <>
                  <Button asChild>
                      <Link href="/dashboard">لوحة التحكم</Link>
                  </Button>
                  <UserNav user={appUser} isAdmin={isAdmin}/>
                  </>
              ) : (
                  <>
                  <Button variant="ghost" asChild>
                      <Link href="/auth/login">
                      <LogIn className="me-2" />
                      دخول
                      </Link>
                  </Button>
                  <Button asChild>
                      <Link href="/auth/signup">
                      <UserPlus className="me-2" />
                      ابدأ الآن
                      </Link>
                  </Button>
                  </>
              )
            }
          </div>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle><Logo /></SheetTitle>
                  <SheetDescription>قائمة التنقل الرئيسية لمنصة حاجاتي.</SheetDescription>
                </SheetHeader>
                 <div className="flex flex-col space-y-2 py-6">
                    {publicNavItems.map(item => renderMobileNavItem(item))}
                  </div>
                 <div className="mt-auto pt-6 border-t">
                  {isUserLoading ? (
                        <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
                    ) : user ? (
                         <SheetClose asChild>
                           <Button asChild className="w-full">
                              <Link href="/dashboard">لوحة التحكم</Link>
                          </Button>
                        </SheetClose>
                    ) : (
                      <div className="space-y-2">
                        <SheetClose asChild>
                           <Button asChild className="w-full">
                              <Link href="/auth/signup"><UserPlus className="me-2" />ابدأ الآن</Link>
                          </Button>
                        </SheetClose>
                         <SheetClose asChild>
                          <Button variant="ghost" asChild className="w-full">
                              <Link href="/auth/login"><LogIn className="me-2" />دخول</Link>
                          </Button>
                        </SheetClose>
                      </div>
                    )
                  }
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Button variant="outline" size="icon" className={cn('fixed bottom-20 end-6 z-50 h-12 w-12 rounded-full shadow-lg transition-opacity duration-300', isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none')} onClick={scrollToTop}>
      <ArrowUp className="h-6 w-6" />
      <span className="sr-only">العودة للأعلى</span>
    </Button>
  );
}

function WhatsappSupportButton() {
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const { data: settingsData } = useDoc<any>(settingsDocRef);
  const whatsappLink = settingsData?.whatsappSupport || "#";

  return (
    <Button asChild className="fixed bottom-6 end-6 z-50 h-14 w-14 rounded-full shadow-lg bg-green-500 hover:bg-green-600 text-white hover:scale-110 transition-transform duration-300">
      <Link href={whatsappLink} target="_blank">
        <WhatsAppIcon className="h-7 w-7" />
        <span className="sr-only">تواصل معنا عبر واتساب</span>
      </Link>
    </Button>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicHeader />
            <main className="flex-1">
                <div className="container mx-auto px-4 md:px-6 py-8">
                    {children}
                </div>
            </main>
            <footer className="bg-card/30 border-t border-border z-10">
                <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-4 md:px-6">
                    <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} حاجاتي. جميع الحقوق محفوظة.</p>
                    <nav className="flex gap-4 sm:gap-6">
                        <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary underline-offset-4">شروط الخدمة</Link>
                        <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary underline-offset-4">سياسة الخصوصية</Link>
                    </nav>
                </div>
            </footer>
            <BackToTopButton />
            <WhatsappSupportButton />
        </div>
    );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, `users/${user.uid}`) : null), [firestore, user]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<User>(userDocRef);
    
    useEffect(() => {
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
    
    const appUser = {
      name: userData.name,
      email: userData.email,
      avatarUrl: userData.avatarUrl || `https://i.pravatar.cc/150?u=${userData.id}`,
      id: userData.id,
    };

    function NavItems() {
        const pathname = usePathname();
        const renderNavItem = (item: NestedNavItem) => {
            const Icon = item.icon;
            if (item.children) {
                return (
                    <SidebarMenuSub key={item.label}>
                        <SidebarMenuSubTrigger><div className='flex items-center gap-2'>{Icon && <Icon className="h-4 w-4" />}<span>{item.label}</span></div></SidebarMenuSubTrigger>
                        <SidebarMenuSubContent>{item.children.map((child) => (<SidebarMenuItem key={child.href}><SidebarMenuSubButton href={child.href || '#'} isActive={pathname === child.href}>{child.icon && <child.icon className="w-4 h-4" />}<span>{child.label}</span></SidebarMenuSubButton></SidebarMenuItem>))}</SidebarMenuSubContent>
                    </SidebarMenuSub>
                );
            }
            return (
                <Link href={item.href || '#'} passHref key={item.href}><SidebarMenuButton isActive={pathname === item.href}>{Icon && <Icon className="h-4 w-4" />}<span>{item.label}</span></SidebarMenuButton></Link>
            );
        };
        return (<>{dashboardNavItems.map((item) => <SidebarMenuItem key={item.label}>{renderNavItem(item)}</SidebarMenuItem>)}</>);
    }

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row">
                <Sidebar side="right" collapsible="icon" className="hidden md:flex">
                    <SidebarHeader><div className="flex h-16 items-center justify-between px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"><Logo className="group-data-[collapsible=icon]:hidden" /><div className="hidden group-data-[collapsible=icon]:block"><Logo/></div></div></SidebarHeader>
                    <SidebarContent>
                      <div className="flex flex-col p-2 items-center gap-2 group-data-[collapsible=icon]:hidden">
                        <Avatar className="h-20 w-20 border-2 border-primary"><AvatarImage src={userData.avatarUrl}/><AvatarFallback>{userData.name.charAt(0)}</AvatarFallback></Avatar>
                        <p className="font-semibold">{userData.name}</p>
                        <Badge>{rank.name}</Badge>
                        {nextRank && (
                          <div className="w-full text-center mt-2">
                             <Progress value={progressToNextRank} className="h-1"/>
                             <p className="text-xs text-muted-foreground mt-1">الترقية التالية: {nextRank.name}</p>
                          </div>
                        )}
                      </div>
                      <SidebarMenu><NavItems /></SidebarMenu>
                    </SidebarContent>
                    {isAdmin && (<SidebarFooter><Link href="/admin/dashboard" passHref><SidebarMenuButton><Shield className="h-4 w-4 text-primary" /><span>لوحة تحكم المسؤول</span></SidebarMenuButton></Link></SidebarFooter>)}
                </Sidebar>
                <div className="flex flex-1 flex-col">
                    <header className="sticky top-0 z-10 hidden h-14 items-center justify-end gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:flex">
                        <div className="ms-auto flex items-center gap-4 font-sans">
                             <div className="flex items-center gap-4 border-s ps-4">
                                <div className="flex items-center gap-2"><div className="p-2 bg-muted rounded-md"><DollarSign className="h-4 w-4 text-muted-foreground" /></div><div><div className="text-xs text-muted-foreground">الرصيد الأساسي</div><div className="font-bold font-mono">${(userData.balance ?? 0).toFixed(2)}</div></div></div>
                                 <div className="flex items-center gap-2"><div className="p-2 bg-muted rounded-md"><Wallet className="h-4 w-4 text-muted-foreground" /></div><div><div className="text-xs text-muted-foreground">رصيد الإعلانات</div><div className="font-bold font-mono">${(userData.adBalance ?? 0).toFixed(2)}</div></div></div>
                             </div>
                             <ThemeToggle />
                             <Notifications userData={userData} />
                            <UserNav user={appUser} isAdmin={isAdmin} />
                        </div>
                    </header>
                    <MobileHeader isAdmin={isAdmin} userData={userData} />
                    <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-6 md:mb-0 mb-20">{children}</main>
                    <BottomNavBar />
                </div>
            </div>
        </SidebarProvider>
    );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const pathname = usePathname();
  const isDashboardArea = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isAuthPage = pathname.startsWith('/auth');
  
  const LayoutComponent = isDashboardArea ? DashboardLayout : PublicLayout;

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <title>Hajaty Hub - رحلتك الكونية للخدمات الرقمية</title>
        <meta name="description" content="انطلق في رحلة كونية مع حاجاتي. مركزك المتكامل لخدمات SMM، إدارة الحملات الإعلانية، ونظام إحالة فريد لنمو أعمالك بسرعة الصاروخ." />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3498DB" />
        <link rel="apple-touch-icon" href="/icon-192x192.png"></link>
      </head>
      <body className={cn('font-sans antialiased', fontSans.variable, fontHeadline.variable)}>
         <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <FirebaseClientProvider>
            <FirebaseErrorListener />
             <div className="cosmic-background"></div>
             {isAuthPage ? children : <LayoutComponent>{children}</LayoutComponent>}
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}