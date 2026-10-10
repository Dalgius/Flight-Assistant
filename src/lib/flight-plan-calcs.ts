
import type { LatLng, Waypoint, CameraAction, HeadingControl, WaypointType, FacadeScanParams, GeneratedWaypointData, FlightPlan, POI } from "@/components/flight-planner/types";

export const R_EARTH = 6371000; // Earth's radius in meters

export const CAMERA_CONSTANTS = {
    sensorWidth_mm: 8.976,
    sensorHeight_mm: 6.716,
    focalLength_mm: 6.88,
};

// Upper bound for auto-generated missions, protects the browser from runaway loops.
export const MAX_GENERATED_WAYPOINTS = 2000;

export function toRad(degrees: number): number {
    return degrees * Math.PI / 180;
}

// Maps any heading in degrees to the WPML range [-180, 180].
export function normalizeHeading(degrees: number): number {
    const h = ((degrees % 360) + 360) % 360;
    return h > 180 ? h - 360 : h;
}

export function isValidOverlap(overlap: number): boolean {
    return Number.isFinite(overlap) && overlap >= 0 && overlap < 100;
}

export function haversineDistance(coords1: LatLng, coords2: LatLng): number {
    const lat1 = coords1.lat;
    const lon1 = coords1.lng;
    const lat2 = coords2.lat;
    const lon2 = coords2.lng;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R_EARTH * c;
}

export function calculateBearing(point1LatLng: LatLng, point2LatLng: LatLng): number {
    const lat1 = toRad(point1LatLng.lat);
    const lon1 = toRad(point1LatLng.lng);
    const lat2 = toRad(point2LatLng.lat);
    const lon2 = toRad(point2LatLng.lng);
    const dLon = lon2 - lon1;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let brng = Math.atan2(y, x) * 180 / Math.PI;

    return (brng + 360) % 360; 
}

export function destinationPoint(startLatLng: LatLng, bearingDeg: number, distanceMeters: number): LatLng {
    const angularDistance = distanceMeters / R_EARTH; 
    const bearingRad = toRad(bearingDeg);

    const lat1 = toRad(startLatLng.lat);
    const lon1 = toRad(startLatLng.lng);

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angularDistance) +
                           Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearingRad));

    let lon2 = lon1 + Math.atan2(Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1),
                                 Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2));

    lon2 = (lon2 * 180 / Math.PI + 540) % 360 - 180;

    return { lat: lat2 * 180 / Math.PI, lng: lon2 };
}

export function calculateRequiredGimbalPitch(observerAMSL: number, targetAMSL: number, horizontalDistance: number): number {
    if (horizontalDistance <= 0.1) {
        if (targetAMSL < observerAMSL) return -90; 
        if (targetAMSL > observerAMSL) return 60;  
        return 0;
    }

    const deltaAltitude = targetAMSL - observerAMSL;

    let pitchAngleRad = Math.atan2(deltaAltitude, horizontalDistance);
    let pitchAngleDeg = pitchAngleRad * (180 / Math.PI);

    pitchAngleDeg = Math.max(-90, Math.min(60, pitchAngleDeg));
    
    return Math.round(pitchAngleDeg);
}

function getCatmullRomPoint(t: number, p0: LatLng, p1: LatLng, p2: LatLng, p3: LatLng): LatLng {
    const t2 = t * t;
    const t3 = t2 * t;

    const f1 = -0.5 * t3 + t2 - 0.5 * t;
    const f2 = 1.5 * t3 - 2.5 * t2 + 1;
    const f3 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
    const f4 = 0.5 * t3 - 0.5 * t2;

    const lat = p0.lat * f1 + p1.lat * f2 + p2.lat * f3 + p3.lat * f4;
    const lng = p0.lng * f1 + p1.lng * f2 + p2.lng * f3 + p3.lng * f4;

    return { lat, lng };
}

export function createSmoothPath(points: LatLng[]): LatLng[] {
    if (points.length < 2) return points;
    if (points.length === 2) return [points[0], points[1]];

    const smoothed: LatLng[] = [];
    const numSegmentsBetweenPoints = 15;

    smoothed.push(points[0]);

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = (i === 0) ? points[0] : points[i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = (i === points.length - 2) ? points[points.length - 1] : points[i + 2];

        for (let j = 1; j <= numSegmentsBetweenPoints; j++) {
            const t = j / numSegmentsBetweenPoints;
            smoothed.push(getCatmullRomPoint(t, p0, p1, p2, p3));
        }
    }
    return smoothed;
}


