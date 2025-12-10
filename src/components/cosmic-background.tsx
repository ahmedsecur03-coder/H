
'use client';

import { cn } from "@/lib/utils";

export default function CosmicBackground({ className }: { className?: string }) {
    return (
        <div className={cn("absolute inset-0 -z-10 h-full w-full bg-background overflow-hidden", className)}>
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
            <div className="absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-background to-transparent"></div>
            <div className="stars"></div>
             <div className="absolute -bottom-1/2 left-1/2 -z-10 h-[200%] w-[200%] -translate-x-1/2 animate-move-background rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#1e3a8a20,hsl(var(--background))_40%,#7c3aed20_80%,hsl(var(--background)))]"></div>
        </div>
    )
}
