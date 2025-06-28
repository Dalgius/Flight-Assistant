
"use client";

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Grid3x3, DraftingCompass } from 'lucide-react';
import type { SurveyGridParams } from '../types';
import { useTranslation } from '@/hooks/use-translation';

interface SurveyGridDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  params: SurveyGridParams;
  onParamsChange: (params: SurveyGridParams) => void;
  onDrawArea: () => void;
  onDrawAngle: () => void;
  onCreateGrid: () => void;
  isEditing: boolean;
}

export function SurveyGridDialog({
  open,
  onOpenChange,
  params,
  onParamsChange,
  onDrawArea,
  onDrawAngle,
  onCreateGrid,
  isEditing,
}: SurveyGridDialogProps) {
  const { t } = useTranslation();
  
  const handleNumberValueChange = (field: keyof Omit<SurveyGridParams, 'polygon'>, value: string) => {
    onParamsChange({ ...params, [field]: Number(value) });
  };

  const isAreaDefined = params.polygon && params.polygon.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editSurveyTitle') : t('createSurveyTitle')}</DialogTitle>
          <DialogDescription>
            {isAreaDefined
              ? t('surveyAreaDefinedDesc', { points: params.polygon.length })
              : t('surveyAreaNotDefinedDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surveyAltitude">{t('surveyAltitude')}</Label>
              <Input
                id="surveyAltitude"
                type="number"
                value={params.altitude}
                onChange={(e) => handleNumberValueChange('altitude', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gridAngle">{t('gridAngle')}</Label>
              <Input
                id="gridAngle"
                type="number"
                value={params.angle}
                onChange={(e) => handleNumberValueChange('angle', e.target.value)}
              />
              <Button variant="outline" size="sm" className="w-full mt-1" onClick={onDrawAngle}>
                <DraftingCompass className="w-4 h-4 mr-2" />
                {t('drawAngle')}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sidelap">{t('sidelap')}</Label>
              <Input
                id="sidelap"
                type="number"
                value={params.sidelap}
                onChange={(e) => handleNumberValueChange('sidelap', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frontlap">{t('frontlap')}</Label>
              <Input
                id="frontlap"
                type="number"
                value={params.frontlap}
                onChange={(e) => handleNumberValueChange('frontlap', e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={onDrawArea}>
            {isAreaDefined ? t('redrawArea') : t('startDrawingArea')}
          </Button>
          <Button disabled={!isAreaDefined} onClick={onCreateGrid}>
            <Grid3x3 className="w-4 h-4 mr-2" />
            {isEditing ? t('updateGrid') : t('generateGrid')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
