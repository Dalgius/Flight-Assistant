"use client";

import {
  SlidersHorizontal,
  MapPin,
  LocateFixed,
  ClipboardList,
  MountainSnow,
  FileText,
  Gauge,
  Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PanelType } from './types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ActionBarProps {
  activePanel: PanelType | null;
  onPanelChange: (panel: PanelType) => void;
}

const actions: { id: PanelType; label: string; icon: React.ElementType }[] = [
  { id: 'settings', label: 'Flight Settings', icon: SlidersHorizontal },
  { id: 'waypoints', label: 'Waypoints', icon: MapPin },
  { id: 'pois', label: 'Points of Interest', icon: LocateFixed },
  { id: 'missions', label: 'Missions', icon: ClipboardList },
  { id: 'terrain', label: 'Terrain Tools', icon: MountainSnow },
  { id: 'file', label: 'File Operations', icon: FileText },
  { id: 'stats', label: 'Flight Statistics', icon: Gauge },
];

export function ActionBar({ activePanel, onPanelChange }: ActionBarProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="w-[55px] h-full bg-[#1F2225] border-r border-border flex flex-col justify-between items-center py-2.5 z-20">
        <div className="flex flex-col gap-2.5">
          {actions.map((action) => (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`w-10 h-10 rounded-lg transition-colors duration-200 ${
                    activePanel === action.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-400 hover:bg-secondary hover:text-white'
                  }`}
                  onClick={() => onPanelChange(action.id)}
                  aria-label={action.label}
                >
                  <action.icon className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="px-2 w-full">
           <Select defaultValue="en">
              <SelectTrigger className="h-9 border-0 bg-secondary focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder={<Languages className="w-5 h-5" />} />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>
    </TooltipProvider>
  );
}
