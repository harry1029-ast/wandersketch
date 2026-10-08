'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type L from 'leaflet';
import { useItineraryStore, getActiveDayLandmarks } from '@/store/useItineraryStore';
import { MASTER_ZONES } from '@/lib/mockData';
import { Landmark, ItineraryItem, ExpenseCategory } from '@/types/itinerary';
import { fetchSpotsInEnvelope, DynamicMapSpot } from '@/lib/repositories';
import { playChime, playVoiceNarrator } from '@/lib/audio';
import { useGeolocationTracker } from '@/lib/useGeolocationTracker';
import { GuideDrawer } from './GuideDrawer';
import { LandmarkDetailModal } from '@/components/Modals/LandmarkDetailModal';
import { QuickExpenseModal } from '@/components/Modals/QuickExpenseModal';
import { Palette, ArrowsOut, NavigationArrow, Crosshair, Sparkle, CalendarBlank } from '@phosphor-icons/react';

const DynamicIslandModal = dynamic(
    () => import('@/components/Modals/ContainedIslandModal').then((mod) => mod.ContainedIslandModal),
    { ssr: false }
);

const DynamicLeafletMap = dynamic(
    () => import('./LeafletBaseMap').then((mod) => mod.LeafletBaseMap),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full bg-[#e8dcba] flex items-center justify-center font-bold text-paper-900">
                Loading Illustrated Map...
            </div>
        ),
    }
);

