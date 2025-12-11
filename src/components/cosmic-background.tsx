
'use client';

import { cn } from "@/lib/utils";

export default function CosmicBackground({ className }: { className?: string }) {
    return (
        <div className={cn("absolute inset-0 -z-10 h-full w-full bg-background overflow-hidden", className)}>
            <div id='stars' />
            <div id='stars2' />
            <div id='stars3' />
            <div className="absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-background to-transparent"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
             <div className="absolute -bottom-1/2 left-1/2 -z-10 h-[200%] w-[200%] -translate-x-1/2 animate-move-background rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,hsl(var(--primary)/0.15),hsl(var(--background))_40%,hsl(var(--accent)/0.1)_80%,hsl(var(--background)))]"></div>
        </div>
    )
}
