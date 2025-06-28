
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppWindow, Grid3x3, Building2, Trash2, Pencil } from 'lucide-react';
import type { PanelProps, SurveyMission } from '../types';


export function MissionsPanel({ onOpenDialog, missions = [], deleteMission, editMission }: PanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mission Creator</CardTitle>
          <CardDescription>Generate automated flight patterns.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2">
          <Button variant="outline" onClick={() => onOpenDialog('survey')}>
            <Grid3x3 className="w-4 h-4 mr-2" />
            Create Survey Grid
          </Button>
          <Button variant="outline" onClick={() => onOpenDialog('facade')}>
            <Building2 className="w-4 h-4 mr-2" />
            Create Facade Scan
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Saved Missions</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[150px] w-full">
            <div className="space-y-2">
              {missions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No missions created yet.</p>
              )}
              {missions.map((mission: SurveyMission) => (
                <div key={mission.id} className="p-3 rounded-lg border flex items-center gap-3">
                  {mission.type === 'Grid' && <Grid3x3 className="w-5 h-5 text-primary" />}
                  {mission.type === 'Facade' && <Building2 className="w-5 h-5 text-accent" />}
                  {mission.type === 'Orbit' && <AppWindow className="w-5 h-5 text-green-500" />}
                  <div className="flex-1">
                    <p className="font-semibold">{mission.name}</p>
                    <p className="text-xs text-muted-foreground">{mission.type} Mission ({mission.waypointIds.length} WPs)</p>
                  </div>
                  <div className="flex items-center">
                    {editMission && (mission.type === 'Grid' || mission.type === 'Facade') && (
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary" onClick={() => editMission(mission.id)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {deleteMission && (
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMission(mission.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
