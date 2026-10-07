'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import rough from 'roughjs';
import { useItineraryStore } from '@/store/useItineraryStore';
import { MASTER_ZONES } from '@/lib/mockData';
import { playChime, playVoiceNarrator } from '@/lib/audio';
import { useGeolocationTracker } from '@/lib/useGeolocationTracker';
import {
    X,
    PaintBrush,
    Compass,
    Headphones,
    Footprints,
    Clock,
    ArrowRight,
    Sparkle,
    MapPin,
    ArrowsOutSimple,
} from '@phosphor-icons/react';

interface ContainedIslandModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ContainedIslandModal: React.FC<ContainedIslandModalProps> = ({
    isOpen,
    onClose,
}) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const svgOverlayRef = useRef<SVGSVGElement | null>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const userHaloRef = useRef<L.Circle | null>(null);

    const { activePlanId, savedPlans } = useItineraryStore();
    const [activeSpeechTip, setActiveSpeechTip] = useState<string | null>(null);

    const plan = savedPlans.find((p) => p.id === activePlanId) || savedPlans[0];
    const zone = MASTER_ZONES[plan?.zoneKey] || MASTER_ZONES.toronto_distillery;
    const orderedLandmarks = useMemo(() => {
        return (plan?.spotIds || [])
            .map((id) => zone.landmarksPool.find((l) => l.id === id))
            .filter(Boolean) as typeof zone.landmarksPool;
    }, [plan?.spotIds, zone.landmarksPool]);

    const stopCoords = useMemo(() => {
        return orderedLandmarks.map((l) => l.coords);
    }, [orderedLandmarks]);

    // Track user's actual GPS location
    const { coords: userCoords, heading: userHeading, accuracy: userAccuracy, isTracking } = useGeolocationTracker({
        landmarks: orderedLandmarks,
        fallbackCoords: zone.userOrigin,
        enabled: isOpen,
    });

    const handleSpotClick = (name: string, audioNote: string) => {
        playChime('tap');
        setActiveSpeechTip(name);
        playVoiceNarrator(`${name}. ${audioNote}`);
    };

    const handleResetView = () => {
        if (!mapInstanceRef.current) return;
        playChime('tap');
        if (zone.illustratedMapBounds) {
            const bounds = L.latLngBounds(zone.illustratedMapBounds);
            const coverZoom = mapInstanceRef.current.getBoundsZoom(bounds, true);
            mapInstanceRef.current.setMinZoom(coverZoom);
            mapInstanceRef.current.setView(bounds.getCenter(), coverZoom);
        } else if (stopCoords.length > 0) {
            mapInstanceRef.current.fitBounds(L.latLngBounds(stopCoords), { padding: [40, 40] });
        }
    };

    const handleSelectStop = (lm: typeof zone.landmarksPool[0]) => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(lm.coords, 17, { duration: 0.8 });
        }
        handleSpotClick(lm.name, lm.audioNote);
    };

    useEffect(() => {
        if (!isOpen) return;
        const container = mapContainerRef.current;
        if (!container || stopCoords.length === 0) return;

        // Clean up any existing map instance
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        // 1. Initialize dedicated Leaflet Canvas for Pictorial Scenic Guide
        const map = L.map(container, {
            center: zone.center,
            zoom: zone.zoom,
            zoomControl: false,
            attributionControl: false,
            dragging: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            zoomSnap: 0,
            ...(zone.illustratedMapBounds ? {
                maxBounds: zone.illustratedMapBounds,
                maxBoundsViscosity: 1.0,
            } : {})
        });
        mapInstanceRef.current = map;

        // Ensure map container has solid background color
        container.style.backgroundColor = '#f6efe2';

        // Zoom control in bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // 2. Base tile layer removed as per user request to only show illustration

        // 3. Georeferenced 2.5D Pictorial Hand-Drawn Scenic Overlay (Image 3 style)
        if (zone.illustratedMapUrl && zone.illustratedMapBounds) {
            L.imageOverlay(zone.illustratedMapUrl, zone.illustratedMapBounds, {
                opacity: 1,
                interactive: false,
                zIndex: 260,
            }).addTo(map);

            const bounds = L.latLngBounds(zone.illustratedMapBounds);
            const coverZoom = map.getBoundsZoom(bounds, true);
            map.setMinZoom(coverZoom);
            map.setView(bounds.getCenter(), coverZoom);
        }

        const markersLayer = L.layerGroup().addTo(map);

        // 6. Populate interactive landmark stickers (Sleek Bubble Pin Style - Image 3)
        orderedLandmarks.forEach((lm, idx) => {
            const markerHtml = `
        <div class="relative flex flex-col items-center select-none cursor-pointer group hover:scale-110 active:scale-95 transition-all">
          <!-- Speech bubble pill -->
          <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border-2 border-paper-900 shadow-md backdrop-blur-sm group-hover:border-watercolor-brick group-hover:shadow-lg transition-all">
            <span class="w-5 h-5 rounded-full bg-emerald-700 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-sm">
              ${idx + 1}
            </span>
            <span class="text-xs font-black font-serif text-paper-900 whitespace-nowrap">
              ${lm.name.split(' (')[0]}
            </span>
            <span class="text-[10px] text-paper-700 font-sans hidden sm:inline">
              ${lm.tag}
            </span>
          </div>
          <!-- Pointer caret triangle -->
          <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-paper-900 -mt-[1px]"></div>
          <!-- Ground anchor ring -->
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-800/80 border border-white -mt-0.5 shadow-sm"></div>
        </div>
      `;

            const icon = L.divIcon({
                className: 'custom-island-landmark-bubble',
                html: markerHtml,
                iconSize: [160, 42],
                iconAnchor: [80, 40],
            });

            const marker = L.marker(lm.coords, { icon, zIndexOffset: 1200 + idx });
            marker.on('click', () => {
                map.flyTo(lm.coords, 17, { duration: 0.8 });
                handleSpotClick(lm.name, lm.audioNote);
            });
            marker.addTo(markersLayer);
        });

        // 7. Populate Scenic Facility Pins (Amenities)
        (zone.facilities || []).forEach((fac) => {
            const facHtml = `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/95 border-2 border-paper-900 shadow-md text-sm cursor-pointer hover:scale-125 transition-transform" title="${fac.name}">
          ${fac.emoji}
        </div>
      `;

            const icon = L.divIcon({
                className: 'custom-island-facility-pin',
                html: facHtml,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
            });

            const marker = L.marker(fac.coords, { icon, zIndexOffset: 800 });
            marker.bindTooltip(
                `<div class="text-xs font-bold font-serif text-paper-900">${fac.name}</div>`,
                { direction: 'top', offset: [0, -10] }
            );
            marker.addTo(markersLayer);
        });

        // 9. Invalidate map size after layout transition and ensure correct bounds
        map.whenReady(() => {
            map.invalidateSize();
            if (zone.illustratedMapBounds) {
                const bounds = L.latLngBounds(zone.illustratedMapBounds);
                const coverZoom = map.getBoundsZoom(bounds, true);
                map.setMinZoom(coverZoom);
                map.setView(bounds.getCenter(), coverZoom);
            } else if (stopCoords.length > 0) {
                map.fitBounds(L.latLngBounds(stopCoords), { padding: [40, 40], maxZoom: 17 });
            }

            setTimeout(() => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                    if (zone.illustratedMapBounds) {
                        const bounds = L.latLngBounds(zone.illustratedMapBounds);
                        const coverZoom = mapInstanceRef.current.getBoundsZoom(bounds, true);
                        mapInstanceRef.current.setMinZoom(coverZoom);
                        mapInstanceRef.current.setView(bounds.getCenter(), coverZoom);
                    }
                }
            }, 150);
        });

        return () => {
            map.off();
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [isOpen, plan?.id, stopCoords, zone.center, zone.zoom, zone.illustratedMapUrl, zone.illustratedMapBounds]);

    useEffect(() => {
        if (!mapInstanceRef.current || !isTracking) return;

        const map = mapInstanceRef.current;

        // Create marker if it doesn't exist
        if (!userMarkerRef.current) {
            const userIconHtml = `
                <div class="relative flex items-center justify-center w-6 h-6">
                    <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" style="animation-duration: 2s;"></div>
                    <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-md z-10"></div>
                </div>
            `;
            const icon = L.divIcon({
                className: 'custom-user-location',
                html: userIconHtml,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });
            userMarkerRef.current = L.marker(userCoords, { icon, zIndexOffset: 2000 }).addTo(map);
        } else {
            userMarkerRef.current.setLatLng(userCoords);
        }

        if (!userHaloRef.current && userAccuracy) {
            userHaloRef.current = L.circle(userCoords, {
                radius: userAccuracy,
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.15,
                weight: 1,
            }).addTo(map);
        } else if (userHaloRef.current && userAccuracy) {
            userHaloRef.current.setLatLng(userCoords);
            userHaloRef.current.setRadius(userAccuracy);
        }
    }, [userCoords, userAccuracy, isTracking]);

    if (!isOpen || !plan) return null;

    return (
        <div className="fixed inset-0 z-50 bg-paper-900/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fade-in">
            <div className="relative bg-paper-100 border-4 border-paper-900 rounded-3xl max-w-5xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">

                {/* Top Header Bar */}
                <div className="flex items-center justify-between border-b-2 border-paper-300 px-4 py-3 sm:px-6 bg-paper-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 border-2 border-paper-900 flex items-center justify-center shadow-stamp shrink-0">
                            <span className="text-xl">🌸</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-700 text-white uppercase tracking-wider font-mono">
                                    2.5D Pictorial Guide
                                </span>
                                <span className="text-xs font-bold text-paper-700 font-serif">
                                    {zone.city} · {zone.name}
                                </span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-paper-900 font-serif leading-tight">
                                {plan.title}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleResetView}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper-100 hover:bg-amber-100 text-paper-900 border-2 border-paper-900 font-serif font-bold text-xs shadow-stamp transition active:scale-95"
                            title="Reset zoom & bounds"
                        >
                            <ArrowsOutSimple size={15} weight="bold" />
                            <span>Fit Overview</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-paper-200 hover:bg-paper-300 text-paper-900 border-2 border-paper-900 shrink-0 transition active:scale-95 shadow-stamp"
                            title="Close guide"
                        >
                            <X size={18} weight="bold" />
                        </button>
                    </div>
                </div>

                {/* Main Pictorial Scenic Map Canvas Stage (Explicit height & absolute fill for Leaflet) */}
                <div className="relative w-full h-[500px] sm:h-[560px] md:h-[620px] bg-[#f6efe2] overflow-hidden">
                    <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

                    {/* Top Floating Badge on Map */}
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
                        <div className="px-3.5 py-1.5 bg-white/95 border-2 border-paper-900 rounded-full flex items-center gap-2 text-xs font-serif font-black text-paper-900 shadow-md backdrop-blur-sm">
                            <Sparkle size={15} weight="fill" className="text-amber-500 animate-pulse" />
                            <span>Pictorial Scenic Guide · 手绘导览</span>
                        </div>
                    </div>

                    {/* Active Audio Narration Banner */}
                    {activeSpeechTip && (
                        <div className="absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-xl bg-paper-900/95 text-white text-xs font-bold flex items-center gap-2 shadow-float animate-fade-in border border-amber-300/40">
                            <Headphones size={16} className="text-amber-300 animate-pulse" />
                            <span>Docent Commentary: <strong className="text-amber-300 font-serif">{activeSpeechTip}</strong></span>
                        </div>
                    )}

                    {/* Bottom Floating Legend / Help Pill */}
                    <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-3 px-3 py-1 bg-white/90 backdrop-blur-sm border border-paper-900/60 rounded-full text-[11px] font-bold text-paper-800 shadow-sm pointer-events-none">
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span> Landmark Stops
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span> Live GPS
                        </span>
                        <span className="flex items-center gap-1">
                            <span>🚻 🍵</span> Scenic Amenities
                        </span>
                    </div>
                </div>

                {/* Bottom Interactive Waypoints Bar */}
                <div className="bg-paper-50 border-t-2 border-paper-300 px-4 py-3 sm:px-6 shrink-0 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <h4 className="font-extrabold text-paper-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Footprints size={15} className="text-watercolor-brick" />
                            <span>Scenic Stops · Tap to Pan & Listen</span>
                        </h4>
                        <div className="text-xs font-bold text-watercolor-brick font-serif flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <Footprints size={13} /> {plan.estimatedDistance}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={13} /> {plan.estimatedDuration}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                        {orderedLandmarks.map((lm, index) => {
                            if (!lm) return null;
                            const isNarrating = activeSpeechTip === lm.name;
                            return (
                                <React.Fragment key={lm.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectStop(lm)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border-2 shrink-0 shadow-sm transition active:scale-95 text-left ${
                                            isNarrating
                                                ? 'bg-amber-100 border-watercolor-brick ring-2 ring-watercolor-brick/40 shadow-md'
                                                : 'bg-white border-paper-900 hover:border-watercolor-brick hover:bg-paper-100'
                                        }`}
                                    >
                                        <span className="w-5 h-5 bg-emerald-700 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <div className="text-xs font-bold text-paper-900 font-serif whitespace-nowrap">
                                                {lm.name.split(' (')[0]}
                                            </div>
                                            <div className="text-[10px] text-paper-700 leading-tight">
                                                {lm.tag}
                                            </div>
                                        </div>
                                    </button>

                                    {index < orderedLandmarks.length - 1 && (
                                        <div className="flex flex-col items-center justify-center shrink-0 px-0.5 text-[10px] font-bold text-paper-600">
                                            <ArrowRight size={13} className="text-watercolor-brick" />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};