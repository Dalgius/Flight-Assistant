
"use client";

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-geometryutil';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, ScaleControl, Polyline, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ZoomIn, LocateFixed, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Waypoint, POI, LatLng, DrawingState } from './types';
import { calculateBearing } from '@/lib/flight-plan-calcs';

// Fix for default Leaflet icon path issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


// Custom hook to handle map events
const MapEvents = ({ onMapClick, drawingState }: { onMapClick: (latlng: LatLng, event: any) => void; drawingState: DrawingState }) => {
    useMapEvents({
        click(e) {
            if (drawingState.mode === null) {
                onMapClick(e.latlng, e);
            }
        },
    });
    return null;
};

const MapDrawer = ({ drawingState }: { drawingState: DrawingState }) => {
    const map = useMap();
    const [linePoints, setLinePoints] = useState<LatLng[] | null>(null);

    useMapEvents({
        mousedown(e) {
            if (drawingState.mode === 'orbitRadius' && drawingState.center) {
                map.dragging.disable();
                setLinePoints([drawingState.center, e.latlng]);
            }
        },
        mousemove(e) {
            if (linePoints) {
                setLinePoints([linePoints[0], e.latlng]);
            }
        },
        mouseup(e) {
            if (linePoints) {
                const radius = L.latLng(linePoints[0]).distanceTo(e.latlng);
                drawingState.onComplete(radius);
                setLinePoints(null);
                map.dragging.enable();
            }
        }
    });

    useEffect(() => {
        if (drawingState.mode === 'orbitRadius') {
            map.getContainer().style.cursor = 'crosshair';
        } else {
            map.getContainer().style.cursor = '';
            setLinePoints(null); // Clear line if mode changes
        }
        return () => { // Cleanup cursor on unmount
          map.getContainer().style.cursor = '';
        }
    }, [drawingState.mode, map]);

    return linePoints ? <Polyline positions={linePoints} color="#f39c12" weight={3} dashArray="5, 5" /> : null;
}

const MapController = ({ waypoints, pois, isPanelOpen, selectedWaypointId }: { waypoints: Waypoint[], pois: POI[], isPanelOpen: boolean, selectedWaypointId: number | null }) => {
    const map = useMap();
    
    // Fit bounds on initial load
    useEffect(() => {
      const allPoints = [...waypoints.map(wp => wp.latlng), ...pois.map(p => p.latlng)];
      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.1));
        }
      } else {
        map.setView([42.5, 12.5], 6); // Default view for Italy
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    useEffect(() => {
        // Invalidate map size when panel opens/closes to fix gray areas
        setTimeout(() => map.invalidateSize(), 310);
    }, [isPanelOpen, map]);

    // Pan to newly selected waypoint
    useEffect(() => {
        if (selectedWaypointId) {
            const wp = waypoints.find(w => w.id === selectedWaypointId);
            if (wp) {
                map.panTo(wp.latlng);
            }
        }
    }, [selectedWaypointId, map, waypoints]);

    return null;
};

const createWaypointIcon = (waypoint: Waypoint, isSelectedSingle: boolean, isMultiSelected: boolean, isHomePoint: boolean, waypoints: Waypoint[], pois: POI[]): L.DivIcon => {
    let bgColor = '#3498db';
    let iconHtmlContent = String(waypoint.id);
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

const WaypointMarker = ({ waypoint, waypoints, pois, isSelected, isMultiSelected, onClick, onDragEnd }: any) => {
    const markerRef = useRef(null);
    const isHome = waypoints[0]?.id === waypoint.id;

    const icon = useMemo(() => createWaypointIcon(waypoint, isSelected, isMultiSelected, isHome, waypoints, pois), 
        [waypoint, isSelected, isMultiSelected, isHome, waypoints, pois]);
    
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
            }
        }),
        [waypoint.id, onDragEnd, onClick]
    );

    return (
        <Marker
            ref={markerRef}
            position={waypoint.latlng}
            icon={icon}
            draggable={true}
            eventHandlers={eventHandlers}
            zIndexOffset={zIndexOffset}
        />
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
        // POI drag handling can be added here if needed
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
  const { isPanelOpen, waypoints, pois, pathType, selectedWaypointId, multiSelectedWaypointIds, drawingState, onMapClick, onMarkerClick, onMarkerDragEnd } = props;
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const mapRef = useRef<L.Map>(null);

  const toggleSatellite = () => setIsSatelliteView(prev => !prev);
  const currentLayer = isSatelliteView ? satelliteLayer : defaultLayer;

  const pathCoords = useMemo(() => waypoints.map(wp => wp.latlng), [waypoints]);
  
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
              <MapEvents onMapClick={onMapClick} drawingState={drawingState} />
              <MapController 
                waypoints={waypoints} 
                pois={pois}
                isPanelOpen={isPanelOpen} 
                selectedWaypointId={selectedWaypointId}
              />
              <MapDrawer drawingState={drawingState} />


              {pathCoords.length > 1 && <Polyline positions={pathCoords} color="#3498db" weight={3} dashArray={pathType === 'straight' ? '5, 5' : undefined} />}

              {waypoints.map(wp => (
                <WaypointMarker 
                    key={wp.id} 
                    waypoint={wp}
                    waypoints={waypoints}
                    pois={pois}
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
                        <TooltipTrigger asChild><Button variant="secondary" size="icon" onClick={() => mapRef.current?.fitBounds(L.latLngBounds(pathCoords).pad(0.1))}><ZoomIn className="w-5 h-5" /></Button></TooltipTrigger>
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
