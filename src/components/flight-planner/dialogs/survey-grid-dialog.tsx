"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Grid3x3 } from 'lucide-react';

interface SurveyGridDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SurveyGridDialog({ open, onOpenChange }: SurveyGridDialogProps) {
  const [isDrawing, setIsDrawing] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Survey Grid</DialogTitle>
          <DialogDescription>
            Define an area on the map to generate a flight grid for 2D/3D mapping.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
                {isDrawing ? "Click on the map to add points to the survey area polygon. Click the first point again to close it." : "Set the survey parameters below, then start drawing the area."}
            </p>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="surveyAltitude">Flight Altitude (m)</Label>
                    <Input id="surveyAltitude" type="number" defaultValue={50} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="gridAngle">Grid Angle (°)</Label>
                    <Input id="gridAngle" type="number" defaultValue={0} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="sidelap">Sidelap (%)</Label>
                    <Input id="sidelap" type="number" defaultValue={70} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="frontlap">Frontlap (%)</Label>
                    <Input id="frontlap" type="number" defaultValue={80} />
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!isDrawing && <Button onClick={() => setIsDrawing(true)}>Start Drawing Area</Button>}
          {isDrawing && <Button onClick={() => setIsDrawing(false)} variant="secondary">Finalize Area</Button>}
          <Button disabled={isDrawing}>
            <Grid3x3 className="w-4 h-4 mr-2" />
            Generate Grid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
