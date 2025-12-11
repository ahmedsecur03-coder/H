
'use client';

import { cn } from "@/lib/utils";

export default function CosmicBackground({ className }: { className?: string }) {
    return (
        <div className={cn("absolute inset-0 h-full w-full bg-background overflow-hidden", className)}>
            {/* Stars Layers */}
            <div id='stars' />
            <div id='stars2' />
            <div id='stars3' />

            {/* Solar System Elements */}
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

            {/* Shooting Stars */}
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
        </div>
    )
}