function calculateFootprint(altitudeAGL: number) {
    const { focalLength_mm, sensorWidth_mm, sensorHeight_mm } = CAMERA_CONSTANTS;
    if (!focalLength_mm || focalLength_mm === 0) return { width: 0, height: 0 };
    const footprintWidth = (sensorWidth_mm / focalLength_mm) * altitudeAGL;
    const footprintHeight = (sensorHeight_mm / focalLength_mm) * altitudeAGL;
    return { width: footprintWidth, height: footprintHeight };
}
  
function rotateLatLng(pointLatLng: LatLng, centerLatLng: LatLng, angleRadians: number): LatLng {
    const cosAngle = Math.cos(angleRadians);
    const sinAngle = Math.sin(angleRadians);
    const dLngScaled = (pointLatLng.lng - centerLatLng.lng) * Math.cos(toRad(centerLatLng.lat));
    const dLat = pointLatLng.lat - centerLatLng.lat;
    
    const rotatedDLngScaled = dLngScaled * cosAngle - dLat * sinAngle;
    const rotatedDLat = dLngScaled * sinAngle + dLat * cosAngle;

    const finalLng = centerLatLng.lng + (rotatedDLngScaled / Math.cos(toRad(centerLatLng.lat)));
    const finalLat = centerLatLng.lat + rotatedDLat;
    return { lat: finalLat, lng: finalLng };
}

