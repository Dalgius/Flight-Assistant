import { z } from 'zod';
import type { FlightPlan, FlightPlanSettings, SurveyMission } from '@/components/flight-planner/types';

export const DEFAULT_SETTINGS: FlightPlanSettings = {
  defaultAltitude: 50,
  flightSpeed: 2.5,
  pathType: 'curved',
  homeElevationMsl: 0,
  altitudeAdaptationMode: 'relative',
  desiredAGL: 50,
  desiredAMSL: 100,
};

const MAX_IMPORTED_ITEMS = 10000;
const MAX_REPORTED_ERRORS = 10;

const finite = () => z.number().finite();
const id = () => z.number().int().positive();

// Older exports serialized Leaflet LatLng objects as { _lat, _lng }.
const latLngSchema = z.preprocess(
  value => {
    if (!value || typeof value !== 'object' || 'lat' in value || !('_lat' in value)) return value;
    const legacy = value as { _lat?: unknown; _lng?: unknown };
    return { lat: legacy._lat, lng: legacy._lng };
  },
  z.object({
    lat: finite().min(-90).max(90),
    lng: finite().min(-180).max(180),
  })
);

// Older versions accepted mission types as heading control values.
const headingControlSchema = z.preprocess(
  value => value === 'grid' || value === 'facade' ? 'fixed' : value === 'orbit' ? 'poi_track' : value,
  z.enum(['auto', 'fixed', 'poi_track'])
);

const settingsSchema = z.object({
  defaultAltitude: finite().min(1).max(500),
  flightSpeed: finite().positive().max(15),
  pathType: z.enum(['straight', 'curved']),
  homeElevationMsl: finite(),
  altitudeAdaptationMode: z.enum(['relative', 'agl', 'amsl']),
  desiredAGL: finite(),
  desiredAMSL: finite(),
}).partial();

const waypointSchema = z.object({
  id: id(),
  latlng: latLngSchema,
  altitude: finite(),
  hoverTime: finite().min(0),
  gimbalPitch: finite().min(-90).max(60),
  headingControl: headingControlSchema,
  fixedHeading: finite().default(0),
  cameraAction: z.enum(['none', 'takePhoto', 'startRecord', 'stopRecord']).default('none'),
  targetPoiId: z.number().int().nullable().default(null),
  terrainElevationMSL: finite().nullable().default(null),
  waypointType: z.enum(['generic', 'orbit', 'grid', 'facade']).default('generic'),
});

const poiSchema = z.object({
  id: id(),
  name: z.string().max(200),
  latlng: latLngSchema,
  objectHeightAboveGround: finite().default(0),
  terrainElevationMSL: finite().nullable().default(null),
  altitude: finite().optional(),
}).transform(poi => ({
  ...poi,
  altitude: poi.terrainElevationMSL !== null
    ? poi.terrainElevationMSL + poi.objectHeightAboveGround
    : poi.altitude ?? poi.objectHeightAboveGround,
}));

const missionBase = {
  id: id(),
  name: z.string().max(200),
  waypointIds: z.array(z.number().int()).max(MAX_IMPORTED_ITEMS),
};

const missionSchema = z.discriminatedUnion('type', [
  z.object({
    ...missionBase,
    type: z.literal('Grid'),
    parameters: z.object({ altitude: finite(), sidelap: finite(), frontlap: finite(), angle: finite() }),
    polygon: z.array(latLngSchema).max(MAX_IMPORTED_ITEMS).optional(),
  }),
  z.object({
    ...missionBase,
    type: z.literal('Facade'),
    parameters: z.object({
      side: z.enum(['left', 'right']),
      distance: finite(),
      minHeight: finite(),
      maxHeight: finite(),
      horizontalOverlap: finite(),
      verticalOverlap: finite(),
      gimbalPitch: finite(),
    }),
    line: z.object({ start: latLngSchema, end: latLngSchema }).optional(),
  }),
  z.object({
    ...missionBase,
    type: z.literal('Orbit'),
    parameters: z.object({ poiId: z.number().int(), radius: finite(), numPoints: z.number().int() }),
  }),
]);

const flightPlanSchema = z.object({
  settings: settingsSchema.default({}),
  waypoints: z.array(waypointSchema).max(MAX_IMPORTED_ITEMS),
  pois: z.array(poiSchema).max(MAX_IMPORTED_ITEMS).default([]),
  missions: z.array(missionSchema).max(MAX_IMPORTED_ITEMS).default([]),
}).superRefine((plan, ctx) => {
  const checkUnique = (items: { id: number }[], path: string) => {
    const seen = new Set<number>();
    items.forEach((item, index) => {
      if (seen.has(item.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path, index, 'id'], message: `Duplicate ID ${item.id}` });
      }
      seen.add(item.id);
    });
  };
  checkUnique(plan.waypoints, 'waypoints');
  checkUnique(plan.pois, 'pois');
  checkUnique(plan.missions, 'missions');
});

export type FlightPlanParseResult = { ok: true; plan: FlightPlan } | { ok: false; errors: string[] };

// Validates and normalizes an imported flight plan. Unknown fields are dropped,
// so nothing outside the schema reaches the UI or the KML/KMZ exports.
export function parseFlightPlan(raw: unknown): FlightPlanParseResult {
  const result = flightPlanSchema.safeParse(raw);
  if (!result.success) {
    const errors = result.error.issues.slice(0, MAX_REPORTED_ERRORS).map(issue =>
      issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message
    );
    if (result.error.issues.length > MAX_REPORTED_ERRORS) {
      errors.push(`… +${result.error.issues.length - MAX_REPORTED_ERRORS}`);
    }
    return { ok: false, errors };
  }

  const { settings, waypoints, pois, missions } = result.data;
  const poiIds = new Set(pois.map(poi => poi.id));
  return {
    ok: true,
    plan: {
      settings: { ...DEFAULT_SETTINGS, ...settings },
      // A reference to a missing POI would make POI tracking point nowhere.
      waypoints: waypoints.map(wp => wp.targetPoiId !== null && !poiIds.has(wp.targetPoiId) ? { ...wp, targetPoiId: null } : wp),
      pois,
      missions: missions as SurveyMission[],
    },
  };
}
