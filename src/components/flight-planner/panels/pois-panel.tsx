"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { PanelProps } from '../types';
import { LocateFixed, Orbit, Trash2 } from 'lucide-react';

const mockPois = [
  { id: 1, name: 'Duomo di Milano', height: 108 },
  { id: 2, name: 'Castello Sforzesco', height: 70 },
];

export function PoisPanel({ onOpenDialog }: PanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New POI</CardTitle>
          <CardDescription>
            Enter details and then Ctrl+Click on the map to place a POI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poiName">POI Name</Label>
            <Input id="poiName" placeholder="e.g., Main Tower" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="poiObjectHeight">Object Height (m)</Label>
              <Input id="poiObjectHeight" type="number" defaultValue={10} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poiTerrainElevation">Terrain (m)</Label>
              <Input id="poiTerrainElevation" type="number" defaultValue={121} readOnly />
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Final POI Altitude (AMSL)</Label>
            <p className="text-xl font-bold text-primary">131.0 m</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>POI List</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[150px] w-full pr-4">
            <div className="space-y-2">
              {mockPois.map(poi => (
                <div key={poi.id} className="p-3 rounded-lg border flex items-center gap-3">
                  <LocateFixed className="w-5 h-5 text-accent" />
                  <div className="flex-1">
                    <p className="font-semibold">{poi.name}</p>
                    <p className="text-xs text-muted-foreground">Height: {poi.height}m</p>
                  </div>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
               {mockPois.length === 0 && <p className="text-center text-muted-foreground py-8">No POIs added.</p>}
            </div>
          </ScrollArea>
          <Separator className="my-4" />
          <Button className="w-full" onClick={() => onOpenDialog('orbit')} disabled={mockPois.length === 0}>
            <Orbit className="w-4 h-4 mr-2" />
            Create Orbit Mission
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
