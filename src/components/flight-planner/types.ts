
export type PanelType = 'settings' | 'waypoints' | 'pois' | 'missions' | 'terrain' | 'file' | 'stats';

export type DialogType = 'orbit' | 'survey' | 'facade' | null;

export interface SurveyMission {
  id: number;
  name: string;
  type: 'Grid' | 'Facade' | 'Orbit';
  waypointIds: number[];
  parameters: any;
  polygon?: LatLng[];
  line?: { start: LatLng; end: LatLng };
}

export interface PanelProps {
  [key: string]: any; 
  missions?: SurveyMission[];
  deleteMission?: (id: number) => void;
  editMission?: (id: number) => void;
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

export interface SurveyGridParams {
  altitude: number;
  sidelap: number;
  frontlap: number;
  angle: number;
  polygon: LatLng[];
}

export interface FacadeScanParams {
  side: 'left' | 'right';
  distance: number;
  minHeight: number;
  maxHeight: number;
  horizontalOverlap: number;
  verticalOverlap: number;
  gimbalPitch: number;
}

export interface DrawingState {
  mode: 'orbitRadius' | 'surveyArea' | 'surveyAngle' | 'facadeLine' | null;
  center?: LatLng;
  onComplete: (value: any) => void;
}

export interface GeneratedWaypointData {
    latlng: LatLng;
    options: {
        altitude: number;
        cameraAction: CameraAction;
        headingControl: HeadingControl;
        fixedHeading: number;
        gimbalPitch: number;
        waypointType: WaypointType;
    }
}
