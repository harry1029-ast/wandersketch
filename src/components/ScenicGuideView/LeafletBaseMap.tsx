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
} from '@/lib/geoMask';
import { isCommercialChain } from '@/lib/chainBrands';

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
    isParchmentMode: boolean;
    onOpenIslandView?: () => void;
    onMapReady?: (map: L.Map) => void;
    onBoundsChange?: (bounds: { minLat: number; minLng: number; maxLat: number; maxLng: number }) => void;
    onRecordExpense?: (item: ItineraryItem) => void;
    onAddToRoute?: (landmark: Landmark) => void;
    onDeletePersonalSpot?: (spotId: string) => void;
    onMapClick?: (coords: [number, number]) => void;
    mapDiscoveryMode?: string;
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
    isParchmentMode,
    onOpenIslandView,
    onMapReady,
    onBoundsChange,
    onRecordExpense,
    onAddToRoute,
    onDeletePersonalSpot,
    onMapClick,
    mapDiscoveryMode,
}) => {
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
        if (!map || !inpaintedPane || !bCircle) return;

        // For distant intercity journeys (>20km), disable localized circular clip-path to prevent GPU lag
        if (bCircle.radiusMeters > 20000) {
            inpaintedPane.style.clipPath = 'none';
            (inpaintedPane.style as any).webkitClipPath = 'none';
            return;
        }

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

        if (currentMode === 'ambient' && activeItineraryLandmarks.length < 2) {
            // Ambient discovery horizon halo (~1.2km) centered at user location or zone center
            const centerPoint = userCoords || zone.center;
            boundingCircleRef.current = {
                center: centerPoint,
                radiusMeters: 1200,
                maxDistFromCenterMeters: 1200,
            };
            trajectoryRef.current = [];
            redrawSketchedPaths();
            return;
        }

        const bCircle = calculateItineraryBoundingCircle(stopCoords, userCoords || zone.center);
        boundingCircleRef.current = bCircle;

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
    }, [activeItineraryLandmarks, userCoords, zone.center, currentMode]);

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
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // 1. Base tile layer in standard tilePane (z-index: 200) - muted sepia parchment
        L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
            {
                maxZoom: 19,
                crossOrigin: true,
            }
        ).addTo(map);

        // Apply parchment shader to base tilePane
        const baseTilePane = map.getPane('tilePane');
        if (baseTilePane && isParchmentMode) {
            baseTilePane.classList.add('hand-drawn-tile-filter');
        }

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
        map.on('click', (e: L.LeafletMouseEvent) => {
            if (onMapClickRef.current) {
                onMapClickRef.current([e.latlng.lat, e.latlng.lng]);
            }
        });

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
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            if (itineraryCircleRef.current) {
                itineraryCircleRef.current.remove();
                itineraryCircleRef.current = null;
            }
            if (badgeMarkerRef.current) {
                badgeMarkerRef.current.remove();
                badgeMarkerRef.current = null;
            }
            map.off();
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [zone]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        const tilePane = map.getPane('tilePane');
        if (!tilePane) return;

        if (isParchmentMode) {
            tilePane.classList.add('hand-drawn-tile-filter');
        } else {
            tilePane.classList.remove('hand-drawn-tile-filter');
        }
    }, [isParchmentMode]);

    useEffect(() => {
        const layer = landmarksLayerRef.current;
        const map = mapInstanceRef.current;
        if (!layer || !map) return;
        layer.clearLayers();

        const zoom = map.getZoom();
        const itineraryIndexMap = new Map(activeStopIds.map((id, index) => [id, index + 1]));

        // Screen-space collision avoidance points (container coordinates [x, y])
        const placedScreenPoints: { x: number; y: number }[] = [];

        // Prioritize itinerary stops first, then personal spots, then sort by importance score descending, and chains last
        const sortedLandmarks = [...landmarks].sort((a, b) => {
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

            // --- 1. Level of Detail (LOD) Zoom Gating by Importance ---
            if (!isItineraryStop && !isPersonalSpot) {
                const isDining =
                    lm.category === 'craft' ||
                    lm.tag === 'CAFE' ||
                    lm.tag === 'COFFEE' ||
                    lm.tag === 'BAKERY' ||
                    lm.tag === 'RESTAURANT' ||
                    lm.tag === 'FAST FOOD' ||
                    lm.tag === 'DINING';

                // Regional overview (zoom <= 14): HIDE ambient dining/cafes completely!
                // Keep the macro illustrated map clean and focused on anchor destinations (malls, museums, temples, parks)
                if (zoom <= 14 && isDining) {
                    return;
                }

                const tier =
                    lm.prominenceTier ||
                    (lm.importanceScore && lm.importanceScore >= 68
                        ? 1
                        : lm.importanceScore && lm.importanceScore >= 42
                        ? 2
                        : 3);

                // Regional overview (zoom <= 13): ONLY show Tier 1 major landmarks & icons
                if (zoom <= 13 && tier > 1) {
                    return;
                }
                // Neighborhood walk (zoom 14-15): Show Tier 1 + Tier 2 (hide minor street amenities)
                if (zoom <= 15 && tier > 2) {
                    return;
                }
                // Ambient chain venues: Do not show at mid-zoom (zoom <= 14) to avoid canvas clutter.
                if (isChain && zoom <= 14) {
                    return;
                }
            }

            // Convert LatLng to container screen pixel coordinates
            const pt = map.latLngToContainerPoint(L.latLng(lm.coords[0], lm.coords[1]));

            // --- 2. Screen-Space Collision Avoidance ---
            if (!isItineraryStop) {
                const isDining =
                    lm.category === 'craft' ||
                    lm.tag === 'CAFE' ||
                    lm.tag === 'COFFEE' ||
                    lm.tag === 'BAKERY' ||
                    lm.tag === 'RESTAURANT' ||
                    lm.tag === 'FAST FOOD' ||
                    lm.tag === 'DINING';

                const tier =
                    lm.prominenceTier ||
                    (lm.importanceScore && lm.importanceScore >= 68 ? 1 : 2);
                const collisionRadius = isPersonalSpot
                    ? 28
                    : isDining
                    ? 38 // Wider spacing for dining to prevent cafes clumping together on the same block
                    : isChain
                    ? 18
                    : tier === 1
                    ? (zoom >= 16 ? 24 : zoom === 15 ? 18 : 22)
                    : (zoom >= 16 ? 22 : zoom === 15 ? 18 : 22);
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
                // State C2: Standard Ambient Locations: NO huge white square! Compact circular stamp coin with clean label
                iconSize = [36, 46];
                iconAnchor = [18, 20];
                popupOffset = [0, -22];
                const emoji = getCategoryEmoji(lm);
                markerHtml = `
                    <div class="relative flex flex-col items-center select-none cursor-pointer group transition-transform ${isSelected ? 'scale-120 -translate-y-1' : 'hover:scale-115 hover:-translate-y-1'}">
                        <div class="w-8.5 h-8.5 rounded-full border-2 border-paper-900 shadow-stamp flex items-center justify-center text-sm transition-transform" style="background-color: ${lm.color || '#f4c568'}">
                            <span class="drop-shadow-xs">${emoji}</span>
                        </div>
                        <div class="mt-0.5 px-1.5 py-0.2 rounded-md bg-paper-50/95 border border-paper-900/80 shadow-2xs text-[10px] font-bold text-paper-900 whitespace-nowrap max-w-[110px] truncate font-serif text-center group-hover:bg-amber-100" title="${lm.name}">
                            ${formatPinLabel(lm.name)}
                        </div>
                    </div>
                `;
            }

            const icon = L.divIcon({
                className: 'custom-scenic-building-pin',
                html: markerHtml,
                iconSize,
                iconAnchor,
            });

            const marker = L.marker(lm.coords, {
                icon,
                zIndexOffset: isItineraryStop ? 2000 : (isPersonalSpot ? 1500 : 1000),
            });

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

        redrawSketchedPaths();
    }, [landmarks, activeLandmark, activeStopIds, activeItineraryLandmarks, appMode, activeDay, onRecordExpense, currentZoom]);

    useEffect(() => {
        const layer = facilitiesLayerRef.current;
        if (!layer) return;
        layer.clearLayers();

        // Filter out any synthetic dummy facilities (e.g. legacy Artisan Cafe)
        const validFacilities = facilities.filter(
            (fac) => !fac.name.toLowerCase().includes('artisan cafe')
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