
'use client';
import { FirebaseClientProvider } from "@/firebase";
import React from 'react';
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
} from '@/components/ui/sheet';
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Menu, ChevronDown, Loader2 } from 'lucide-react';
import Logo from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import type { NestedNavItem } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SocialLinks } from "@/components/social-links";
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

function PublicHeader() {
  const { user, isUserLoading } = useUser();

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
      <NavigationMenuItem>
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
            {publicNavItems.map((item) => renderNavItem(item))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            {isUserLoading ? (
              <Loader2 className="animate-spin" />
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
                   <div className="flex flex-col space-y-2">
                    <SheetClose asChild>
                        <Button asChild><Link href="/dashboard">لوحة التحكم</Link></Button>
                    </SheetClose>
                    <SheetClose asChild>
                        <Button variant="ghost" asChild><Link href="/auth/login">تسجيل الدخول</Link></Button>
                    </SheetClose>
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


export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
        <PublicHeader />
        <main className="flex-1 container py-8">{children}</main>
        <PublicFooter />
    </>
  );
}

    