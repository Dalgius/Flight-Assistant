"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-sm py-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground">{value}</span>
  </div>
);

export function StatsPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mission Summary</CardTitle>
          <CardDescription>Calculations based on current settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <StatRow label="Total Distance" value="4,215 m" />
            <Separator />
            <StatRow label="Est. Flight Time" value="8 min 27 sec" />
            <Separator />
            <StatRow label="Waypoints" value="4" />
            <Separator />
            <StatRow label="Points of Interest" value="2" />
            <Separator />
            <StatRow label="Photos to be Taken" value="31" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
