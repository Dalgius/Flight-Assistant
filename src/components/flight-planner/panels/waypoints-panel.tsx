"use client";

import React, { useState, useMemo } from 'react';
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

const MultiWaypointEditor = ({ pois, multiSelectedWaypointIds, updateWaypoint, clearMultiSelection }: PanelProps) => {
    const [updates, setUpdates] = useState<Partial<Waypoint>>({
        altitude: 50,
        gimbalPitch: 0,
        hoverTime: 0,
        fixedHeading: 0,
    });
    const [apply, setApply] = useState({
        altitude: false,
        gimbalPitch: false,
        hoverTime: false,
        headingControl: false,
        cameraAction: false,
    });

    const handleApplyChange = (field: keyof typeof apply, value: boolean) => {
        setApply(prev => ({ ...prev, [field]: value }));
    };

    const handleValueChange = (field: keyof Waypoint, value: any) => {
        setUpdates(prev => ({ ...prev, [field]: value }));
    };
    
    const handleHeadingControlChange = (value: HeadingControl | '') => {
        const newUpdates: Partial<Waypoint> = { ...updates, headingControl: value as HeadingControl };
        if (value !== 'fixed') {
            delete newUpdates.fixedHeading;
        }
        if (value !== 'poi_track') {
            delete newUpdates.targetPoiId;
        }
        setUpdates(newUpdates);
    };

    const handleBatchUpdate = () => {
        const finalUpdates: Partial<Waypoint> = {};
        
        if (apply.altitude && updates.altitude !== undefined) {
            finalUpdates.altitude = updates.altitude;
        }
        if (apply.gimbalPitch && updates.gimbalPitch !== undefined) {
            finalUpdates.gimbalPitch = updates.gimbalPitch;
        }
        if (apply.hoverTime && updates.hoverTime !== undefined) {
            finalUpdates.hoverTime = updates.hoverTime;
        }
        if (apply.cameraAction && updates.cameraAction) {
            finalUpdates.cameraAction = updates.cameraAction;
        }
        if (apply.headingControl && updates.headingControl) {
            finalUpdates.headingControl = updates.headingControl;
            if (updates.headingControl === 'fixed') {
                finalUpdates.fixedHeading = updates.fixedHeading ?? 0;
            }
            if (updates.headingControl === 'poi_track') {
                finalUpdates.targetPoiId = updates.targetPoiId ?? null;
            } else {
                finalUpdates.targetPoiId = null;
            }
        }

        if (Object.keys(finalUpdates).length > 0) {
            multiSelectedWaypointIds.forEach((id: number) => {
                updateWaypoint(id, finalUpdates);
            });
        }
    };

    return (
         <Card>
          <CardHeader>
            <CardTitle>Batch Edit {multiSelectedWaypointIds.size} Waypoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="applyAltitude" checked={apply.altitude} onCheckedChange={(checked) => handleApplyChange('altitude', !!checked)} />
                    <Label htmlFor="applyAltitude" className="flex justify-between w-full cursor-pointer">
                        <span>Altitude</span>
                        <span>{updates.altitude ?? 50} m</span>
                    </Label>
                </div>
                <Slider disabled={!apply.altitude} value={[updates.altitude ?? 50]} onValueChange={([val]) => handleValueChange('altitude', val)} max={120} step={1} />
            </div>
            
            <div className="space-y-2">
                 <div className="flex items-center space-x-2">
                    <Checkbox id="applyGimbal" checked={apply.gimbalPitch} onCheckedChange={(checked) => handleApplyChange('gimbalPitch', !!checked)} />
                    <Label htmlFor="applyGimbal" className="flex justify-between w-full cursor-pointer">
                        <span>Gimbal Pitch</span>
                        <span>{updates.gimbalPitch ?? 0}°</span>
                    </Label>
                </div>
                <Slider disabled={!apply.gimbalPitch} value={[updates.gimbalPitch ?? 0]} onValueChange={([val]) => handleValueChange('gimbalPitch', val)} min={-90} max={30} step={1} />
            </div>

            <div className="space-y-2">
                 <div className="flex items-center space-x-2">
                    <Checkbox id="applyHover" checked={apply.hoverTime} onCheckedChange={(checked) => handleApplyChange('hoverTime', !!checked)} />
                    <Label htmlFor="applyHover" className="flex justify-between w-full cursor-pointer">
                        <span>Hover Time</span>
                        <span>{updates.hoverTime ?? 0} s</span>
                    </Label>
                </div>
                <Slider disabled={!apply.hoverTime} value={[updates.hoverTime ?? 0]} onValueChange={([val]) => handleValueChange('hoverTime', val)} max={30} step={1} />
            </div>

            <Separator />
            
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="applyHeading" checked={apply.headingControl} onCheckedChange={(checked) => handleApplyChange('headingControl', !!checked)} />
                    <Label htmlFor="applyHeading" className="cursor-pointer">Heading</Label>
                </div>
                <Select disabled={!apply.headingControl} value={updates.headingControl || ''} onValueChange={(val: HeadingControl | '') => handleHeadingControlChange(val)}>
                    <SelectTrigger><SelectValue placeholder="Select Heading" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="auto">Auto (Next Waypoint)</SelectItem>
                        <SelectItem value="fixed">Fixed Angle</SelectItem>
                        <SelectItem value="poi_track">Focus on POI</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {apply.headingControl && updates.headingControl === 'fixed' && (
                 <div className="space-y-2 pl-6">
                    <Label className="flex justify-between">Fixed Heading <span>{updates.fixedHeading ?? 0}°</span></Label>
                    <Slider value={[updates.fixedHeading ?? 0]} onValueChange={([val]) => handleValueChange('fixedHeading', val)} max={359} step={1} />
                </div>
            )}
            {apply.headingControl && updates.headingControl === 'poi_track' && (
                <div className="space-y-2 pl-6">
                    <Label>Target POI</Label>
                    <Select value={String(updates.targetPoiId || '')} onValueChange={(val) => handleValueChange('targetPoiId', val ? Number(val) : null)}>
                        <SelectTrigger><SelectValue placeholder="Select a POI" /></SelectTrigger>
                        <SelectContent>
                            {pois.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <Separator />

            <div className="space-y-2">
                 <div className="flex items-center space-x-2">
                    <Checkbox id="applyAction" checked={apply.cameraAction} onCheckedChange={(checked) => handleApplyChange('cameraAction', !!checked)} />
                    <Label htmlFor="applyAction" className="cursor-pointer">Camera Action</Label>
                </div>
                <Select disabled={!apply.cameraAction} value={updates.cameraAction || ''} onValueChange={(val: CameraAction | '') => handleValueChange('cameraAction', val as CameraAction)}>
                  <SelectTrigger><SelectValue placeholder="Select an action" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="takePhoto">Take Photo</SelectItem>
                    <SelectItem value="startRecord">Start Recording</SelectItem>
                    <SelectItem value="stopRecord">Stop Recording</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <Separator />

            <div className="flex gap-2">
                <Button className="flex-1" onClick={handleBatchUpdate}>
                    Apply to Selected
                </Button>
                <Button variant="secondary" onClick={clearMultiSelection}>
                    Clear Selection
                </Button>
            </div>

          </CardContent>
        </Card>
    );
}

export function WaypointsPanel(props: PanelProps) {
  const { waypoints, selectedWaypoint, multiSelectedWaypointIds, selectAllWaypoints, clearWaypoints, selectWaypoint, toggleMultiSelectWaypoint, updateWaypoint, deleteWaypoint, pois } = props;

  const isAllSelected = waypoints.length > 0 && waypoints.length === multiSelectedWaypointIds.size;

  const showMultiEdit = multiSelectedWaypointIds.size > 0;
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
