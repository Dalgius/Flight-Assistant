"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { PanelProps } from '../types';
import { LocateFixed, Orbit, Trash2, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


export function PoisPanel({ onOpenDialog, pois, addPoi, deletePoi }: PanelProps) {
  const [poiName, setPoiName] = useState('');
  const [poiHeight, setPoiHeight] = useState(10);
  
  const handleAddPoi = () => {
    // This is a placeholder. The real add happens via map click.
    // We could use this button to enter a "place POI" mode.
    alert("Please Ctrl+Click on the map to add a POI with this name and height.");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New POI</CardTitle>
          <CardDescription className="flex items-center gap-2">
            Enter details, then Ctrl+Click map to place.
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger><HelpCircle className="w-4 h-4" /></TooltipTrigger>
                <TooltipContent>
                  <p>The POI's terrain elevation is fetched automatically on placement.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poiName">POI Name</Label>
            <Input 
              id="poiName" 
              placeholder="e.g., Main Tower"
              value={poiName}
              onChange={(e) => setPoiName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="poiObjectHeight">Object Height (m)</Label>
            <Input 
              id="poiObjectHeight" 
              type="number" 
              value={poiHeight}
              onChange={(e) => setPoiHeight(Number(e.target.value))}
            />
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
              {pois.map((poi: any) => (
                <div key={poi.id} className="p-3 rounded-lg border flex items-center gap-3">
                  <LocateFixed className="w-5 h-5 text-accent" />
                  <div className="flex-1">
                    <p className="font-semibold">{poi.name}</p>
                    <p className="text-xs text-muted-foreground">Height: {poi.objectHeightAboveGround}m</p>
                  </div>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive" onClick={() => deletePoi(poi.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
               {pois.length === 0 && <p className="text-center text-muted-foreground py-8">No POIs added.</p>}
            </div>
          </ScrollArea>
          <Separator className="my-4" />
          <Button className="w-full" onClick={() => onOpenDialog('orbit')} disabled={pois.length === 0}>
            <Orbit className="w-4 h-4 mr-2" />
            Create Orbit Mission
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