export const ScenicGuideView: React.FC = () => {
    const {
        appMode,
        activePlanId,
        savedPlans,
        currentItineraryDays,
        activeDayNumber,
        setActiveDay,
    } = useItineraryStore();

    const plan = savedPlans.find((p) => p.id === activePlanId) || savedPlans[0];
    const zone = MASTER_ZONES[plan?.zoneKey] || MASTER_ZONES.toronto_distillery;

    const activeDay = currentItineraryDays.find((d) => d.dayNumber === activeDayNumber);
    const dayLandmarks = React.useMemo(() => getActiveDayLandmarks(activeDay, zone), [activeDay, zone]);

    const [activeLandmark, setActiveLandmark] = useState<Landmark | null>(null);
    const [userCoords, setUserCoords] = useState<[number, number]>(zone.userOrigin);
    const [isLiveGpsActive, setIsLiveGpsActive] = useState<boolean>(false);
    const [isParchmentMode, setIsParchmentMode] = useState<boolean>(true);
    const [isCruiseActive, setIsCruiseActive] = useState<boolean>(false);
    const [filterRestrooms, setFilterRestrooms] = useState<boolean>(true);
    const [filterCafes, setFilterCafes] = useState<boolean>(true);
    const [isIslandModalOpen, setIsIslandModalOpen] = useState<boolean>(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
    const [expenseModalItem, setExpenseModalItem] = useState<ItineraryItem | null>(null);

    const handleRecordExpense = (item: ItineraryItem) => {
        setExpenseModalItem(item);
        setIsExpenseModalOpen(true);
    };

    const activeLandmarkItem: ItineraryItem | null = React.useMemo(() => {
        if (!activeLandmark) return null;
        const fallbackCategory: ExpenseCategory =
            activeLandmark.category === 'craft'
                ? 'dining'
                : activeLandmark.category === 'history'
                ? 'transit'
                : 'ticket';

        return (
            activeDay?.items?.find((i) => i.id === activeLandmark.id) ||
            (activeLandmark.tag === 'LODGING'
                ? activeDay?.items?.find((i) => i.category === 'lodging')
                : null) || {
                id: activeLandmark.id,
                dayId: activeDay?.id || 'day-1',
                planId: activeDay?.planId || 'plan-1',
                name: activeLandmark.name,
                category: fallbackCategory,
                estimatedCost: 0,
                actualCost: 0,
                location: activeLandmark.coords,
                orderIndex: 0,
            }
        );
    }, [activeLandmark, activeDay]);

    const mapRef = useRef<L.Map | null>(null);
    const cruiseIndexRef = useRef<number>(0);
    const cruiseIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const orderedLandmarks = React.useMemo(() => {
        if (dayLandmarks.length > 0) return dayLandmarks;
        return (plan?.spotIds || [])
            .map((id) => zone.landmarksPool.find((l) => l.id === id))
            .filter(Boolean) as Landmark[];
    }, [dayLandmarks, plan?.spotIds, zone.landmarksPool]);

    // Dynamic spots queried from PostGIS ST_MakeEnvelope
    const [envelopeSpots, setEnvelopeSpots] = useState<DynamicMapSpot[]>([]);
    const boundsTimerRef = useRef<NodeJS.Timeout | null>(null);
    const prevSpotIdsRef = useRef<string>('');

    const handleBoundsChange = React.useCallback(
        (b: { minLat: number; minLng: number; maxLat: number; maxLng: number }) => {
            if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
            boundsTimerRef.current = setTimeout(async () => {
                const results = await fetchSpotsInEnvelope(b.minLat, b.minLng, b.maxLat, b.maxLng);
                if (results) {
                    const signature = results.map((r) => r.id).sort().join(',');
                    // Only trigger re-render if the discovered spots actually changed
                    if (signature !== prevSpotIdsRef.current) {
                        prevSpotIdsRef.current = signature;
                        setEnvelopeSpots(results);
                    }
                }
            }, 400);
        },
        []
    );

    // Merge itinerary waypoints with any extra community / custom spots in the current viewport
    const displayedLandmarks: Landmark[] = React.useMemo(() => {
        const existingIds = new Set(orderedLandmarks.map((l) => l.id));
        const extras: Landmark[] = envelopeSpots
            .filter((s) => !existingIds.has(s.id))
            .map((s) => ({
                id: s.id,
                name: s.name,
                category: s.category as any,
                color: s.color,
                coords: s.coords,
                svgSnippet: s.svgSnippet,
                tag: s.tag,
                desc: s.desc,
                audioNote: s.audioNote,
                panoUrl: '',
                tips: s.isCustom ? 'Discovered Community Spot' : '',
            }));
        return [...orderedLandmarks, ...extras];
    }, [orderedLandmarks, envelopeSpots]);

    const { coords: liveGpsCoords, heading: liveHeading, accuracy: liveAccuracy } = useGeolocationTracker({
        landmarks: displayedLandmarks,
        fallbackCoords: zone.userOrigin,
        enabled: isLiveGpsActive,
    });

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

    useEffect(() => {
        if (isLiveGpsActive) {
            setUserCoords(liveGpsCoords);
            if (mapRef.current) {
                mapRef.current.panTo(liveGpsCoords, { animate: true, duration: 0.6 });
            }
        }
    }, [liveGpsCoords, isLiveGpsActive]);

    const handleToggleCruise = () => {
        if (isLiveGpsActive) setIsLiveGpsActive(false);
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
        if (isLiveGpsActive) setIsLiveGpsActive(false);
        const originCoords = orderedLandmarks.length > 0 ? orderedLandmarks[0].coords : zone.userOrigin;
        setUserCoords(originCoords);
        if (mapRef.current) {
            mapRef.current.flyTo(originCoords, 16);
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
                onRecordExpense={handleRecordExpense}
            />

            <div className="flex-1 h-full relative">
                <DynamicLeafletMap
                    zone={zone}
                    landmarks={displayedLandmarks}
                    itineraryStopIds={orderedLandmarks.map((l) => l.id)}
                    facilities={activeFacilities}
                    activeLandmark={activeLandmark}
                    onSelectLandmark={handleSelectLandmark}
                    userCoords={userCoords}
                    userHeading={isLiveGpsActive ? liveHeading : null}
                    userAccuracy={isLiveGpsActive ? liveAccuracy : null}
                    isParchmentMode={isParchmentMode}
                    onOpenIslandView={() => {
                        playChime('stamp');
                        setIsIslandModalOpen(true);
                    }}
                    onBoundsChange={handleBoundsChange}
                    onRecordExpense={handleRecordExpense}
                    onMapReady={(map) => {
                        mapRef.current = map;
                    }}
                />

                {/* Sticky Day-Picker Carousel */}
                {currentItineraryDays.length > 0 && (
                    <div className="absolute top-4 left-4 z-20 max-w-[calc(100%-120px)] sm:max-w-[calc(100%-140px)]">
                        <div className="flex items-center gap-1.5 p-1.5 bg-paper-100/95 backdrop-blur-md border-2 border-paper-900 rounded-2xl shadow-stamp overflow-x-auto no-scrollbar">
                            <span className="text-[10px] font-black uppercase text-paper-700 px-2 font-mono shrink-0 hidden sm:inline">
                                Day:
                            </span>
                            {currentItineraryDays.map((day) => {
                                const isActive = day.dayNumber === activeDayNumber;
                                return (
                                    <button
                                        key={day.dayNumber}
                                        onClick={() => {
                                            playChime('tap');
                                            setActiveDay(day.dayNumber);
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 select-none ${
                                            isActive
                                                ? 'bg-watercolor-brick text-white shadow-stamp font-black ring-1 ring-paper-900/30 scale-102'
                                                : 'bg-paper-50 hover:bg-paper-200 text-paper-900 border border-paper-300'
                                        }`}
                                        title={`Switch to Day ${day.dayNumber} itinerary`}
                                    >
                                        <CalendarBlank size={13} weight={isActive ? 'fill' : 'bold'} />
                                        <span>Day {day.dayNumber}</span>
                                        {day.calendarDate && (
                                            <span
                                                className={`text-[10px] font-mono px-1 rounded ${
                                                    isActive
                                                        ? 'bg-red-950/40 text-amber-100'
                                                        : 'bg-paper-200 text-paper-700'
                                                }`}
                                            >
                                                {day.calendarDate.slice(5)}
                                            </span>
                                        )}
                                        <span
                                            className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${
                                                isActive
                                                    ? 'bg-amber-300 text-paper-900'
                                                    : 'bg-paper-200 text-paper-800'
                                            }`}
                                        >
                                            ${day.subtotalEstimated}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Floating Map Controls */}
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <button
                        onClick={() => {
                            playChime('stamp');
                            setIsIslandModalOpen(true);
                        }}
                        title="Open Illustrated Island View"
                        className="p-2.5 rounded-2xl bg-paper-50 hover:bg-amber-100 border-2 border-paper-900 text-paper-900 shadow-card transition active:scale-95"
                    >
                        <Sparkle size={20} weight="fill" className="text-amber-500" />
                    </button>
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
                        onClick={() => {
                            playChime('tap');
                            setIsLiveGpsActive(!isLiveGpsActive);
                            if (!isLiveGpsActive && isCruiseActive) {
                                setIsCruiseActive(false);
                            }
                        }}
                        title={isLiveGpsActive ? 'Disable Live GPS Tracking' : 'Enable Live GPS Tracking'}
                        className={`p-2.5 rounded-2xl border-2 border-paper-900 shadow-card transition active:scale-95 ${isLiveGpsActive ? 'bg-watercolor-brick text-white animate-pulse' : 'bg-paper-50 hover:bg-paper-100 text-paper-900'
                            }`}
                    >
                        <NavigationArrow
                            size={20}
                            weight={isLiveGpsActive ? 'fill' : 'bold'}
                            className={isLiveGpsActive ? 'text-white' : 'text-watercolor-brick'}
                        />
                    </button>
                    <button
                        onClick={handleResetLocation}
                        title="Reset to District Entrance"
                        className="p-2.5 rounded-2xl bg-paper-50 hover:bg-paper-100 border-2 border-paper-900 text-paper-900 shadow-card transition active:scale-95"
                    >
                        <Crosshair size={20} weight="bold" />
                    </button>
                </div>

                {/* Landmark Detail Inspection Card */}
                <LandmarkDetailModal
                    landmark={activeLandmark}
                    onClose={() => setActiveLandmark(null)}
                    onRecordExpense={
                        appMode === 'on-trip' && activeLandmarkItem
                            ? () => handleRecordExpense(activeLandmarkItem)
                            : undefined
                    }
                />

                {/* Hand-Drawn Island Modal */}
                <DynamicIslandModal
                    isOpen={isIslandModalOpen}
                    onClose={() => setIsIslandModalOpen(false)}
                />

                {/* Quick Expense Logging Modal */}
                <QuickExpenseModal
                    isOpen={isExpenseModalOpen}
                    onClose={() => setIsExpenseModalOpen(false)}
                    targetItem={expenseModalItem}
                    dayNumber={activeDayNumber}
                />
            </div>
        </div>
    );
};