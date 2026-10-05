'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { useItineraryStore } from '@/store/useItineraryStore';
import { MASTER_ZONES } from '@/lib/mockData';
import { Landmark } from '@/types/itinerary';
import { playChime, playVoiceNarrator } from '@/lib/audio';
import { GuideDrawer } from './GuideDrawer';
import { LandmarkDetailModal } from '@/components/Modals/LandmarkDetailModal';
import { Palette, ArrowsOut, NavigationArrow } from '@phosphor-icons/react';

// Dynamic import with SSR disabled to keep Leaflet purely client-side
const DynamicLeafletMap = dynamic(
    () => import('./LeafletBaseMap').then((mod) => mod.LeafletBaseMap),
    { ssr: false, loading: () => <div className="w-full h-full bg-[#e8dcba] flex items-center justify-center font-bold text-paper-900">Loading Illustrated Map...</div> }
);

export const ScenicGuideView: React.FC = () => {
    const { activePlanId, savedPlans } = useItineraryStore();
    const plan = savedPlans.find((p) => p.id === activePlanId) || savedPlans[0];
    const zone = MASTER_ZONES[plan?.zoneKey] || MASTER_ZONES.toronto_distillery;

    const [activeLandmark, setActiveLandmark] = useState<Landmark | null>(null);
    const [userCoords, setUserCoords] = useState<[number, number]>(zone.userOrigin);
    const [isParchmentMode, setIsParchmentMode] = useState<boolean>(true);
    const [isCruiseActive, setIsCruiseActive] = useState<boolean>(false);
    const [filterRestrooms, setFilterRestrooms] = useState<boolean>(true);
    const [filterCafes, setFilterCafes] = useState<boolean>(true);

    const mapRef = useRef<L.Map | null>(null);
    const cruiseIndexRef = useRef<number>(0);
    const cruiseIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const orderedLandmarks = (plan?.spotIds || [])
        .map((id) => zone.landmarksPool.find((l) => l.id === id))
        .filter(Boolean) as Landmark[];

    const activeFacilities = zone.facilities.filter((f) => {
        if (f.type === 'restroom') return filterRestrooms;
        if (f.type === 'cafe') return filterCafes;
        return true;
    });

    const handleSelectLandmark = (lm: Landmark) => {
        playChime('tap');
        setActiveLandmark(lm);
        if (mapRef.current) {
            mapRef.current.flyTo(lm.coords, 17, { duration: 0.8 });
        }
    };

    const handleToggleCruise = () => {
        if (isCruiseActive) {
            setIsCruiseActive(false);
            if (cruiseIntervalRef.current) clearInterval(cruiseIntervalRef.current);
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        } else {
            setIsCruiseActive(true);
            playChime('bell');
            cruiseIndexRef.current = 0;

            cruiseIntervalRef.current = setInterval(() => {
                const target = orderedLandmarks[cruiseIndexRef.current];
                if (target) {
                    setUserCoords(target.coords);
                    setActiveLandmark(target);
                    if (mapRef.current) {
                        mapRef.current.panTo(target.coords, { animate: true, duration: 1 });
                    }
                    playChime('stamp');
                    playVoiceNarrator(`Arrived at ${target.name}. ${target.audioNote}`);

                    cruiseIndexRef.current = (cruiseIndexRef.current + 1) % orderedLandmarks.length;
                }
            }, 5500);
        }
    };

    const handleFitBounds = () => {
        playChime('tap');
        if (mapRef.current && zone.bounds) {
            mapRef.current.fitBounds(zone.bounds, { padding: [40, 40] });
        }
    };

    const handleResetLocation = () => {
        playChime('tap');
        setUserCoords(zone.userOrigin);
        if (mapRef.current) {
            mapRef.current.flyTo(zone.userOrigin, 16);
        }
    };

    useEffect(() => {
        return () => {
            if (cruiseIntervalRef.current) clearInterval(cruiseIntervalRef.current);
        };
    }, []);

    return (
        <div className="flex-1 flex overflow-hidden relative w-full h-[calc(100vh-4rem)]">
            <GuideDrawer
                onSelectLandmark={handleSelectLandmark}
                isCruiseActive={isCruiseActive}
                onToggleCruise={handleToggleCruise}
                onResetLocation={handleResetLocation}
                filterRestrooms={filterRestrooms}
                setFilterRestrooms={setFilterRestrooms}
                filterCafes={filterCafes}
                setFilterCafes={setFilterCafes}
            />

            <div className="flex-1 h-full relative">
                <DynamicLeafletMap
                    zone={zone}
                    landmarks={orderedLandmarks}
                    facilities={activeFacilities}
                    activeLandmark={activeLandmark}
                    onSelectLandmark={handleSelectLandmark}
                    userCoords={userCoords}
                    isParchmentMode={isParchmentMode}
                    onMapReady={(map) => {
                        mapRef.current = map;
                    }}
                />

                {/* Floating Map Controls */}
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <button
                        onClick={() => setIsParchmentMode(!isParchmentMode)}
                        title="Toggle Sepia Watercolor Parchment"
                        className="p-2.5 rounded-2xl bg-paper-50 hover:bg-paper-100 border-2 border-paper-900 text-paper-900 shadow-card transition active:scale-95"
                    >
                        <Palette size={20} weight="bold" className="text-watercolor-brick" />
                    </button>
                    <button
                        onClick={handleFitBounds}
                        title="Fit Current District View"
                        className="p-2.5 rounded-2xl bg-paper-50 hover:bg-paper-100 border-2 border-paper-900 text-paper-900 shadow-card transition active:scale-95"
                    >
                        <ArrowsOut size={20} weight="bold" />
                    </button>
                    <button
                        onClick={handleResetLocation}
                        title="Locate Current Position"
                        className="p-2.5 rounded-2xl bg-paper-50 hover:bg-paper-100 border-2 border-paper-900 text-paper-900 shadow-card transition active:scale-95"
                    >
                        <NavigationArrow size={20} weight="bold" className="text-watercolor-brick" />
                    </button>
                </div>

                {/* Landmark Detail Inspection Card */}
                <LandmarkDetailModal
                    landmark={activeLandmark}
                    onClose={() => setActiveLandmark(null)}
                />
            </div>
        </div>
    );
};