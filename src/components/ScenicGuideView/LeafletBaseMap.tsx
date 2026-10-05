'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import rough from 'roughjs';
import { Landmark, ScenicFacility, ScenicZone } from '@/types/itinerary';
import { fetchPedestrianRoute } from '@/lib/routing';

interface LeafletBaseMapProps {
    zone: ScenicZone;
    landmarks: Landmark[];
    facilities: ScenicFacility[];
    activeLandmark: Landmark | null;
    onSelectLandmark: (lm: Landmark) => void;
    userCoords: [number, number];
    isParchmentMode: boolean;
    onMapReady?: (map: L.Map) => void;
}

export const LeafletBaseMap: React.FC<LeafletBaseMapProps> = ({
    zone,
    landmarks,
    facilities,
    activeLandmark,
    onSelectLandmark,
    userCoords,
    isParchmentMode,
    onMapReady,
}) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const landmarksLayerRef = useRef<L.LayerGroup | null>(null);
    const facilitiesLayerRef = useRef<L.LayerGroup | null>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const svgOverlayRef = useRef<SVGSVGElement | null>(null);

    // Mutable refs to prevent React stale closures inside Leaflet map listeners
    const trajectoryRef = useRef<[number, number][]>([]);
    const landmarksRef = useRef<Landmark[]>(landmarks);
    landmarksRef.current = landmarks;

    // 1. Core redraw function using layer points
    // Inside LeafletBaseMap.tsx: Replace redrawSketchedPaths with this implementation

    const redrawSketchedPaths = () => {
        const map = mapInstanceRef.current;
        const svg = svgOverlayRef.current;
        if (!map || !svg) return;

        const coords = trajectoryRef.current;
        if (coords.length < 2) {
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            return;
        }

        // Clear previous drawings
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        // Position SVG directly at layer origin (0, 0)
        const topLeft = map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(svg as unknown as HTMLElement, topLeft);

        const size = map.getSize();
        svg.setAttribute('width', `${size.x}`);
        svg.setAttribute('height', `${size.y}`);

        const rc = rough.svg(svg);

        // Convert lat/lng to container pixel coordinates relative to the current viewport
        const pixelPoints = coords.map(([lat, lng]) => {
            const pt = map.latLngToContainerPoint(L.latLng(lat, lng));
            return [pt.x, pt.y];
        });

        for (let i = 0; i < pixelPoints.length - 1; i++) {
            const p1 = pixelPoints[i];
            const p2 = pixelPoints[i + 1];

            // Sand foundation underlay
            svg.appendChild(
                rc.line(p1[0], p1[1], p2[0], p2[1], {
                    roughness: 1.5,
                    stroke: 'rgba(232, 220, 186, 0.85)',
                    strokeWidth: 14,
                    bowing: 1.2,
                })
            );

            // Terracotta sketched route
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

        // Milestone stamps at primary stops
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

    // 2. Fetch real street pedestrian routes when landmarks change
    useEffect(() => {
        if (landmarks.length < 2) {
            trajectoryRef.current = landmarks.map((l) => l.coords);
            redrawSketchedPaths();
            return;
        }

        let isMounted = true;
        const stopCoords = landmarks.map((l) => l.coords);

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
    }, [landmarks]);

    // 3. Initialize Leaflet Map Instance
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: zone.center,
            zoom: zone.zoom,
            zoomControl: false,
            attributionControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
            {
                maxZoom: 19,
                crossOrigin: true,
            }
        ).addTo(map);

        // Create a dedicated SVG pane between base tiles (z=200) and markers (z=600)
        const customPane = map.createPane('roughOverlayPane');
        customPane.style.zIndex = '450';
        customPane.style.pointerEvents = 'none';

        // Create the SVG container and inject it directly into Leaflet's pane
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

        // Attach listeners — now pointing to fresh ref values
        map.on('move', redrawSketchedPaths);
        map.on('zoom', redrawSketchedPaths);
        map.on('zoomend', redrawSketchedPaths);
        map.on('resize', redrawSketchedPaths);

        if (onMapReady) onMapReady(map);

        setTimeout(() => {
            map.invalidateSize();
            redrawSketchedPaths();
        }, 200);

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [zone]);

    // 4. Safely toggle watercolor filter on map container
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (isParchmentMode) {
            mapContainerRef.current.classList.add('hand-drawn-tile-filter');
        } else {
            mapContainerRef.current.classList.remove('hand-drawn-tile-filter');
        }
    }, [isParchmentMode]);

    // 5. Update Landmark Pins
    useEffect(() => {
        const layer = landmarksLayerRef.current;
        if (!layer) return;
        layer.clearLayers();

        landmarks.forEach((lm, idx) => {
            const isSelected = activeLandmark?.id === lm.id;
            const markerHtml = `
        <div class="relative flex flex-col items-center select-none cursor-pointer group transition-transform ${isSelected ? 'scale-115 -translate-y-2' : 'hover:scale-110 hover:-translate-y-1'
                }">
          <span class="absolute -top-3 -right-2 w-6 h-6 bg-watercolor-brick text-white rounded-full border-2 border-white font-black text-xs flex items-center justify-center shadow-stamp z-20">
            ${idx + 1}
          </span>
          <div class="w-14 h-14 p-1 rounded-2xl bg-paper-50 border-2 border-paper-900 shadow-stamp flex items-center justify-center">
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
            marker.on('click', () => onSelectLandmark(lm));
            marker.addTo(layer);
        });

        redrawSketchedPaths();
    }, [landmarks, activeLandmark]);

    // 6. Update Amenities Pins
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

    // 7. Update User GPS Marker
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(userCoords);
        } else {
            const userHtml = `
        <div class="relative w-10 h-10 flex items-center justify-center select-none">
          <div class="gps-pulse-beacon"></div>
          <div class="w-6 h-6 bg-watercolor-brick border-2 border-white rounded-full shadow-stamp z-10 flex items-center justify-center text-[10px] text-white font-black">
            Me
          </div>
        </div>
      `;

            const icon = L.divIcon({
                className: 'custom-user-gps-marker',
                html: userHtml,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
            });

            userMarkerRef.current = L.marker(userCoords, { icon, zIndexOffset: 3000 }).addTo(map);
        }
    }, [userCoords]);

    return (
        <div className="relative w-full h-full overflow-hidden bg-[#e8dcba]">
            <div
                ref={mapContainerRef}
                className="w-full h-full relative z-0"
            />
        </div>
    );
};