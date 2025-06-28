
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileDown, FileUp, Globe, FileJson2 } from 'lucide-react';
import type { PanelProps } from '../types';

interface FilePanelProps extends PanelProps {
  onImportJson: () => void;
  onExportJson: () => void;
  onExportKmz: () => void;
  onExportKml: () => void;
}

export function FilePanel({ onImportJson, onExportJson, onExportKmz, onExportKml }: FilePanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mission Data</CardTitle>
          <CardDescription>Save your current flight plan or load an existing one.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button variant="outline" onClick={onImportJson}>
            <FileUp className="w-4 h-4 mr-2" />
            Import from JSON
          </Button>
          <Button variant="outline" onClick={onExportJson}>
            <FileDown className="w-4 h-4 mr-2" />
            Export to JSON
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Third-Party Export</CardTitle>
          <CardDescription>Export your flight plan for use in other software.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button variant="outline" onClick={onExportKmz}>
            <FileJson2 className="w-4 h-4 mr-2" />
            Export DJI WPML (.kmz)
          </Button>
          <Button variant="outline" onClick={onExportKml}>
            <Globe className="w-4 h-4 mr-2" />
            Export for Google Earth (.kml)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
