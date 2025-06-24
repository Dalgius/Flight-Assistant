"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Camera, Trash2, Sailboat, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const mockWaypoints = [
  { id: 1, name: 'Waypoint 1', lat: 45.46, lng: 9.19, action: 'takePhoto' },
  { id: 2, name: 'Waypoint 2', lat: 45.47, lng: 9.20, action: 'none' },
  { id: 3, name: 'Waypoint 3', lat: 45.46, lng: 9.21, action: 'startRecord' },
  { id: 4, name: 'Waypoint 4', lat: 45.45, lng: 9.20, action: 'stopRecord' },
];

export function WaypointsPanel() {
  const [selectedWaypoints, setSelectedWaypoints] = useState<number[]>([]);
  const [activeWaypoint, setActiveWaypoint] = useState<number | null>(null);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedWaypoints(mockWaypoints.map(wp => wp.id));
    } else {
      setSelectedWaypoints([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedWaypoints([...selectedWaypoints, id]);
    } else {
      setSelectedWaypoints(selectedWaypoints.filter(wpId => wpId !== id));
    }
  };

  const isAllSelected = selectedWaypoints.length > 0 && selectedWaypoints.length === mockWaypoints.length;
  const isIndeterminate = selectedWaypoints.length > 0 && selectedWaypoints.length < mockWaypoints.length;


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
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="selectAll">Select All Waypoints</Label>
            <Button variant="destructive" size="sm" className="ml-auto" disabled={mockWaypoints.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
          <ScrollArea className="h-[200px] w-full pr-4">
            <div className="space-y-2">
              {mockWaypoints.map(wp => (
                <div
                  key={wp.id}
                  className={`p-3 rounded-lg border flex items-center gap-4 cursor-pointer transition-colors ${activeWaypoint === wp.id ? 'bg-secondary border-primary' : 'hover:bg-secondary/50'}`}
                  onClick={() => setActiveWaypoint(wp.id)}
                >
                  <Checkbox
                    checked={selectedWaypoints.includes(wp.id)}
                    onCheckedChange={(checked) => handleSelectOne(wp.id, checked === true)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <MapPin className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold">{wp.name}</p>
                    <p className="text-xs text-muted-foreground">{`Lat: ${wp.lat.toFixed(2)}, Lng: ${wp.lng.toFixed(2)}`}</p>
                  </div>
                  {wp.action !== 'none' && <Camera className="w-4 h-4 text-accent" />}
                </div>
              ))}
              {mockWaypoints.length === 0 && <p className="text-center text-muted-foreground py-8">No waypoints added.</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {selectedWaypoints.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Edit {selectedWaypoints.length} Waypoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label>Heading</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="No Change" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nochange">No Change</SelectItem>
                    <SelectItem value="auto">Auto (Next Waypoint)</SelectItem>
                    <SelectItem value="fixed">Fixed Angle</SelectItem>
                    <SelectItem value="poi">Focus on POI</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label>Camera Action</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="No Change" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nochange">No Change</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="takePhoto">Take Photo</SelectItem>
                    <SelectItem value="startRecord">Start Recording</SelectItem>
                    <SelectItem value="stopRecord">Stop Recording</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <Button className="w-full bg-accent hover:bg-accent/90">Apply to Selected</Button>
          </CardContent>
        </Card>
      )}

      {activeWaypoint && ! (selectedWaypoints.length > 1) && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Waypoint {activeWaypoint}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Altitude</Label>
              <Slider defaultValue={[60]} max={120} step={1} />
            </div>
            <div className="space-y-2">
              <Label>Gimbal Pitch</Label>
              <Slider defaultValue={[-30]} min={-90} max={30} step={1} />
            </div>
             <div className="space-y-2">
                <Label>Heading</Label>
                <Select defaultValue="auto">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Next Waypoint)</SelectItem>
                    <SelectItem value="fixed">Fixed Angle</SelectItem>
                    <SelectItem value="poi">Focus on POI</SelectItem>
                  </SelectContent>
                </Select>
             </div>
            <Separator />
            <div className="space-y-2">
              <Label>Camera Action</Label>
               <Select defaultValue="takePhoto">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="takePhoto">Take Photo</SelectItem>
                    <SelectItem value="startRecord">Start Recording</SelectItem>
                    <SelectItem value="stopRecord">Stop Recording</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <Button variant="destructive" className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Waypoint
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
