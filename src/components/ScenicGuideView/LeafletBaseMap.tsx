'use client';

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import rough from 'roughjs';
import { Landmark, ScenicFacility, ScenicZone, ItineraryItem } from '@/types/itinerary';
import { fetchPedestrianRoute } from '@/lib/routing';
import { useItineraryStore, getActiveDayLandmarks } from '@/store/useItineraryStore';
import {
    calculateItineraryBoundingCircle,
    getPixelCircle,
    getCirclePerimeterCoords,
    BoundingCircle,
    haversineMeters,
} from '@/lib/geoMask';
import { isCommercialChain } from '@/lib/chainBrands';
import { CITY_PACKS } from '@/data/cityPacks';
import { DiscoveryCategory, getLandmarkCategoryGroup } from '@/lib/landmarkCategories';
import { playChime } from '@/lib/audio';
import {
    HONG_KONG_DISTRICT_BOUNDARIES,
    getDistrictBoundary,
    getDistrictBoundaryKey,
    DistrictBoundary,
} from '@/data/districtBoundaries';

// Guard Leaflet DomUtil.getPosition against undefined elements during unmounting transitions
if (typeof window !== 'undefined' && L && L.DomUtil) {
    const origGetPos = L.DomUtil.getPosition;
    L.DomUtil.getPosition = function (el: HTMLElement) {
        if (!el) return new L.Point(0, 0);
        try {
            return origGetPos.call(L.DomUtil, el) || new L.Point(0, 0);
        } catch {
            return new L.Point(0, 0);
        }
    };
}

interface LeafletBaseMapProps {
    zone: ScenicZone;
    landmarks: Landmark[];
    itineraryStopIds?: string[];
    facilities: ScenicFacility[];
    activeLandmark: Landmark | null;
    onSelectLandmark: (lm: Landmark) => void;
    userCoords: [number, number];
    userHeading?: number | null;
    userAccuracy?: number | null;
    isParchmentMode?: boolean;
    onOpenIslandView?: () => void;
    onMapReady?: (map: L.Map) => void;
    onBoundsChange?: (bounds: { minLat: number; minLng: number; maxLat: number; maxLng: number }) => void;
    onRecordExpense?: (item: ItineraryItem) => void;
    onAddToRoute?: (landmark: Landmark) => void;
    onDeletePersonalSpot?: (spotId: string) => void;
    onMapClick?: (coords: [number, number]) => void;
    mapDiscoveryMode?: string;
    categoryFilter?: DiscoveryCategory;
    onCategoryCountChange?: (count: number) => void;
    visibleCategoryLandmarks?: Landmark[];
    categoryBatchStartIdx?: number;
    hoveredLandmarkId?: string | null;
    selectedDistrictKey?: string | null;
    onSelectDistrict?: (districtKey: string | null) => void;
    territoryMode?: 'explore' | 'select';
}

