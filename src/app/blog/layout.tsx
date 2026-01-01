'use client';

import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="container flex-1 py-8">{children}</main>
      <PublicFooter />
    </>
  );
}
