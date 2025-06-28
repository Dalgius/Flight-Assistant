
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
import { useTranslation } from '@/hooks/use-translation';

interface ActionBarProps {
  activePanel: PanelType | null;
  onPanelChange: (panel: PanelType) => void;
}

const actions: { id: PanelType; labelKey: string; icon: React.ElementType }[] = [
  { id: 'settings', labelKey: 'flightSettingsTitle', icon: SlidersHorizontal },
  { id: 'waypoints', labelKey: 'waypointsTitle', icon: MapPin },
  { id: 'pois', labelKey: 'poiTitle', icon: LocateFixed },
  { id: 'missions', labelKey: 'surveyMissionsTitle', icon: ClipboardList },
  { id: 'terrain', labelKey: 'terrainToolsTitle', icon: MountainSnow },
  { id: 'file', labelKey: 'fileOpsTitle', icon: FileText },
  { id: 'stats', labelKey: 'statsTitle', icon: Gauge },
];

export function ActionBar({ activePanel, onPanelChange }: ActionBarProps) {
  const { t, language, setLanguage } = useTranslation();

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
                  aria-label={t(action.labelKey)}
                >
                  <action.icon className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t(action.labelKey)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="px-2 w-full">
           <Select value={language} onValueChange={(val: 'en' | 'it') => setLanguage(val)}>
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
