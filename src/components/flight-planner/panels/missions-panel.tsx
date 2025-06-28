
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppWindow, Grid3x3, Building2, Trash2, Pencil } from 'lucide-react';
import type { PanelProps, SurveyMission } from '../types';
import { useTranslation } from '@/hooks/use-translation';


export function MissionsPanel({ onOpenDialog, missions = [], deleteMission, editMission }: PanelProps) {
  const { t } = useTranslation();
  const filteredMissions = missions.filter(m => m.type !== 'Orbit');
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('missionCreatorTitle')}</CardTitle>
          <CardDescription>{t('missionCreatorDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2">
          <Button variant="outline" onClick={() => onOpenDialog('survey')}>
            <Grid3x3 className="w-4 h-4 mr-2" />
            {t('createSurveyGridBtn')}
          </Button>
          <Button variant="outline" onClick={() => onOpenDialog('facade')}>
            <Building2 className="w-4 h-4 mr-2" />
            {t('createFacadeScanBtn')}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('savedMissionsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[150px] w-full">
            <div className="space-y-2">
              {filteredMissions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">{t('noMissionsCreated')}</p>
              )}
              {filteredMissions.map((mission: SurveyMission) => (
                <div key={mission.id} className="p-3 rounded-lg border flex items-center gap-3">
                  {mission.type === 'Grid' && <Grid3x3 className="w-5 h-5 text-primary" />}
                  {mission.type === 'Facade' && <Building2 className="w-5 h-5 text-accent" />}
                  <div className="flex-1">
                    <p className="font-semibold">{mission.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {mission.type === 'Grid' ? t('missionTypeGrid') : t('missionTypeFacade')} ({t('missionWaypointCount', { count: mission.waypointIds.length })})
                    </p>
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
