
'use client';

import { cn } from "@/lib/utils";

// This component renders a dynamic cosmic background with multiple layers of stars and shooting stars.
// The styling and animations are handled purely by CSS in globals.css.
export default function CosmicBackground({ className }: { className?: string }) {
    return (
        <div className={cn("aurora-background absolute inset-0 h-full w-full bg-background overflow-hidden", className)}>
            {/* These divs generate the star layers using CSS box-shadows. */}
            <div className="stars-small"></div>
            <div className="stars-medium"></div>
            <div className="stars-large"></div>

            {/* These divs create the shooting star animations. */}
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
        </div>
    )
}
