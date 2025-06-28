
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PanelProps, FlightPlanSettings } from '../types';
import { useTranslation } from '@/hooks/use-translation';


export function SettingsPanel({ settings, updateSettings }: PanelProps) {
  const { t } = useTranslation();
  
  const handleSettingsChange = (key: keyof FlightPlanSettings, value: string | number) => {
    updateSettings({ [key]: value });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('flightSettingsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="defaultAltitude" className="flex justify-between">
              <span>{t('defaultAltitudeLabel')} <span className="text-muted-foreground font-normal text-xs">{t('defaultAltitudeHint')}</span></span>
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
              <span>{t('flightSpeedLabel')}</span>
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
            <Label htmlFor="pathType">{t('pathTypeLabel')}</Label>
            <Select 
              value={settings.pathType} 
              onValueChange={(value: 'straight' | 'curved') => handleSettingsChange('pathType', value)}
            >
              <SelectTrigger id="pathType">
                <SelectValue placeholder="Select path type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="straight">{t('pathTypeStraight')}</SelectItem>
                <SelectItem value="curved">{t('pathTypeCurved')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
