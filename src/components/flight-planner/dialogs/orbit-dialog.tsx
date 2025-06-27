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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Orbit, Radius } from 'lucide-react';

interface OrbitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrbitDialog({ open, onOpenChange }: OrbitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Orbit Mission</DialogTitle>
          <DialogDescription>
            Generate a circular flight path around a point of interest.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="orbitPoi">Center POI</Label>
            <Select>
              <SelectTrigger id="orbitPoi">
                <SelectValue placeholder="Select a POI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Duomo di Milano</SelectItem>
                <SelectItem value="2">Castello Sforzesco</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orbitRadius">Radius (meters)</Label>
            <div className="flex items-center gap-2">
              <Input id="orbitRadius" type="number" defaultValue={30} min={5} />
              <Button variant="outline" size="icon">
                <Radius className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orbitPoints">Number of Waypoints</Label>
            <Input id="orbitPoints" type="number" defaultValue={8} min={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button>
            <Orbit className="w-4 h-4 mr-2" />
            Create Orbit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
