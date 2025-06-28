
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
import type { PanelProps, Waypoint, POI, HeadingControl, CameraAction, FlightPlanSettings } from '../types';
import { useTranslation } from '@/hooks/use-translation';

const WaypointItem = ({ waypoint, displayIndex, isSelected, onSelect, isMultiSelected, onMultiSelectToggle, settings, t }: {
    waypoint: Waypoint, 
    displayIndex: number,
    isSelected: boolean, 
    onSelect: (id: number) => void, 
    isMultiSelected: boolean, 
    onMultiSelectToggle: (id: number) => void,
    settings: FlightPlanSettings,
    t: (key: string) => string
}) => {
    
    const handleItemClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.waypoint-checkbox-container')) {
            return;
        }
        onSelect(waypoint.id);
    };

    const homeElevation = settings.homeElevationMsl ?? 0;
    const altitudeRelToHome = waypoint.altitude;
    const amslText = `${(homeElevation + altitudeRelToHome).toFixed(1)}m`;
    let aglText = t('na');
    if (waypoint.terrainElevationMSL !== null) {
      const amslWaypoint = homeElevation + altitudeRelToHome;
      aglText = `${(amslWaypoint - waypoint.terrainElevationMSL).toFixed(1)}m`;
    }
    
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
            <p className="font-semibold truncate">Waypoint {displayIndex}</p>
            <div className="text-xs text-muted-foreground leading-tight space-y-0.5">
                <div>{t('waypointRelAlt')}: {altitudeRelToHome.toFixed(1)}m</div>
                <div>{t('waypointAmslAlt')}: {amslText}</div>
                <div>{t('waypointAglAlt')}: {aglText}</div>
                <div>{t('waypointPitch')}: {waypoint.gimbalPitch}° | {t('waypointHover')}: {waypoint.hoverTime}s</div>
            </div>
          </div>
          {waypoint.cameraAction !== 'none' && <Camera className="w-4 h-4 text-accent shrink-0" />}
        </div>
    );
}

