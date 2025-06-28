
"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import type { PanelType, DialogType, Waypoint, POI, FlightPlanSettings, LatLng, FlightStatistics, DrawingState, SurveyGridParams, FacadeScanParams, GeneratedWaypointData, SurveyMission } from '@/components/flight-planner/types';
import { haversineDistance, calculateRequiredGimbalPitch, toRad, R_EARTH, generateSurveyGridWaypoints, calculateBearing, generateFacadeWaypoints } from '@/lib/flight-plan-calcs';

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
  });
  
  const [selectedWaypointId, setSelectedWaypointId] = useState<number | null>(null);
  const [multiSelectedWaypointIds, setMultiSelectedWaypointIds] = useState<Set<number>>(new Set());
  
  const [waypointCounter, setWaypointCounter] = useState(1);
  const [poiCounter, setPoiCounter] = useState(1);
  const [missionCounter, setMissionCounter] = useState(1);

  const [editingMissionId, setEditingMissionId] = useState<number | null>(null);


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

  const addWaypoint = useCallback((latlng: LatLng, options: Partial<Waypoint> = {}) => {
    const newWaypoint: Waypoint = {
        id: waypointCounter,
        latlng: latlng,
        altitude: options.altitude ?? settings.defaultAltitude,
        hoverTime: options.hoverTime ?? 0,
        gimbalPitch: options.gimbalPitch ?? 0,
        headingControl: options.headingControl || 'auto',
        fixedHeading: options.fixedHeading || 0,
        cameraAction: options.cameraAction || 'none',
        targetPoiId: options.targetPoiId || null,
        terrainElevationMSL: options.terrainElevationMSL ?? null,
        waypointType: options.waypointType || 'generic' 
    };
    setWaypoints(prev => [...prev, newWaypoint]);
    setWaypointCounter(prev => prev + 1);
    selectWaypoint(newWaypoint.id);
  }, [settings, waypointCounter]);

  const updateWaypoint = useCallback((id: number, updates: Partial<Waypoint>) => {
    setWaypoints(prev => prev.map(wp => wp.id === id ? { ...wp, ...updates } : wp));
  }, []);

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

  const addPoi = useCallback((latlng: LatLng, name: string, objectHeight: number) => {
    const newPoi: POI = {
        id: poiCounter,
        name: name || `POI ${poiCounter}`,
        latlng,
        objectHeightAboveGround: objectHeight,
        terrainElevationMSL: null, // To be fetched
        altitude: objectHeight, // Initial, will be updated
    };
    setPois(prev => [...prev, newPoi]);
    setPoiCounter(prev => prev + 1);
    // In a real scenario, we'd fetch terrain elevation here.
  }, [poiCounter]);
  
  const deletePoi = useCallback((id: number) => {
    setPois(prev => prev.filter(p => p.id !== id));
    // Also nullify any waypoint targeting this POI
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
      const params = mission.parameters as { poiId: string, radius: number, numPoints: number };
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
        addPoi(latlng, `POI ${poiCounter}`, 10);
        toast({ title: "POI Added", description: `POI ${poiCounter} created at clicked location.` });
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
    pois, addPoi, deletePoi,
    missions, deleteMission, editMission: handleEditMission,
    flightStats,
    onOpenDialog: handleOpenDialog,
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
            selectedWaypointId={selectedWaypointId}
            multiSelectedWaypointIds={multiSelectedWaypointIds}
            drawingState={drawingState}
            onMapClick={handleMapClick}
            onMarkerClick={(id) => selectWaypoint(id)}
            onMarkerDragEnd={updateWaypoint}
        />
      </div>

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