export const LeafletBaseMap: React.FC<LeafletBaseMapProps> = ({
    zone,
    landmarks,
    itineraryStopIds = [],
    facilities,
    activeLandmark,
    onSelectLandmark,
    userCoords,
    userHeading,
    userAccuracy,
    isParchmentMode = false,
    onOpenIslandView,
    onMapReady,
    onBoundsChange,
    onRecordExpense,
    onAddToRoute,
    onDeletePersonalSpot,
    onMapClick,
    mapDiscoveryMode,
    categoryFilter = 'all',
    onCategoryCountChange,
    visibleCategoryLandmarks = [],
    categoryBatchStartIdx = 0,
    hoveredLandmarkId = null,
    selectedDistrictKey = null,
    onSelectDistrict,
    territoryMode = 'explore',
}) => {
    const [internalSelectedDistrictKey, setInternalSelectedDistrictKey] = useState<string | null>(null);
    const activeDistrictKey = selectedDistrictKey !== undefined ? selectedDistrictKey : internalSelectedDistrictKey;

    const territoryModeRef = useRef(territoryMode);
    territoryModeRef.current = territoryMode;

    const hoveredDistrictRef = useRef<string | null>(null);
    const setHoveredDistrict = (key: string | null) => {
        if (hoveredDistrictRef.current === key) return;
        hoveredDistrictRef.current = key;
        const activeHovered = document.querySelectorAll('.district-boundary-hovered');
        activeHovered.forEach((el) => el.classList.remove('district-boundary-hovered'));
        if (key) {
            const targets = document.querySelectorAll(`.district-boundary-${key}`);
            targets.forEach((el) => el.classList.add('district-boundary-hovered'));
        }
    };

    const handleSelectDistrict = (key: string | null) => {
        setHoveredDistrict(null);
        setInternalSelectedDistrictKey(key);
        if (onSelectDistrict) {
            onSelectDistrict(key);
        }
    };

    const {
        currentItineraryDays,
        activeDayNumber,
        appMode,
        mapDiscoveryMode: storeDiscoveryMode,
        plannerBuffer,
    } = useItineraryStore();
    const currentMode = mapDiscoveryMode || storeDiscoveryMode;

    const activeDay = currentItineraryDays.find((d) => d.dayNumber === activeDayNumber);
    const dayLandmarks = React.useMemo(
        () => getActiveDayLandmarks(activeDay, zone),
        [activeDay, zone]
    );

    // Derive active itinerary stops: either curated stops in ambient mode, or current day's stops, or plan's stops
    const activeItineraryLandmarks = React.useMemo(() => {
        if (currentMode === 'ambient') {
            return (plannerBuffer.spotIds || [])
                .map((id) => landmarks.find((l) => l.id === id) || zone.landmarksPool.find((l) => l.id === id))
                .filter(Boolean) as Landmark[];
        }
        if (dayLandmarks.length > 0) return dayLandmarks;
        if (itineraryStopIds.length > 0) {
            return itineraryStopIds
                .map((id) => landmarks.find((l) => l.id === id) || zone.landmarksPool.find((l) => l.id === id))
                .filter(Boolean) as Landmark[];
        }
        return [];
    }, [currentMode, plannerBuffer.spotIds, dayLandmarks, itineraryStopIds, landmarks, zone.landmarksPool]);

    const activeStopIds = React.useMemo(() => {
        return activeItineraryLandmarks.map((l) => l.id);
    }, [activeItineraryLandmarks]);

    const [currentZoom, setCurrentZoom] = useState<number>(() => zone.zoom || 15);

    function getCategoryEmoji(lm: Landmark): string {
        const cat = (lm.category || '').toLowerCase();
        const tag = (lm.tag || '').toUpperCase();
        const name = (lm.name || '').toLowerCase();

        // 1. Temples, Shrines, Churches & Places of Worship
        if (
            tag.includes('TEMPLE') ||
            tag.includes('SHRINE') ||
            tag.includes('WORSHIP') ||
            name.includes('temple') ||
            name.includes('shrine') ||
            name.includes('church') ||
            name.includes('cathedral') ||
            name.includes('basilica') ||
            name.includes('寺') ||
            name.includes('神社') ||
            name.includes('廟') ||
            name.includes('堂')
        ) {
            if (name.includes('church') || name.includes('cathedral') || name.includes('basilica') || tag.includes('CHURCH')) return '⛪';
            if (tag.includes('MOSQUE') || name.includes('mosque')) return '🕌';
            return '⛩️';
        }

        // 2. Bakeries, Patisseries & Ice Cream
        if (tag.includes('BAKERY') || tag.includes('PASTRY') || name.includes('bakery') || name.includes('patisserie') || name.includes('croissant') || name.includes('bread') || name.includes('bake')) return '🥐';
        if (tag.includes('ICE CREAM') || name.includes('ice cream') || name.includes('gelato')) return '🍦';

        // 3. Fast Food
        if (name.includes('mcdonald') || name.includes('burger') || name.includes('kfc') || name.includes('subway') || tag.includes('FAST FOOD')) return '🍔';

        // 4. Sit-down Restaurants & Dining
        if (tag.includes('RESTAURANT') || tag.includes('DINING') || tag.includes('BISTRO') || name.includes('restaurant') || name.includes('bistro') || name.includes('kitchen') || name.includes('dining')) return '🍽️';

        // 5. Cafes & Coffee
        if (tag.includes('CAFE') || tag.includes('COFFEE') || cat === 'craft' || name.includes('coffee') || name.includes('starbucks') || name.includes('mccafe') || name.includes('cafe')) return '☕';

        // 6. Markets, Plazas & Public Squares
        if (tag.includes('MARKET') || tag.includes('PLAZA') || tag.includes('SQUARE') || name.includes('market') || name.includes('plaza') || name.includes('square')) return '🛍️';

        // 7. Hotels & Accommodations
        if (tag.includes('LODGING') || tag.includes('HOTEL') || name.includes('hotel') || name.includes('inn') || name.includes('hostel') || name.includes('ryokan') || name.includes('resort')) return '🏨';

        // 8. Beaches & Waterfronts
        if (tag.includes('BEACH') || tag.includes('WATERFRONT') || name.includes('beach') || name.includes('harbour') || name.includes('harbor') || name.includes('bay')) return '🌊';

        // 9. Zoos, Aquariums & Theme Parks
        if (name.includes('zoo') || name.includes('safari')) return '🦁';
        if (name.includes('aquarium')) return '🐬';
        if (name.includes('theme park') || name.includes('amusement') || name.includes('disney')) return '🎡';

        // 10. Culture, Museums & History
        if (tag.includes('CULTURE') || tag.includes('MUSEUM') || cat === 'culture' || cat === 'history' || name.includes('museum') || name.includes('gallery') || name.includes('theatre') || name.includes('theater')) return '🏛️';

        // 11. Parks, Gardens & Nature
        if (tag.includes('PARK') || tag.includes('GARDEN') || cat === 'view' || cat === 'nature' || name.includes('park') || name.includes('garden')) return '🌿';

        // 12. Viewpoints & Towers
        if (tag.includes('VIEW') || tag.includes('TOWER') || name.includes('tower') || name.includes('lookout') || name.includes('viewpoint') || name.includes('observatory')) return '📷';

        // 13. Transit
        if (tag.includes('TRANSIT') || tag.includes('STATION') || name.includes('station') || name.includes('metro')) return '🚇';

        // 14. Sports
        if (tag.includes('SPORTS') || tag.includes('STADIUM') || name.includes('stadium') || name.includes('arena')) return '🏟️';

        return '✨';
    }

    function formatPinLabel(name: string): string {
        if (!name) return '';
        let clean = name.trim();
        // If name has a parenthetical like "Sha Tin Town Hall (沙田大會堂)", take the primary part
        if (clean.includes('(')) {
            const primary = clean.split('(')[0].trim();
            if (primary.length >= 2) {
                clean = primary;
            }
        }
        return clean;
    }

    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const districtBoundariesLayerRef = useRef<L.LayerGroup | null>(null);
    const landmarksLayerRef = useRef<L.LayerGroup | null>(null);
    const facilitiesLayerRef = useRef<L.LayerGroup | null>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const accuracyCircleRef = useRef<L.Circle | null>(null);
    const itineraryCircleRef = useRef<L.Circle | null>(null);
    const svgOverlayRef = useRef<SVGSVGElement | null>(null);
    const inpaintedPaneRef = useRef<HTMLElement | null>(null);
    const badgeMarkerRef = useRef<L.Marker | null>(null);
    const maskCircleRef = useRef<SVGCircleElement | null>(null);

    const boundingCircleRef = useRef<BoundingCircle | null>(null);
    const categoryMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
    const trajectoryRef = useRef<[number, number][]>([]);
    const landmarksRef = useRef<Landmark[]>(activeItineraryLandmarks);
    landmarksRef.current = activeItineraryLandmarks;

    const onBoundsChangeRef = useRef(onBoundsChange);
    onBoundsChangeRef.current = onBoundsChange;

    const onOpenIslandViewRef = useRef(onOpenIslandView);
    onOpenIslandViewRef.current = onOpenIslandView;

    const onAddToRouteRef = useRef(onAddToRoute);
    onAddToRouteRef.current = onAddToRoute;

    const onDeletePersonalSpotRef = useRef(onDeletePersonalSpot);
    onDeletePersonalSpotRef.current = onDeletePersonalSpot;

    const onMapClickRef = useRef(onMapClick);
    onMapClickRef.current = onMapClick;

    const updateInpaintingMask = () => {
        const map = mapInstanceRef.current;
        const inpaintedPane = inpaintedPaneRef.current;
        const bCircle = boundingCircleRef.current;
        if (!map || !inpaintedPane) return;

        // In Planning Mode (or if no circle or radius > 20km): disable circular inpainting clip path completely!
        if (appMode === 'planning' || !bCircle || bCircle.radiusMeters > 20000) {
            inpaintedPane.style.display = 'none';
            inpaintedPane.style.clipPath = 'none';
            (inpaintedPane.style as any).webkitClipPath = 'none';
            return;
        }

        inpaintedPane.style.display = 'block';

        const { layerCenter, radiusPx } = getPixelCircle(
            map,
            bCircle.center,
            bCircle.radiusMeters
        );

        if (radiusPx > 2500) {
            inpaintedPane.style.clipPath = 'none';
            (inpaintedPane.style as any).webkitClipPath = 'none';
            return;
        }

        if (maskCircleRef.current) {
            maskCircleRef.current.setAttribute('cx', `${layerCenter.x}`);
            maskCircleRef.current.setAttribute('cy', `${layerCenter.y}`);
            maskCircleRef.current.setAttribute('r', `${radiusPx}`);
        }

        inpaintedPane.style.clipPath = `circle(${radiusPx}px at ${layerCenter.x}px ${layerCenter.y}px)`;
        (inpaintedPane.style as any).webkitClipPath = `circle(${radiusPx}px at ${layerCenter.x}px ${layerCenter.y}px)`;
    };

    const updateItineraryCircle = () => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // In Planning Mode: No circle boundary!
        if (appMode === 'planning') {
            if (itineraryCircleRef.current) {
                itineraryCircleRef.current.remove();
                itineraryCircleRef.current = null;
            }
            return;
        }

        if (boundingCircleRef.current && boundingCircleRef.current.radiusMeters <= 20000) {
            const { center, radiusMeters } = boundingCircleRef.current;
            const isAmbientHalo = currentMode === 'ambient' && activeItineraryLandmarks.length < 2;
            const circleColor = isAmbientHalo ? '#f4c568' : '#c14937';
            const fillColor = isAmbientHalo ? '#f4c568' : '#c14937';
            const fillOpacity = isAmbientHalo ? 0.04 : 0.05;

            if (itineraryCircleRef.current) {
                itineraryCircleRef.current.setLatLng(center);
                itineraryCircleRef.current.setRadius(radiusMeters);
                itineraryCircleRef.current.setStyle({
                    color: circleColor,
                    fillColor: fillColor,
                    fillOpacity: fillOpacity,
                    dashArray: isAmbientHalo ? '8, 8' : undefined,
                });
            } else {
                itineraryCircleRef.current = L.circle(center, {
                    radius: radiusMeters,
                    color: circleColor,
                    weight: 1.5,
                    dashArray: isAmbientHalo ? '8, 8' : undefined,
                    fillColor: fillColor,
                    fillOpacity: fillOpacity,
                    interactive: false,
                }).addTo(map);
            }
        } else if (itineraryCircleRef.current) {
            itineraryCircleRef.current.remove();
            itineraryCircleRef.current = null;
        }
    };

    const redrawSketchedPaths = () => {
        const map = mapInstanceRef.current;
        const svg = svgOverlayRef.current;
        if (!map || !svg) return;

        updateInpaintingMask();
        updateItineraryCircle();

        const coords = trajectoryRef.current;
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        const topLeft = map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(svg as unknown as HTMLElement, topLeft);

        const size = map.getSize();
        svg.setAttribute('width', `${size.x}`);
        svg.setAttribute('height', `${size.y}`);

        const rc = rough.svg(svg);

        // 2. Draw trajectory walking path
        if (coords.length >= 2) {
            const minX = -100;
            const minY = -100;
            const maxX = size.x + 100;
            const maxY = size.y + 100;

            const pixelPoints = coords.map(([lat, lng]) => {
                const pt = map.latLngToContainerPoint(L.latLng(lat, lng));
                return [pt.x, pt.y];
            });

            for (let i = 0; i < pixelPoints.length - 1; i++) {
                const p1 = pixelPoints[i];
                const p2 = pixelPoints[i + 1];

                // Screen frustum culling: skip if segment is completely outside visible bounds
                if (
                    (p1[0] < minX && p2[0] < minX) ||
                    (p1[0] > maxX && p2[0] > maxX) ||
                    (p1[1] < minY && p2[1] < minY) ||
                    (p1[1] > maxY && p2[1] > maxY)
                ) {
                    continue;
                }

                // Distance decimation: skip redundant micro-segments (< 4px)
                const distSq = (p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2;
                if (distSq < 16 && i < pixelPoints.length - 2) {
                    continue;
                }

                svg.appendChild(
                    rc.line(p1[0], p1[1], p2[0], p2[1], {
                        roughness: 1.5,
                        stroke: 'rgba(232, 220, 186, 0.85)',
                        strokeWidth: 14,
                        bowing: 1.2,
                    })
                );

                svg.appendChild(
                    rc.line(p1[0], p1[1], p2[0], p2[1], {
                        roughness: 1.4,
                        stroke: '#c14937',
                        strokeWidth: 3.5,
                        strokeLineDash: [8, 6],
                        bowing: 1.1,
                    })
                );
            }
        }

        // 3. Draw milestone dots
        landmarksRef.current.forEach((lm) => {
            const pt = map.latLngToContainerPoint(L.latLng(lm.coords[0], lm.coords[1]));
            svg.appendChild(
                rc.circle(pt.x, pt.y, 8, {
                    fill: '#f4c568',
                    fillStyle: 'solid',
                    roughness: 1.2,
                    stroke: '#2b261b',
                    strokeWidth: 1.5,
                })
            );
        });
    };

    useEffect(() => {
        const stopCoords = activeItineraryLandmarks.map((l) => l.coords);

        if (appMode === 'on-trip') {
            // In On-Trip Mode: Ambient discovery horizon halo (~1.2km) centered at user location or active waypoint
            const centerPoint = userCoords || (stopCoords.length > 0 ? stopCoords[0] : zone.center);
            boundingCircleRef.current = {
                center: centerPoint,
                radiusMeters: 1200,
                maxDistFromCenterMeters: 1200,
            };
        } else {
            // In Planning Mode: No restrictive circle
            boundingCircleRef.current = null;
        }

        if (activeItineraryLandmarks.length < 2) {
            trajectoryRef.current = stopCoords;
            redrawSketchedPaths();
            return;
        }

        let isMounted = true;
        fetchPedestrianRoute(stopCoords).then((result) => {
            if (isMounted) {
                trajectoryRef.current =
                    result.coordinates.length > 0 ? result.coordinates : stopCoords;
                redrawSketchedPaths();
            }
        });

        return () => {
            isMounted = false;
        };
    }, [activeItineraryLandmarks, userCoords, zone.center, currentMode, appMode]);

    // Smoothly re-center camera on day switch
    const prevDayRef = useRef<number>(activeDayNumber);
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (prevDayRef.current !== activeDayNumber) {
            prevDayRef.current = activeDayNumber;
            const stopCoords = activeItineraryLandmarks.map((l) => l.coords);
            if (stopCoords.length > 1) {
                const latLngs = stopCoords.map(([lat, lng]) => L.latLng(lat, lng));
                const bounds = L.latLngBounds(latLngs);
                if (bounds.isValid()) {
                    map.flyToBounds(bounds.pad(0.35), {
                        duration: 1.2,
                        easeLinearity: 0.25,
                    });
                }
            } else if (stopCoords.length === 1) {
                map.flyTo(stopCoords[0], 16, { duration: 1.0 });
            }
        }
    }, [activeDayNumber, activeItineraryLandmarks]);

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: zone.center,
            zoom: zone.zoom,
            zoomControl: false,
            attributionControl: false,
            boxZoom: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // 1. Base tile layer in standard tilePane (z-index: 200) - default natural topo coloring
        L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
            {
                maxZoom: 19,
                crossOrigin: true,
            }
        ).addTo(map);

        // 2. Inpainted tile layer in custom pane (z-index: 220) - vibrant illustrated watercolor
        const inpaintedPane = map.createPane('inpaintedTilePane');
        inpaintedPane.style.zIndex = '220';
        inpaintedPane.style.pointerEvents = 'none';
        inpaintedPane.classList.add('illustrated-watercolor-tiles');
        inpaintedPaneRef.current = inpaintedPane;

        L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
            {
                maxZoom: 19,
                crossOrigin: true,
                pane: 'inpaintedTilePane',
            }
        ).addTo(map);

        // 3. Rough.js vector overlay pane (z-index: 450)
        const customPane = map.createPane('roughOverlayPane');
        customPane.style.zIndex = '450';
        customPane.style.pointerEvents = 'none';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.left = '0px';
        svg.style.top = '0px';
        svg.style.pointerEvents = 'none';
        svg.style.overflow = 'visible';
        customPane.appendChild(svg);
        svgOverlayRef.current = svg;

        districtBoundariesLayerRef.current = L.layerGroup().addTo(map);
        landmarksLayerRef.current = L.layerGroup().addTo(map);
        facilitiesLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        const emitCurrentBounds = () => {
            if (!onBoundsChangeRef.current || !mapInstanceRef.current) return;
            try {
                const b = mapInstanceRef.current.getBounds();
                if (!b || !b.isValid()) return;
                onBoundsChangeRef.current({
                    minLat: b.getSouth(),
                    minLng: b.getWest(),
                    maxLat: b.getNorth(),
                    maxLng: b.getEast(),
                });
            } catch {
                // Ignore transient frame checks during zoom transitions
            }
        };

        let rafId: number | null = null;
        const scheduleRedraw = () => {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(() => {
                rafId = null;
                redrawSketchedPaths();
            });
        };

        const handleZoomChange = () => {
            if (mapInstanceRef.current) {
                setCurrentZoom(mapInstanceRef.current.getZoom());
            }
            scheduleRedraw();
        };

        map.on('move', scheduleRedraw);
        map.on('zoom', handleZoomChange);
        map.on('zoomend', handleZoomChange);
        map.on('viewreset', handleZoomChange);
        map.on('moveend', emitCurrentBounds);
        map.on('resize', scheduleRedraw);
        map.on('dragstart', () => setHoveredDistrict(null));
        map.on('movestart', () => setHoveredDistrict(null));
        map.on('zoomstart', () => setHoveredDistrict(null));
        map.on('mouseout', () => setHoveredDistrict(null));
        map.on('click', (e: L.LeafletMouseEvent) => {
            if (territoryModeRef.current === 'select') {
                handleSelectDistrict(null);
            }
            if (onMapClickRef.current) {
                onMapClickRef.current([e.latlng.lat, e.latlng.lng]);
            }
        });

        const container = mapContainerRef.current;
        const handleContainerMouseLeave = () => setHoveredDistrict(null);
        if (container) {
            container.addEventListener('mouseleave', handleContainerMouseLeave);
            container.addEventListener('pointerleave', handleContainerMouseLeave);
        }
        window.addEventListener('blur', handleContainerMouseLeave);

        if (onMapReady) onMapReady(map);

        map.whenReady(() => {
            setTimeout(() => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                    setCurrentZoom(mapInstanceRef.current.getZoom());
                    scheduleRedraw();
                    emitCurrentBounds();
                }
            }, 300);
        });

        return () => {
            if (container) {
                container.removeEventListener('mouseleave', handleContainerMouseLeave);
                container.removeEventListener('pointerleave', handleContainerMouseLeave);
            }
            window.removeEventListener('blur', handleContainerMouseLeave);
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            if (itineraryCircleRef.current) {
                itineraryCircleRef.current.remove();
            }
            if (badgeMarkerRef.current) {
                badgeMarkerRef.current.remove();
                badgeMarkerRef.current = null;
            }
            if (districtBoundariesLayerRef.current) {
                districtBoundariesLayerRef.current.clearLayers();
                districtBoundariesLayerRef.current = null;
            }
            try {
                map.stop();
                (map as any)._onZoomTransitionEnd = () => {};
                map.off();
                map.remove();
            } catch {
                // Ignore transient unmount errors
            }
            mapInstanceRef.current = null;
        };
    }, []);

    // Smoothly fly camera when destination zone changes without tearing down map canvas
    const prevZoneIdRef = useRef(zone.id);
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        if (prevZoneIdRef.current !== zone.id) {
            prevZoneIdRef.current = zone.id;
            map.flyTo(zone.center, zone.zoom || 15, { duration: 1.2 });
        }
    }, [zone.id, zone.center, zone.zoom]);

    // Fast 60FPS DOM sync for hovered landmark in container list
    useEffect(() => {
        document.querySelectorAll('.pin-hovered-active').forEach((el) => {
            el.classList.remove('pin-hovered-active');
        });

        if (hoveredLandmarkId) {
            const el = document.getElementById(`scenic-pin-${hoveredLandmarkId}`);
            if (el) {
                el.classList.add('pin-hovered-active');
            }
            const marker = categoryMarkersMapRef.current.get(hoveredLandmarkId);
            if (marker) {
                marker.setZIndexOffset(4000);
            }
        }

        return () => {
            if (hoveredLandmarkId) {
                const marker = categoryMarkersMapRef.current.get(hoveredLandmarkId);
                if (marker) {
                    marker.setZIndexOffset(1000);
                }
            }
        };
    }, [hoveredLandmarkId]);

    // Render and manage Hong Kong 18 District Boundaries (Mode A: Purely visual, Mode B: Interactive)
    useEffect(() => {
        const map = mapInstanceRef.current;
        const layer = districtBoundariesLayerRef.current;
        if (!map || !layer) return;

        layer.clearLayers();
        setHoveredDistrict(null);

        const isSelectMode = territoryMode === 'select';
        const allBoundaries = Object.values(HONG_KONG_DISTRICT_BOUNDARIES);
        const zoom = map.getZoom();
        // In Select Mode: always show all district boundaries so user can hover and select any district
        // In Explore Mode: show subtle ambient boundaries if zoom <= 13, and always show active lit boundary
        const showAmbient = isSelectMode ? true : zoom <= 13;

        for (const dist of allBoundaries) {
            const isActive = activeDistrictKey === dist.key;
            if (!isActive && !showAmbient) continue;

            const polyGroup = L.featureGroup();

            dist.rings.forEach((ring) => {
                const polygon = L.polygon(ring, {
                    className: `district-boundary-ring district-boundary-${dist.key} ${
                        isActive ? 'district-boundary-lit' : 'district-boundary-ambient'
                    }`,
                    color: isActive ? '#d97706' : (isSelectMode ? '#b45309' : '#92400e'),
                    weight: isActive ? 3.5 : (isSelectMode ? 2 : 1.2),
                    opacity: isActive ? 1 : (isSelectMode ? 0.6 : 0.35),
                    dashArray: isActive ? undefined : (isSelectMode ? '6, 4' : '5, 5'),
                    fill: isSelectMode,
                    fillColor: isSelectMode ? '#f59e0b' : 'transparent',
                    fillOpacity: isSelectMode ? 0.0001 : 0,
                    interactive: isSelectMode,
                    bubblingMouseEvents: true,
                });

                if (isSelectMode) {
                    const matchingPack = Object.values(CITY_PACKS).find((p) => getDistrictBoundaryKey(p.id) === dist.key);
                    const spotCount = matchingPack?.landmarks?.length || 0;
                    const label = dist.name;

                    polygon.bindTooltip(`
                        <div class="px-2.5 py-1 text-xs font-serif font-black text-paper-900 flex items-center gap-1.5 bg-paper-50/95 border-2 border-paper-900 rounded-xl shadow-stamp backdrop-blur-xs select-none pointer-events-none">
                            <span class="w-5 h-5 rounded-full bg-amber-200 border border-amber-400 flex items-center justify-center text-[11px] shrink-0">🏮</span>
                            <span class="font-bold">${label}</span>
                            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 font-mono font-bold">${spotCount} spots</span>
                        </div>
                    `, {
                        sticky: true,
                        direction: 'top',
                        offset: [0, -10],
                        className: 'custom-district-polygon-tooltip',
                    });

                    polygon.on('click', (e) => {
                        L.DomEvent.stopPropagation(e);
                        playChime('stamp');
                        const nextKey = isActive ? null : dist.key;
                        handleSelectDistrict(nextKey);
                    });
                }

                polyGroup.addLayer(polygon);
            });

            if (isSelectMode) {
                polyGroup.on('mouseover', () => {
                    if (!isActive) {
                        setHoveredDistrict(dist.key);
                    }
                });

                polyGroup.on('mouseout', () => {
                    if (!isActive) {
                        setHoveredDistrict(null);
                    }
                });
            }

            if (isActive) {
                polyGroup.bringToFront();
            }
            layer.addLayer(polyGroup);
        }
    }, [activeDistrictKey, currentZoom, territoryMode]);

    useEffect(() => {
        const layer = landmarksLayerRef.current;
        const map = mapInstanceRef.current;
        if (!layer || !map) return;
        layer.clearLayers();
        categoryMarkersMapRef.current.clear();

        const zoom = map.getZoom();
        const itineraryIndexMap = new Map(activeStopIds.map((id, index) => [id, index + 1]));
        const activeCat = categoryFilter || 'all';
        const visibleCategoryIds = new Set((visibleCategoryLandmarks || []).map((l) => l.id));

        // 1. Filter landmarks by active category (always preserving route stops & personal spots)
        const candidateLandmarks = landmarks.filter((lm) => {
            const isStop = itineraryIndexMap.has(lm.id);
            const isPersonal = Boolean(lm.isCustom || lm.tag === 'Personal Spot' || (typeof lm.id === 'string' && lm.id.startsWith('custom-')));
            if (isStop || isPersonal) return true;
            if (activeCat === 'all') return true;
            return visibleCategoryIds.has(lm.id);
        });

        // 2. Macro Territorial View (zoom <= 12): ZERO ambient icons! Render Illustrated District Badges instead.
        if (zoom <= 12) {
            const uniquePacks = Array.from(new Set(Object.values(CITY_PACKS)));
            const viewBounds = map.getBounds();
            const placedBadgePoints: { x: number; y: number }[] = [];

            for (const pack of uniquePacks) {
                if (!pack.center || !pack.districtName) continue;
                if (!viewBounds.contains(L.latLng(pack.center[0], pack.center[1]))) continue;

                const count = pack.landmarks?.length || 0;
                const cleanName = pack.districtName.replace(/^Hong Kong\s*•\s*/i, '').trim();
                const badgeLabel = cleanName
                    .replace(' (Yau Tsim Mong)', '')
                    .replace(' (Kwai Chung & Tsing Yi)', '')
                    .replace(' (North Point & Quarry Bay)', ' (North Point)')
                    .replace(' (Lantau, Lamma & Cheung Chau)', ' (Lantau & Lamma)')
                    .replace(', Tai Mei Tuk & Tap Mun', ' & Tai Mei Tuk');

                // Screen-space slight dynamic offset to avoid adjacent coin overlap in dense clusters (e.g. Kowloon)
                const pt = map.latLngToContainerPoint(L.latLng(pack.center[0], pack.center[1]));
                let offsetY = 0;
                for (const placed of placedBadgePoints) {
                    const dx = Math.abs(pt.x - placed.x);
                    const dy = Math.abs(pt.y - placed.y);
                    if (dx < 36 && dy < 36) {
                        offsetY = pt.y >= placed.y ? 10 : -10;
                    }
                }
                placedBadgePoints.push({ x: pt.x, y: pt.y + offsetY });

                const bKey = getDistrictBoundaryKey(pack.id);
                const isDistrictActive = Boolean(bKey && activeDistrictKey === bKey);

                const badgeHtml = `
                    <div class="relative pointer-events-auto group" style="transform: translate(-50%, calc(-50% + ${offsetY}px));">
                        <div class="cursor-pointer inline-flex items-center p-1 rounded-full ${
                            isDistrictActive
                                ? 'bg-amber-100 border-2 border-amber-600 shadow-[0_0_22px_rgba(245,158,11,0.95)] scale-110 px-2.5 py-1'
                                : 'bg-paper-50/95 border-2 border-paper-900 shadow-stamp'
                        } transition-all duration-300 ease-out select-none backdrop-blur-xs whitespace-nowrap hover:scale-105 active:scale-95 group-hover:px-3 group-hover:py-1" title="${badgeLabel} (${count} spots)">
                            <div class="w-6 h-6 rounded-full ${
                                isDistrictActive
                                    ? 'bg-amber-400 text-amber-950 border border-amber-500 shadow-xs'
                                    : 'bg-amber-200/90 border border-amber-400/80'
                            } flex items-center justify-center text-xs shrink-0 shadow-2xs">
                                🏮
                            </div>
                            <div class="${
                                isDistrictActive
                                    ? 'max-w-[280px] opacity-100 ml-1.5'
                                    : 'max-w-0 overflow-hidden opacity-0 group-hover:max-w-[280px] group-hover:opacity-100 group-hover:ml-1.5'
                            } transition-all duration-300 ease-out flex items-center gap-1.5">
                                <span class="text-xs font-serif font-black text-paper-900 tracking-tight">${badgeLabel}</span>
                                <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-300/80 shrink-0">${count} spots</span>
                            </div>
                        </div>
                    </div>
                `;
                const icon = L.divIcon({
                    className: 'custom-district-badge-pin',
                    html: badgeHtml,
                    iconSize: [0, 0],
                    iconAnchor: [0, 0],
                });
                const marker = L.marker(pack.center, { icon, zIndexOffset: isDistrictActive ? 1500 : 500 });
                marker.on('mouseover', () => {
                    marker.setZIndexOffset(2000);
                    if (bKey && !isDistrictActive) {
                        setHoveredDistrict(bKey);
                    }
                });
                marker.on('mouseout', () => {
                    marker.setZIndexOffset(isDistrictActive ? 1500 : 500);
                    if (!isDistrictActive) {
                        setHoveredDistrict(null);
                    }
                });
                marker.on('click', () => {
                    playChime('stamp');
                    const nextKey = isDistrictActive ? null : bKey;
                    handleSelectDistrict(nextKey || null);
                    if (nextKey) {
                        const boundary = getDistrictBoundary(bKey || '');
                        if (boundary && boundary.rings && boundary.rings.length > 0) {
                            const lats = boundary.rings.flatMap((r) => r.map((pt) => pt[0]));
                            const lngs = boundary.rings.flatMap((r) => r.map((pt) => pt[1]));
                            const b = L.latLngBounds(
                                [Math.min(...lats), Math.min(...lngs)],
                                [Math.max(...lats), Math.max(...lngs)]
                            );
                            if (mapInstanceRef.current) {
                                mapInstanceRef.current.fitBounds(b, { padding: [40, 40], maxZoom: 14 });
                            }
                        } else if (mapInstanceRef.current) {
                            mapInstanceRef.current.flyTo(pack.center, 14, { duration: 1.2 });
                        }
                    }
                });
                layer.addLayer(marker);
            }
        }

        // Screen-space collision avoidance points (container coordinates [x, y])
        const placedScreenPoints: { x: number; y: number }[] = [];

        // Max ambient spots allowed on screen based on zoom and category
        const maxAmbientAllowed =
            zoom <= 12
                ? 0 // ZERO ambient spots at macro overview
                : zoom <= 14
                ? (activeCat === 'all' ? 8 : 16) // Sub-region / District view (top anchors only)
                : (activeCat === 'all' ? 18 : 28); // Neighborhood walk (max 18-28 spots)

        let renderedAmbientCount = 0;

        // Prioritize itinerary stops first, then personal spots, then sort by importance score descending, and chains last
        const sortedLandmarks = [...candidateLandmarks].sort((a, b) => {
            const aIsStop = itineraryIndexMap.has(a.id);
            const bIsStop = itineraryIndexMap.has(b.id);
            if (aIsStop && !bIsStop) return -1;
            if (!aIsStop && bIsStop) return 1;

            const aIsPersonal = Boolean(a.isCustom || a.tag === 'Personal Spot' || (typeof a.id === 'string' && a.id.startsWith('custom-')));
            const bIsPersonal = Boolean(b.isCustom || b.tag === 'Personal Spot' || (typeof b.id === 'string' && b.id.startsWith('custom-')));
            if (aIsPersonal && !bIsPersonal) return -1;
            if (!aIsPersonal && bIsPersonal) return 1;

            // Sort by Importance Score (highest prominence landmark rendered first so it claims screen coordinates)
            const aScore = a.importanceScore ?? (aIsPersonal ? 90 : 50);
            const bScore = b.importanceScore ?? (bIsPersonal ? 90 : 50);
            if (aScore !== bScore) {
                return bScore - aScore;
            }

            const aIsChain = isCommercialChain(a.name);
            const bIsChain = isCommercialChain(b.name);
            if (!aIsChain && bIsChain) return -1;
            if (aIsChain && !bIsChain) return 1;
            return 0;
        });

        sortedLandmarks.forEach((lm) => {
            const isSelected = activeLandmark?.id === lm.id;
            const stopNumber = itineraryIndexMap.get(lm.id);
            const isItineraryStop = stopNumber !== undefined;
            const isPersonalSpot = Boolean(
                lm.isCustom ||
                lm.tag === 'Personal Spot' ||
                (typeof lm.id === 'string' && lm.id.startsWith('custom-'))
            );
            const isChain = isCommercialChain(lm.name);

            // --- 1. Level of Detail (LOD) & Density Capping ---
            if (!isItineraryStop && !isPersonalSpot) {
                // At macro zoom <= 12: hide ambient spots in default overview mode
                if (zoom <= 12 && activeCat === 'all') {
                    return;
                }

                // In On-Trip Mode: Ambient discovery only within the live 1.2km walking radius!
                if (appMode === 'on-trip' && userCoords) {
                    const distMeters = haversineMeters(lm.coords, userCoords);
                    if (distMeters > 1200) {
                        return; // Outside discovery horizon!
                    }
                }

                // Strict budget cap: don't overwhelm canvas in default overview mode
                if (activeCat === 'all' && renderedAmbientCount >= maxAmbientAllowed) {
                    return;
                }

                if (activeCat === 'all') {
                    const tier = lm.prominenceTier || (lm.importanceScore && lm.importanceScore >= 85 ? 1 : 2);
                    // Regional overview (zoom <= 14): ONLY show Tier 1 flagship anchors
                    if (zoom <= 14 && tier > 1) {
                        return;
                    }
                    // Ambient chain venues: Do not show at mid-zoom
                    if (isChain && zoom <= 15) {
                        return;
                    }
                }
            }

            // Convert LatLng to container screen pixel coordinates
            const pt = map.latLngToContainerPoint(L.latLng(lm.coords[0], lm.coords[1]));

            // --- 2. Screen-Space Collision Avoidance ---
            if (!isItineraryStop) {
                const collisionRadius = isPersonalSpot
                    ? 28
                    : activeCat !== 'all'
                    ? (zoom >= 16 ? 24 : zoom === 15 ? 28 : 34)
                    : zoom >= 16
                    ? 24
                    : zoom === 15
                    ? 32
                    : 40; // Generous 40px spacing at mid-zoom

                const hasCollision = placedScreenPoints.some((p) => {
                    const dx = p.x - pt.x;
                    const dy = p.y - pt.y;
                    return Math.sqrt(dx * dx + dy * dy) < collisionRadius;
                });
                if (hasCollision) {
                    return; // Skip overlapping ambient spot
                }
            }

            placedScreenPoints.push({ x: pt.x, y: pt.y });
            if (!isItineraryStop && !isPersonalSpot) {
                renderedAmbientCount++;
            }

            // --- 3. Marker Visual Presentation ---
            let markerHtml = '';
            let iconSize: [number, number] = [52, 70];
            let iconAnchor: [number, number] = [26, 64];
            let popupOffset: [number, number] = [0, -56];

            if (isItineraryStop) {
                // State A: Route Stops (active stops in curated journey)
                if (isChain) {
                    // Commercial chain stop: Compact, neat milestone pin
                    iconSize = [36, 48];
                    iconAnchor = [18, 42];
                    popupOffset = [0, -40];
                    markerHtml = `
                        <div class="relative flex flex-col items-center select-none cursor-pointer group transition-transform ${isSelected ? 'scale-120 -translate-y-1' : 'hover:scale-110 hover:-translate-y-1'}">
                            <div class="relative flex items-center justify-center">
                                <div class="w-8 h-8 rounded-xl bg-paper-50 border-2 border-paper-900 shadow-stamp flex items-center justify-center text-sm">
                                    <span>${getCategoryEmoji(lm)}</span>
                                </div>
                                <span class="absolute -top-2 -right-2 w-5 h-5 bg-watercolor-brick text-white rounded-full border border-white font-black text-[10px] flex items-center justify-center shadow-xs">
                                    ${stopNumber}
                                </span>
                            </div>
                            <div class="mt-0.5 px-1.5 py-0.5 rounded-md bg-paper-50/95 border border-paper-900 shadow-xs text-[10px] font-bold text-paper-900 whitespace-nowrap max-w-[100px] truncate font-serif text-center" title="${lm.name}">
                                ${formatPinLabel(lm.name)}
                            </div>
                        </div>
                    `;
                } else if (zoom <= 13) {
                    // Zoomed-out compact milestone stamp (36px)
                    iconSize = [36, 46];
                    iconAnchor = [18, 40];
                    popupOffset = [0, -38];
                    markerHtml = `
                        <div class="relative flex flex-col items-center select-none cursor-pointer group transition-transform ${isSelected ? 'scale-125 -translate-y-1' : 'hover:scale-115 hover:-translate-y-1'}">
                            <div class="w-8 h-8 bg-watercolor-brick text-white rounded-full border-2 border-white font-black text-xs flex items-center justify-center shadow-stamp">
                                ${stopNumber}
                            </div>
                            <div class="mt-0.5 px-1.5 py-0.2 rounded-md bg-paper-50/95 border border-paper-900 shadow-xs text-[10px] font-bold text-paper-900 whitespace-nowrap max-w-[100px] truncate font-serif" title="${lm.name}">
                                ${formatPinLabel(lm.name)}
                            </div>
                        </div>
                    `;
                } else {
                    // Prominent illustrated milestone card with square border and red number badge
                    iconSize = [52, 70];
                    iconAnchor = [26, 64];
                    popupOffset = [0, -56];
                    const badgeHtml = `<span class="absolute -top-3 -right-2 w-6 h-6 bg-watercolor-brick text-white rounded-full border-2 border-white font-black text-xs flex items-center justify-center shadow-stamp z-20">${stopNumber}</span>`;
                    markerHtml = `
                        <div class="relative flex flex-col items-center select-none cursor-pointer group transition-transform ${isSelected ? 'scale-115 -translate-y-2' : 'hover:scale-110 hover:-translate-y-1'}">
                            ${badgeHtml}
                            <div class="w-13 h-13 p-1 rounded-2xl bg-paper-50 border-2 border-paper-900 shadow-stamp flex items-center justify-center">
                                ${lm.svgSnippet}
                            </div>
                            <div class="mt-1 px-2.5 py-0.5 rounded-lg bg-paper-50/95 border-2 border-paper-900 shadow-sm text-[11px] font-bold text-paper-900 whitespace-nowrap max-w-[140px] truncate font-serif text-center" title="${lm.name}">
                                ${formatPinLabel(lm.name)}
                            </div>
                        </div>
                    `;
                }
            } else if (isPersonalSpot) {
                // State B: User's Saved Personal Spot (distinct large square card with gold star badge)
                iconSize = [52, 70];
                iconAnchor = [26, 64];
                popupOffset = [0, -56];
                const badgeHtml = `<span class="absolute -top-2.5 -right-2 w-5.5 h-5.5 bg-amber-400 text-paper-900 rounded-full border-2 border-paper-900 font-black text-[11px] flex items-center justify-center shadow-stamp z-20">⭐</span>`;
                markerHtml = `
                    <div class="relative flex flex-col items-center select-none cursor-pointer group transition-transform ${isSelected ? 'scale-115 -translate-y-2' : 'hover:scale-110 hover:-translate-y-1'}">
                        ${badgeHtml}
                        <div class="w-13 h-13 p-1 rounded-2xl bg-paper-50 ring-2 ring-amber-400 border-2 border-paper-900 shadow-stamp flex items-center justify-center">
                            ${lm.svgSnippet}
                        </div>
                        <div class="mt-1 px-2 py-0.5 rounded-lg bg-amber-100/95 border-2 border-paper-900 shadow-sm text-[11px] font-black text-paper-900 whitespace-nowrap max-w-[130px] truncate font-serif text-center" title="${lm.name}">
                            ${formatPinLabel(lm.name)}
                        </div>
                    </div>
                `;
            } else if (isChain) {
                // State C1: Ambient Chain Venue: Subtle, compact enamel badge (26px) with clean hover tooltip
                iconSize = [26, 26];
                iconAnchor = [13, 13];
                popupOffset = [0, -16];
                const emoji = getCategoryEmoji(lm);
                markerHtml = `
                    <div class="relative flex items-center justify-center select-none cursor-pointer group transition-transform hover:scale-125">
                        <div class="w-6.5 h-6.5 rounded-full bg-paper-50 border-2 border-paper-700/80 shadow-xs flex items-center justify-center text-[11px] opacity-90 group-hover:opacity-100">
                            <span>${emoji}</span>
                        </div>
                        <div class="hidden group-hover:block absolute bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-paper-50/95 border border-paper-900 shadow-sm text-[10px] font-bold text-paper-900 whitespace-nowrap z-30 font-serif pointer-events-none">
                            ${formatPinLabel(lm.name)}
                        </div>
                    </div>
                `;
            } else {
                // State C2: Standard Ambient Locations: Compact circular stamp coin
                const emoji = getCategoryEmoji(lm);
                // Suppress permanent text pill at zoom <= 14 to avoid overlapping text pills!
                const showLabelAlways = zoom >= 15;
                iconSize = showLabelAlways ? [36, 46] : [30, 30];
                iconAnchor = showLabelAlways ? [18, 20] : [15, 15];
                popupOffset = [0, -18];

                // Use category color if active category filter
                let pinColor = lm.color || '#f4c568';
                if (activeCat === 'restaurant') pinColor = '#dc2626';
                else if (activeCat === 'cafe') pinColor = '#ea580c';
                else if (activeCat === 'hotel') pinColor = '#6366f1';
                else if (activeCat === 'shopping') pinColor = '#9333ea';
                else if (activeCat === 'nature') pinColor = '#15803d';
                else if (activeCat === 'attraction') pinColor = '#0284c7';

                const categoryItemIdx = visibleCategoryLandmarks.findIndex((l) => l.id === lm.id);
                const batchNumber = categoryItemIdx !== -1 && activeCat !== 'all' ? (categoryBatchStartIdx ?? 0) + categoryItemIdx + 1 : null;
                const isHovered = hoveredLandmarkId === lm.id;

                const labelHtml = showLabelAlways || isHovered
                    ? `<div class="pin-hover-tooltip mt-0.5 px-1.5 py-0.2 rounded-md bg-paper-50/95 border border-paper-900/80 shadow-2xs text-[10px] font-bold text-paper-900 whitespace-nowrap max-w-[120px] truncate font-serif text-center group-hover:bg-amber-100" title="${lm.name}">
                           ${formatPinLabel(lm.name)}
                       </div>`
                    : `<div class="pin-hover-tooltip hidden group-hover:block absolute bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-paper-50/95 border border-paper-900 shadow-sm text-[10px] font-bold text-paper-900 whitespace-nowrap z-30 font-serif pointer-events-none">
                           ${formatPinLabel(lm.name)}
                       </div>`;

                markerHtml = `
                    <div id="scenic-pin-${lm.id}" class="scenic-pin-container relative flex flex-col items-center select-none cursor-pointer group transition-all duration-200 ${
                        isHovered
                            ? 'pin-hovered-active'
                            : isSelected
                            ? 'scale-120 -translate-y-1'
                            : 'hover:scale-115 hover:-translate-y-1'
                    }">
                        <div class="pin-circle-bg w-8 h-8 rounded-full border-2 border-paper-900 shadow-stamp flex items-center justify-center text-sm transition-all duration-200 relative" style="background-color: ${pinColor}">
                            ${batchNumber !== null ? `<span class="absolute -top-2 -right-2.5 w-5 h-5 bg-paper-900 text-amber-300 border border-white rounded-full font-mono text-[9px] font-black flex items-center justify-center shadow-xs z-20">${batchNumber}</span>` : ''}
                            <span class="drop-shadow-xs">${emoji}</span>
                        </div>
                        ${labelHtml}
                    </div>
                `;
            }

            const icon = L.divIcon({
                className: 'custom-scenic-building-pin',
                html: markerHtml,
                iconSize,
                iconAnchor,
            });

            const isHoveredSpot = hoveredLandmarkId === lm.id;
            const marker = L.marker(lm.coords, {
                icon,
                zIndexOffset: isHoveredSpot ? 4000 : isItineraryStop ? 2000 : (isPersonalSpot ? 1500 : 1000),
            });
            categoryMarkersMapRef.current.set(lm.id, marker);

            const targetItem =
                activeDay?.items?.find((i) => i.id === lm.id) ||
                (lm.tag === 'LODGING'
                    ? activeDay?.items?.find((i) => i.category === 'lodging')
                    : null);

            const actualCostBadge =
                targetItem && targetItem.actualCost > 0
                    ? `<span class="bg-emerald-100 text-emerald-900 border border-emerald-400 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-full">Paid: $${targetItem.actualCost}</span>`
                    : targetItem && targetItem.estimatedCost > 0
                    ? `<span class="bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-full">Est: $${targetItem.estimatedCost}</span>`
                    : '';

            const popupHtml = `
                <div class="p-1 space-y-1.5 font-sans min-w-[200px] max-w-[240px]">
                    <div class="flex items-center justify-between gap-1.5">
                        ${isItineraryStop
                            ? `<span class="text-[10px] font-black px-1.5 py-0.5 bg-watercolor-brick text-white rounded font-mono">#${stopNumber} In Route</span>`
                            : isPersonalSpot
                            ? `<span class="text-[10px] font-bold px-1.5 py-0.5 bg-amber-300 text-amber-950 border border-amber-400 rounded font-mono">⭐ Personal Spot</span>`
                            : `<span class="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-950 border border-amber-300 rounded font-mono">📍 Discovered Spot</span>`
                        }
                        ${actualCostBadge}
                    </div>
                    <div class="font-serif font-black text-sm text-paper-900 leading-tight">${lm.name}</div>
                    <div class="text-[11px] text-paper-700 line-clamp-2">${lm.desc}</div>
                    <div class="pt-1 flex flex-col gap-1 border-t border-paper-200">
                        ${!isItineraryStop && onAddToRouteRef.current ? `
                            <button
                                type="button"
                                id="btn-add-${lm.id}"
                                class="w-full py-1.5 px-3 bg-amber-400 hover:bg-amber-500 text-paper-900 rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-xs border border-paper-900 cursor-pointer transition active:scale-95"
                            >
                                <span>➕ Add to Route</span>
                            </button>
                        ` : ''}
                        ${isPersonalSpot && onDeletePersonalSpotRef.current ? `
                            <button
                                type="button"
                                id="btn-del-spot-${lm.id}"
                                class="w-full py-1.5 px-3 bg-red-100 hover:bg-red-200 text-red-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs border border-red-300 cursor-pointer transition active:scale-95"
                            >
                                <span>🗑️ Delete Personal Spot</span>
                            </button>
                        ` : ''}
                        ${appMode === 'on-trip' && isItineraryStop ? `
                            <button
                                type="button"
                                id="btn-expense-${lm.id}"
                                class="w-full py-1.5 px-3 bg-watercolor-brick hover:bg-red-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm cursor-pointer transition active:scale-95"
                            >
                                <span>💸 Record Expense</span>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;

            marker.bindPopup(popupHtml, {
                className: 'custom-watercolor-popup',
                offset: popupOffset,
                closeButton: true,
            });

            marker.on('popupopen', () => {
                const addBtn = document.getElementById(`btn-add-${lm.id}`);
                if (addBtn && onAddToRouteRef.current) {
                    addBtn.onclick = (e) => {
                        e.stopPropagation();
                        onAddToRouteRef.current!(lm);
                        marker.closePopup();
                    };
                }
                const delSpotBtn = document.getElementById(`btn-del-spot-${lm.id}`);
                if (delSpotBtn && onDeletePersonalSpotRef.current) {
                    delSpotBtn.onclick = (e) => {
                        e.stopPropagation();
                        onDeletePersonalSpotRef.current!(lm.id);
                        marker.closePopup();
                    };
                }
                const expenseBtn = document.getElementById(`btn-expense-${lm.id}`);
                if (expenseBtn && onRecordExpense) {
                    expenseBtn.onclick = (e) => {
                        e.stopPropagation();
                        const fallbackItem: ItineraryItem = targetItem || {
                            id: lm.id,
                            dayId: activeDay?.id || 'day-1',
                            planId: activeDay?.planId || 'plan-1',
                            name: lm.name,
                            category:
                                lm.category === 'craft'
                                    ? 'dining'
                                    : lm.category === 'history'
                                    ? 'transit'
                                    : 'ticket',
                            estimatedCost: 0,
                            actualCost: 0,
                            location: lm.coords,
                            orderIndex: (stopNumber || 1) - 1,
                        };
                        onRecordExpense(fallbackItem);
                        marker.closePopup();
                    };
                }
            });

            marker.on('click', () => {
                onSelectLandmark(lm);
                marker.openPopup();
            });
            marker.addTo(layer);
        });

        if (onCategoryCountChange) {
            onCategoryCountChange(renderedAmbientCount);
        }

        redrawSketchedPaths();
    }, [landmarks, activeLandmark, activeStopIds, activeItineraryLandmarks, appMode, activeDay, onRecordExpense, currentZoom, categoryFilter, onCategoryCountChange, userCoords, visibleCategoryLandmarks, categoryBatchStartIdx, hoveredLandmarkId, activeDistrictKey]);

    useEffect(() => {
        const layer = facilitiesLayerRef.current;
        if (!layer) return;
        layer.clearLayers();

        // Filter out any synthetic dummy facilities (e.g. legacy Artisan Cafe, synthetic visitor info, restrooms, photo spots)
        const validFacilities = facilities.filter(
            (fac) =>
                !fac.name.toLowerCase().includes('artisan cafe') &&
                !fac.name.toLowerCase().includes('visitor information') &&
                !fac.name.toLowerCase().includes('public restroom facilities') &&
                !fac.name.toLowerCase().includes('scenic photography spot')
        );

        validFacilities.forEach((fac) => {
            const facHtml = `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-paper-50 border-2 border-paper-900 shadow-stamp text-sm cursor-pointer hover:scale-125 transition-transform" title="${fac.name}">
          ${fac.emoji}
        </div>
      `;

            const icon = L.divIcon({
                className: 'custom-amenity-pin',
                html: facHtml,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
            });

            const marker = L.marker(fac.coords, { icon, zIndexOffset: 800 });
            marker.bindTooltip(
                `<div class="text-xs font-bold font-serif text-paper-900">${fac.name}</div>`,
                { direction: 'top', offset: [0, -12] }
            );

            const popupHtml = `
                <div class="p-2 min-w-[150px] font-sans text-center">
                    <div class="text-2xl mb-1">${fac.emoji}</div>
                    <div class="font-serif font-black text-sm text-paper-900">${fac.name}</div>
                    <div class="text-[11px] text-paper-600 capitalize mt-0.5">${fac.type} amenity</div>
                </div>
            `;
            marker.bindPopup(popupHtml, {
                className: 'custom-watercolor-popup',
                offset: [0, -14],
                closeButton: true,
            });

            marker.on('click', () => {
                marker.openPopup();
            });

            marker.addTo(layer);
        });
    }, [facilities]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const rotateTransform = userHeading != null ? `transform: rotate(${userHeading}deg);` : '';
        const userHtml = `
      <div class="relative w-10 h-10 flex items-center justify-center select-none">
        <div class="gps-pulse-beacon"></div>
        <div class="w-7 h-7 bg-watercolor-brick border-2 border-white rounded-full shadow-stamp z-10 flex items-center justify-center text-[10px] text-white font-black" style="${rotateTransform}">
          ${userHeading != null ? '▲' : 'Me'}
        </div>
      </div>
    `;

        const icon = L.divIcon({
            className: 'custom-user-gps-marker',
            html: userHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
        });

        if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(userCoords);
            userMarkerRef.current.setIcon(icon);
        } else {
            userMarkerRef.current = L.marker(userCoords, { icon, zIndexOffset: 3000 }).addTo(map);
        }

        if (userAccuracy && userAccuracy > 0) {
            if (accuracyCircleRef.current) {
                accuracyCircleRef.current.setLatLng(userCoords);
                accuracyCircleRef.current.setRadius(userAccuracy);
            } else {
                accuracyCircleRef.current = L.circle(userCoords, {
                    radius: userAccuracy,
                    color: '#c14937',
                    weight: 1,
                    fillColor: '#c14937',
                    fillOpacity: 0.1,
                }).addTo(map);
            }
        } else if (accuracyCircleRef.current) {
            accuracyCircleRef.current.remove();
            accuracyCircleRef.current = null;
        }
    }, [userCoords, userHeading, userAccuracy]);

    return (
        <div className="relative w-full h-full overflow-hidden bg-[#e8dcba]">
            {/* SVG Defs for itinerary bounding mask clipPath */}
            <svg
                className="absolute pointer-events-none"
                style={{ position: 'absolute', width: 0, height: 0, left: 0, top: 0 }}
                aria-hidden="true"
            >
                <defs>
                    <clipPath id="itinerary-bounding-mask" clipPathUnits="userSpaceOnUse">
                        <circle ref={maskCircleRef} cx="0" cy="0" r="0" />
                    </clipPath>
                </defs>
            </svg>
            <div ref={mapContainerRef} className="w-full h-full relative z-0" />
        </div>
    );
};