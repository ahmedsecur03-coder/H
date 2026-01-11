
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  SheetClose,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Menu, ChevronDown, Loader2, LayoutDashboard } from 'lucide-react';
import Logo from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import type { NestedNavItem } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { publicNavItems } from '@/lib/placeholder-data';
import { cn } from '@/lib/utils';
import { useUser } from "@/firebase";

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

function AuthButtons() {
    const { user, isUserLoading } = useUser();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // This hook ensures the component only renders on the client,
        // and after the initial auth state is determined.
        setMounted(!isUserLoading);
    }, [isUserLoading]);

    if (!mounted) {
        return <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />;
    }

    if (user) {
        return <Button asChild><Link href="/dashboard"><LayoutDashboard className="me-2 h-4 w-4" />لوحة التحكم</Link></Button>;
    }

    return (
        <>
            <Button variant="ghost" asChild><Link href="/auth/login"><LogIn className="me-2" />دخول</Link></Button>
            <Button asChild><Link href="/auth/signup"><UserPlus className="me-2" />حساب جديد</Link></Button>
        </>
    );
}

function MobileAuthButtons() {
    const { user, isUserLoading } = useUser();
     const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(!isUserLoading);
    }, [isUserLoading]);
    
    if (!mounted) {
        return <Loader2 className="animate-spin mx-auto text-muted-foreground" />;
    }

    if (user) {
        return (
             <SheetClose asChild>
                <Button asChild className="w-full"><Link href="/dashboard"><LayoutDashboard className="me-2 h-4 w-4" />لوحة التحكم</Link></Button>
            </SheetClose>
        )
    }

    return (
        <>
            <SheetClose asChild>
                <Button asChild className="w-full"><Link href="/auth/signup"><UserPlus className="me-2" />حساب جديد</Link></Button>
            </SheetClose>
            <SheetClose asChild>
                <Button variant="ghost" asChild className="w-full"><Link href="/auth/login"><LogIn className="me-2" />تسجيل الدخول</Link></Button>
            </SheetClose>
        </>
    )

}

function PublicHeader() {
  const renderNavItem = (item: NestedNavItem) => {
    if (item.children) {
      return (
        <NavigationMenuItem key={item.label}>
          <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
              {item.children.map((component) => (
                  <ListItem key={component.label} href={component.href || '#'} title={component.label}>
                    {component.description}
                  </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      );
    }
    return (
      <NavigationMenuItem key={item.href}>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href={item.href || '#'}>
                {item.label}
            </Link>
          </NavigationMenuLink>
      </NavigationMenuItem>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {publicNavItems.map((item) => renderNavItem(item))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
             <AuthButtons />
          </div>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu /></Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader className="mb-8">
                  <SheetTitle className="sr-only">Main Menu</SheetTitle>
                  <Logo />
                </SheetHeader>
                <div className="flex flex-col space-y-3">
                  {publicNavItems.map((item) =>
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
                   <div className="flex flex-col space-y-2">
                     <MobileAuthButtons />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

export default PublicHeader;