function isPointInPolygon(point: LatLng, polygonVertices: LatLng[]): boolean {
    if (!point || !polygonVertices || polygonVertices.length < 3) return false;
    let isInside = false;
    const x = point.lng, y = point.lat;
    for (let i = 0, j = polygonVertices.length - 1; i < polygonVertices.length; j = i++) {
        const xi = polygonVertices[i].lng, yi = polygonVertices[i].lat;
        const xj = polygonVertices[j].lng, yj = polygonVertices[j].lat;
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
}

export function generateSurveyGridWaypoints(
    polygonLatLngs: LatLng[], 
    params: { altitude: number; sidelap: number; frontlap: number; angle: number; }
): GeneratedWaypointData[] {
    const { altitude, sidelap, frontlap, angle } = params;
    
    const MIN_POLYGON_POINTS = 3;
    if (!polygonLatLngs || polygonLatLngs.length < MIN_POLYGON_POINTS) return [];
    if (!isValidOverlap(sidelap) || !isValidOverlap(frontlap) || !Number.isFinite(angle)) return [];
    
    const footprint = calculateFootprint(altitude);
    if (!(footprint.width > 0) || !(footprint.height > 0)) return [];

    const fixedGridHeading = angle;
    const rotationAngleDeg = -(fixedGridHeading); 
    const actualLineSpacing = footprint.width * (1 - sidelap / 100);
    const actualDistanceBetweenPhotos = footprint.height * (1 - frontlap / 100);
    const rotationCenter = polygonLatLngs[0];
    const angleRad = toRad(rotationAngleDeg);
    const rotatedPolygonLatLngs = polygonLatLngs.map(p => rotateLatLng(p, rotationCenter, -angleRad));

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    rotatedPolygonLatLngs.forEach(p => {
        minLat = Math.min(minLat, p.lat);
        maxLat = Math.max(maxLat, p.lat);
        minLng = Math.min(minLng, p.lng);
        maxLng = Math.max(maxLng, p.lng);
    });
    
    const lineSpacingRotLng = (actualLineSpacing / (R_EARTH * Math.cos(toRad(rotationCenter.lat)))) * (180 / Math.PI);
    const photoSpacingRotLat = (actualDistanceBetweenPhotos / R_EARTH) * (180 / Math.PI);
    if (!(lineSpacingRotLng > 0) || !(photoSpacingRotLat > 0)) return [];

    // Candidate points over the bounding box: an upper bound on the generated waypoints.
    const estimatedCandidates = ((maxLng - minLng) / lineSpacingRotLng + 2) * ((maxLat - minLat) / photoSpacingRotLat + 1);
    if (estimatedCandidates > MAX_GENERATED_WAYPOINTS * 4) return [];

    let currentRotLng = minLng;
    let scanDir = 1;
    const finalWaypointsData: GeneratedWaypointData[] = [];

    while (currentRotLng <= maxLng + lineSpacingRotLng * 0.5) {
        const lineCandRot = [];

        if (scanDir === 1) { 
            for (let lat = minLat; lat <= maxLat; lat += photoSpacingRotLat) lineCandRot.push({ lat, lng: currentRotLng });
        } else {
            for (let lat = maxLat; lat >= minLat; lat -= photoSpacingRotLat) lineCandRot.push({ lat, lng: currentRotLng });
        }

        const wpOptions = { 
            altitude: altitude, 
            cameraAction: 'takePhoto' as const, 
            headingControl: 'fixed' as const, 
            fixedHeading: Math.round(fixedGridHeading),
            gimbalPitch: -90, 
            waypointType: 'grid' as const,
        };

        lineCandRot.forEach(rotPt => {
            const actualGeoPt = rotateLatLng(rotPt, rotationCenter, angleRad);
            if (isPointInPolygon(actualGeoPt, polygonLatLngs)) {
                finalWaypointsData.push({ latlng: actualGeoPt, options: wpOptions });
            }
        });

        currentRotLng += lineSpacingRotLng;
        scanDir *= -1;
    }
    
    const uniqueWaypoints: GeneratedWaypointData[] = [];
    const seenKeys = new Set<string>();
    for (const wp of finalWaypointsData) {
        const key = `${wp.latlng.lat.toFixed(7)},${wp.latlng.lng.toFixed(7)}`;
        if (!seenKeys.has(key)) {
            uniqueWaypoints.push(wp);
            seenKeys.add(key);
        }
    }
    return uniqueWaypoints.length > MAX_GENERATED_WAYPOINTS ? [] : uniqueWaypoints;
}

export function generateFacadeWaypoints(
  startPoint: LatLng,
  endPoint: LatLng,
  params: FacadeScanParams
): GeneratedWaypointData[] {
    const { side, distance, minHeight, maxHeight, gimbalPitch, horizontalOverlap, verticalOverlap } = params;
    
    const facadeBearing = calculateBearing(startPoint, endPoint);
    
    const offsetAngle = (side === 'left') ? -90 : 90;
    const offsetBearing = (facadeBearing + offsetAngle + 360) % 360;
    const droneHeading = (facadeBearing - offsetAngle + 360) % 360;

    const { sensorWidth_mm, sensorHeight_mm, focalLength_mm } = CAMERA_CONSTANTS;
    const verticalFootprint = (sensorHeight_mm / focalLength_mm) * distance;
    const horizontalFootprint = (sensorWidth_mm / focalLength_mm) * distance;
    
    if (!(distance > 0) || !isValidOverlap(horizontalOverlap) || !isValidOverlap(verticalOverlap)) return [];

    const verticalStep = verticalFootprint * (1 - verticalOverlap / 100);
    const horizontalStep = horizontalFootprint * (1 - horizontalOverlap / 100);
    if (!(verticalStep > 0) || !(horizontalStep > 0)) return [];

    const facadeLength = haversineDistance(startPoint, endPoint);
    
    const numHorizontalPoints = facadeLength > 0 ? Math.floor(facadeLength / horizontalStep) + 1 : 1;
    const numVerticalPoints = maxHeight > minHeight ? Math.floor((maxHeight - minHeight) / verticalStep) + 1 : 1;
    if (numHorizontalPoints * numVerticalPoints > MAX_GENERATED_WAYPOINTS) return [];
    
    let scanDirection = 1;
    const finalWaypointsData: GeneratedWaypointData[] = [];

    for (let i = 0; i < numVerticalPoints; i++) {
        const currentHeight = Math.min(maxHeight, minHeight + i * verticalStep);
        
        for (let j = 0; j < numHorizontalPoints; j++) {
            let pointIndex = scanDirection === 1 ? j : (numHorizontalPoints - 1 - j);
            
            const fractionAlongFacade = numHorizontalPoints > 1 
                                        ? Math.min(1, (pointIndex * horizontalStep) / facadeLength) 
                                        : 0;
            
            const pointOnFacade = {
                lat: startPoint.lat + (endPoint.lat - startPoint.lat) * fractionAlongFacade,
                lng: startPoint.lng + (endPoint.lng - startPoint.lng) * fractionAlongFacade
            };
            
            const dronePosition = destinationPoint(pointOnFacade, offsetBearing, distance);

            const wpOptions = {
                altitude: currentHeight,
                headingControl: 'fixed' as const,
                fixedHeading: Math.round(droneHeading),
                gimbalPitch: gimbalPitch,
                cameraAction: 'takePhoto' as const,
                waypointType: 'facade' as const
            };

            finalWaypointsData.push({ latlng: dronePosition, options: wpOptions });
        }
        scanDirection *= -1;
    }
    return finalWaypointsData;
}

// OpenTopoData allows one request per second. All elevation requests, also from
// concurrent callers (e.g. quick POI clicks), go through this queue.
export const ELEVATION_REQUEST_INTERVAL_MS = 1100;
let elevationQueue: Promise<unknown> = Promise.resolve();
let lastElevationRequestAt = -Infinity;

export function scheduleElevationRequest<T>(request: () => Promise<T>): Promise<T> {
    const run = elevationQueue.then(async () => {
        const wait = lastElevationRequestAt + ELEVATION_REQUEST_INTERVAL_MS - Date.now();
        if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
        lastElevationRequestAt = Date.now();
        return request();
    });
    elevationQueue = run.catch(() => undefined);
    return run;
}

export async function getElevationsBatch(locations: LatLng[]): Promise<(number | null)[]> {
    if (locations.length === 0) {
        return [];
    }
    
    const batchSize = 100;
    const results: (number | null)[] = new Array(locations.length).fill(null);
    
    for (let i = 0; i < locations.length; i += batchSize) {
        const batch = locations.slice(i, i + batchSize);
        const locationsString = batch.map(loc => `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`).join('|');
        
        try {
            const response = await scheduleElevationRequest(() => fetch(`/api/elevation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ locations: locationsString }),
            }));

            if (!response.ok) {
                console.error(`Elevation API Error: Status ${response.status}`);
                continue; 
            }
            
            const data = await response.json();

            if (data.results) { // OpenTopoData may return OK but with an error message
                 data.results.forEach((result: { elevation: number | null }, indexInBatch: number) => {
                    const originalIndex = i + indexInBatch;
                    if (result.elevation !== null) {
                        results[originalIndex] = parseFloat(result.elevation.toFixed(1));
                    }
                });
            } else {
                 console.warn("Elevation API response not OK or no results:", data);
            }
        } catch (error) {
            console.error("Exception during batch elevation fetch:", error);
        }
    }

    return results;
}

// --- Import/Export Helpers ---

function validateCoordinates(lat: number, lng: number): boolean {
  return typeof lat === 'number' && isFinite(lat) &&
         typeof lng === 'number' && isFinite(lng) &&
         lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function validateGimbalPitch(pitch: number): boolean {
  return typeof pitch === 'number' && isFinite(pitch) && pitch >= -90 && pitch <= 60;
}

// Escapes text for XML content and attribute values (KML/WPML export).
export function escapeXml(value: unknown): string {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// AMSL altitude of a POI. Without terrain data the POI ground is assumed at the
// takeoff elevation, instead of treating the object height as an AMSL altitude.
export function getPoiAmsl(poi: POI, homeElevationMsl: number): number {
    const ground = poi.terrainElevationMSL ?? homeElevationMsl;
    return ground + poi.objectHeightAboveGround;
}

// Replaces a mission's waypoints keeping its position in the route: the new
// waypoints go where the first old one was (or at the end if none is left).
export function replaceMissionWaypoints(waypoints: Waypoint[], oldIds: Set<number>, newWaypoints: Waypoint[]): Waypoint[] {
    const insertAt = waypoints.findIndex(wp => oldIds.has(wp.id));
    const kept = waypoints.filter(wp => !oldIds.has(wp.id));
    if (insertAt === -1) return [...kept, ...newWaypoints];
    // Everything before the first old waypoint is kept, so its index is unchanged in `kept`.
    return [...kept.slice(0, insertAt), ...newWaypoints, ...kept.slice(insertAt)];
}

export interface WpmlValidationIssue {
    key: string;
    params?: { [key: string]: string | number };
}

export const DJI_ALTITUDE_MIN = 2;
export const DJI_ALTITUDE_MAX = 500;
export const MIN_TERRAIN_CLEARANCE_M = 2;
export const LOW_TERRAIN_CLEARANCE_M = 10;
export const MAX_LEGAL_HEIGHT_M = 120;
// DJI Fly may refuse longer missions: warn, do not block.
export const DJI_FLY_MAX_WAYPOINTS = 200;

// Errors block the export; warnings are shown but the export proceeds.
export function validateFlightPlanForWpml(waypoints: Waypoint[], homeElevationMsl: number): { errors: WpmlValidationIssue[]; warnings: WpmlValidationIssue[] } {
    const errors: WpmlValidationIssue[] = [];
    const warnings: WpmlValidationIssue[] = [];
    if (!waypoints || waypoints.length < 2) {
        errors.push({ key: "error_min_waypoints" });
    }
    if (!Number.isFinite(homeElevationMsl)) {
        errors.push({ key: "invalidTakeoffElev" });
        return { errors, warnings };
    }

    const invalidCoords: number[] = [];
    const altitudeOutOfRange: number[] = [];
    const gimbalOutOfRange: number[] = [];
    const belowTerrain: number[] = [];
    const lowClearance: number[] = [];
    const aboveLegalHeight: number[] = [];
    const unknownTerrain: number[] = [];

    (waypoints || []).forEach((wp, i) => {
        const n = i + 1;
        if (!wp.latlng || !validateCoordinates(wp.latlng.lat, wp.latlng.lng)) {
            invalidCoords.push(n);
        }
        if (typeof wp.altitude !== 'number' || !Number.isFinite(wp.altitude) || wp.altitude < DJI_ALTITUDE_MIN || wp.altitude > DJI_ALTITUDE_MAX) {
            altitudeOutOfRange.push(n);
            return;
        }
        if (wp.gimbalPitch !== undefined && !validateGimbalPitch(wp.gimbalPitch)) {
            gimbalOutOfRange.push(n);
        }
        if (typeof wp.terrainElevationMSL === 'number' && Number.isFinite(wp.terrainElevationMSL)) {
            const agl = homeElevationMsl + wp.altitude - wp.terrainElevationMSL;
            if (agl < MIN_TERRAIN_CLEARANCE_M) belowTerrain.push(n);
            else if (agl < LOW_TERRAIN_CLEARANCE_M) lowClearance.push(n);
            if (agl > MAX_LEGAL_HEIGHT_M) aboveLegalHeight.push(n);
        } else {
            unknownTerrain.push(n);
            if (wp.altitude > MAX_LEGAL_HEIGHT_M) aboveLegalHeight.push(n);
        }
    });

    const wps = (list: number[]) => list.length > 8 ? `${list.slice(0, 8).join(', ')}…` : list.join(', ');
    if (invalidCoords.length) errors.push({ key: "error_invalid_coordinates", params: { wps: wps(invalidCoords) } });
    if (altitudeOutOfRange.length) errors.push({ key: "error_altitude_range", params: { wps: wps(altitudeOutOfRange) } });
    if (gimbalOutOfRange.length) errors.push({ key: "error_gimbal_range", params: { wps: wps(gimbalOutOfRange) } });
    if (belowTerrain.length) errors.push({ key: "error_terrain_clearance", params: { wps: wps(belowTerrain), min: MIN_TERRAIN_CLEARANCE_M } });
    if (lowClearance.length) warnings.push({ key: "warning_low_clearance", params: { wps: wps(lowClearance), min: LOW_TERRAIN_CLEARANCE_M } });
    if (aboveLegalHeight.length) warnings.push({ key: "warning_above_legal_height", params: { wps: wps(aboveLegalHeight), max: MAX_LEGAL_HEIGHT_M } });
    if (unknownTerrain.length) warnings.push({ key: "warning_unknown_terrain", params: { count: unknownTerrain.length } });
    if (waypoints && waypoints.length > DJI_FLY_MAX_WAYPOINTS) warnings.push({ key: "warning_waypoint_count", params: { count: waypoints.length, max: DJI_FLY_MAX_WAYPOINTS } });

    return { errors, warnings };
}

export function calculateMissionDuration(waypoints: Waypoint[], speed: number): number {
    if (!speed || speed <= 0 || !waypoints || waypoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < waypoints.length; i++) {
        totalDistance += haversineDistance(waypoints[i-1].latlng, waypoints[i].latlng);
    }

    const baseTime = totalDistance / speed;
    const hoverTime = waypoints.reduce((total, wp) => total + (wp.hoverTime || 0), 0);
    return baseTime + hoverTime;
}

export function calculateMissionDistance(waypoints: Waypoint[]): number {
    if (!waypoints || waypoints.length < 2) return 0;
    let totalDistance = 0;
    for (let i = 1; i < waypoints.length; i++) {
        totalDistance += haversineDistance(waypoints[i-1].latlng, waypoints[i].latlng);
    }
    return totalDistance;
}
