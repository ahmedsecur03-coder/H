
'use client';
import PublicFooter from "@/components/public-footer";
import PublicHeader from "@/components/public-header";
import { FirebaseClientProvider } from "@/firebase";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <>
        <PublicHeader />
        <main className="container flex-1 py-8">{children}</main>
        <PublicFooter />
      </>
  );
}
