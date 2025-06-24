"use client";

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Satellite, ZoomIn, LocateFixed } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MapViewProps {
  isPanelOpen: boolean;
}

export function MapView({ isPanelOpen }: MapViewProps) {
  return (
    <div className={cn('flex-1 h-full transition-all duration-300 ease-in-out', isPanelOpen ? 'ml-[350px]' : 'ml-0')}>
        <div id="map" className="relative h-full w-full bg-gray-800">
             <Image
                src="https://placehold.co/1200x800.png"
                alt="Map placeholder"
                layout="fill"
                objectFit="cover"
                data-ai-hint="satellite map"
            />
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="secondary" size="icon"><Satellite className="w-5 h-5" /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Satellite View</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="secondary" size="icon"><ZoomIn className="w-5 h-5" /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Fit to Mission</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="secondary" size="icon"><LocateFixed className="w-5 h-5" /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>My Location</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="absolute bottom-4 left-4 z-10 bg-card/80 backdrop-blur-sm p-2 rounded-lg text-xs">
                <p>Lat: 45.4642, Lng: 9.1900</p>
                <p>Altitude: 120m MSL</p>
            </div>
        </div>
    </div>
  );
}
