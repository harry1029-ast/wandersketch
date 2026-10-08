'use client';

import React, { useEffect, useRef } from 'react';
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
}) => {
    const { currentItineraryDays, activeDayNumber, appMode } = useItineraryStore();
    const activeDay = currentItineraryDays.find((d) => d.dayNumber === activeDayNumber);
    const dayLandmarks = React.useMemo(
        () => getActiveDayLandmarks(activeDay, zone),
        [activeDay, zone]
    );

    // Derive active itinerary stops: either current day's stops, or plan's stops
    const activeItineraryLandmarks = React.useMemo(() => {
        if (dayLandmarks.length > 0) return dayLandmarks;
        if (itineraryStopIds.length > 0) {
            return itineraryStopIds
                .map((id) => landmarks.find((l) => l.id === id))
                .filter(Boolean) as Landmark[];
        }
        return landmarks;
    }, [dayLandmarks, itineraryStopIds, landmarks]);

    const activeStopIds = React.useMemo(() => {
        return activeItineraryLandmarks.map((l) => l.id);
    }, [activeItineraryLandmarks]);

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

    const updateInpaintingMask = () => {
        const map = mapInstanceRef.current;
        const inpaintedPane = inpaintedPaneRef.current;
        const bCircle = boundingCircleRef.current;
        if (!map || !inpaintedPane || !bCircle) return;

        const { layerCenter, radiusPx } = getPixelCircle(
            map,
            bCircle.center,
            bCircle.radiusMeters
        );

        if (maskCircleRef.current) {
            maskCircleRef.current.setAttribute('cx', `${layerCenter.x}`);
            maskCircleRef.current.setAttribute('cy', `${layerCenter.y}`);
            maskCircleRef.current.setAttribute('r', `${radiusPx}`);
        }

        inpaintedPane.style.clipPath = `circle(${radiusPx}px at ${layerCenter.x}px ${layerCenter.y}px)`;
        (inpaintedPane.style as any).webkitClipPath = `circle(${radiusPx}px at ${layerCenter.x}px ${layerCenter.y}px)`;
    };

    const updatePerimeterBadge = () => {
        const map = mapInstanceRef.current;
        const bCircle = boundingCircleRef.current;
        if (!map || !bCircle) return;

        const badgeCoords = getCirclePerimeterCoords(bCircle.center, bCircle.radiusMeters, 42);

        if (badgeMarkerRef.current) {
            badgeMarkerRef.current.setLatLng(badgeCoords);
        } else {
            const badgeHtml = `
        <button
          type="button"
          class="group flex items-center gap-1.5 px-3 py-1 bg-paper-50 hover:bg-amber-100 text-paper-900 border-2 border-paper-900 rounded-full font-serif font-black text-xs shadow-stamp cursor-pointer transform hover:scale-105 active:scale-95 transition-all select-none whitespace-nowrap"
          title="Open self-contained illustrated island view"
        >
          <span class="text-amber-500 animate-spin-slow">✨</span>
          <span>Enter Island View</span>
          <span class="text-[10px] text-watercolor-brick opacity-80 group-hover:translate-x-0.5 transition-transform">➔</span>
        </button>
      `;

            const badgeIcon = L.divIcon({
                className: 'custom-island-trigger-badge',
                html: badgeHtml,
                iconSize: [140, 32],
                iconAnchor: [70, 16],
            });

            const marker = L.marker(badgeCoords, { icon: badgeIcon, zIndexOffset: 2500 });
            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                if (onOpenIslandViewRef.current) {
                    onOpenIslandViewRef.current();
                }
            });
            marker.addTo(map);
            badgeMarkerRef.current = marker;
        }
    };

    const updateItineraryCircle = () => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (boundingCircleRef.current) {
            const { center, radiusMeters } = boundingCircleRef.current;
            if (itineraryCircleRef.current) {
                itineraryCircleRef.current.setLatLng(center);
                itineraryCircleRef.current.setRadius(radiusMeters);
            } else {
                itineraryCircleRef.current = L.circle(center, {
                    radius: radiusMeters,
                    color: '#c14937',
                    weight: 1.5,
                    fillColor: '#c14937',
                    fillOpacity: 0.05,
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
        updatePerimeterBadge();

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
            const pixelPoints = coords.map(([lat, lng]) => {
                const pt = map.latLngToContainerPoint(L.latLng(lat, lng));
                return [pt.x, pt.y];
            });

            for (let i = 0; i < pixelPoints.length - 1; i++) {
                const p1 = pixelPoints[i];
                const p2 = pixelPoints[i + 1];

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
        // ONLY route through active itinerary stops (multi-day or plan stops)
        const stopCoords = activeItineraryLandmarks.map((l) => l.coords);

        // Calculate and cache bounding circle around the active day's cluster
        const bCircle = calculateItineraryBoundingCircle(stopCoords, zone.center);
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
    }, [activeItineraryLandmarks, zone.center]);

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

        map.on('move', redrawSketchedPaths);
        map.on('zoom', redrawSketchedPaths);
        map.on('zoomend', redrawSketchedPaths);
        map.on('viewreset', redrawSketchedPaths);
        map.on('moveend', emitCurrentBounds);
        map.on('resize', redrawSketchedPaths);

        if (onMapReady) onMapReady(map);

        map.whenReady(() => {
            setTimeout(() => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                    redrawSketchedPaths();
                    emitCurrentBounds();
                }
            }, 300);
        });

        return () => {
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
        if (!layer) return;
        layer.clearLayers();

        const itineraryIndexMap = new Map(activeStopIds.map((id, index) => [id, index + 1]));

        landmarks.forEach((lm) => {
            const isSelected = activeLandmark?.id === lm.id;
            const stopNumber = itineraryIndexMap.get(lm.id);
            const isItineraryStop = stopNumber !== undefined;

            const badgeHtml = isItineraryStop
                ? `<span class="absolute -top-3 -right-2 w-6 h-6 bg-watercolor-brick text-white rounded-full border-2 border-white font-black text-xs flex items-center justify-center shadow-stamp z-20">${stopNumber}</span>`
                : `<span class="absolute -top-3 -right-2 w-6 h-6 bg-[#f4c568] text-paper-900 rounded-full border-2 border-paper-900 font-black text-xs flex items-center justify-center shadow-stamp z-20">✨</span>`;

            const markerHtml = `
        <div class="relative flex flex-col items-center select-none cursor-pointer group transition-transform ${isSelected ? 'scale-115 -translate-y-2' : 'hover:scale-110 hover:-translate-y-1'
                }">
          ${badgeHtml}
          <div class="w-14 h-14 p-1 rounded-2xl ${isItineraryStop ? 'bg-paper-50' : 'bg-paper-100 ring-2 ring-amber-400'} border-2 border-paper-900 shadow-stamp flex items-center justify-center">
            ${lm.svgSnippet}
          </div>
          <div class="mt-1 px-2.5 py-0.5 rounded-lg bg-paper-50/95 border-2 border-paper-900 shadow-sm text-[11px] font-bold text-paper-900 whitespace-nowrap max-w-[130px] truncate font-serif">
            ${lm.name.split(' ')[0]}
          </div>
        </div>
      `;

            const icon = L.divIcon({
                className: 'custom-scenic-building-pin',
                html: markerHtml,
                iconSize: [56, 74],
                iconAnchor: [28, 68],
            });

            const marker = L.marker(lm.coords, { icon, zIndexOffset: 1000 });

            if (appMode === 'on-trip' && isItineraryStop) {
                const targetItem =
                    activeDay?.items?.find((i) => i.id === lm.id) ||
                    (lm.tag === 'LODGING'
                        ? activeDay?.items?.find((i) => i.category === 'lodging')
                        : null);

                const actualCostBadge =
                    targetItem && targetItem.actualCost > 0
                        ? `<span class="bg-emerald-100 text-emerald-900 border border-emerald-400 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-full">Paid: $${targetItem.actualCost}</span>`
                        : `<span class="bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-full">Est: $${targetItem?.estimatedCost || 0}</span>`;

                const popupHtml = `
                    <div class="p-1 space-y-1.5 font-sans min-w-[190px]">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-[10px] font-black px-1.5 py-0.5 bg-watercolor-brick text-white rounded font-mono">#${stopNumber}</span>
                            ${actualCostBadge}
                        </div>
                        <div class="font-serif font-black text-sm text-paper-900 leading-tight">${lm.name}</div>
                        <div class="text-[11px] text-paper-700 line-clamp-2">${lm.desc}</div>
                        <button
                            type="button"
                            id="btn-expense-${lm.id}"
                            class="w-full mt-2 py-1.5 px-3 bg-watercolor-brick hover:bg-red-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm cursor-pointer transition active:scale-95"
                        >
                            <span>💸 Record Expense</span>
                        </button>
                    </div>
                `;

                marker.bindPopup(popupHtml, {
                    className: 'custom-watercolor-popup',
                    offset: [0, -60],
                    closeButton: true,
                });

                marker.on('popupopen', () => {
                    const btn = document.getElementById(`btn-expense-${lm.id}`);
                    if (btn && onRecordExpense) {
                        btn.onclick = (e) => {
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
                                orderIndex: stopNumber - 1,
                            };
                            onRecordExpense(fallbackItem);
                            marker.closePopup();
                        };
                    }
                });
            }

            marker.on('click', () => {
                onSelectLandmark(lm);
                if (appMode === 'on-trip' && isItineraryStop) {
                    marker.openPopup();
                }
            });
            marker.addTo(layer);
        });

        redrawSketchedPaths();
    }, [landmarks, activeLandmark, activeStopIds, activeItineraryLandmarks, appMode, activeDay, onRecordExpense]);

    useEffect(() => {
        const layer = facilitiesLayerRef.current;
        if (!layer) return;
        layer.clearLayers();

        facilities.forEach((fac) => {
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