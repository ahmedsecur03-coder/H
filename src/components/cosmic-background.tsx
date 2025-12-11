
'use client';

import { cn } from "@/lib/utils";

// This component renders a dynamic cosmic background with multiple layers of stars and shooting stars.
// The styling and animations are handled purely by CSS in globals.css.
export default function CosmicBackground({ className }: { className?: string }) {
    return (
        <div className={cn("absolute inset-0 h-full w-full bg-background overflow-hidden", className)}>
            <div id="stars"></div>
            <div id="stars2"></div>
            <div id="stars3"></div>
            
             <div className="solar-system">
                <div id="sun"></div>
                <div id="earth-orbit">
                    <div id="earth">
                         <div id="moon-orbit">
                            <div id="moon"></div>
                        </div>
                    </div>
                </div>
                <div id="mars-orbit">
                    <div id="mars"></div>
                </div>
            </div>

            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
        </div>
    )
}