const SingleWaypointEditor = ({ waypoint, displayIndex, pois, updateWaypoint, deleteWaypoint } : { 
    waypoint: Waypoint, 
    displayIndex: number,
    pois: POI[], 
    updateWaypoint: Function, 
    deleteWaypoint: Function 
}) => {
    const { t } = useTranslation();
    
    const handleUpdate = (field: keyof Waypoint, value: any) => {
        updateWaypoint(waypoint.id, { [field]: value });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('editWaypointTitle')} {displayIndex}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`altitude-slider-${waypoint.id}`}>{t('altitudeLabel')}</Label>
                    <div className="flex items-center gap-4">
                        <Slider id={`altitude-slider-${waypoint.id}`} value={[waypoint.altitude]} onValueChange={([val]) => handleUpdate('altitude', val)} max={120} step={1} />
                        <span className="w-14 shrink-0 text-right font-mono text-sm text-muted-foreground">{waypoint.altitude} m</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`gimbal-slider-${waypoint.id}`}>{t('gimbalPitchLabel')}</Label>
                    <div className="flex items-center gap-4">
                        <Slider id={`gimbal-slider-${waypoint.id}`} value={[waypoint.gimbalPitch]} onValueChange={([val]) => handleUpdate('gimbalPitch', val)} min={-90} max={30} step={1} />
                        <span className="w-14 shrink-0 text-right font-mono text-sm text-muted-foreground">{waypoint.gimbalPitch}°</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`hover-slider-${waypoint.id}`}>{t('hoverTimeLabel')}</Label>
                    <div className="flex items-center gap-4">
                        <Slider id={`hover-slider-${waypoint.id}`} value={[waypoint.hoverTime]} onValueChange={([val]) => handleUpdate('hoverTime', val)} max={30} step={1} />
                        <span className="w-14 shrink-0 text-right font-mono text-sm text-muted-foreground">{waypoint.hoverTime} s</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>{t('headingLabel')}</Label>
                    <Select value={waypoint.headingControl} onValueChange={(val: HeadingControl) => handleUpdate('headingControl', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">{t('headingAuto')}</SelectItem>
                            <SelectItem value="fixed">{t('headingFixed')}</SelectItem>
                            <SelectItem value="poi_track">{t('headingPoi')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {waypoint.headingControl === 'fixed' && (
                     <div className="space-y-2">
                        <Label htmlFor={`heading-slider-${waypoint.id}`}>{t('fixedHeadingLabel')}</Label>
                        <div className="flex items-center gap-4">
                            <Slider id={`heading-slider-${waypoint.id}`} value={[waypoint.fixedHeading]} onValueChange={([val]) => handleUpdate('fixedHeading', val)} max={359} step={1} />
                            <span className="w-14 shrink-0 text-right font-mono text-sm text-muted-foreground">{waypoint.fixedHeading}°</span>
                        </div>
                    </div>
                )}
                {waypoint.headingControl === 'poi_track' && (
                    <div className="space-y-2">
                        <Label>{t('targetPoiLabel')}</Label>
                        <Select value={String(waypoint.targetPoiId ?? '')} onValueChange={(val) => handleUpdate('targetPoiId', val ? Number(val) : null)}>
                            <SelectTrigger><SelectValue placeholder={t('selectPoiPlaceholder')} /></SelectTrigger>
                            <SelectContent>
                                {pois.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <Separator />
                <div className="space-y-2">
                    <Label>{t('cameraActionLabel')}</Label>
                    <Select value={waypoint.cameraAction} onValueChange={(val: CameraAction) => handleUpdate('cameraAction', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">{t('actionNone')}</SelectItem>
                            <SelectItem value="takePhoto">{t('actionTakePhoto')}</SelectItem>
                            <SelectItem value="startRecord">{t('actionStartRecord')}</SelectItem>
                            <SelectItem value="stopRecord">{t('actionStopRecord')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="destructive" className="w-full" onClick={() => deleteWaypoint(waypoint.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('deleteWaypointBtn')}
                </Button>
            </CardContent>
        </Card>
    );
};

const MultiWaypointEditor = ({ pois, multiSelectedWaypointIds, updateWaypoint, clearMultiSelection, deleteMultiSelectedWaypoints }: PanelProps) => {
    const { t } = useTranslation();
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
            <CardTitle>{t('multiEditTitle', { count: multiSelectedWaypointIds.size })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="applyAltitude" checked={apply.altitude} onCheckedChange={(checked) => handleApplyChange('altitude', !!checked)} />
                    <Label htmlFor="applyAltitude" className="cursor-pointer flex-1">{t('altitudeLabel')}</Label>
                </div>
                <div className="flex items-center gap-4 pl-6">
                    <Slider disabled={!apply.altitude} value={[updates.altitude ?? 50]} onValueChange={([val]) => handleValueChange('altitude', val)} max={120} step={1} />
                    <span className="w-14 shrink-0 text-right font-mono text-sm text-muted-foreground">{updates.altitude ?? 50} m</span>
                </div>
            </div>
            
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="applyGimbal" checked={apply.gimbalPitch} onCheckedChange={(checked) => handleApplyChange('gimbalPitch', !!checked)} />
                    <Label htmlFor="applyGimbal" className="cursor-pointer flex-1">{t('gimbalPitchLabel')}</Label>
                </div>
                <div className="flex items-center gap-4 pl-6">
                    <Slider disabled={!apply.gimbalPitch} value={[updates.gimbalPitch ?? 0]} onValueChange={([val]) => handleValueChange('gimbalPitch', val)} min={-90} max={30} step={1} />
                    <span className="w-14 shrink-0 text-right font-mono text-sm text-muted-foreground">{updates.gimbalPitch ?? 0}°</span>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="applyHover" checked={apply.hoverTime} onCheckedChange={(checked) => handleApplyChange('hoverTime', !!checked)} />
                    <Label htmlFor="applyHover" className="cursor-pointer flex-1">{t('hoverTimeLabel')}</Label>
                </div>
                <div className="flex items-center gap-4 pl-6">
                    <Slider disabled={!apply.hoverTime} value={[updates.hoverTime ?? 0]} onValueChange={([val]) => handleValueChange('hoverTime', val)} max={30} step={1} />
                    <span className="w-14 shrink-0 text-right font-mono text-sm text-muted-foreground">{updates.hoverTime ?? 0} s</span>
                </div>
            </div>

            <Separator />
            
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="applyHeading" checked={apply.headingControl} onCheckedChange={(checked) => handleApplyChange('headingControl', !!checked)} />
                    <Label htmlFor="applyHeading" className="cursor-pointer">{t('headingLabel')}</Label>
                </div>
                <div className="pl-6">
                    <Select disabled={!apply.headingControl} value={updates.headingControl || ''} onValueChange={(val: HeadingControl | '') => handleHeadingControlChange(val)}>
                        <SelectTrigger><SelectValue placeholder={t('headingLabel')} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">{t('headingAuto')}</SelectItem>
                            <SelectItem value="fixed">{t('headingFixed')}</SelectItem>
                            <SelectItem value="poi_track">{t('headingPoi')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {apply.headingControl && updates.headingControl === 'fixed' && (
                 <div className="space-y-2 pl-12">
                    <Label>{t('fixedHeadingLabel')}</Label>
                    <div className="flex items-center gap-4">
                        <Slider value={[updates.fixedHeading ?? 0]} onValueChange={([val]) => handleValueChange('fixedHeading', val)} max={359} step={1} />
                        <span className="w-14 shrink-0 text-right font-mono text-sm text-muted-foreground">{updates.fixedHeading ?? 0}°</span>
                    </div>
                </div>
            )}
            {apply.headingControl && updates.headingControl === 'poi_track' && (
                <div className="space-y-2 pl-12">
                    <Label>{t('targetPoiLabel')}</Label>
                    <Select value={String(updates.targetPoiId || '')} onValueChange={(val) => handleValueChange('targetPoiId', val ? Number(val) : null)}>
                        <SelectTrigger><SelectValue placeholder={t('selectPoiPlaceholder')} /></SelectTrigger>
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
                    <Label htmlFor="applyAction" className="cursor-pointer">{t('cameraActionLabel')}</Label>
                </div>
                <div className="pl-6">
                    <Select disabled={!apply.cameraAction} value={updates.cameraAction || ''} onValueChange={(val: CameraAction | '') => handleValueChange('cameraAction', val as CameraAction)}>
                      <SelectTrigger><SelectValue placeholder={t('cameraActionLabel')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('actionNone')}</SelectItem>
                        <SelectItem value="takePhoto">{t('actionTakePhoto')}</SelectItem>
                        <SelectItem value="startRecord">{t('actionStartRecord')}</SelectItem>
                        <SelectItem value="stopRecord">{t('actionStopRecord')}</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
             </div>

             <Separator />

             <div className="flex flex-col gap-2 pt-2">
                <Button className="w-full" onClick={handleBatchUpdate}>
                    {t('applyChanges')}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={clearMultiSelection}>
                        {t('clearSelection')}
                    </Button>
                    <Button variant="destructive" onClick={deleteMultiSelectedWaypoints}>
                        {t('deleteSelected')}
                    </Button>
                </div>
            </div>
          </CardContent>
        </Card>
    );
}

export function WaypointsPanel(props: PanelProps) {
  const { waypoints, selectedWaypoint, multiSelectedWaypointIds, selectAllWaypoints, clearWaypoints, selectWaypoint, toggleMultiSelectWaypoint, updateWaypoint, deleteWaypoint, pois, settings } = props;
  const { t } = useTranslation();

  const selectedWaypointIndex = useMemo(() => {
    if (!selectedWaypoint) return -1;
    return waypoints.findIndex(wp => wp.id === selectedWaypoint.id);
  }, [selectedWaypoint, waypoints]);

  const isAllSelected = waypoints.length > 0 && waypoints.length === multiSelectedWaypointIds.size;

  const showMultiEdit = multiSelectedWaypointIds.size > 0;
  const showSingleEdit = !showMultiEdit && selectedWaypoint !== null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('waypointListTitle')}</CardTitle>
          <CardDescription>{t('waypointListDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="selectAll"
              checked={isAllSelected}
              onCheckedChange={selectAllWaypoints}
              disabled={waypoints.length === 0}
            />
            <Label htmlFor="selectAll">{t('selectAll')}</Label>
            <Button variant="destructive" size="sm" className="ml-auto" disabled={waypoints.length === 0} onClick={clearWaypoints}>
              <Trash2 className="w-4 h-4 mr-2" />
              {t('clearAll')}
            </Button>
          </div>
          <ScrollArea className="h-[200px] w-full pr-4">
            <div className="space-y-2">
              {waypoints.map((wp: Waypoint, index: number) => (
                <WaypointItem 
                    key={wp.id} 
                    waypoint={wp} 
                    displayIndex={index + 1}
                    isSelected={selectedWaypoint?.id === wp.id}
                    isMultiSelected={multiSelectedWaypointIds.has(wp.id)}
                    onSelect={selectWaypoint}
                    onMultiSelectToggle={toggleMultiSelectWaypoint}
                    settings={settings}
                    t={t}
                />
              ))}
              {waypoints.length === 0 && <p className="text-center text-muted-foreground py-8">{t('clickMapToAddWaypoints')}</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {showMultiEdit && <MultiWaypointEditor {...props} />}
      {showSingleEdit && <SingleWaypointEditor 
        waypoint={selectedWaypoint}
        displayIndex={selectedWaypointIndex + 1}
        pois={pois} 
        updateWaypoint={updateWaypoint} 
        deleteWaypoint={deleteWaypoint} 
      />}
    </div>
  );
}
