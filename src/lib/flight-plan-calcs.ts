import type { LatLng } from "@/components/flight-planner/types";

const R_EARTH = 6371000; // Earth's radius in meters

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
