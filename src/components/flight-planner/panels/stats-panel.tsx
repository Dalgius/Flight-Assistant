"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { PanelProps, FlightStatistics } from '../types';


const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-sm py-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground">{value}</span>
  </div>
);

export function StatsPanel({ flightStats }: PanelProps) {
  
  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.round(totalSeconds % 60);
    return `${mins} min ${secs} sec`;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mission Summary</CardTitle>
          <CardDescription>Calculations based on current settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <StatRow label="Total Distance" value={`${Math.round(flightStats.totalDistance)} m`} />
            <Separator />
            <StatRow label="Est. Flight Time" value={formatDuration(flightStats.flightTime)} />
            <Separator />
            <StatRow label="Waypoints" value={String(flightStats.waypointCount)} />
            <Separator />
            <StatRow label="Points of Interest" value={String(flightStats.poiCount)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
