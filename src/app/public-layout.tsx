
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn, UserPlus, Menu, X } from 'lucide-react';
import Logo from '@/components/logo';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { UserNav } from '@/app/dashboard/_components/user-nav';
import React, { useState, useEffect } from 'react';
import { publicNavItems } from '@/lib/placeholder-data';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { doc, getDoc } from 'firebase/firestore';
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


function Header() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
      const fetchUserData = async () => {
          if (user && firestore) {
              const userDocRef = doc(firestore, 'users', user.uid);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                  setUserData(userDoc.data());
              }
          } else {
            setUserData(null);
          }
      };
      fetchUserData();
  }, [user, firestore]);

   const appUser = user ? {
      name: user.displayName || `User`,
      email: user.email || "Registered User",
      avatarUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
      id: user.uid
  } : null;

  const isAdmin = userData?.role === 'admin';


  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
         <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
               {publicNavItems.map((item) => (
                <NavigationMenuItem key={item.label}>
                  {item.children ? (
                    <>
                      <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                          {item.children.map((component) => (
                             <ListItem key={component.label} href={component.href} title={component.label}>
                               {component.description}
                             </ListItem>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
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
            {isClient && (
              isUserLoading ? (
                  <div className="h-10 w-24 rounded-md bg-muted animate-pulse" />
              ) : user ? (
                  <>
                  <Button asChild>
                      <Link href="/dashboard">لوحة التحكم</Link>
                  </Button>
                  {appUser && <UserNav user={appUser} isAdmin={isAdmin}/>}
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
            )}
          </div>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle><Logo /></SheetTitle>
                  <SheetDescription>قائمة التنقل الرئيسية لمنصة حاجاتي.</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col space-y-4 py-6">
                  {publicNavItems.map(item => (
                     <SheetClose asChild key={item.label}>
                      <Link href={item.href || '#'} className="text-lg font-medium hover:text-primary">{item.label}</Link>
                    </SheetClose>
                  ))}
                </div>
                 <div className="mt-auto pt-6 border-t">
                  {isClient && (
                    isUserLoading ? (
                        <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
                    ) : user ? (
                         <Button asChild className="w-full">
                            <Link href="/dashboard">لوحة التحكم</Link>
                        </Button>
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


export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <div className="flex min-h-screen flex-col font-sans antialiased">
       <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-8">
            {children}
        </div>
      </main>
      <footer className="bg-card/50 border-t border-border z-10">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-4 md:px-6">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} حاجاتي. جميع الحقوق محفوظة.</p>
            <nav className="flex gap-4 sm:gap-6">
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary underline-offset-4">شروط الخدمة</Link>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary underline-offset-4">سياسة الخصوصية</Link>
            </nav>
        </div>
      </footer>
    </div>
  );
}
