
'use client';

import { cn } from "@/lib/utils";

// This component renders a dynamic cosmic background with multiple layers of stars and shooting stars.
// The styling and animations are handled purely by CSS in globals.css.
export default function CosmicBackground({ className }: { className?: string }) {
    return (
        <div className={cn("absolute inset-0 h-full w-full bg-background overflow-hidden", className)}>
            <div className="stars"></div>
            <div className="stars2"></div>
            <div className="stars3"></div>
        </div>
    )
}
