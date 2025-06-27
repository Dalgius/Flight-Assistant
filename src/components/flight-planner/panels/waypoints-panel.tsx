"use client";

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Camera, Trash2, Sailboat, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PanelProps, Waypoint, POI, HeadingControl, CameraAction } from '../types';

const WaypointItem = ({ waypoint, isSelected, onSelect, isMultiSelected, onMultiSelectToggle }: {waypoint: Waypoint, isSelected: boolean, onSelect: (id: number) => void, isMultiSelected: boolean, onMultiSelectToggle: (id: number) => void}) => {
    
    const handleItemClick = (e: React.MouseEvent) => {
        // Prevent click from propagating to parent if checkbox is clicked
        if ((e.target as HTMLElement).closest('.waypoint-checkbox-container')) {
            return;
        }
        onSelect(waypoint.id);
    };
    
    return (
        <div
          className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-secondary border-primary' : 'hover:bg-secondary/50'} ${isMultiSelected ? 'bg-blue-900/50 border-blue-500' : ''}`}
          onClick={handleItemClick}
        >
          <div className="waypoint-checkbox-container" onClick={(e) => {e.stopPropagation(); onMultiSelectToggle(waypoint.id)}}>
            <Checkbox
              checked={isMultiSelected}
              className="mt-1"
            />
          </div>
          <MapPin className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold truncate">Waypoint {waypoint.id}</p>
            <p className="text-xs text-muted-foreground truncate">{`Alt: ${waypoint.altitude}m, Pitch: ${waypoint.gimbalPitch}°`}</p>
          </div>
          {waypoint.cameraAction !== 'none' && <Camera className="w-4 h-4 text-accent shrink-0" />}
        </div>
    );
}

const SingleWaypointEditor = ({ waypoint, pois, updateWaypoint, deleteWaypoint } : { waypoint: Waypoint, pois: POI[], updateWaypoint: Function, deleteWaypoint: Function }) => {
    
    const handleUpdate = (field: keyof Waypoint, value: any) => {
        updateWaypoint(waypoint.id, { [field]: value });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Edit Waypoint {waypoint.id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label className="flex justify-between">Altitude <span>{waypoint.altitude} m</span></Label>
                    <Slider value={[waypoint.altitude]} onValueChange={([val]) => handleUpdate('altitude', val)} max={120} step={1} />
                </div>
                <div className="space-y-2">
                    <Label className="flex justify-between">Gimbal Pitch <span>{waypoint.gimbalPitch}°</span></Label>
                    <Slider value={[waypoint.gimbalPitch]} onValueChange={([val]) => handleUpdate('gimbalPitch', val)} min={-90} max={30} step={1} />
                </div>
                <div className="space-y-2">
                    <Label className="flex justify-between">Hover Time <span>{waypoint.hoverTime} s</span></Label>
                    <Slider value={[waypoint.hoverTime]} onValueChange={([val]) => handleUpdate('hoverTime', val)} max={30} step={1} />
                </div>

                <div className="space-y-2">
                    <Label>Heading</Label>
                    <Select value={waypoint.headingControl} onValueChange={(val: HeadingControl) => handleUpdate('headingControl', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">Auto (Next Waypoint)</SelectItem>
                            <SelectItem value="fixed">Fixed Angle</SelectItem>
                            <SelectItem value="poi_track">Focus on POI</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {waypoint.headingControl === 'fixed' && (
                     <div className="space-y-2">
                        <Label className="flex justify-between">Fixed Heading <span>{waypoint.fixedHeading}°</span></Label>
                        <Slider value={[waypoint.fixedHeading]} onValueChange={([val]) => handleUpdate('fixedHeading', val)} max={359} step={1} />
                    </div>
                )}
                {waypoint.headingControl === 'poi_track' && (
                    <div className="space-y-2">
                        <Label>Target POI</Label>
                        <Select value={String(waypoint.targetPoiId)} onValueChange={(val) => handleUpdate('targetPoiId', Number(val))}>
                            <SelectTrigger><SelectValue placeholder="Select a POI" /></SelectTrigger>
                            <SelectContent>
                                {pois.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <Separator />
                <div className="space-y-2">
                    <Label>Camera Action</Label>
                    <Select value={waypoint.cameraAction} onValueChange={(val: CameraAction) => handleUpdate('cameraAction', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="takePhoto">Take Photo</SelectItem>
                            <SelectItem value="startRecord">Start Recording</SelectItem>
                            <SelectItem value="stopRecord">Stop Recording</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="destructive" className="w-full" onClick={() => deleteWaypoint(waypoint.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Waypoint
                </Button>
            </CardContent>
        </Card>
    );
};

const MultiWaypointEditor = ({ waypoints, pois, multiSelectedWaypointIds, updateWaypoint, clearMultiSelection }: PanelProps) => {
    // A simplified multi-editor
    const handleBatchUpdate = (field: keyof Waypoint, value: any) => {
        multiSelectedWaypointIds.forEach((id: number) => {
            updateWaypoint(id, { [field]: value });
        });
    };
    
    return (
         <Card>
          <CardHeader>
            <CardTitle>Batch Edit {multiSelectedWaypointIds.size} Waypoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label>Camera Action</Label>
                <Select onValueChange={(val: CameraAction) => handleBatchUpdate('cameraAction', val)}>
                  <SelectTrigger><SelectValue placeholder="Select an action" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="takePhoto">Take Photo</SelectItem>
                    <SelectItem value="startRecord">Start Recording</SelectItem>
                    <SelectItem value="stopRecord">Stop Recording</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <Button className="w-full bg-accent hover:bg-accent/90" onClick={clearMultiSelection}>Done</Button>
          </CardContent>
        </Card>
    )
}

export function WaypointsPanel(props: PanelProps) {
  const { waypoints, selectedWaypoint, multiSelectedWaypointIds, selectAllWaypoints, clearWaypoints, selectWaypoint, toggleMultiSelectWaypoint, updateWaypoint, deleteWaypoint, pois } = props;

  const isAllSelected = waypoints.length > 0 && waypoints.length === multiSelectedWaypointIds.size;

  const showMultiEdit = multiSelectedWaypointIds.size > 1;
  const showSingleEdit = !showMultiEdit && selectedWaypoint !== null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Waypoint List</CardTitle>
          <CardDescription>Click on a waypoint to edit its properties.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="selectAll"
              checked={isAllSelected}
              onCheckedChange={selectAllWaypoints}
              disabled={waypoints.length === 0}
            />
            <Label htmlFor="selectAll">Select All</Label>
            <Button variant="destructive" size="sm" className="ml-auto" disabled={waypoints.length === 0} onClick={clearWaypoints}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
          <ScrollArea className="h-[200px] w-full pr-4">
            <div className="space-y-2">
              {waypoints.map((wp: Waypoint) => (
                <WaypointItem 
                    key={wp.id} 
                    waypoint={wp} 
                    isSelected={selectedWaypoint?.id === wp.id}
                    isMultiSelected={multiSelectedWaypointIds.has(wp.id)}
                    onSelect={selectWaypoint}
                    onMultiSelectToggle={toggleMultiSelectWaypoint}
                />
              ))}
              {waypoints.length === 0 && <p className="text-center text-muted-foreground py-8">Click on map to add waypoints.</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {showMultiEdit && <MultiWaypointEditor {...props} />}
      {showSingleEdit && <SingleWaypointEditor waypoint={selectedWaypoint} pois={pois} updateWaypoint={updateWaypoint} deleteWaypoint={deleteWaypoint} />}
    </div>
  );
}
