'use client';
import { SocialLinks } from "@/components/social-links";
import Link from "next/link";

function PublicFooter() {
    return (
        <footer className="border-t">
            <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="text-sm text-muted-foreground text-center md:text-right">
                    <p>&copy; {new Date().getFullYear()} جميع الحقوق محفوظة لمنصة حاجاتي.</p>
                     <div className="flex gap-4 justify-center md:justify-start mt-2">
                        <Link href="/terms" className="hover:text-primary">شروط الخدمة</Link>
                        <Link href="/privacy" className="hover:text-primary">سياسة الخصوصية</Link>
                    </div>
                 </div>
                 <SocialLinks />
            </div>
        </footer>
    );
}

export default PublicFooter;
