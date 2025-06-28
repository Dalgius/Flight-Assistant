
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { PanelProps, FlightStatistics } from '../types';
import { useTranslation } from '@/hooks/use-translation';


const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-sm py-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground">{value}</span>
  </div>
);

export function StatsPanel({ flightStats }: PanelProps) {
  const { t } = useTranslation();
  
  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.round(totalSeconds % 60);
    return t('flightTimeFormat', { mins, secs });
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('missionSummaryTitle')}</CardTitle>
          <CardDescription>{t('missionSummaryDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <StatRow label={t('totalDistance')} value={`${Math.round(flightStats.totalDistance)} m`} />
            <Separator />
            <StatRow label={t('estFlightTime')} value={formatDuration(flightStats.flightTime)} />
            <Separator />
            <StatRow label={t('waypointsCount')} value={String(flightStats.waypointCount)} />
            <Separator />
            <StatRow label={t('poisCount')} value={String(flightStats.poiCount)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
