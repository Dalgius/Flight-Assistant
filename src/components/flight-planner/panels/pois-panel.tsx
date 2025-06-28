
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { PanelProps, SurveyMission, POI } from '../types';
import { LocateFixed, Orbit, Trash2, HelpCircle, Pencil } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function PoisPanel({ onOpenDialog, pois, addPoi, deletePoi, missions, deleteMission, editMission, poiName, setPoiName, poiHeight, setPoiHeight, updatePoi }: PanelProps) {
  
  const handlePoiUpdate = (poiId: number, field: 'objectHeightAboveGround' | 'terrainElevationMSL', value: string) => {
    const poi = pois.find(p => p.id === poiId);
    if (!poi) return;
    const numValue = parseFloat(value);
    if (isNaN(numValue) && value !== '') return;

    const newPoi = { ...poi };
    
    if (field === 'objectHeightAboveGround') {
        newPoi.objectHeightAboveGround = isNaN(numValue) ? 0 : numValue;
    } else if (field === 'terrainElevationMSL') {
        newPoi.terrainElevationMSL = isNaN(numValue) ? null : numValue;
    }

    newPoi.altitude = (newPoi.terrainElevationMSL ?? 0) + newPoi.objectHeightAboveGround;
    updatePoi(poiId, newPoi);
  }

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
            <Label htmlFor="poiName">Next POI Name</Label>
            <Input 
              id="poiName" 
              placeholder="e.g., Main Tower"
              value={poiName}
              onChange={(e) => setPoiName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="poiObjectHeight">Next POI Object Height (m)</Label>
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
          <ScrollArea className="h-[250px] w-full pr-4">
            <div className="space-y-2">
              {pois.map((poi: POI) => {
                const orbitMission = missions?.find((m: SurveyMission) => m.type === 'Orbit' && (m.parameters as any).poiId === poi.id);
                return (
                  <div key={poi.id} className="p-3 rounded-lg border flex flex-col items-stretch gap-2">
                    <div className="flex items-center gap-3">
                      <LocateFixed className="w-5 h-5 text-accent shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold">{poi.name}</p>
                        <p className="text-xs text-muted-foreground">Final AMSL: {poi.altitude.toFixed(1)}m</p>
                      </div>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive" onClick={() => deletePoi(poi.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Inline editors */}
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <Label htmlFor={`poi_h_${poi.id}`} className="flex-1">Obj. Height (m)</Label>
                            <Input id={`poi_h_${poi.id}`} type="number" value={poi.objectHeightAboveGround} onChange={(e) => handlePoiUpdate(poi.id, 'objectHeightAboveGround', e.target.value)} className="h-7 w-20"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor={`poi_e_${poi.id}`} className="flex-1">Terrain Elev. (m)</Label>
                            <Input id={`poi_e_${poi.id}`} type="number" value={poi.terrainElevationMSL ?? ''} placeholder="N/A" onChange={(e) => handlePoiUpdate(poi.id, 'terrainElevationMSL', e.target.value)} className="h-7 w-20"/>
                        </div>
                    </div>

                    {orbitMission && editMission && deleteMission && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Orbit className="w-4 h-4 text-green-500" />
                                <div>
                                    <p className="text-sm font-medium">Orbit Mission</p>
                                    <p className="text-xs text-muted-foreground">{orbitMission.waypointIds.length} Waypoints</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary" onClick={() => editMission(orbitMission.id)}>
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMission(orbitMission.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {pois.length === 0 && <p className="text-center text-muted-foreground py-8">No POIs added.</p>}
            </div>
          </ScrollArea>
          <Separator className="my-4" />
          <Button className="w-full" onClick={() => onOpenDialog('orbit')} disabled={!pois || pois.length === 0}>
            <Orbit className="w-4 h-4 mr-2" />
            Create Orbit Mission
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
