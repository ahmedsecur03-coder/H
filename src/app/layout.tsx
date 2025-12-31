'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Poppins, PT_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/ui/icons';
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
import { useUser } from '@/firebase';
import DashboardLayout from './dashboard/layout';


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

function PublicHeader() {
  const { user, isUserLoading } = useUser();

  const renderNavItem = (item: NestedNavItem) => {
    if (item.children) {
      return (
        <NavigationMenuItem key={item.label}>
          <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
              {item.children.map((component) => {
                const Icon = component.icon;
                return (
                  <ListItem key={component.label} href={component.href || '#'} title={component.label}>
                    <Icon className="h-5 w-5 text-primary me-3" />
                    {component.description}
                  </ListItem>
                )
              })}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      );
    }
    return (
      <NavigationMenuItem key={item.href}>
        <Link href={item.href || '#'} legacyBehavior passHref>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            {item.label}
          </NavigationMenuLink>
        </Link>
      </NavigationMenuItem>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {publicNavItems.map(item => renderNavItem(item))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            {isUserLoading ? (
              <Button disabled variant="ghost" size="icon"><Loader2 className="h-5 w-5 animate-spin" /></Button>
            ) : user ? (
              <Button asChild><Link href="/dashboard">لوحة التحكم</Link></Button>
            ) : (
              <>
                <Button variant="ghost" asChild><Link href="/auth/login"><LogIn className="me-2" />دخول</Link></Button>
                <Button asChild><Link href="/auth/signup"><UserPlus className="me-2" />حساب جديد</Link></Button>
              </>
            )}
          </div>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu /></Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader className="mb-8"><Logo /></SheetHeader>
                <div className="flex flex-col space-y-3">
                  {publicNavItems.map(item =>
                    item.children ? (
                      <Collapsible key={item.label}>
                        <CollapsibleTrigger className="flex w-full justify-between items-center rounded-md p-2 hover:bg-muted font-medium">
                          {item.label}
                          <ChevronDown />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2 pe-4">
                          {item.children.map(child => (
                            <SheetClose asChild key={child.href}>
                              <Link href={child.href || '#'} className="block rounded-md p-2 hover:bg-muted text-muted-foreground">{child.label}</Link>
                            </SheetClose>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SheetClose asChild key={item.href}>
                        <Link href={item.href || '#'} className="block rounded-md p-2 hover:bg-muted font-medium">{item.label}</Link>
                      </SheetClose>
                    )
                  )}
                  <hr className="my-4" />
                   {isUserLoading ? (
                      <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : user ? (
                      <SheetClose asChild>
                         <Button asChild><Link href="/dashboard">لوحة التحكم</Link></Button>
                      </SheetClose>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        <SheetClose asChild>
                           <Button asChild><Link href="/auth/signup">إنشاء حساب جديد</Link></Button>
                        </SheetClose>
                         <SheetClose asChild>
                           <Button variant="ghost" asChild><Link href="/auth/login">تسجيل الدخول</Link></Button>
                        </SheetClose>
                      </div>
                    )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
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
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"


function PublicFooter() {
    return (
        <footer className="border-t">
            <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                 <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة لمنصة حاجاتي.</p>
                 <SocialLinks />
            </div>
        </footer>
    );
}


function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">
            <PublicHeader />
            <main className="flex-1 container py-8">{children}</main>
            <PublicFooter />
        </div>
    );
}

function LayoutDecider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  
  if (isDashboard) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return <PublicLayout>{children}</PublicLayout>;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const measurementId = "G-4030VT05Y1";
  const siteUrl = "https://hajaty.com";

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <title>منصة حاجاتي | خدمات SMM وزيادة متابعين وإدارة حملات إعلانية</title>
        <meta name="description" content="منصة حاجاتي هي سيرفرك الأول لخدمات التسويق الرقمي. نقدم زيادة متابعين (انستقرام، تيك توك، فيسبوك)، إدارة حملات إعلانية احترافية، وشراء حسابات وكالة لنمو أعمالك." />
        <link rel="canonical" href={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content="منصة حاجاتي | بوابتك لخدمات التسويق الرقمي" />
        <meta property="og:description" content="زيادة متابعين، إدارة حملات إعلانية، شراء حسابات وكالة، وكل ما تحتاجه لنمو أعمالك الرقمية في مكان واحد." />
        <meta property="og:image" content={`${siteUrl}/og-image.png`} />
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
            <div className="cosmic-background"></div>
            <LayoutDecider>{children}</LayoutDecider>
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
