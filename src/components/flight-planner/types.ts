export type PanelType = 'settings' | 'waypoints' | 'pois' | 'missions' | 'terrain' | 'file' | 'stats';

export type DialogType = 'orbit' | 'survey' | 'facade' | null;

export interface PanelProps {
  onOpenDialog: (dialog: DialogType) => void;
}
