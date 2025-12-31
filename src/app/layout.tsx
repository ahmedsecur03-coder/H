
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
import React, { useState, useEffect, Suspense } from 'react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { LogIn, UserPlus, Menu, X, ArrowUp, Loader2 } from 'lucide-react';
import Logo from '@/components/logo';
import { UserNav } from '@/app/dashboard/_components/user-nav';
import { publicNavItems } from '@/lib/placeholder-data';
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
import { ChevronDown } from 'lucide-react';
import Script from 'next/script';
import GoogleAnalytics from '@/components/google-analytics';
import { SocialLinks } from '@/components/social-links';


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
               {publicNavItems.map((item, index) => (
                <NavigationMenuItem key={index}>
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
                    {publicNavItems.map((item, index) => renderMobileNavItem(item))}
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
  const whatsappLink = settingsData?.whatsappSupport || "https://wa.me/+201008070666";

  if(!whatsappLink || whatsappLink === "#") return null;

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
                <div className="container mx-auto flex flex-col items-center justify-center gap-4 py-6 px-4 md:px-6">
                    <SocialLinks />
                    <nav className="flex gap-4 sm:gap-6">
                        <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary underline-offset-4">شروط الخدمة</Link>
                        <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary underline-offset-4">سياسة الخصوصية</Link>
                    </nav>
                     <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} حاجاتي. جميع الحقوق محفوظة.</p>
                </div>
            </footer>
            <BackToTopButton />
            <WhatsappSupportButton />
        </div>
    );
}


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const pathname = usePathname();
  const isDashboardArea = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isAuthPage = pathname.startsWith('/auth');
  
  const LayoutComponent = isDashboardArea ? ({children}: {children: React.ReactNode}) => <>{children}</> : PublicLayout;
  const measurementId = "G-4030VT05Y1";
  const siteUrl = "https://hajaty.com";

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <title>منصة حاجاتي | خدمات SMM وزيادة متابعين وإدارة حملات إعلانية</title>
        <meta name="description" content="منصة حاجاتي هي سيرفرك الأول لخدمات التسويق الرقمي. نقدم زيادة متابعين (انستقرام، تيك توك، فيسبوك)، إدارة حملات إعلانية احترافية، وشراء حسابات وكالة لنمو أعمالك." />
        <link rel="canonical" href={siteUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content="منصة حاجاتي | بوابتك لخدمات التسويق الرقمي" />
        <meta property="og:description" content="زيادة متابعين، إدارة حملات إعلانية، شراء حسابات وكالة، وكل ما تحتاجه لنمو أعمالك الرقمية في مكان واحد." />
        <meta property="og:image" content={`${siteUrl}/og-image.png`} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={siteUrl} />
        <meta property="twitter:title" content="منصة حاجاتي | بوابتك لخدمات التسويق الرقمي" />
        <meta property="twitter:description" content="زيادة متابعين، إدارة حملات إعلانية، شراء حسابات وكالة، وكل ما تحتاجه لنمو أعمالك الرقمية في مكان واحد." />
        <meta property="twitter:image" content={`${siteUrl}/og-image.png`} />
        
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3498DB" />
        <link rel="apple-touch-icon" href="/icon-192x192.png"></link>
      </head>
      <body className={cn('font-sans antialiased', fontSans.variable, fontHeadline.variable)}>
        <Suspense>
          <GoogleAnalytics gaId={measurementId} />
        </Suspense>
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
