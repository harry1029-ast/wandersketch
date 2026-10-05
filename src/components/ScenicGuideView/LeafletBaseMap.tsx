'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import rough from 'roughjs';
import { Landmark, ScenicFacility, ScenicZone } from '@/types/itinerary';

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
    const svgOverlayRef = useRef<SVGSVGElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const landmarksLayerRef = useRef<L.LayerGroup | null>(null);
    const facilitiesLayerRef = useRef<L.LayerGroup | null>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);

    // Function to redraw hand-sketched connector trails via Rough.js
    const redrawSketchedPaths = () => {
        const map = mapInstanceRef.current;
        const svg = svgOverlayRef.current;
        if (!map || !svg || landmarks.length < 2) return;

        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }

        const rc = rough.svg(svg);
        const pixelPoints = landmarks.map((lm) => {
            const pt = map.latLngToContainerPoint(L.latLng(lm.coords[0], lm.coords[1]));
            return [pt.x, pt.y];
        });

        for (let i = 0; i < pixelPoints.length - 1; i++) {
            const p1 = pixelPoints[i];
            const p2 = pixelPoints[i + 1];

            // Sand cobblestone underlay
            svg.appendChild(
                rc.line(p1[0], p1[1], p2[0], p2[1], {
                    roughness: 2.2,
                    stroke: 'rgba(232, 220, 186, 0.85)',
                    strokeWidth: 16,
                    bowing: 2.2,
                })
            );

            // Terracotta dashed pencil route
            svg.appendChild(
                rc.line(p1[0], p1[1], p2[0], p2[1], {
                    roughness: 1.8,
                    stroke: '#c14937',
                    strokeWidth: 3.5,
                    strokeLineDash: [10, 8],
                    bowing: 1.8,
                })
            );

            // Milestone circle
            const midX = (p1[0] + p2[0]) / 2;
            const midY = (p1[1] + p2[1]) / 2;
            svg.appendChild(
                rc.circle(midX, midY, 9, {
                    fill: '#f4c568',
                    fillStyle: 'solid',
                    roughness: 1.4,
                    stroke: '#2b261b',
                    strokeWidth: 1.5,
                })
            );
        }
    };

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: zone.center,
            zoom: zone.zoom,
            zoomControl: false,
            attributionControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Unblocked ESRI Topo Tiles
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            crossOrigin: true,
        }).addTo(map);

        landmarksLayerRef.current = L.layerGroup().addTo(map);
        facilitiesLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        map.on('move', redrawSketchedPaths);
        map.on('zoomend', redrawSketchedPaths);
        map.on('resize', redrawSketchedPaths);

        if (onMapReady) onMapReady(map);

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [zone]);

    // Update Landmark Markers
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

            const marker = L.marker(lm.coords, { icon });
            marker.on('click', () => onSelectLandmark(lm));
            marker.addTo(layer);
        });

        redrawSketchedPaths();
    }, [landmarks, activeLandmark]);

    // Update Facility Markers
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

            const marker = L.marker(fac.coords, { icon });
            marker.bindTooltip(
                `<div class="text-xs font-bold font-serif text-paper-900">${fac.name}</div>`,
                { direction: 'top', offset: [0, -12] }
            );
            marker.addTo(layer);
        });
    }, [facilities]);

    // Update User GPS Marker
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
                className={`w-full h-full z-10 ${isParchmentMode ? 'hand-drawn-tile-filter' : ''}`}
            />
            <svg
                ref={svgOverlayRef}
                className="absolute inset-0 pointer-events-none z-15 w-full h-full"
            />
        </div>
    );
};