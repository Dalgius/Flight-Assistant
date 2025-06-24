"use client";

import { useState } from 'react';
import type { PanelType, DialogType } from '@/components/flight-planner/types';
import { ActionBar } from '@/components/flight-planner/action-bar';
import { SidePanel } from '@/components/flight-planner/side-panel';
import { MapView } from '@/components/flight-planner/map-view';
import { OrbitDialog } from '@/components/flight-planner/dialogs/orbit-dialog';
import { SurveyGridDialog } from '@/components/flight-planner/dialogs/survey-grid-dialog';
import { FacadeScanDialog } from '@/components/flight-planner/dialogs/facade-scan-dialog';

export default function FlightPlanner() {
  const [activePanel, setActivePanel] = useState<PanelType | null>(null);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  
  const handlePanelChange = (panel: PanelType) => {
    setActivePanel(currentPanel => (currentPanel === panel ? null : panel));
  };

  const handleOpenDialog = (dialog: DialogType) => {
    setActiveDialog(dialog);
  };
  
  return (
    <div className="flex h-screen w-screen bg-background">
      <ActionBar activePanel={activePanel} onPanelChange={handlePanelChange} />
      <div className="flex flex-1 relative">
        <SidePanel 
          activePanel={activePanel} 
          onClose={() => setActivePanel(null)}
          onOpenDialog={handleOpenDialog}
        />
        <MapView isPanelOpen={!!activePanel} />
      </div>

      <OrbitDialog
        open={activeDialog === 'orbit'}
        onOpenChange={(isOpen) => !isOpen && setActiveDialog(null)}
      />
      <SurveyGridDialog
        open={activeDialog === 'survey'}
        onOpenChange={(isOpen) => !isOpen && setActiveDialog(null)}
      />
      <FacadeScanDialog
        open={activeDialog === 'facade'}
        onOpenChange={(isOpen) => !isOpen && setActiveDialog(null)}
      />
    </div>
  );
}
