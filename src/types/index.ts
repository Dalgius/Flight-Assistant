// src/types/index.ts
import { LatLng } from "leaflet";

export interface Waypoint {
  id: number;
  latlng: LatLng;
  altitude: number;
  // ... other waypoint properties
}

export interface POI {
  id: number;
  name: string;
  latlng: LatLng;
  // ... other POI properties
}

export type PanelType = 'settings' | 'waypoints' | 'pois' | 'missions' | 'terrain' | 'file' | 'stats' | null;

export interface AppState {
  isPanelOpen: boolean;
  activePanel: PanelType;
  waypoints: Waypoint[];
  pois: POI[];
  
  openPanel: (panel: PanelType) => void;
  closePanel: () => void;
  togglePanel: (panel: PanelType) => void;
  
  // You would add more state and actions here
  // e.g., addWaypoint: (waypoint: Waypoint) => void;
}