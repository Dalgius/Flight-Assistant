
"use client";

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Grid3x3, DraftingCompass } from 'lucide-react';
import type { SurveyGridParams } from '../types';

interface SurveyGridDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  params: SurveyGridParams;
  onParamsChange: (params: SurveyGridParams) => void;
  onDrawArea: () => void;
  onDrawAngle: () => void;
  onCreateGrid: () => void;
}

export function SurveyGridDialog({
  open,
  onOpenChange,
  params,
  onParamsChange,
  onDrawArea,
  onDrawAngle,
  onCreateGrid,
}: SurveyGridDialogProps) {
  
  const handleNumberValueChange = (field: keyof Omit<SurveyGridParams, 'polygon'>, value: string) => {
    onParamsChange({ ...params, [field]: Number(value) });
  };

  const isAreaDefined = params.polygon && params.polygon.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Survey Grid</DialogTitle>
          <DialogDescription>
            {isAreaDefined
              ? `Area defined with ${params.polygon.length} points. Adjust parameters and generate the grid.`
              : 'Set parameters, then start drawing the area on the map.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surveyAltitude">Flight Altitude (m)</Label>
              <Input
                id="surveyAltitude"
                type="number"
                value={params.altitude}
                onChange={(e) => handleNumberValueChange('altitude', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gridAngle">Grid Angle (°)</Label>
              <Input
                id="gridAngle"
                type="number"
                value={params.angle}
                onChange={(e) => handleNumberValueChange('angle', e.target.value)}
              />
              <Button variant="outline" size="sm" className="w-full mt-1" onClick={onDrawAngle}>
                <DraftingCompass className="w-4 h-4 mr-2" />
                Draw Angle
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sidelap">Sidelap (%)</Label>
              <Input
                id="sidelap"
                type="number"
                value={params.sidelap}
                onChange={(e) => handleNumberValueChange('sidelap', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frontlap">Frontlap (%)</Label>
              <Input
                id="frontlap"
                type="number"
                value={params.frontlap}
                onChange={(e) => handleNumberValueChange('frontlap', e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onDrawArea}>
            {isAreaDefined ? 'Redraw Area' : 'Start Drawing Area'}
          </Button>
          <Button disabled={!isAreaDefined} onClick={onCreateGrid}>
            <Grid3x3 className="w-4 h-4 mr-2" />
            Generate Grid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
