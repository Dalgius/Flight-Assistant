
"use client";

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { PanelType, PanelProps } from './types';
import { useTranslation } from '@/hooks/use-translation';

import { SettingsPanel } from './panels/settings-panel';
import { WaypointsPanel } from './panels/waypoints-panel';
import { PoisPanel } from './panels/pois-panel';
import { MissionsPanel } from './panels/missions-panel';
import { TerrainPanel } from './panels/terrain-panel';
import { FilePanel } from './panels/file-panel';
import { StatsPanel } from './panels/stats-panel';

interface SidePanelProps extends PanelProps {
  activePanel: PanelType | null;
  onClose: () => void;
}

const panelConfig = {
  settings: { titleKey: 'flightSettingsTitle', component: SettingsPanel },
  waypoints: { titleKey: 'waypointsTitle', component: WaypointsPanel },
  pois: { titleKey: 'poiTitle', component: PoisPanel },
  missions: { titleKey: 'surveyMissionsTitle', component: MissionsPanel },
  terrain: { titleKey: 'terrainToolsTitle', component: TerrainPanel },
  file: { titleKey: 'fileOpsTitle', component: FilePanel },
  stats: { titleKey: 'statsTitle', component: StatsPanel },
};

export function SidePanel({ activePanel, onClose, ...props }: SidePanelProps) {
  const { t } = useTranslation();
  const PanelComponent = activePanel ? panelConfig[activePanel].component : null;

  return (
    <div
      className={cn(
        'absolute top-0 left-0 h-full w-[400px] bg-[#25282B] z-10 flex flex-col transition-transform duration-300 ease-in-out',
        'border-r border-border shadow-2xl',
        activePanel ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <header className="flex items-center justify-between p-4 bg-[#1F2225] flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-200">
          {activePanel ? t(panelConfig[activePanel].titleKey) : 'Panel'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
          <span className="sr-only">Close panel</span>
        </Button>
      </header>
      <ScrollArea className="flex-1">
        <div className="p-4">
          {PanelComponent && <PanelComponent {...props} />}
        </div>
      </ScrollArea>
    </div>
  );
}
