"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PanelProps, FlightPlanSettings } from '../types';


export function SettingsPanel({ settings, updateSettings }: PanelProps) {
  
  const handleSettingsChange = (key: keyof FlightPlanSettings, value: string | number) => {
    updateSettings({ [key]: value });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="defaultAltitude" className="flex justify-between">
              <span>Default Altitude</span>
              <span>{settings.defaultAltitude} m</span>
            </Label>
            <Slider
              id="defaultAltitude"
              value={[settings.defaultAltitude]}
              onValueChange={(value) => handleSettingsChange('defaultAltitude', value[0])}
              min={5}
              max={120}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flightSpeed" className="flex justify-between">
              <span>Flight Speed</span>
              <span>{settings.flightSpeed.toFixed(1)} m/s</span>
            </Label>
            <Slider
              id="flightSpeed"
              value={[settings.flightSpeed]}
              onValueChange={(value) => handleSettingsChange('flightSpeed', value[0])}
              min={1}
              max={17}
              step={0.1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pathType">Path Type</Label>
            <Select 
              value={settings.pathType} 
              onValueChange={(value: 'straight' | 'curved') => handleSettingsChange('pathType', value)}
            >
              <SelectTrigger id="pathType">
                <SelectValue placeholder="Select path type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="straight">Straight Lines</SelectItem>
                <SelectItem value="curved">Curved Transitions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
