
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileDown, FileUp, Globe, FileJson2 } from 'lucide-react';
import type { PanelProps } from '../types';
import { useTranslation } from '@/hooks/use-translation';

interface FilePanelProps extends PanelProps {
  onImportJson: () => void;
  onExportJson: () => void;
  onExportKmz: () => void;
  onExportKml: () => void;
}

export function FilePanel({ onImportJson, onExportJson, onExportKmz, onExportKml }: FilePanelProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('missionDataTitle')}</CardTitle>
          <CardDescription>{t('missionDataDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button variant="outline" onClick={onImportJson}>
            <FileUp className="w-4 h-4 mr-2" />
            {t('importJsonBtn')}
          </Button>
          <Button variant="outline" onClick={onExportJson}>
            <FileDown className="w-4 h-4 mr-2" />
            {t('exportJsonBtn')}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('thirdPartyExportTitle')}</CardTitle>
          <CardDescription>{t('thirdPartyExportDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button variant="outline" onClick={onExportKmz}>
            <FileJson2 className="w-4 h-4 mr-2" />
            {t('exportKmzBtn')}
          </Button>
          <Button variant="outline" onClick={onExportKml}>
            <Globe className="w-4 h-4 mr-2" />
            {t('exportKmlBtn')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
