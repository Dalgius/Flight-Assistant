
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { PanelProps, FlightPlanSettings } from '../types';
import { useTranslation } from '@/hooks/use-translation';

interface TerrainPanelProps extends PanelProps {
  settings: FlightPlanSettings;
  updateSettings: (newSettings: Partial<FlightPlanSettings>) => void;
  getHomeElevationFromFirstWaypoint: () => void;
  adaptToAGL: () => void;
  adaptToAMSL: () => void;
}

export function TerrainPanel({ settings, updateSettings, getHomeElevationFromFirstWaypoint, adaptToAGL, adaptToAMSL }: TerrainPanelProps) {
  const { t } = useTranslation();

  const pathModeDisplay = {
    relative: t('pathModeRelative'),
    agl: t('pathModeAgl'),
    amsl: t('pathModeAmsl'),
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('takeoffPointTitle')}</CardTitle>
          <CardDescription>{t('takeoffPointDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="homeElevation">{t('takeoffElevationLabel')}</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="homeElevation" 
                type="number" 
                value={settings.homeElevationMsl} 
                onChange={(e) => updateSettings({ homeElevationMsl: Number(e.target.value) })}
              />
              <Button variant="secondary" onClick={getHomeElevationFromFirstWaypoint}>{t('useWp1Btn')}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('pathAdaptationTitle')}</CardTitle>
          <CardDescription>{t('pathAdaptationDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="space-y-2">
              <Label htmlFor="desiredAGL">{t('desiredAglLabel')}</Label>
              <Input 
                id="desiredAGL" 
                type="number" 
                value={settings.desiredAGL} 
                onChange={(e) => updateSettings({ desiredAGL: Number(e.target.value) })}
              />
            </div>
            <Button className="w-full mt-2" onClick={adaptToAGL}>{t('adaptToAglBtn')}</Button>
          </div>

          <Separator />

          <div>
            <div className="space-y-2">
              <Label htmlFor="desiredAMSL">{t('desiredAmslLabel')}</Label>
              <Input 
                id="desiredAMSL" 
                type="number" 
                value={settings.desiredAMSL}
                onChange={(e) => updateSettings({ desiredAMSL: Number(e.target.value) })}
              />
            </div>
            <Button className="w-full mt-2" onClick={adaptToAMSL}>{t('adaptToAmslBtn')}</Button>
          </div>
          
          <div className="text-center text-sm p-2 bg-secondary rounded-md">
            <div className="text-muted-foreground">{t('currentPathModeLabel')}</div>
            <div className="font-semibold text-primary">{pathModeDisplay[settings.altitudeAdaptationMode]}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
