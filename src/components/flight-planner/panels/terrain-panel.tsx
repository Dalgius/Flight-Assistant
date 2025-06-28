
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { PanelProps, FlightPlanSettings } from '../types';

interface TerrainPanelProps extends PanelProps {
  settings: FlightPlanSettings;
  updateSettings: (newSettings: Partial<FlightPlanSettings>) => void;
  getHomeElevationFromFirstWaypoint: () => void;
  adaptToAGL: () => void;
  adaptToAMSL: () => void;
}

export function TerrainPanel({ settings, updateSettings, getHomeElevationFromFirstWaypoint, adaptToAGL, adaptToAMSL }: TerrainPanelProps) {

  const pathModeDisplay = {
    relative: 'Relative to Takeoff',
    agl: 'Constant AGL',
    amsl: 'Constant AMSL'
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Takeoff Point</CardTitle>
          <CardDescription>Set the takeoff ground elevation (AMSL).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="homeElevation">Takeoff Elevation (m)</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="homeElevation" 
                type="number" 
                value={settings.homeElevationMsl} 
                onChange={(e) => updateSettings({ homeElevationMsl: Number(e.target.value) })}
              />
              <Button variant="secondary" onClick={getHomeElevationFromFirstWaypoint}>Use WP1</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Path Altitude Adaptation</CardTitle>
          <CardDescription>Adjust all waypoints to a new altitude profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="space-y-2">
              <Label htmlFor="desiredAGL">Desired AGL (m)</Label>
              <Input 
                id="desiredAGL" 
                type="number" 
                value={settings.desiredAGL} 
                onChange={(e) => updateSettings({ desiredAGL: Number(e.target.value) })}
              />
            </div>
            <Button className="w-full mt-2" onClick={adaptToAGL}>Adapt to AGL</Button>
          </div>

          <Separator />

          <div>
            <div className="space-y-2">
              <Label htmlFor="desiredAMSL">Desired AMSL (m)</Label>
              <Input 
                id="desiredAMSL" 
                type="number" 
                value={settings.desiredAMSL}
                onChange={(e) => updateSettings({ desiredAMSL: Number(e.target.value) })}
              />
            </div>
            <Button className="w-full mt-2" onClick={adaptToAMSL}>Adapt to AMSL</Button>
          </div>
          
          <div className="text-center text-sm p-2 bg-secondary rounded-md">
            <div className="text-muted-foreground">Current Path Mode:</div>
            <div className="font-semibold text-primary">{pathModeDisplay[settings.altitudeAdaptationMode]}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
