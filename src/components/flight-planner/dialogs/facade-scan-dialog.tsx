
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
import type { FacadeScanParams } from '../types';

interface FacadeScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  params: FacadeScanParams;
  onParamsChange: (params: FacadeScanParams) => void;
  onDrawLine: () => void;
  onGenerateScan: () => void;
  isLineDrawn: boolean;
}

export function FacadeScanDialog({ 
    open, 
    onOpenChange, 
    params, 
    onParamsChange, 
    onDrawLine, 
    onGenerateScan, 
    isLineDrawn 
}: FacadeScanDialogProps) {

    const handleValueChange = (field: keyof FacadeScanParams, value: string | number) => {
        onParamsChange({ ...params, [field]: value });
    }
    
    const handleNumberValueChange = (field: keyof FacadeScanParams, value: string) => {
        onParamsChange({ ...params, [field]: Number(value) });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
            <DialogHeader>
            <DialogTitle>Create Facade Scan</DialogTitle>
            <DialogDescription>
                {isLineDrawn ? "Line drawn. Adjust parameters and generate." : "Draw a line on the map to generate a vertical scanning mission."}
            </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-6">
                <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Scan Side</Label>
                    <RadioGroup 
                        value={params.side} 
                        onValueChange={(val: 'left' | 'right') => handleValueChange('side', val)} 
                        className="flex gap-4"
                    >
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
                    <Input id="facadeDistance" type="number" value={params.distance} onChange={e => handleNumberValueChange('distance', e.target.value)} min={5} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="minHeight">Min Height (m)</Label>
                    <Input id="minHeight" type="number" value={params.minHeight} onChange={e => handleNumberValueChange('minHeight', e.target.value)} min={2} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="maxHeight">Max Height (m)</Label>
                    <Input id="maxHeight" type="number" value={params.maxHeight} onChange={e => handleNumberValueChange('maxHeight', e.target.value)} min={5} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="hOverlap">Horizontal Overlap (%)</Label>
                    <Input id="hOverlap" type="number" value={params.horizontalOverlap} onChange={e => handleNumberValueChange('horizontalOverlap', e.target.value)} min={10} max={95} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="vOverlap">Vertical Overlap (%)</Label>
                    <Input id="vOverlap" type="number" value={params.verticalOverlap} onChange={e => handleNumberValueChange('verticalOverlap', e.target.value)} min={10} max={95} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="gimbalPitch">Gimbal Pitch (°)</Label>
                    <Input id="gimbalPitch" type="number" value={params.gimbalPitch} onChange={e => handleNumberValueChange('gimbalPitch', e.target.value)} min={-90} max={30} />
                </div>
                </div>
            </ScrollArea>
            <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
            </Button>
            <Button onClick={onDrawLine}>
                {isLineDrawn ? 'Redraw Line' : 'Start Drawing Line'}
            </Button>
            <Button disabled={!isLineDrawn} onClick={onGenerateScan}>
                <Building2 className="w-4 h-4 mr-2" />
                Generate Scan
            </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
}
