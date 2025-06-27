"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export function TerrainPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Takeoff Point</CardTitle>
          <CardDescription>Set the ground elevation at your takeoff location.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="homeElevation">Takeoff Elevation (AMSL)</Label>
            <div className="flex items-center gap-2">
              <Input id="homeElevation" type="number" defaultValue={121} />
              <Button variant="secondary">Use WP1</Button>
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
              <Label htmlFor="desiredAGL">Desired Height Above Ground (AGL)</Label>
              <Input id="desiredAGL" type="number" defaultValue={50} />
            </div>
            <Button className="w-full mt-2">Adapt to AGL</Button>
          </div>

          <Separator />

          <div>
            <div className="space-y-2">
              <Label htmlFor="desiredAMSL">Desired Altitude Above Sea Level (AMSL)</Label>
              <Input id="desiredAMSL" type="number" defaultValue={100} />
            </div>
            <Button className="w-full mt-2">Adapt to AMSL</Button>
          </div>
          
          <div className="text-center text-sm p-2 bg-secondary rounded-md">
            Current Path Mode: <span className="font-semibold text-primary">Relative to Takeoff</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
