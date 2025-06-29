
"use client";

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-geometryutil';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, ScaleControl, Polyline, Marker, useMap, useMapEvents, Popup } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ZoomIn, LocateFixed, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Waypoint, POI, LatLng, DrawingState, FlightPlanSettings } from './types';
import { calculateBearing, createSmoothPath } from '@/lib/flight-plan-calcs';

// Fix for default Leaflet icon path issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const MapInteractionManager = ({ drawingState, onMapClick }: { drawingState: DrawingState; onMapClick: (latlng: LatLng, event: any) => void; }) => {
    const map = useMap();

    // Drawing states
    const [radiusLinePoints, setRadiusLinePoints] = useState<LatLng[] | null>(null);
    const [surveyPolygonPoints, setSurveyPolygonPoints] = useState<LatLng[]>([]);
    const [angleLinePoints, setAngleLinePoints] = useState<LatLng[] | null>(null);
    const [facadeLinePoints, setFacadeLinePoints] = useState<LatLng[] | null>(null);

    useEffect(() => {
        // Reset all drawing states when mode changes
        setRadiusLinePoints(null);
        setSurveyPolygonPoints([]);
        setAngleLinePoints(null);
        setFacadeLinePoints(null);

        if (drawingState.mode) {
            map.getContainer().style.cursor = 'crosshair';
        } else {
            map.getContainer().style.cursor = '';
        }

        return () => { map.getContainer().style.cursor = ''; }
    }, [drawingState.mode, map]);

    useMapEvents({
        click(e) {
            if (drawingState.mode === 'surveyArea') {
                const newPoints = [...surveyPolygonPoints, e.latlng];
                const clickTolerance = map.getZoom() > 15 ? 20 / (map.getZoom() - 14) : 20;
                if (surveyPolygonPoints.length >= 3 && L.latLng(e.latlng).distanceTo(L.latLng(surveyPolygonPoints[0])) < clickTolerance ) {
                    drawingState.onComplete(surveyPolygonPoints); 
                    setSurveyPolygonPoints([]);
                    return;
                }
                setSurveyPolygonPoints(newPoints);
            } else if (drawingState.mode === null) {
                onMapClick(e.latlng, e);
            }
        },
        mousedown(e) {
            if (drawingState.mode === 'orbitRadius' && drawingState.center) {
                map.dragging.disable();
                setRadiusLinePoints([drawingState.center, e.latlng]);
            } else if (drawingState.mode === 'surveyAngle') {
                map.dragging.disable();
                setAngleLinePoints([e.latlng, e.latlng]);
            } else if (drawingState.mode === 'facadeLine') {
                map.dragging.disable();
                setFacadeLinePoints([e.latlng, e.latlng]);
            }
        },
        mousemove(e) {
            if (radiusLinePoints) {
                setRadiusLinePoints([radiusLinePoints[0], e.latlng]);
            } else if (angleLinePoints) {
                setAngleLinePoints([angleLinePoints[0], e.latlng]);
            } else if (facadeLinePoints) {
                setFacadeLinePoints([facadeLinePoints[0], e.latlng]);
            }
        },
        mouseup(e) {
            if (radiusLinePoints) {
                map.dragging.enable();
                const radius = L.latLng(radiusLinePoints[0]).distanceTo(e.latlng);
                drawingState.onComplete(radius);
                setRadiusLinePoints(null);
            } else if (angleLinePoints) {
                map.dragging.enable();
                const angle = calculateBearing(angleLinePoints[0], e.latlng);
                drawingState.onComplete(angle);
                setAngleLinePoints(null);
            } else if (facadeLinePoints) {
                map.dragging.enable();
                drawingState.onComplete({ start: facadeLinePoints[0], end: e.latlng });
                setFacadeLinePoints(null);
            }
        }
    });

    const vertexMarkers = surveyPolygonPoints.map((p, i) => (
         <Marker key={`v-${i}`} position={p} icon={L.divIcon({
            className: 'survey-vertex-marker',
            html: `<div style="background: ${i === 0 ? '#2ecc71' : '#e74c3c'}; border: 1px solid white; border-radius: 50%; width: 10px; height: 10px;"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        })} />
    ));

    const polygonPreview = surveyPolygonPoints.length > 1 
      ? <Polyline positions={surveyPolygonPoints.length > 2 ? [...surveyPolygonPoints, surveyPolygonPoints[0]] : surveyPolygonPoints} color="#1abc9c" weight={2} dashArray="5, 5" />
      : null;

    return (
        <>
            {radiusLinePoints && <Polyline positions={radiusLinePoints} color="#f39c12" weight={3} dashArray="5, 5" />}
            {angleLinePoints && <Polyline positions={angleLinePoints} color="#f39c12" weight={3} dashArray="5, 5" />}
            {facadeLinePoints && <Polyline positions={facadeLinePoints} color="#1abc9c" weight={3} dashArray="10, 10" />}
            {polygonPreview}
            {vertexMarkers}
        </>
    );
};

const MapController = ({ waypoints, isPanelOpen, selectedWaypointId }: { waypoints: Waypoint[], isPanelOpen: boolean, selectedWaypointId: number | null }) => {
    const map = useMap();

    useEffect(() => {
        // Adjust map size when the side panel opens/closes
        setTimeout(() => map.invalidateSize(), 310);
    }, [isPanelOpen, map]);

    useEffect(() => {
        // Pan to the selected waypoint, but only when the ID changes.
        // This prevents re-panning when waypoint data is edited.
        if (selectedWaypointId) {
            const wp = waypoints.find(w => w.id === selectedWaypointId);
            if (wp) {
                map.panTo(wp.latlng);
            }
        }
    }, [selectedWaypointId, map]); // `waypoints` is intentionally omitted to prevent re-panning on data edits.

    return null;
};

const createWaypointIcon = (waypoint: Waypoint, displayIndex: number, isSelectedSingle: boolean, isMultiSelected: boolean, isHomePoint: boolean, waypoints: Waypoint[], pois: POI[]): L.DivIcon => {
    let bgColor = '#3498db';
    let iconHtmlContent = String(displayIndex);
    let borderStyle = '2px solid white';
    let classNameSuffix = '';
    let currentSize = 24;
    let currentFontSize = 12;

    if (isHomePoint) {
        bgColor = '#27ae60';
        iconHtmlContent = '🏠';
        borderStyle = '2px solid #ffffff';
        classNameSuffix = 'home-point-wp';
        currentSize = 28;
        currentFontSize = 16;
    } else if (isSelectedSingle) {
        bgColor = '#e74c3c';
        classNameSuffix = 'selected-single';
        currentSize = Math.round(24 * 1.2);
        currentFontSize = Math.round(12 * 1.2);
        if (isMultiSelected) {
            borderStyle = '3px solid #f39c12';
        }
    } else if (isMultiSelected) {
        bgColor = '#f39c12';
        classNameSuffix = 'selected-multi';
        currentSize = Math.round(24 * 1.1);
        currentFontSize = Math.round(12 * 1.1);
        borderStyle = '2px solid #ffeb3b';
    }

    currentSize = Math.round(currentSize);
    currentFontSize = Math.round(currentFontSize);

    let headingAngleDeg = 0;
    let arrowColor = 'transparent';
    const wpIndex = waypoints.findIndex(w => w.id === waypoint.id);

    if (waypoint.headingControl === 'auto') {
        arrowColor = '#3498db';
        if (wpIndex < waypoints.length - 1) {
            headingAngleDeg = calculateBearing(waypoint.latlng, waypoints[wpIndex + 1].latlng);
        } else if (wpIndex > 0) {
            headingAngleDeg = calculateBearing(waypoints[wpIndex - 1].latlng, waypoint.latlng);
        } else {
            arrowColor = 'transparent';
        }
    } else if (waypoint.headingControl === 'fixed') {
        headingAngleDeg = waypoint.fixedHeading;
        arrowColor = '#607d8b';
    } else if (waypoint.headingControl === 'poi_track' && waypoint.targetPoiId !== null) {
        const targetPoi = pois.find(p => p.id === waypoint.targetPoiId);
        if (targetPoi) {
            headingAngleDeg = calculateBearing(waypoint.latlng, targetPoi.latlng);
            arrowColor = '#4CAF50';
        } else {
            arrowColor = 'transparent';
        }
    }

    let headingIndicatorSvg = '';
    if (arrowColor !== 'transparent') {
        const circleRadius = currentSize / 2;
        const arrowheadLength = 8;
        const arrowheadWidth = 7;
        const gapFromCircle = 2;
        const arrowBaseY = -(circleRadius + gapFromCircle);
        const arrowTipY = -(circleRadius + gapFromCircle + arrowheadLength);
        const baseCornerOffsetX = arrowheadWidth / 2;
        const polygonPoints = `${baseCornerOffsetX},${arrowBaseY} ${-baseCornerOffsetX},${arrowBaseY} 0,${arrowTipY}`;
        const maxArrowExtent = circleRadius + gapFromCircle + arrowheadLength;
        const svgContainerSize = maxArrowExtent * 2 + arrowheadWidth;
        const svgCenterX = svgContainerSize / 2;
        const svgCenterY = svgContainerSize / 2;

        headingIndicatorSvg = `
            <svg width="${svgContainerSize}" height="${svgContainerSize}" 
                 style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); overflow: visible; z-index: 5;">
                <g transform="translate(${svgCenterX}, ${svgCenterY}) rotate(${headingAngleDeg})">
                    <polygon points="${polygonPoints}" fill="${arrowColor}"/>
                </g>
            </svg>
        `;
    }

    return L.divIcon({
        className: `waypoint-marker ${classNameSuffix}`,
        html: `
            <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <div style="background: ${bgColor}; color: white; border-radius: 50%; width: ${currentSize}px; height: ${currentSize}px; display: flex; align-items: center; justify-content: center; font-size: ${currentFontSize}px; font-weight: bold; border: ${borderStyle}; box-shadow: 0 2px 4px rgba(0,0,0,0.3); line-height: ${currentSize}px; position: relative; z-index: 10;">
                    ${iconHtmlContent}
                </div>
                ${headingIndicatorSvg}
            </div>`,
        iconSize: [currentSize, currentSize],
        iconAnchor: [currentSize / 2, currentSize / 2],
    });
};

const WaypointMarker = ({ waypoint, displayIndex, waypoints, pois, settings, isSelected, isMultiSelected, onClick, onDragEnd }: any) => {
    const markerRef = useRef<L.Marker>(null);
    const isHome = waypoints[0]?.id === waypoint.id;

    const icon = useMemo(() => createWaypointIcon(waypoint, displayIndex, isSelected, isMultiSelected, isHome, waypoints, pois), 
        [waypoint, displayIndex, isSelected, isMultiSelected, isHome, waypoints, pois]);
    
    const zIndexOffset = isHome ? 1500 : (isSelected ? 1000 : (isMultiSelected ? 500 : 0));

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    onDragEnd(waypoint.id, { latlng: (marker as L.Marker).getLatLng() });
                }
            },
            click() {
                onClick(waypoint.id);
            },
            mouseover: (e: L.LeafletMouseEvent) => {
                e.target.openPopup();
            },
            mouseout: (e: L.LeafletMouseEvent) => {
                e.target.closePopup();
            },
        }),
        [waypoint.id, onDragEnd, onClick]
    );

    const homeElevation = settings?.homeElevationMsl ?? 0;
    const altitudeRelToHome = waypoint.altitude;
    const amslText = `${(homeElevation + altitudeRelToHome).toFixed(1)} m`;
    const aglText = waypoint.terrainElevationMSL !== null ? `${((homeElevation + altitudeRelToHome) - waypoint.terrainElevationMSL).toFixed(1)}m` : "N/A";
    const terrainElevText = waypoint.terrainElevationMSL !== null ? `${waypoint.terrainElevationMSL.toFixed(1)}m` : "N/A";

    return (
        <Marker
            ref={markerRef}
            position={waypoint.latlng}
            icon={icon}
            draggable={true}
            eventHandlers={eventHandlers}
            zIndexOffset={zIndexOffset}
        >
            <Popup autoPan={false}>
                <div className="text-xs leading-snug">
                    <strong className="text-sm">Waypoint {displayIndex}</strong><br />
                    Lat: {waypoint.latlng.lat.toFixed(5)}, Lng: {waypoint.latlng.lng.toFixed(5)}<br />
                    Flight Alt (Rel): {altitudeRelToHome} m<br />
                    AMSL Alt: {amslText}<br />
                    AGL Alt: {aglText}<br />
                    Terrain Elev: {terrainElevText}<br />
                    Gimbal: {waypoint.gimbalPitch}° | Hover: {waypoint.hoverTime}s
                </div>
            </Popup>
        </Marker>
    );
};

const PoiMarker = ({ poi, onClick, onDragEnd }: any) => {
    const markerRef = useRef(null);

    const icon = L.divIcon({
        className: 'poi-marker',
        html: `<div style="background: #f39c12; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">🎯</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });
    
    const eventHandlers = useMemo(() => ({
        click() {
            // POI selection logic can be added here
        }
    }), [poi.id, onClick]);

    return <Marker ref={markerRef} position={poi.latlng} icon={icon} eventHandlers={eventHandlers} />;
};


interface MapViewProps {
  isPanelOpen: boolean;
  waypoints: Waypoint[];
  pois: POI[];
  pathType: 'straight' | 'curved';
  altitudeAdaptationMode: FlightPlanSettings['altitudeAdaptationMode'];
  settings: FlightPlanSettings;
  selectedWaypointId: number | null;
  multiSelectedWaypointIds: Set<number>;
  drawingState: DrawingState;
  onMapClick: (latlng: LatLng, event: any) => void;
  onMarkerClick: (id: number) => void;
  onMarkerDragEnd: (id: number, updates: Partial<Waypoint>) => void;
}

const satelliteLayer = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Tiles &copy; Esri',
  maxZoom: 25,
  maxNativeZoom: 21,
};

