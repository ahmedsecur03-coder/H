
'use client';

import { cn } from "@/lib/utils";
import { PLATFORM_ICONS } from "@/lib/icon-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const socialLinks = [
    { name: "Facebook", href: "https://www.facebook.com/hagaaty.co", icon: PLATFORM_ICONS.Facebook },
    { name: "Instagram", href: "https://www.instagram.com/hagaaty.co", icon: PLATFORM_ICONS.Instagram },
    { name: "Threads", href: "https://www.threads.com/@hagaaty.co", icon: PLATFORM_ICONS.Threads },
    { name: "X (Twitter)", href: "https://x.com/HHagaaty36117", icon: PLATFORM_ICONS["X (Twitter)"] },
    { name: "YouTube", href: "https://www.youtube.com/@hagaatycom", icon: PLATFORM_ICONS.YouTube },
    { name: "Snapchat", href: "https://www.snapchat.com/@hagaaty", icon: PLATFORM_ICONS.Snapchat },
    { name: "Telegram", href: "http://t.me/hagaatycom", icon: PLATFORM_ICONS.Telegram },
    { name: "LinkedIn", href: "https://www.linkedin.com/company/hagaaty", icon: PLATFORM_ICONS.LinkedIn },
    { name: "Quora", href: "https://ar.quora.com/profile/Hagaaty-Hagaaty", icon: PLATFORM_ICONS.Quora },
    { name: "Google Maps", href: "https://maps.app.goo.gl/x1VCsqR4yVBdEafYA", icon: PLATFORM_ICONS.GoogleMaps },
];


export function SocialLinks({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            <TooltipProvider>
                {socialLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Tooltip key={link.name}>
                            <TooltipTrigger asChild>
                                <Button asChild variant="ghost" size="icon">
                                    <Link href={link.href} target="_blank" aria-label={link.name}>
                                        <Icon className="h-5 w-5" />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{link.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </TooltipProvider>
        </div>
    );
}
