
"use client";

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Orbit, Radius } from 'lucide-react';
import type { POI } from '../types';
import { useTranslation } from '@/hooks/use-translation';

interface OrbitDialogParams {
  poiId: string;
  radius: number;
  numPoints: number;
}

interface OrbitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pois: POI[];
  params: OrbitDialogParams;
  onParamsChange: (params: OrbitDialogParams) => void;
  onCreateOrbit: () => void;
  onDrawRadius: () => void;
  isEditing: boolean;
}

export function OrbitDialog({ open, onOpenChange, pois, params, onParamsChange, onCreateOrbit, onDrawRadius, isEditing }: OrbitDialogProps) {
  const { t } = useTranslation();
  
  useEffect(() => {
    if (open && pois.length > 0) {
      if (!params.poiId || !pois.some(p => String(p.id) === params.poiId)) {
        onParamsChange({ ...params, poiId: String(pois[0].id) });
      }
    }
  }, [open, pois, params, onParamsChange]);

  const handleValueChange = (field: keyof typeof params, value: string | number) => {
    onParamsChange({ ...params, [field]: value });
  };

  const handleNumberValueChange = (field: keyof typeof params, value: string) => {
    onParamsChange({ ...params, [field]: Number(value) });
  };

  const canCreate = parseInt(params.poiId) > 0 && params.radius > 0 && params.numPoints >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editOrbitTitle') : t('createOrbitTitle')}</DialogTitle>
          <DialogDescription>
            {t('orbitDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 px-1">
          <div className="space-y-2">
            <Label htmlFor="orbitPoi">{t('centerPoi')}</Label>
            <Select 
              onValueChange={(value) => handleValueChange('poiId', value)} 
              value={params.poiId} 
              disabled={pois.length === 0}
            >
              <SelectTrigger id="orbitPoi">
                <SelectValue placeholder={t('selectPoiPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {pois.map(p => (
                   <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orbitRadius">{t('radius')}</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="orbitRadius" 
                type="number" 
                value={params.radius}
                onChange={e => handleNumberValueChange('radius', e.target.value)}
                min={5} 
              />
              <Button variant="outline" size="icon" onClick={onDrawRadius} disabled={!params.poiId}>
                <Radius className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orbitPoints">{t('numWaypoints')}</Label>
            <Input 
              id="orbitPoints" 
              type="number" 
              value={params.numPoints}
              onChange={e => handleNumberValueChange('numPoints', e.target.value)}
              min={3} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={onCreateOrbit} disabled={!canCreate}>
            <Orbit className="w-4 h-4 mr-2" />
            {isEditing ? t('updateOrbit') : t('createOrbit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
