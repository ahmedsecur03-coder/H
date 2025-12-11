
"use client";

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn, UserPlus } from 'lucide-react';
import Logo from '@/components/logo';
import { useUser } from '@/firebase';
import { UserNav } from './(dashboard)/_components/user-nav';
import React from 'react';
import CosmicBackground from '@/components/cosmic-background';

function Header() {
  const { user, isUserLoading } = useUser();

   const appUser = user ? {
      name: user.displayName || `مستخدم`,
      email: user.email || "مستخدم مسجل",
      avatarUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
      id: user.uid
  } : null;

  const adminEmails = ['hagaaty@gmail.com', 'admin@gmail.com'];
  const isAdmin = user ? adminEmails.includes(user.email || '') : false;


  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
            <Link href="/services" className="text-sm font-medium hover:text-primary transition-colors">الخدمات</Link>
            <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">المدونة</Link>
            <Link href="/agency-accounts" className="text-sm font-medium hover:text-primary transition-colors">حسابات وكالة</Link>
        </nav>
        <div className="flex items-center gap-4">
          {isUserLoading ? (
            <div className="h-10 w-24 bg-muted rounded-md animate-pulse" />
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
                <Link href="/login">
                  <LogIn className="ml-2" />
                  تسجيل الدخول
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup">
                  <UserPlus className="ml-2" />
                  ابدأ الآن
                </Link>
              </Button>
            </>
          )}
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
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-8">
            {children}
        </div>
      </main>
      <footer className="bg-card border-t border-border">
        <div className="container mx-auto py-6 px-4 md:px-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">&copy; 2024 حاجاتي. جميع الحقوق محفوظة.</p>
            <nav className="flex gap-4 sm:gap-6">
                <Link href="#" className="text-sm hover:text-primary underline-offset-4">شروط الخدمة</Link>
                <Link href="#" className="text-sm hover:text-primary underline-offset-4">سياسة الخصوصية</Link>
            </nav>
        </div>
      </footer>
    </div>
  );
}
