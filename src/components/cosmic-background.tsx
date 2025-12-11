
'use client';

import { cn } from "@/lib/utils";

export default function CosmicBackground({ className }: { className?: string }) {
    return (
        <div className={cn("absolute inset-0 h-full w-full bg-background overflow-hidden", className)}>
            {/* Stars Layers */}
            <div id='stars' />
            <div id='stars2' />
            <div id='stars3' />

            {/* Shooting Stars */}
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
        </div>
    )
}
