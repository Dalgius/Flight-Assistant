// src/store/useAppStore.ts
import { create } from 'zustand';
import { AppState, PanelType } from '@/types';

export const useAppStore = create<AppState>((set, get) => ({
  // STATE
  isPanelOpen: true,
  activePanel: 'waypoints',
  waypoints: [],
  pois: [],

  // ACTIONS
  openPanel: (panel: PanelType) => set({ isPanelOpen: true, activePanel: panel }),
  closePanel: () => set({ isPanelOpen: false }),
  togglePanel: (panel: PanelType) => {
    const { isPanelOpen, activePanel } = get();
    if (isPanelOpen && activePanel === panel) {
      set({ isPanelOpen: false });
    } else {
      set({ isPanelOpen: true, activePanel: panel });
    }
  },
}));