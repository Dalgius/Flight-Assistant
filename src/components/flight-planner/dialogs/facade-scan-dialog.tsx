"use client";

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Building2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FacadeScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FacadeScanDialog({ open, onOpenChange }: FacadeScanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Facade Scan</DialogTitle>
          <DialogDescription>
            Draw a line on the map to generate a vertical scanning mission.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
            <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Scan Side</Label>
                <RadioGroup defaultValue="left" className="flex gap-4">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="left" id="sideLeft" />
                    <Label htmlFor="sideLeft">Left of path</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="right" id="sideRight" />
                    <Label htmlFor="sideRight">Right of path</Label>
                </div>
                </RadioGroup>
            </div>

            <div className="space-y-2">
                <Label htmlFor="facadeDistance">Distance from Facade (m)</Label>
                <Input id="facadeDistance" type="number" defaultValue={10} min={5} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="minHeight">Min Height (m)</Label>
                <Input id="minHeight" type="number" defaultValue={5} min={2} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="maxHeight">Max Height (m)</Label>
                <Input id="maxHeight" type="number" defaultValue={20} min={5} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="hOverlap">Horizontal Overlap (%)</Label>
                <Input id="hOverlap" type="number" defaultValue={80} min={10} max={95} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="vOverlap">Vertical Overlap (%)</Label>
                <Input id="vOverlap" type="number" defaultValue={70} min={10} max={95} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="gimbalPitch">Gimbal Pitch (°)</Label>
                <Input id="gimbalPitch" type="number" defaultValue={0} min={-90} max={30} />
            </div>
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button>Start Drawing Line</Button>
          <Button disabled>
            <Building2 className="w-4 h-4 mr-2" />
            Generate Scan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