const defaultLayer = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 22,
  maxNativeZoom: 19,
};

export function MapView(props: MapViewProps) {
  const { isPanelOpen, waypoints, pois, pathType, altitudeAdaptationMode, settings, selectedWaypointId, multiSelectedWaypointIds, drawingState, onMapClick, onMarkerClick, onMarkerDragEnd } = props;
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const mapRef = useRef<L.Map>(null);

  const toggleSatellite = () => setIsSatelliteView(prev => !prev);
  const currentLayer = isSatelliteView ? satelliteLayer : defaultLayer;

  const pathCoords = useMemo(() => {
    if (waypoints.length < 2) return [];
    const points = waypoints.map(wp => wp.latlng);
    if (pathType === 'curved') {
        return createSmoothPath(points);
    }
    return points;
  }, [waypoints, pathType]);

  const pathOptions = useMemo(() => {
    const color = (() => {
        switch (altitudeAdaptationMode) {
            case 'agl': return '#27ae60'; // Green
            case 'amsl': return '#e67e22'; // Orange
            default: return '#3498db'; // Blue
        }
    })();
    return {
        color: color,
        weight: 3,
        dashArray: pathType === 'straight' ? '5, 5' : undefined,
    };
  }, [altitudeAdaptationMode, pathType]);
  
  return (
    <div className={cn('flex-1 h-full transition-all duration-300 ease-in-out', isPanelOpen ? 'ml-[350px]' : 'ml-0')}>
        <div id="map" className="relative h-full w-full bg-gray-800">
            <MapContainer ref={mapRef} center={[42.5, 12.5]} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
              <TileLayer
                attribution={currentLayer.attribution}
                url={currentLayer.url}
                maxZoom={currentLayer.maxZoom}
                maxNativeZoom={currentLayer.maxNativeZoom}
                key={isSatelliteView ? 'satellite' : 'default'}
              />
              <ScaleControl position="bottomleft" />
              <MapController 
                waypoints={waypoints} 
                isPanelOpen={isPanelOpen} 
                selectedWaypointId={selectedWaypointId}
              />
              <MapInteractionManager onMapClick={onMapClick} drawingState={drawingState} />


              {pathCoords.length > 1 && <Polyline pathOptions={pathOptions} positions={pathCoords} />}

              {waypoints.map((wp, index) => (
                <WaypointMarker 
                    key={wp.id} 
                    waypoint={wp}
                    displayIndex={index + 1}
                    waypoints={waypoints}
                    pois={pois}
                    settings={settings}
                    isSelected={selectedWaypointId === wp.id}
                    isMultiSelected={multiSelectedWaypointIds.has(wp.id)}
                    onClick={onMarkerClick}
                    onDragEnd={onMarkerDragEnd}
                />
              ))}

              {pois.map(p => (
                  <PoiMarker key={p.id} poi={p} />
              ))}
            </MapContainer>
           
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild><Button variant="secondary" size="icon" onClick={toggleSatellite}><Layers className="w-5 h-5" /></Button></TooltipTrigger>
                        <TooltipContent><p>Toggle Satellite View</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild><Button variant="secondary" size="icon" onClick={() => { if (mapRef.current && pathCoords.length > 0) mapRef.current.fitBounds(L.latLngBounds(pathCoords).pad(0.1)); }}><ZoomIn className="w-5 h-5" /></Button></TooltipTrigger>
                        <TooltipContent><p>Fit to Mission</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild><Button variant="secondary" size="icon" onClick={() => mapRef.current?.locate()}><LocateFixed className="w-5 h-5" /></Button></TooltipTrigger>
                        <TooltipContent><p>My Location</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    </div>
  );
}
