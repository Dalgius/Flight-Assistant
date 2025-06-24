"use client";

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { PanelType, DialogType } from './types';

import { SettingsPanel } from './panels/settings-panel';
import { WaypointsPanel } from './panels/waypoints-panel';
import { PoisPanel } from './panels/pois-panel';
import { MissionsPanel } from './panels/missions-panel';
import { TerrainPanel } from './panels/terrain-panel';
import { FilePanel } from './panels/file-panel';
import { StatsPanel } from './panels/stats-panel';

interface SidePanelProps {
  activePanel: PanelType | null;
  onClose: () => void;
  onOpenDialog: (dialog: DialogType) => void;
}

const panelConfig = {
  settings: { title: 'Flight Settings', component: SettingsPanel },
  waypoints: { title: 'Waypoints & Actions', component: WaypointsPanel },
  pois: { title: 'Points of Interest', component: PoisPanel },
  missions: { title: 'Automated Missions', component: MissionsPanel },
  terrain: { title: 'Terrain Tools', component: TerrainPanel },
  file: { title: 'File Operations', component: FilePanel },
  stats: { title: 'Flight Statistics', component: StatsPanel },
};

export function SidePanel({ activePanel, onClose, onOpenDialog }: SidePanelProps) {
  const PanelComponent = activePanel ? panelConfig[activePanel].component : null;

  return (
    <div
      className={cn(
        'absolute top-0 left-0 h-full w-[350px] bg-[#25282B] z-10 flex flex-col transition-transform duration-300 ease-in-out',
        'border-r border-border shadow-2xl',
        activePanel ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <header className="flex items-center justify-between p-4 bg-[#1F2225] flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-200">
          {activePanel ? panelConfig[activePanel].title : 'Panel'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
          <span className="sr-only">Close panel</span>
        </Button>
      </header>
      <ScrollArea className="flex-1">
        <div className="p-4">
          {PanelComponent && <PanelComponent onOpenDialog={onOpenDialog} />}
        </div>
      </ScrollArea>
    </div>
  );
}
