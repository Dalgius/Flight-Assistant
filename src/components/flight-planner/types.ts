export type PanelType = 'settings' | 'waypoints' | 'pois' | 'missions' | 'terrain' | 'file' | 'stats';

export type DialogType = 'orbit' | 'survey' | 'facade' | null;

export interface PanelProps {
  // This is a generic interface for props passed to all panels
  // It will be expanded as more functionality is added
  [key: string]: any; 
}

export interface LatLng {
  lat: number;
  lng: number;
}

export type HeadingControl = 'auto' | 'fixed' | 'poi_track';
export type CameraAction = 'none' | 'takePhoto' | 'startRecord' | 'stopRecord';
export type WaypointType = 'generic' | 'orbit' | 'grid' | 'facade';

export interface Waypoint {
  id: number;
  latlng: LatLng;
  altitude: number; // Relative to takeoff
  hoverTime: number; // in seconds
  gimbalPitch: number; // in degrees
  headingControl: HeadingControl;
  fixedHeading: number; // in degrees
  cameraAction: CameraAction;
  targetPoiId: number | null;
  terrainElevationMSL: number | null;
  waypointType: WaypointType;
}

export interface POI {
  id: number;
  name: string;
  latlng: LatLng;
  altitude: number; // Final AMSL altitude
  terrainElevationMSL: number | null;
  objectHeightAboveGround: number;
}

export interface FlightPlanSettings {
  defaultAltitude: number;
  flightSpeed: number;
  pathType: 'straight' | 'curved';
  homeElevationMsl: number;
}

export interface FlightStatistics {
    totalDistance: number;
    flightTime: number; // in seconds
    waypointCount: number;
    poiCount: number;
}
