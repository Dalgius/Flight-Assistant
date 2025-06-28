
import type { LatLng, Waypoint, CameraAction, HeadingControl, WaypointType } from "@/components/flight-planner/types";

export const R_EARTH = 6371000; // Earth's radius in meters

export const CAMERA_CONSTANTS = {
    sensorWidth_mm: 8.976,
    sensorHeight_mm: 6.716,
    focalLength_mm: 6.88,
};

export function toRad(degrees: number): number {
    return degrees * Math.PI / 180;
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

/**
 * Calculates a point on a Catmull-Rom spline.
 * This function should remain private to this module.
 */
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

/**
 * Creates a smoothed path using Catmull-Rom splines.
 * @param {LatLng[]} points - Array of LatLng points.
 * @returns {LatLng[]} Array of LatLng points for the smoothed path.
 */
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


// --- Survey Grid Calculations ---

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

interface GridWaypointData {
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

export function generateSurveyGridWaypoints(
    polygonLatLngs: LatLng[], 
    params: { altitude: number; sidelap: number; frontlap: number; angle: number; }
): GridWaypointData[] {
    const { altitude, sidelap, frontlap, angle } = params;
    
    const MIN_POLYGON_POINTS = 3;
    if (!polygonLatLngs || polygonLatLngs.length < MIN_POLYGON_POINTS) return [];
    
    const footprint = calculateFootprint(altitude);
    if (footprint.width === 0 || footprint.height === 0) return [];

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
    let currentRotLng = minLng;
    let scanDir = 1;
    const finalWaypointsData: GridWaypointData[] = [];

    while (currentRotLng <= maxLng + lineSpacingRotLng * 0.5) {
        const photoSpacingRotLat = (actualDistanceBetweenPhotos / R_EARTH) * (180 / Math.PI);
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
    
    const uniqueWaypoints: GridWaypointData[] = [];
    const seenKeys = new Set<string>();
    for (const wp of finalWaypointsData) {
        const key = `${wp.latlng.lat.toFixed(7)},${wp.latlng.lng.toFixed(7)}`;
        if (!seenKeys.has(key)) {
            uniqueWaypoints.push(wp);
            seenKeys.add(key);
        }
    }
    return uniqueWaypoints;
}
