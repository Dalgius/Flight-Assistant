
"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import type { PanelType, DialogType, Waypoint, POI, FlightPlanSettings, LatLng, FlightStatistics, DrawingState, SurveyGridParams, FacadeScanParams, GeneratedWaypointData, SurveyMission, FlightPlan } from '@/components/flight-planner/types';
import { haversineDistance, calculateRequiredGimbalPitch, toRad, R_EARTH, generateSurveyGridWaypoints, calculateBearing, generateFacadeWaypoints, getElevationsBatch, validateFlightPlanForImport, validateFlightPlanForWpml, calculateMissionDuration } from '@/lib/flight-plan-calcs';
import JSZip from 'jszip';

import { ActionBar } from '@/components/flight-planner/action-bar';
import { SidePanel } from '@/components/flight-planner/side-panel';
import { OrbitDialog } from '@/components/flight-planner/dialogs/orbit-dialog';
import { SurveyGridDialog } from '@/components/flight-planner/dialogs/survey-grid-dialog';
import { FacadeScanDialog } from '@/components/flight-planner/dialogs/facade-scan-dialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function FlightPlanner() {
  const { toast } = useToast();
  const [activePanel, setActivePanel] = useState<PanelType | null>('waypoints');
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [missions, setMissions] = useState<SurveyMission[]>([]);
  const [settings, setSettings] = useState<FlightPlanSettings>({
    defaultAltitude: 50,
    flightSpeed: 8.5,
    pathType: 'curved',
    homeElevationMsl: 0,
    altitudeAdaptationMode: 'relative',
    desiredAGL: 50,
    desiredAMSL: 100,
  });
  
  const [selectedWaypointId, setSelectedWaypointId] = useState<number | null>(null);
  const [multiSelectedWaypointIds, setMultiSelectedWaypointIds] = useState<Set<number>>(new Set());
  
  const [waypointCounter, setWaypointCounter] = useState(1);
  const [poiCounter, setPoiCounter] = useState(1);
  const [missionCounter, setMissionCounter] = useState(1);

  const [editingMissionId, setEditingMissionId] = useState<number | null>(null);

  // State for POI panel inputs
  const [poiName, setPoiName] = useState('');
  const [poiHeight, setPoiHeight] = useState(10);

  // Lifted state for dialogs
  const [orbitParams, setOrbitParams] = useState({ poiId: "", radius: 30, numPoints: 8 });
  const [surveyParams, setSurveyParams] = useState<SurveyGridParams>({
    altitude: 50, sidelap: 70, frontlap: 80, angle: 0, polygon: [],
  });
  const [facadeParams, setFacadeParams] = useState<FacadeScanParams>({
    side: 'left', distance: 10, minHeight: 5, maxHeight: 20,
    horizontalOverlap: 80, verticalOverlap: 70, gimbalPitch: 0
  });

  const [facadeLine, setFacadeLine] = useState<{start: LatLng, end: LatLng} | null>(null);
  
  const [drawingState, setDrawingState] = useState<DrawingState>({ mode: null, onComplete: () => {} });

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const MapView = useMemo(() => dynamic(() => import('@/components/flight-planner/map-view').then(mod => mod.MapView), { 
    ssr: false,
    loading: () => <Skeleton className="h-full w-full bg-secondary" />
  }), []);

  const handlePanelChange = (panel: PanelType) => {
    setActivePanel(currentPanel => (currentPanel === panel ? null : panel));
  };

  const handleOpenDialog = (dialog: DialogType) => {
    if (dialog === 'orbit' && pois.length > 0) {
        const validPoiSelected = pois.some(p => String(p.id) === orbitParams.poiId);
        if (!validPoiSelected) {
            setOrbitParams(prev => ({ ...prev, poiId: String(pois[0].id) }));
        }
    }
    setActiveDialog(dialog);
  };
  
  // --- Core Logic ---

  const updateSettings = useCallback((newSettings: Partial<FlightPlanSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  useEffect(() => {
    const suggestedAMSL = settings.homeElevationMsl + settings.defaultAltitude;
    if (Math.round(suggestedAMSL) !== settings.desiredAMSL) {
      updateSettings({ desiredAMSL: Math.round(suggestedAMSL) });
    }
  }, [settings.homeElevationMsl, settings.defaultAltitude, settings.desiredAMSL, updateSettings]);

  const addWaypoint = useCallback(async (latlng: LatLng, options: Partial<Waypoint> & { isFromImport?: boolean } = {}) => {
    const isFirstWaypoint = waypoints.length === 0;
    let terrainElevation: number | null = null;
    
    if (isFirstWaypoint && !options.isFromImport) {
      toast({ title: "Fetching Elevation...", description: "Getting ground elevation for takeoff point." });
      const elevations = await getElevationsBatch([latlng]);
      if (elevations && elevations.length > 0 && elevations[0] !== null) {
        terrainElevation = Math.round(elevations[0]);
        setSettings(prev => ({
          ...prev,
          homeElevationMsl: terrainElevation!,
          altitudeAdaptationMode: 'relative'
        }));
        toast({ title: "Success", description: `Takeoff elevation set to ${terrainElevation}m based on Waypoint 1.` });
      } else {
        toast({ variant: "destructive", title: "Warning", description: "Could not fetch takeoff elevation." });
      }
    }

    const newWaypoint: Waypoint = {
        id: options.id ?? waypointCounter,
        latlng: latlng,
        altitude: options.altitude ?? settings.defaultAltitude,
        hoverTime: options.hoverTime ?? 0,
        gimbalPitch: options.gimbalPitch ?? 0,
        headingControl: options.headingControl || 'auto',
        fixedHeading: options.fixedHeading || 0,
        cameraAction: options.cameraAction || 'none',
        targetPoiId: options.targetPoiId || null,
        terrainElevationMSL: options.terrainElevationMSL ?? terrainElevation,
        waypointType: options.waypointType || 'generic' 
    };
    setWaypoints(prev => [...prev, newWaypoint]);
    if (!options.isFromImport) {
      setWaypointCounter(prev => prev + 1);
      selectWaypoint(newWaypoint.id);
    }
  }, [settings, waypointCounter, waypoints.length, toast]);

  const updateWaypoint = useCallback(async (id: number, updates: Partial<Waypoint>) => {
    let homeElevationUpdate: Partial<FlightPlanSettings> | null = null;
    
    const isFirstWaypoint = waypoints.length > 0 && waypoints[0].id === id;

    if (isFirstWaypoint && updates.latlng) {
      const elevations = await getElevationsBatch([updates.latlng]);
      if (elevations && elevations.length > 0 && elevations[0] !== null) {
        const homeElev = Math.round(elevations[0]);
        homeElevationUpdate = { homeElevationMsl: homeElev, altitudeAdaptationMode: 'relative' };
        updates.terrainElevationMSL = homeElev;
      }
    }

    setWaypoints(prev => prev.map(wp => wp.id === id ? { ...wp, ...updates } : wp));
    
    if (homeElevationUpdate) {
        setSettings(prev => ({...prev, ...homeElevationUpdate}));
    }
  }, [waypoints]);

  const deleteWaypoint = useCallback((id: number) => {
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
    if (selectedWaypointId === id) {
        setSelectedWaypointId(null);
    }
    setMultiSelectedWaypointIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, [selectedWaypointId]);

  const deleteMultiSelectedWaypoints = useCallback(() => {
    if (multiSelectedWaypointIds.size === 0) return;
    const count = multiSelectedWaypointIds.size;
    
    setWaypoints(prev => prev.filter(wp => !multiSelectedWaypointIds.has(wp.id)));
    setMultiSelectedWaypointIds(new Set());
    
    toast({
      title: "Waypoints Deleted",
      description: `${count} waypoint${count > 1 ? 's have' : ' has'} been removed.`
    });
  }, [multiSelectedWaypointIds, toast]);

  const selectWaypoint = useCallback((id: number | null) => {
    if (multiSelectedWaypointIds.size > 0) {
      setMultiSelectedWaypointIds(new Set());
    }
    setSelectedWaypointId(id);
  }, [multiSelectedWaypointIds]);

  const toggleMultiSelectWaypoint = useCallback((id: number) => {
    setSelectedWaypointId(null);
    setMultiSelectedWaypointIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  }, []);

  const clearMultiSelection = useCallback(() => {
    setMultiSelectedWaypointIds(new Set());
  }, []);

  const selectAllWaypoints = useCallback(() => {
    if (waypoints.length === multiSelectedWaypointIds.size) {
        setMultiSelectedWaypointIds(new Set());
    } else {
        setMultiSelectedWaypointIds(new Set(waypoints.map(wp => wp.id)));
    }
    setSelectedWaypointId(null);
  }, [waypoints, multiSelectedWaypointIds.size]);

  const clearWaypoints = useCallback(() => {
    setWaypoints([]);
    setPois([]);
    setMissions([]);
    setSelectedWaypointId(null);
    setMultiSelectedWaypointIds(new Set());
    setWaypointCounter(1);
    setPoiCounter(1);
    setMissionCounter(1);
    toast({ title: "Mission Cleared", description: "All waypoints and POIs have been removed." });
  }, [toast]);

  const addPoi = useCallback(async (latlng: LatLng, name: string, objectHeight: number, options: Partial<POI> & { isFromImport?: boolean } = {}) => {
    const newPoi: POI = {
        id: options.id ?? poiCounter,
        name: name || `POI ${options.id ?? poiCounter}`,
        latlng,
        objectHeightAboveGround: objectHeight,
        terrainElevationMSL: options.terrainElevationMSL ?? null,
        altitude: (options.terrainElevationMSL ?? 0) + objectHeight,
    };
    
    if (!options.isFromImport && newPoi.terrainElevationMSL === null) {
      const elevations = await getElevationsBatch([latlng]);
      if (elevations && elevations.length > 0 && elevations[0] !== null) {
        newPoi.terrainElevationMSL = elevations[0];
        newPoi.altitude = newPoi.terrainElevationMSL + newPoi.objectHeightAboveGround;
      } else {
        toast({ variant: "destructive", title: "Warning", description: `Could not fetch terrain elevation for ${newPoi.name}.` });
      }
    }

    setPois(prev => [...prev, newPoi]);
    if (!options.isFromImport) {
        setPoiCounter(prev => prev + 1);
    }
  }, [poiCounter, toast]);
  
  const updatePoi = useCallback((id: number, updates: Partial<POI>) => {
    setPois(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePoi = useCallback((id: number) => {
    setPois(prev => prev.filter(p => p.id !== id));
    setWaypoints(prev => prev.map(wp => wp.targetPoiId === id ? {...wp, targetPoiId: null} : wp));
  }, []);

  const deleteMission = useCallback((missionId: number) => {
    const missionToDelete = missions.find(m => m.id === missionId);
    if (!missionToDelete) return;

    const waypointIdsToDelete = new Set(missionToDelete.waypointIds);
    setWaypoints(prev => prev.filter(wp => !waypointIdsToDelete.has(wp.id)));
    setMissions(prev => prev.filter(m => m.id !== missionId));

    toast({
        title: "Mission Deleted",
        description: `Mission "${missionToDelete.name}" and its ${missionToDelete.waypointIds.length} waypoints have been removed.`
    });
  }, [missions, toast]);

  const handleEditMission = useCallback((missionId: number) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return;

    setEditingMissionId(missionId);

    if (mission.type === 'Grid' && mission.parameters) {
      setSurveyParams({ ...(mission.parameters as Omit<SurveyGridParams, 'polygon'>), polygon: mission.polygon || [] });
      setActiveDialog('survey');
    } else if (mission.type === 'Facade' && mission.parameters) {
      setFacadeParams(mission.parameters as FacadeScanParams);
      if (mission.line) {
        setFacadeLine(mission.line);
      }
      setActiveDialog('facade');
    } else if (mission.type === 'Orbit' && mission.parameters) {
      const params = mission.parameters as { poiId: number, radius: number, numPoints: number };
      setOrbitParams({
          poiId: String(params.poiId),
          radius: params.radius,
          numPoints: params.numPoints,
      });
      setActiveDialog('orbit');
    }
  }, [missions]);

  const handleSaveOrbit = useCallback(() => {
    const { poiId, radius, numPoints } = orbitParams;
    const centerPoi = pois.find(p => p.id === parseInt(poiId));
    if (!centerPoi) {
      toast({ variant: "destructive", title: "Error", description: "Selected POI not found." });
      return;
    }

    const altitudeRelToHome = settings.defaultAltitude;
    const homeElevation = settings.homeElevationMsl;
    const orbitWpAMSL = homeElevation + altitudeRelToHome;
    
    const poiAMSL = centerPoi.altitude; 

    const calculatedGimbalPitch = calculateRequiredGimbalPitch(orbitWpAMSL, poiAMSL, radius);

    let currentWpCounter = waypointCounter;
    const newWaypoints: Waypoint[] = [];
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const latRad = toRad(centerPoi.latlng.lat);
        const lngRad = toRad(centerPoi.latlng.lng);

        const pointLatRad = Math.asin(Math.sin(latRad) * Math.cos(radius / R_EARTH) +
                                    Math.cos(latRad) * Math.sin(radius / R_EARTH) * Math.cos(angle));
        const pointLngRad = lngRad + Math.atan2(Math.sin(angle) * Math.sin(radius / R_EARTH) * Math.cos(latRad),
                                             Math.cos(radius / R_EARTH) - Math.sin(latRad) * Math.sin(pointLatRad));
        
        const newLat = pointLatRad * 180 / Math.PI;
        const newLng = pointLngRad * 180 / Math.PI;

        const newWaypoint: Waypoint = {
            id: currentWpCounter++,
            latlng: { lat: newLat, lng: newLng },
            altitude: altitudeRelToHome, 
            headingControl: 'poi_track', 
            targetPoiId: centerPoi.id,
            gimbalPitch: calculatedGimbalPitch,
            waypointType: 'orbit',
            hoverTime: 0,
            fixedHeading: 0,
            cameraAction: 'none',
            terrainElevationMSL: null,
        };
        newWaypoints.push(newWaypoint);
    }
    
    if (editingMissionId) {
        const missionToUpdate = missions.find(m => m.id === editingMissionId);
        if (!missionToUpdate) return;
        
        const oldWaypointIds = new Set(missionToUpdate.waypointIds);
        const updatedMission: SurveyMission = {
            ...missionToUpdate,
            name: `Orbit ${centerPoi.name}`,
            parameters: { poiId: centerPoi.id, radius, numPoints },
            waypointIds: newWaypoints.map(wp => wp.id),
        };

        setMissions(prev => prev.map(m => m.id === editingMissionId ? updatedMission : m));
        setWaypoints(prev => [...prev.filter(wp => !oldWaypointIds.has(wp.id)), ...newWaypoints]);
        toast({ title: "Orbit Updated", description: `${newWaypoints.length} waypoints updated for ${centerPoi.name}.` });
    } else {
        const newMission: SurveyMission = {
            id: missionCounter,
            name: `Orbit ${centerPoi.name}`,
            type: 'Orbit',
            waypointIds: newWaypoints.map(wp => wp.id),
            parameters: { poiId: centerPoi.id, radius, numPoints },
        };
        setMissions(prev => [...prev, newMission]);
        setMissionCounter(prev => prev + 1);
        setWaypoints(prev => [...prev, ...newWaypoints]);
        toast({ title: "Orbit Created", description: `${numPoints} waypoints generated around ${centerPoi.name}.` });
    }

    setWaypointCounter(currentWpCounter);
    setActiveDialog(null);
    setEditingMissionId(null);

  }, [pois, settings, waypointCounter, toast, orbitParams, missionCounter, editingMissionId, missions]);

  const handleCreateSurveyGrid = useCallback(() => {
    const { polygon, altitude, sidelap, frontlap, angle } = surveyParams;
    if (!polygon || polygon.length < 3) {
        toast({ variant: "destructive", title: "Invalid Area", description: "A survey area with at least 3 points is required." });
        return;
    }

    const waypointsData = generateSurveyGridWaypoints(polygon, { altitude, sidelap, frontlap, angle });

    if (waypointsData.length === 0) {
        toast({ variant: "destructive", title: "No Waypoints", description: "Could not generate any waypoints for the given area and parameters." });
        return;
    }

    let currentWpCounter = waypointCounter;
    const newWaypoints: Waypoint[] = waypointsData.map((wpData: GeneratedWaypointData) => {
        const newWp: Waypoint = {
            id: currentWpCounter++,
            latlng: wpData.latlng,
            ...wpData.options,
            hoverTime: 0,
            targetPoiId: null,
            terrainElevationMSL: null,
        };
        return newWp;
    });

    if (editingMissionId) {
        const missionToUpdate = missions.find(m => m.id === editingMissionId);
        if (!missionToUpdate) return;
        
        const oldWaypointIds = new Set(missionToUpdate.waypointIds);

        const updatedMission: SurveyMission = {
            ...missionToUpdate,
            parameters: { altitude, sidelap, frontlap, angle },
            polygon: polygon,
            waypointIds: newWaypoints.map(wp => wp.id),
        };

        setMissions(prev => prev.map(m => m.id === editingMissionId ? updatedMission : m));
        setWaypoints(prev => [...prev.filter(wp => !oldWaypointIds.has(wp.id)), ...newWaypoints]);
        toast({ title: "Survey Grid Updated", description: `${newWaypoints.length} waypoints generated.` });
    } else {
        const newMission: SurveyMission = {
            id: missionCounter,
            name: `Survey Grid ${missionCounter}`,
            type: 'Grid',
            waypointIds: newWaypoints.map(wp => wp.id),
            parameters: { altitude, sidelap, frontlap, angle },
            polygon: polygon,
        };
        setMissions(prev => [...prev, newMission]);
        setMissionCounter(prev => prev + 1);
        setWaypoints(prev => [...prev, ...newWaypoints]);
        toast({ title: "Survey Grid Created", description: `${newWaypoints.length} waypoints generated.` });
    }

    setWaypointCounter(currentWpCounter);
    setActiveDialog(null);
    setEditingMissionId(null);
    setSurveyParams(prev => ({...prev, polygon: []}));

}, [surveyParams, toast, waypointCounter, missionCounter, editingMissionId, missions]);

const handleGenerateFacadeScan = useCallback(() => {
    if (!facadeLine) {
        toast({ variant: "destructive", title: "Error", description: "Facade line is not defined." });
        return;
    }

    const waypointsData = generateFacadeWaypoints(facadeLine.start, facadeLine.end, facadeParams);
    
    if (waypointsData.length === 0) {
        toast({ variant: "destructive", title: "No Waypoints", description: "Could not generate any waypoints for the given area and parameters." });
        return;
    }
    
    let currentWpCounter = waypointCounter;
    const newWaypoints: Waypoint[] = waypointsData.map((wpData: GeneratedWaypointData) => {
        const newWp: Waypoint = {
            id: currentWpCounter++,
            latlng: wpData.latlng,
            ...wpData.options,
            hoverTime: 0,
            targetPoiId: null,
            terrainElevationMSL: null,
        };
        return newWp;
    });

    if (editingMissionId) {
        const missionToUpdate = missions.find(m => m.id === editingMissionId);
        if (!missionToUpdate) return;
        const oldWaypointIds = new Set(missionToUpdate.waypointIds);
        
        const updatedMission: SurveyMission = {
            ...missionToUpdate,
            parameters: facadeParams,
            line: facadeLine,
            waypointIds: newWaypoints.map(wp => wp.id),
        };
        setMissions(prev => prev.map(m => m.id === editingMissionId ? updatedMission : m));
        setWaypoints(prev => [...prev.filter(wp => !oldWaypointIds.has(wp.id)), ...newWaypoints]);
        toast({ title: "Facade Scan Updated", description: `${newWaypoints.length} waypoints generated.` });

    } else {
        const newMission: SurveyMission = {
            id: missionCounter,
            name: `Facade Scan ${missionCounter}`,
            type: 'Facade',
            waypointIds: newWaypoints.map(wp => wp.id),
            parameters: facadeParams,
            line: facadeLine,
        };
        setMissions(prev => [...prev, newMission]);
        setMissionCounter(prev => prev + 1);
        setWaypoints(prev => [...prev, ...newWaypoints]);
        toast({ title: "Facade Scan Created", description: `${waypointsData.length} waypoints generated.` });
    }

    setWaypointCounter(currentWpCounter);
    setActiveDialog(null);
    setEditingMissionId(null);
    setFacadeLine(null);
}, [facadeLine, facadeParams, waypointCounter, toast, missionCounter, editingMissionId, missions]);

  const handleDrawRadiusRequest = useCallback(() => {
    const centerPoi = pois.find(p => p.id === parseInt(orbitParams.poiId));
    if (!centerPoi) return;
    
    setActiveDialog(null);
    
    setDrawingState({
      mode: 'orbitRadius',
      center: centerPoi.latlng,
      onComplete: (newRadius: number) => {
        setOrbitParams(prev => ({ ...prev, radius: Math.round(newRadius) }));
        setDrawingState({ mode: null, onComplete: () => {} });
        setActiveDialog('orbit');
      }
    });

    toast({
      title: "Draw Orbit Radius",
      description: "Click and drag from the POI on the map to set the radius.",
    });
  }, [pois, orbitParams.poiId, toast]);

  const handleDrawSurveyAreaRequest = useCallback(() => {
    setActiveDialog(null);
    setDrawingState({
      mode: 'surveyArea',
      onComplete: (polygon: LatLng[]) => {
        setSurveyParams(prev => ({...prev, polygon}));
        setDrawingState({ mode: null, onComplete: () => {} });
        setActiveDialog('survey');
        toast({
          title: "Survey Area Defined",
          description: `${polygon.length} points selected.`,
        });
      },
    });
    toast({
      title: "Drawing Survey Area",
      description: "Click on the map to define corners. Click the first point again to close the polygon.",
    });
  }, [toast]);
  
  const handleDrawGridAngleRequest = useCallback(() => {
    setActiveDialog(null);
    setDrawingState({
      mode: 'surveyAngle',
      onComplete: (angle: number) => {
        const roundedAngle = Math.round(angle);
        setSurveyParams(prev => ({ ...prev, angle: roundedAngle }));
        setDrawingState({ mode: null, onComplete: () => {} });
        setActiveDialog('survey');
        toast({
          title: "Grid Angle Set",
          description: `Angle set to ${roundedAngle}°`,
        });
      }
    });
    toast({
      title: "Draw Grid Angle",
      description: "Click and drag on the map to define the angle of the flight lines.",
    });
  }, [toast]);

  const handleDrawFacadeLineRequest = useCallback(() => {
    setActiveDialog(null);
    setDrawingState({
        mode: 'facadeLine',
        onComplete: (line: {start: LatLng, end: LatLng}) => {
            setFacadeLine(line);
            setDrawingState({ mode: null, onComplete: () => {} });
            setActiveDialog('facade');
            toast({
                title: "Facade Line Drawn",
                description: "You can now adjust parameters and generate the scan.",
            });
        },
    });
    toast({
        title: "Drawing Facade Line",
        description: "Click and drag on the map along the building facade.",
    });
  }, [toast]);

  // --- Terrain Functions ---
  const getHomeElevationFromFirstWaypoint = useCallback(async () => {
    if (waypoints.length === 0) {
      toast({ title: "Info", description: "Add at least one waypoint to fetch its elevation." });
      return;
    }
    const firstWp = waypoints[0];
    toast({ title: "Fetching Elevation...", description: `Getting elevation for Waypoint 1.` });
    const elevations = await getElevationsBatch([firstWp.latlng]);
    if (elevations && elevations.length > 0 && elevations[0] !== null) {
      const homeElev = Math.round(elevations[0]);
      setSettings(prev => ({
        ...prev,
        homeElevationMsl: homeElev,
        altitudeAdaptationMode: 'relative'
      }));
      setWaypoints(prev => prev.map(wp => wp.id === firstWp.id ? { ...wp, terrainElevationMSL: homeElev } : wp));
      toast({ title: "Success", description: `Takeoff elevation set to ${homeElev}m based on Waypoint 1.` });
    } else {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch elevation for Waypoint 1." });
    }
  }, [waypoints, toast]);

  const adaptToAGL = useCallback(async () => {
    if (waypoints.length === 0) {
      toast({ title: "Info", description: "No waypoints to adapt." });
      return;
    }
    toast({ title: "Processing...", description: "Fetching terrain data for all waypoints." });
    const locations = waypoints.map(wp => wp.latlng);
    const elevations = await getElevationsBatch(locations);

    let successCount = 0;
    const newWaypoints = waypoints.map((wp, index) => {
      const groundElevation = elevations[index];
      if (groundElevation !== null) {
        successCount++;
        const targetMSL = groundElevation + settings.desiredAGL;
        const newRelativeAltitude = targetMSL - settings.homeElevationMsl;
        return {
          ...wp,
          altitude: Math.round(newRelativeAltitude),
          terrainElevationMSL: groundElevation,
        };
      }
      return { ...wp, terrainElevationMSL: null };
    });

    setWaypoints(newWaypoints);
    setSettings(prev => ({ ...prev, altitudeAdaptationMode: 'agl' }));
    if (successCount === waypoints.length && waypoints.length > 0) {
        toast({ title: "Success", description: "All waypoint altitudes have been adapted to a constant AGL." });
    } else if (successCount > 0) {
        toast({ title: "Partial Success", description: `Adapted ${successCount}/${waypoints.length} waypoints. Some terrain fetches failed.` });
    } else {
        toast({ variant: "destructive", title: "Error", description: `Failed to adapt any waypoints.` });
    }
  }, [waypoints, settings.desiredAGL, settings.homeElevationMsl, toast]);

  const adaptToAMSL = useCallback(async () => {
    if (waypoints.length === 0) {
      toast({ title: "Info", description: "No waypoints to adapt." });
      return;
    }
    toast({ title: "Processing...", description: "Fetching terrain data for all waypoints." });
    const locations = waypoints.map(wp => wp.latlng);
    const elevations = await getElevationsBatch(locations);
    const newWaypoints = waypoints.map((wp, index) => {
        const newRelativeAltitude = settings.desiredAMSL - settings.homeElevationMsl;
        return {
            ...wp,
            altitude: Math.round(newRelativeAltitude),
            terrainElevationMSL: elevations[index]
        };
    });

    setWaypoints(newWaypoints);
    setSettings(prev => ({ ...prev, altitudeAdaptationMode: 'amsl' }));
    toast({ title: "Success", description: `All waypoint altitudes set to ${settings.desiredAMSL}m AMSL.` });
  }, [waypoints, settings.desiredAMSL, settings.homeElevationMsl, toast]);

  // --- File Operations ---

  const triggerImportJson = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const plan = JSON.parse(e.target.result as string) as FlightPlan;
        const errors = validateFlightPlanForImport(plan);
        if (errors.length > 0) {
          throw new Error(errors.join('\n'));
        }
        await loadFlightPlan(plan);
        toast({ title: "Success", description: "Flight plan imported successfully!" });
      } catch (err: any) {
        toast({ variant: "destructive", title: "Import Error", description: err.message });
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };

  const loadFlightPlan = async (plan: FlightPlan) => {
    clearWaypoints();

    let maxWpId = 0;
    let maxPoiId = 0;
    let maxMissionId = 0;

    // Must set state in order, settings first
    setSettings(plan.settings);

    const poiPromises = plan.pois.map(p => {
        if (p.id > maxPoiId) maxPoiId = p.id;
        return addPoi(p.latlng, p.name, p.objectHeightAboveGround, { ...p, isFromImport: true });
    });
    await Promise.all(poiPromises);

    const wpPromises = plan.waypoints.map(wp => {
        if (wp.id > maxWpId) maxWpId = wp.id;
        return addWaypoint(wp.latlng, { ...wp, isFromImport: true });
    });
    await Promise.all(wpPromises);
    
    if (plan.missions) {
      setMissions(plan.missions);
      plan.missions.forEach(m => {
          if (m.id > maxMissionId) maxMissionId = m.id;
      });
    }

    setWaypointCounter(maxWpId + 1);
    setPoiCounter(maxPoiId + 1);
    setMissionCounter(maxMissionId + 1);

    if (plan.waypoints.length > 0) {
      selectWaypoint(plan.waypoints[0].id);
    }
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const exportToJson = () => {
    if (waypoints.length === 0 && pois.length === 0) {
      toast({ variant: "destructive", title: "Nothing to export" });
      return;
    }
    const plan: FlightPlan = {
      waypoints, pois, missions, settings
    };
    downloadFile("flight_plan.json", JSON.stringify(plan, null, 2), "application/json");
    toast({ title: "Exported to JSON" });
  };

  const exportToKml = () => {
    if (waypoints.length === 0) {
        toast({ variant: "destructive", title: "Nothing to export" });
        return;
    }
    const homeElevationMSL = settings.homeElevationMsl;
    
    const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Flight Plan (GE)</name>`;
    const styles = `<Style id="wpStyle"><IconStyle><Icon><href>http://maps.google.com/mapfiles/kml/paddle/blu-circle.png</href></Icon></IconStyle></Style><Style id="pathStyle"><LineStyle><color>ffdb9834</color><width>3</width></LineStyle></Style><Style id="poiStyle"><IconStyle><Icon><href>http://maps.google.com/mapfiles/kml/paddle/ylw-stars.png</href></Icon></IconStyle></Style>`;
    const kmlFooter = `</Document></kml>`;

    let waypointsKml = '<Folder><name>Waypoints</name>';
    waypoints.forEach(wp => {
        const altMSL = homeElevationMSL + wp.altitude;
        waypointsKml += `<Placemark><name>WP ${wp.id}</name><Point><altitudeMode>absolute</altitudeMode><coordinates>${wp.latlng.lng},${wp.latlng.lat},${altMSL.toFixed(1)}</coordinates></Point></Placemark>`;
    });
    waypointsKml += '</Folder>';

    let pathKml = '';
    if (waypoints.length >= 2) {
        const pathCoords = waypoints.map(wp => `${wp.latlng.lng},${wp.latlng.lat},${(homeElevationMSL + wp.altitude).toFixed(1)}`).join('\n');
        pathKml = `<Placemark><name>Flight Path</name><styleUrl>#pathStyle</styleUrl><LineString><tessellate>1</tessellate><altitudeMode>absolute</altitudeMode><coordinates>\n${pathCoords}\n</coordinates></LineString></Placemark>`;
    }

    let poisKml = '';
    if (pois.length > 0) {
        poisKml += `<Folder><name>POIs</name>`;
        pois.forEach(p => { 
            poisKml += `<Placemark><name>${p.name}</name><Point><altitudeMode>absolute</altitudeMode><coordinates>${p.latlng.lng},${p.latlng.lat},${p.altitude}</coordinates></Point></Placemark>`;
        });
        poisKml += `</Folder>`;
    }

    const kmlContent = `${kmlHeader}${styles}${waypointsKml}${pathKml}${poisKml}${kmlFooter}`;
    downloadFile("flight_plan_GE.kml", kmlContent, "application/vnd.google-earth.kml+xml");
    toast({ title: "Exported for Google Earth" });
  };

  const exportToKmz = () => {
    const validationErrors = validateFlightPlanForWpml(waypoints);
    if (validationErrors.length > 0) {
        toast({ variant: 'destructive', title: 'Export Error', description: validationErrors.join(' ') });
        return;
    }

    let actionGroupCounter = 1;
    let actionCounter = 1;
    const missionFlightSpeed = settings.flightSpeed;
    const missionPathType = settings.pathType;
    const homeElevationMSL = settings.homeElevationMsl;
    const now = new Date();
    const createTimeMillis = now.getTime().toString();
    const waylineIdInt = Math.floor(now.getTime() / 1000);
    const totalDistance = flightStats.totalDistance;
    const totalDuration = calculateMissionDuration(waypoints, missionFlightSpeed);

    let templateKml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.2"><Document><wpml:missionConfig><wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode><wpml:finishAction>goHome</wpml:finishAction><wpml:exitOnRCLost>executeLostAction</wpml:exitOnRCLost><wpml:executeRCLostAction>goBack</wpml:executeRCLostAction><wpml:globalTransitionalSpeed>${missionFlightSpeed}</wpml:globalTransitionalSpeed><wpml:droneInfo><wpml:droneEnumValue>68</wpml:droneEnumValue><wpml:droneSubEnumValue>0</wpml:droneSubEnumValue></wpml:droneInfo></wpml:missionConfig></Document></kml>`;
    
    let waylinesWpml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.2"><Document><Folder><name>Wayline Mission</name><wpml:templateId>0</wpml:templateId><wpml:executeHeightMode>relativeToStartPoint</wpml:executeHeightMode><wpml:waylineId>0</wpml:waylineId><wpml:distance>${Math.round(totalDistance)}</wpml:distance><wpml:duration>${Math.round(totalDuration)}</wpml:duration><wpml:autoFlightSpeed>${missionFlightSpeed}</wpml:autoFlightSpeed>\n`;

    waypoints.forEach((wp, index) => {
        waylinesWpml += `<Placemark><Point><coordinates>${wp.latlng.lng.toFixed(10)},${wp.latlng.lat.toFixed(10)}</coordinates></Point><wpml:index>${index}</wpml:index><wpml:executeHeight>${wp.altitude.toFixed(1)}</wpml:executeHeight><wpml:waypointSpeed>${missionFlightSpeed}</wpml:waypointSpeed><wpml:waypointHeadingParam>`;

        if (wp.headingControl === 'fixed') {
            waylinesWpml += `<wpml:waypointHeadingMode>smoothTransition</wpml:waypointHeadingMode><wpml:waypointHeadingAngle>${wp.fixedHeading}</wpml:waypointHeadingAngle>`;
        } else if (wp.headingControl === 'poi_track' && wp.targetPoiId != null) {
            const targetPoi = pois.find(p => p.id === wp.targetPoiId);
            if (targetPoi) {
                waylinesWpml += `<wpml:waypointHeadingMode>towardPOI</wpml:waypointHeadingMode><wpml:waypointPoiPoint>${targetPoi.latlng.lng.toFixed(6)},${targetPoi.latlng.lat.toFixed(6)},${(targetPoi.altitude - homeElevationMSL).toFixed(1)}</wpml:waypointPoiPoint>`;
            } else {
                waylinesWpml += `<wpml:waypointHeadingMode>followWayline</wpml:waypointHeadingMode>`;
            }
        } else {
            waylinesWpml += `<wpml:waypointHeadingMode>followWayline</wpml:waypointHeadingMode>`;
        }
        waylinesWpml += `</wpml:waypointHeadingParam><wpml:waypointTurnParam>`;
        const turnMode = missionPathType === 'curved' && index > 0 && index < waypoints.length - 1 ? 'toPointAndPassWithContinuityCurvature' : 'toPointAndStopWithDiscontinuityCurvature';
        waylinesWpml += `<wpml:waypointTurnMode>${turnMode}</wpml:waypointTurnMode></wpml:waypointTurnParam>`;
        
        let actionsXml = "";
        if (wp.hoverTime > 0) {
            actionsXml += `<wpml:action><wpml:actionId>${actionCounter++}</wpml:actionId><wpml:actionActuatorFunc>hover</wpml:actionActuatorFunc><wpml:actionActuatorFuncParam><wpml:hoverTime>${wp.hoverTime}</wpml:hoverTime></wpml:actionActuatorFuncParam></wpml:action>`;
        }
        if (wp.headingControl !== 'poi_track') {
             const clampedPitch = Math.max(-90, Math.min(60, wp.gimbalPitch));
             actionsXml += `<wpml:action><wpml:actionId>${actionCounter++}</wpml:actionId><wpml:actionActuatorFunc>gimbalRotate</wpml:actionActuatorFunc><wpml:actionActuatorFuncParam><wpml:gimbalPitchRotateEnable>1</wpml:gimbalPitchRotateEnable><wpml:gimbalPitchRotateAngle>${clampedPitch}</wpml:gimbalPitchRotateAngle></wpml:actionActuatorFuncParam></wpml:action>`;
        }
        if (wp.cameraAction && wp.cameraAction !== 'none') {
            actionsXml += `<wpml:action><wpml:actionId>${actionCounter++}</wpml:actionId><wpml:actionActuatorFunc>${wp.cameraAction}</wpml:actionActuatorFunc></wpml:action>`;
        }
        if (actionsXml) {
            waylinesWpml += `<wpml:actionGroup><wpml:actionGroupId>${actionGroupCounter++}</wpml:actionGroupId><wpml:actionGroupStartIndex>${index}</wpml:actionGroupStartIndex><wpml:actionGroupEndIndex>${index}</wpml:actionGroupEndIndex><wpml:actionGroupMode>sequence</wpml:actionGroupMode><wpml:actionTrigger><wpml:actionTriggerType>reachPoint</wpml:actionTriggerType></wpml:actionTrigger>${actionsXml}</wpml:actionGroup>`;
        }
        waylinesWpml += `</Placemark>\n`;
    });
    waylinesWpml += `</Folder></Document></kml>`;

    const zip = new JSZip();
    zip.folder("wpmz")?.file("template.kml", templateKml).file("waylines.wpml", waylinesWpml);
    zip.generateAsync({ type: "blob", mimeType: "application/vnd.google-earth.kmz" })
        .then(blob => downloadFile(`flight_plan_${waylineIdInt}.kmz`, blob as any, 'application/vnd.google-earth.kmz'))
        .catch(err => toast({ variant: 'destructive', title: 'KMZ Generation Error', description: err.message }));
    toast({ title: 'Exported DJI KMZ' });
  };


  const flightStats: FlightStatistics = useMemo(() => {
    let totalDistance = 0;
    if (waypoints.length > 1) {
      for (let i = 0; i < waypoints.length - 1; i++) {
        totalDistance += haversineDistance(waypoints[i].latlng, waypoints[i+1].latlng);
      }
    }
    const totalHover = waypoints.reduce((sum, wp) => sum + (wp.hoverTime || 0), 0);
    const flightTime = (totalDistance / (settings.flightSpeed > 0 ? settings.flightSpeed : 1)) + totalHover;

    return {
      totalDistance,
      flightTime,
      waypointCount: waypoints.length,
      poiCount: pois.length,
    };
  }, [waypoints, pois.length, settings.flightSpeed]);

  const handleMapClick = (latlng: LatLng, event: any) => {
    if (drawingState.mode) return;
    if (event.originalEvent.ctrlKey) {
        addPoi(latlng, poiName, poiHeight);
        toast({ title: "POI Added", description: `${poiName || 'POI ' + poiCounter} created at clicked location.` });
    } else {
        addWaypoint(latlng);
        toast({ title: "Waypoint Added", description: `Waypoint ${waypointCounter} created at clicked location.` });
    }
  };

  const selectedWaypoint = useMemo(() => {
    if (selectedWaypointId === null || multiSelectedWaypointIds.size > 0) return null;
    return waypoints.find(wp => wp.id === selectedWaypointId) ?? null;
  }, [selectedWaypointId, waypoints, multiSelectedWaypointIds]);
  

  const sidePanelProps = {
    settings, updateSettings,
    waypoints, selectedWaypoint, multiSelectedWaypointIds,
    addWaypoint, updateWaypoint, deleteWaypoint, selectWaypoint,
    toggleMultiSelectWaypoint, clearMultiSelection, selectAllWaypoints,
    clearWaypoints, deleteMultiSelectedWaypoints,
    pois, addPoi, deletePoi, updatePoi,
    poiName, setPoiName, poiHeight, setPoiHeight,
    missions, deleteMission, editMission: handleEditMission,
    flightStats,
    onOpenDialog: handleOpenDialog,
    getHomeElevationFromFirstWaypoint, adaptToAGL, adaptToAMSL,
    onImportJson: triggerImportJson,
    onExportJson: exportToJson,
    onExportKml: exportToKml,
    onExportKmz: exportToKmz,
  };

  return (
    <div className="flex h-screen w-screen bg-background">
      <ActionBar activePanel={activePanel} onPanelChange={handlePanelChange} />
      <div className="flex flex-1 relative">
        <SidePanel 
          activePanel={activePanel} 
          onClose={() => setActivePanel(null)}
          {...sidePanelProps}
        />
        <MapView 
            isPanelOpen={!!activePanel}
            waypoints={waypoints}
            pois={pois}
            pathType={settings.pathType}
            altitudeAdaptationMode={settings.altitudeAdaptationMode}
            settings={settings}
            selectedWaypointId={selectedWaypointId}
            multiSelectedWaypointIds={multiSelectedWaypointIds}
            drawingState={drawingState}
            onMapClick={handleMapClick}
            onMarkerClick={(id) => selectWaypoint(id)}
            onMarkerDragEnd={updateWaypoint}
        />
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".json"
        className="hidden"
      />
      <OrbitDialog
        open={activeDialog === 'orbit'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setActiveDialog(null);
            setEditingMissionId(null);
          }
        }}
        isEditing={!!editingMissionId && activeDialog === 'orbit'}
        pois={pois}
        params={orbitParams}
        onParamsChange={setOrbitParams}
        onCreateOrbit={handleSaveOrbit}
        onDrawRadius={handleDrawRadiusRequest}
      />
      <SurveyGridDialog
        open={activeDialog === 'survey'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setActiveDialog(null);
            setEditingMissionId(null);
          }
        }}
        isEditing={!!editingMissionId}
        params={surveyParams}
        onParamsChange={setSurveyParams}
        onDrawArea={handleDrawSurveyAreaRequest}
        onDrawAngle={handleDrawGridAngleRequest}
        onCreateGrid={handleCreateSurveyGrid}
      />
      <FacadeScanDialog
        open={activeDialog === 'facade'}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
                setActiveDialog(null);
                setEditingMissionId(null);
                setFacadeLine(null);
            }
        }}
        isEditing={!!editingMissionId}
        params={facadeParams}
        onParamsChange={setFacadeParams}
        onDrawLine={handleDrawFacadeLineRequest}
        onGenerateScan={handleGenerateFacadeScan}
        isLineDrawn={!!facadeLine}
      />
    </div>
  );
}
