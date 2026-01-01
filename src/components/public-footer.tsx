'use client';
import { SocialLinks } from "@/components/social-links";

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

export default PublicFooter;
