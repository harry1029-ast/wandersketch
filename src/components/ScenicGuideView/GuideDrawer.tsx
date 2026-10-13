'use client';

import React, { useState } from 'react';
import { useItineraryStore, getActiveDayLandmarks } from '@/store/useItineraryStore';
import { MASTER_ZONES } from '@/lib/mockData';
import { Landmark, RouteTheme, ItineraryItem, ScenicZoneKey } from '@/types/itinerary';
import { playChime, playVoiceNarrator } from '@/lib/audio';
import { ScrapbookPostcardModal } from '@/components/Modals/ScrapbookPostcardModal';
import { SpotSearchAutocomplete } from '@/components/SpotSearchAutocomplete';
import { CitySearchModal } from '@/components/Modals/CitySearchModal';
import {
    ArrowLeft,
    Play,
    Stop,
    SpeakerHigh,
    PencilSimple,
    Faders,
    Crosshair,
    Stamp,
    CalendarBlank,
    Coins,
    Footprints,
    Headphones,
    Compass,
    Lightning,
    CaretUp,
    CaretDown,
    Trash,
    Coffee,
    ArrowCounterClockwise,
    MapPin,
    Sparkle,
    Star,
    FolderOpen,
    AirplaneTakeoff,
} from '@phosphor-icons/react';
import { DiscoveryCategory, DISCOVERY_CATEGORIES } from '@/lib/landmarkCategories';

interface GuideDrawerProps {
    onSelectLandmark: (landmark: Landmark) => void;
    isCruiseActive: boolean;
    onToggleCruise: () => void;
    onResetLocation: () => void;
    filterRestrooms: boolean;
    setFilterRestrooms: (val: boolean) => void;
    filterCafes: boolean;
    setFilterCafes: (val: boolean) => void;
    onRecordExpense?: (item: ItineraryItem) => void;
    onDeletePersonalSpot?: (spotId: string) => void;
    isMobileOpen?: boolean;
    onCloseMobile?: () => void;
    categoryFilter?: DiscoveryCategory;
    onSelectCategoryFilter?: (cat: DiscoveryCategory) => void;
    categoryLandmarks?: Landmark[];
}

export const GuideDrawer: React.FC<GuideDrawerProps> = ({
    onSelectLandmark,
    isCruiseActive,
    onToggleCruise,
    onResetLocation,
    filterRestrooms,
    setFilterRestrooms,
    filterCafes,
    setFilterCafes,
    onRecordExpense,
    onDeletePersonalSpot,
    isMobileOpen = false,
    onCloseMobile,
    categoryFilter = 'all',
    onSelectCategoryFilter,
    categoryLandmarks = [],
}) => {
    const {
        appMode,
        activePlanId,
        savedPlans,
        zones,
        setStage,
        updateActivePlanTheme,
        currentItineraryDays,
        activeDayNumber,
        setActiveDay,
        drawerTab,
        setDrawerTab,
        mapDiscoveryMode,
        setMapDiscoveryMode,
        plannerBuffer,
        updatePlannerZone,
        jumpToCity,
        reorderPlannerStops,
        removePlannerStop,
        addPlannerCustomStop,
        addStopToRouteBuffer,
        deletePersonalSpot,
        turnPlannerRouteIntoExcursion,
        clearPlannerStops,
    } = useItineraryStore();

    const [isPostcardOpen, setIsPostcardOpen] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [isCityModalOpen, setIsCityModalOpen] = useState(false);

    const allZones = zones || MASTER_ZONES;
    const plan = savedPlans.find((p) => p.id === activePlanId) || savedPlans[0];
    const currentZoneKey =
        drawerTab === 'curator' || mapDiscoveryMode === 'ambient'
            ? plannerBuffer.zoneKey
            : (plan?.zoneKey || plannerBuffer.zoneKey);
    const zone = allZones[currentZoneKey] || allZones.sha_tin_district || Object.values(allZones)[0];

    const personalSpots = React.useMemo(() => {
        const pool = zone?.landmarksPool || [];
        return pool.filter(
            (l) => l.isCustom || l.tag === 'Personal Spot' || (typeof l.id === 'string' && l.id.startsWith('custom-'))
        );
    }, [zone?.landmarksPool]);

    const activeDay = currentItineraryDays.find((d) => d.dayNumber === activeDayNumber);
    const dayLandmarks = React.useMemo(
        () => getActiveDayLandmarks(activeDay, zone),
        [activeDay, zone]
    );

    // Curator ordered landmarks from plannerBuffer
    const curatorOrderedLandmarks = plannerBuffer.spotIds
        .map((id) => zone.landmarksPool.find((l) => l.id === id))
        .filter(Boolean) as Landmark[];

    // Guide ordered landmarks (from active itinerary/day, or ambient curator stops)
    const itineraryOrderedLandmarks = (plan?.spotIds || [])
        .map((id) => zone.landmarksPool.find((l) => l.id === id))
        .filter(Boolean) as Landmark[];

    const effectiveOrderedLandmarks =
        mapDiscoveryMode === 'ambient'
            ? curatorOrderedLandmarks.length > 0
                ? curatorOrderedLandmarks
                : zone.landmarksPool.slice(0, 4)
            : dayLandmarks.length > 0
            ? dayLandmarks
            : itineraryOrderedLandmarks;

    const handleThemeChange = (theme: RouteTheme) => {
        playChime('stamp');
        updateActivePlanTheme(theme);
    };

    const handleZoneSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        playChime('tap');
        const val = e.target.value;
        if (val === '__custom_city__') {
            setIsCityModalOpen(true);
            return;
        }
        updatePlannerZone(val);
        const targetZone = allZones[val];
        if (targetZone && targetZone.landmarksPool.length > 0) {
            onSelectLandmark(targetZone.landmarksPool[0]);
        }
    };

    const handleCitySelected = (cityData: {
        name: string;
        city: string;
        coords: [number, number];
        bounds?: [[number, number], [number, number]];
    }) => {
        const slug = jumpToCity(cityData);
        updatePlannerZone(slug);
        const newZone = zones[slug] || allZones[slug];
        if (newZone) {
            onSelectLandmark({
                id: `center-${slug}`,
                name: newZone.name,
                coords: newZone.center,
                category: 'landmark',
                color: '#b23b23',
                tag: 'CENTER',
                desc: `Welcome to ${newZone.city}! Add stops below to build your route.`,
                audioNote: `Welcome to ${newZone.city}.`,
                svgSnippet: `
                    <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
                      <circle cx="50" cy="50" r="34" fill="#b23b23" stroke="#2b261b" stroke-width="3"/>
                      <text x="50" y="58" font-size="22" text-anchor="middle">📍</text>
                    </svg>
                `,
                panoUrl: '',
                tips: 'Search any landmark or restaurant to add as stops.',
            });
        }
    };

    const handleAddPresetCoffee = async () => {
        playChime('stamp');
        const available = zone.landmarksPool.find(
            (l) => !plannerBuffer.spotIds.includes(l.id) && !l.isCustom && l.tag !== 'Personal Spot'
        );
        if (available) {
            await addPlannerCustomStop(available.name, available.coords, available.desc, true);
        }
    };

    const handleConvertToExcursion = async () => {
        setIsConverting(true);
        playChime('stamp');
        try {
            await turnPlannerRouteIntoExcursion();
        } catch (err) {
            console.error('Failed to convert route to excursion:', err);
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <aside
            className={`${
                isMobileOpen
                    ? 'flex fixed inset-x-0 bottom-0 z-50 max-h-[82vh] rounded-t-3xl border-t-3 border-paper-900 shadow-float animate-slide-up pb-safe'
                    : 'hidden md:flex'
            } md:relative md:inset-auto md:max-h-full md:rounded-none md:border-t-0 md:border-r-2 md:w-[420px] lg:w-[460px] md:z-20 bg-paper-100 flex-col shrink-0 h-full overflow-hidden`}
        >
            {/* Mobile Sheet Drag Handle & Close Bar */}
            <div className="md:hidden flex items-center justify-between px-4 py-2 bg-paper-200/90 border-b border-paper-300 shrink-0">
                <div className="flex-1 flex justify-center cursor-pointer py-1" onClick={onCloseMobile}>
                    <div className="w-12 h-1.5 bg-paper-400 rounded-full" />
                </div>
                {onCloseMobile && (
                    <button
                        type="button"
                        onClick={onCloseMobile}
                        className="text-xs font-black px-2.5 py-1 bg-paper-100 hover:bg-paper-50 rounded-xl border border-paper-900 text-paper-900 flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                    >
                        <span>Back to Map</span>
                        <span>▼</span>
                    </button>
                )}
            </div>

            {/* Top Bar: Back to Trip Hub & Mode Switcher */}
            <div className="p-3.5 border-b-2 border-paper-200 bg-paper-50 space-y-2.5 shrink-0">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setStage('plans')}
                        className="text-xs font-bold text-paper-800 hover:text-paper-900 flex items-center gap-1 group cursor-pointer"
                    >
                        <ArrowLeft size={14} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
                        <span>Back to Trip Hub</span>
                    </button>

                    {/* Mode Chip: Ambient vs Itinerary */}
                    {mapDiscoveryMode === 'ambient' ? (
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-[10px] font-mono font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                🧭 Ambient Discovery
                            </span>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                playChime('tap');
                                setMapDiscoveryMode('ambient');
                            }}
                            className="text-[10px] font-mono font-bold text-paper-700 hover:text-paper-900 bg-paper-200 hover:bg-paper-300 px-2 py-0.5 rounded-full border border-paper-400 flex items-center gap-1 transition"
                            title="Switch to Ambient Free Discovery Mode"
                        >
                            <Compass size={12} weight="bold" />
                            <span>Free Around Me</span>
                        </button>
                    )}
                </div>

                {/* Main Drawer Mode Toggle Pill: Live Guide vs Curate Route */}
                <div className="flex items-center bg-paper-200 p-1 rounded-2xl border-2 border-paper-900 shadow-xs gap-1">
                    <button
                        type="button"
                        onClick={() => {
                            playChime('tap');
                            setDrawerTab('guide');
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            drawerTab === 'guide'
                                ? 'bg-watercolor-brick text-white shadow-stamp ring-1 ring-paper-900'
                                : 'text-paper-800 hover:text-paper-900 hover:bg-paper-300/60'
                        }`}
                    >
                        <Headphones size={15} weight="bold" />
                        <span>Live Guide</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            playChime('tap');
                            setDrawerTab('curator');
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            drawerTab === 'curator'
                                ? 'bg-amber-400 text-paper-900 shadow-stamp border-2 border-paper-900'
                                : 'text-paper-800 hover:text-paper-900 hover:bg-paper-300/60'
                        }`}
                    >
                        <Footprints size={15} weight="bold" />
                        <span>Curate Route</span>
                        {plannerBuffer.spotIds.length > 0 && (
                            <span className="bg-paper-900 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                                {plannerBuffer.spotIds.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ======================================================== */}
            {/* Quick Category Discovery Results (Google Maps style)     */}
            {/* ======================================================== */}
            {categoryFilter && categoryFilter !== 'all' && (
                <div className="mx-4 mt-2 p-3 bg-amber-50/95 border-2 border-paper-900 rounded-2xl shadow-stamp space-y-2 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-serif font-black text-xs text-paper-900">
                            <span>{DISCOVERY_CATEGORIES.find((c) => c.id === categoryFilter)?.emoji}</span>
                            <span>{DISCOVERY_CATEGORIES.find((c) => c.id === categoryFilter)?.label}</span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950">
                                {categoryLandmarks.length} in view
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => onSelectCategoryFilter?.('all')}
                            className="text-[10px] font-bold text-paper-600 hover:text-paper-900 hover:underline cursor-pointer"
                        >
                            ✕ Clear Filter
                        </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                        {categoryLandmarks.length === 0 ? (
                            <p className="text-[11px] text-paper-600 py-2 text-center italic">
                                No {DISCOVERY_CATEGORIES.find((c) => c.id === categoryFilter)?.label.toLowerCase()} found in current view. Pan or zoom map to discover more.
                            </p>
                        ) : (
                            categoryLandmarks.slice(0, 25).map((lm) => (
                                <div
                                    key={lm.id}
                                    onClick={() => onSelectLandmark(lm)}
                                    className="flex items-center justify-between p-2 rounded-xl bg-paper-50 hover:bg-white border border-paper-300 hover:border-paper-900 transition cursor-pointer group shadow-2xs"
                                >
                                    <div className="min-w-0 pr-2">
                                        <h6 className="font-serif font-bold text-xs text-paper-900 truncate group-hover:text-watercolor-brick">
                                            {lm.name}
                                        </h6>
                                        <p className="text-[10px] text-paper-600 truncate">{lm.desc || lm.tag}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addStopToRouteBuffer(lm.id);
                                            playChime('stamp');
                                        }}
                                        className="px-2 py-1 rounded-lg bg-watercolor-brick hover:bg-red-800 text-white font-extrabold text-[10px] shrink-0 shadow-2xs transition active:scale-95 cursor-pointer"
                                        title="Add to route"
                                    >
                                        + Add
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* TAB 1: CURATE ROUTE MODE (Embedded Map Curator)          */}
            {/* ======================================================== */}
            {drawerTab === 'curator' ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-rice-paper">
                    {/* Stops List Header & Actions */}
                    <div className="flex items-center justify-between pt-1">
                        <div>
                            <span className="text-xs font-black text-paper-900 uppercase tracking-wider flex items-center gap-1.5">
                                <MapPin size={15} weight="fill" className="text-watercolor-brick" />
                                <span>Route Stops ({plannerBuffer.spotIds.length})</span>
                            </span>
                            <span className="text-[11px] text-paper-700 block">
                                Reorder with arrows or tap map pins to add
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handleAddPresetCoffee}
                                className="px-2 py-1 rounded-xl bg-paper-200 hover:bg-paper-300 border border-paper-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                title="Add a cafe stop"
                            >
                                <Coffee size={13} />
                                <span>+ Cafe</span>
                            </button>

                            {plannerBuffer.spotIds.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        playChime('tap');
                                        clearPlannerStops();
                                    }}
                                    className="px-2 py-1 rounded-xl bg-paper-200 hover:bg-red-100 text-watercolor-brick border border-paper-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                    title="Clear all route stops"
                                >
                                    <ArrowCounterClockwise size={13} />
                                    <span>Reset</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ordered Stops List */}
                    <div className="space-y-2">
                        {curatorOrderedLandmarks.length === 0 ? (
                            <div className="p-4 rounded-2xl border-2 border-dashed border-paper-400 bg-paper-50/60 text-center space-y-1.5">
                                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center mx-auto text-sm">
                                    ✨
                                </div>
                                <h4 className="font-serif font-black text-xs text-paper-900">
                                    No Stops Selected Yet
                                </h4>
                                <p className="text-[11px] text-paper-700 leading-snug">
                                    Click any landmark pin on the map or search below to start building your live route!
                                </p>
                            </div>
                        ) : (
                            curatorOrderedLandmarks.map((lm, idx) => (
                                <div
                                    key={lm.id}
                                    onClick={() => onSelectLandmark(lm)}
                                    className="flex items-center justify-between p-2.5 bg-paper-50 hover:bg-white border-2 border-paper-900 rounded-2xl shadow-xs transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="w-6 h-6 rounded-full bg-watercolor-brick text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                            {idx + 1}
                                        </span>
                                        <div
                                            className="w-7 h-7 p-0.5 rounded-lg bg-paper-100 border border-paper-900 flex items-center justify-center shrink-0"
                                            dangerouslySetInnerHTML={{ __html: lm.svgSnippet }}
                                        />
                                        <div className="min-w-0">
                                            <h5 className="font-serif font-extrabold text-xs text-paper-900 truncate">
                                                {lm.name}
                                            </h5>
                                            <span className="text-[9px] font-mono font-bold text-paper-700 px-1 py-0.2 rounded bg-paper-200">
                                                {lm.tag}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            onClick={() => reorderPlannerStops(idx, idx - 1)}
                                            disabled={idx === 0}
                                            className={`p-1 rounded text-paper-900 ${
                                                idx === 0 ? 'opacity-25' : 'hover:bg-paper-200 cursor-pointer'
                                            }`}
                                            title="Move Up"
                                        >
                                            <CaretUp size={14} weight="bold" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => reorderPlannerStops(idx, idx + 1)}
                                            disabled={idx === curatorOrderedLandmarks.length - 1}
                                            className={`p-1 rounded text-paper-900 ${
                                                idx === curatorOrderedLandmarks.length - 1
                                                    ? 'opacity-25'
                                                    : 'hover:bg-paper-200 cursor-pointer'
                                            }`}
                                            title="Move Down"
                                        >
                                            <CaretDown size={14} weight="bold" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removePlannerStop(idx)}
                                            className="p-1 text-paper-700 hover:text-watercolor-brick hover:bg-red-50 rounded cursor-pointer"
                                            title="Remove Stop"
                                        >
                                            <Trash size={14} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Spot Search Autocomplete */}
                    <div className="pt-1">
                        <SpotSearchAutocomplete
                            currentZone={zone}
                            onSelectSpot={async (name, coords, address) => {
                                playChime('stamp');
                                // Do NOT auto-add to route stops; bookmark as personal spot only
                                const newId = await addPlannerCustomStop(name, coords, address, false);
                                const currentAllZones = useItineraryStore.getState().zones || allZones;
                                const currentZone = currentAllZones[currentZoneKey] || zone;
                                const newLandmark = currentZone.landmarksPool.find((l) => l.id === newId) || {
                                    id: newId,
                                    name,
                                    coords,
                                    category: 'landmark' as const,
                                    color: '#f4c568',
                                    tag: 'Personal Spot',
                                    desc: address || name,
                                    audioNote: `Arrived at ${name}.`,
                                    svgSnippet: `
                                        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
                                          <circle cx="50" cy="50" r="34" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
                                          <text x="50" y="58" font-size="22" text-anchor="middle">⭐</text>
                                        </svg>
                                    `,
                                    panoUrl: '',
                                    tips: 'Newly added personal spot',
                                    isCustom: true,
                                };
                                onSelectLandmark(newLandmark as Landmark);
                            }}
                        />
                    </div>

                    {/* Saved Personal Spots List - Persistent Container */}
                    <div className="pt-2 border-t-2 border-paper-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-paper-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Star size={14} weight="fill" className="text-amber-500" />
                                <span>My Personal Spots ({personalSpots.length})</span>
                            </span>
                        </div>

                        {personalSpots.length === 0 ? (
                            <div className="p-3 bg-paper-50/70 rounded-2xl border border-dashed border-paper-300 text-center">
                                <p className="text-xs text-paper-600 font-serif">
                                    No personal spots saved yet.
                                </p>
                                <p className="text-[10px] text-paper-500 mt-1">
                                    Search any place or click the map to bookmark spots here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {personalSpots.map((spot) => {
                                    const isInRoute = plannerBuffer.spotIds.includes(spot.id);
                                    return (
                                        <div
                                            key={spot.id}
                                            onClick={() => onSelectLandmark(spot)}
                                            className="p-2.5 rounded-2xl bg-paper-50 border-2 border-paper-900 shadow-2xs flex items-center justify-between gap-2 hover:bg-amber-50 transition cursor-pointer select-none"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs">⭐</span>
                                                    <span className="font-serif font-black text-xs text-paper-900 truncate">
                                                        {spot.name}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-paper-600 truncate block mt-0.5">
                                                    {spot.desc || 'Custom saved location'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {isInRoute ? (
                                                    <span className="text-[10px] font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                                                        ✓ In Route
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            playChime('tap');
                                                            addStopToRouteBuffer(spot.id);
                                                        }}
                                                        className="px-2 py-1 bg-amber-400 hover:bg-amber-500 text-paper-900 rounded-lg text-[10px] font-black border border-paper-900 transition active:scale-95 shadow-2xs cursor-pointer"
                                                        title="Add to route"
                                                    >
                                                        + Route
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        playChime('tap');
                                                        if (onDeletePersonalSpot) {
                                                            onDeletePersonalSpot(spot.id);
                                                        } else {
                                                            deletePersonalSpot(spot.id);
                                                        }
                                                    }}
                                                    className="p-1 hover:bg-red-100 text-paper-400 hover:text-red-700 rounded-lg transition cursor-pointer"
                                                    title="Delete personal spot"
                                                >
                                                    <Trash size={14} weight="bold" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Turn into 1-Day Excursion Action */}
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={handleConvertToExcursion}
                            disabled={isConverting || plannerBuffer.spotIds.length === 0}
                            className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-500 text-paper-900 font-black text-xs sm:text-sm rounded-2xl border-2 border-paper-900 shadow-stamp flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                            <Lightning size={17} weight="fill" className="text-paper-900" />
                            <span>
                                {isConverting ? 'Packaging Excursion...' : '⚡ Turn into 1-Day Excursion'}
                            </span>
                        </button>
                    </div>
                </div>
            ) : (
                /* ======================================================== */
                /* TAB 2: LIVE GUIDE MODE (Audio Tour & Commentary)         */
                /* ======================================================== */
                <>
                    {/* Guide Info Banner */}
                    <div className="p-3.5 border-b-2 border-paper-200 bg-paper-50 space-y-2 shrink-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h2 className="font-black text-lg text-paper-900 font-serif leading-tight">
                                    {mapDiscoveryMode === 'ambient'
                                        ? `Exploring ${zone.name}`
                                        : plan?.title}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-watercolor-brick text-white">
                                        {zone.city}
                                    </span>
                                    <span className="text-[11px] font-bold text-paper-800">
                                        Dynamic Guide Active
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setDrawerTab('curator')}
                                title="Edit route waypoints"
                                className="p-2 rounded-xl bg-paper-200 hover:bg-paper-300 border border-paper-900 text-xs font-bold text-paper-900 shrink-0 cursor-pointer shadow-2xs"
                            >
                                <PencilSimple size={16} weight="bold" />
                            </button>
                        </div>

                        {/* Multi-Day Itinerary Day Selector or Theme Switcher */}
                        {mapDiscoveryMode === 'itinerary' && currentItineraryDays.length > 0 ? (
                            <div className="pt-1 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold text-paper-800">
                                    <span className="flex items-center gap-1">
                                        <CalendarBlank size={14} weight="bold" className="text-watercolor-brick" />
                                        <span>Day Itinerary:</span>
                                    </span>
                                    {activeDay?.calendarDate && (
                                        <span className="font-mono text-[11px] text-paper-700">
                                            {activeDay.calendarDate}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
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
                                                        ? 'bg-watercolor-brick text-white shadow-sm font-black'
                                                        : 'bg-paper-200 text-paper-900 hover:bg-paper-300 border border-paper-300'
                                                }`}
                                            >
                                                <span>Day {day.dayNumber}</span>
                                                {day.subtotalEstimated > 0 && (
                                                    <span
                                                        className={`text-[10px] font-mono font-bold px-1 rounded ${
                                                            isActive ? 'bg-red-950/40 text-amber-100' : 'bg-paper-300 text-paper-800'
                                                        }`}
                                                    >
                                                        ${day.subtotalEstimated}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            /* Theme Route Switcher */
                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                                {(['classic', 'culture', 'rain'] as RouteTheme[]).map((theme) => {
                                    const isActive = plan?.activeRouteKey === theme;
                                    const labels: Record<RouteTheme, string> = {
                                        classic: '🌟 Classic',
                                        culture: '🎨 Cultural',
                                        rain: '☂️ Rain Cover',
                                    };
                                    return (
                                        <button
                                            key={theme}
                                            onClick={() => handleThemeChange(theme)}
                                            className={`px-2 py-1.5 rounded-xl text-xs font-bold border-2 transition-all text-center cursor-pointer ${
                                                isActive
                                                    ? 'border-paper-900 bg-watercolor-navy text-white shadow-sm'
                                                    : 'border-paper-300 bg-paper-100 text-paper-900 hover:bg-paper-200'
                                            }`}
                                        >
                                            {labels[theme]}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Facility Filter Toggles */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                            <span className="text-paper-800 font-bold text-[11px] flex items-center gap-1">
                                <Faders size={14} weight="bold" /> Amenities:
                            </span>
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-md bg-paper-200 border border-paper-300 text-[11px] font-bold">
                                    <input
                                        type="checkbox"
                                        checked={filterRestrooms}
                                        onChange={(e) => setFilterRestrooms(e.target.checked)}
                                        className="rounded text-watercolor-brick"
                                    />
                                    <span>🚻 Restroom</span>
                                </label>
                                <label className="cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-md bg-paper-200 border border-paper-300 text-[11px] font-bold">
                                    <input
                                        type="checkbox"
                                        checked={filterCafes}
                                        onChange={(e) => setFilterCafes(e.target.checked)}
                                        className="rounded text-watercolor-brick"
                                    />
                                    <span>☕ Cafe</span>
                                </label>
                            </div>
                        </div>

                        {/* Export Postcard Button */}
                        <button
                            onClick={() => {
                                playChime('stamp');
                                setIsPostcardOpen(true);
                            }}
                            className="w-full py-1.5 rounded-xl bg-paper-100 hover:bg-paper-200 border border-paper-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                        >
                            <Stamp size={16} weight="fill" className="text-watercolor-brick" />
                            <span>Export Scrapbook Postcard</span>
                        </button>
                    </div>

                    {/* Stats Metric Strip */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-paper-200/50 border-b border-paper-300 text-center shrink-0">
                        <div>
                            <span className="text-[10px] text-paper-700 font-bold block uppercase">Walking Distance</span>
                            <span className="text-xs font-black text-paper-900 font-mono">
                                {plan?.estimatedDistance || '1.8 km'}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-paper-700 font-bold block uppercase">Duration</span>
                            <span className="text-xs font-black text-paper-900 font-mono">
                                {plan?.estimatedDuration || '20 mins'}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-paper-700 font-bold block uppercase">Waypoints</span>
                            <span className="text-xs font-black text-watercolor-green font-mono">
                                {effectiveOrderedLandmarks.length} Stops
                            </span>
                        </div>
                    </div>

                    {/* Landmark Cards List with Audio commentary */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                        {effectiveOrderedLandmarks.map((lm, idx) => {
                            const isLodging = lm.tag === 'LODGING';
                            return (
                                <div
                                    key={lm.id}
                                    onClick={() => onSelectLandmark(lm)}
                                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer shadow-xs ${
                                        isLodging
                                            ? 'bg-indigo-50/70 border-indigo-400 hover:border-indigo-600'
                                            : 'bg-paper-50 border-paper-900 hover:border-watercolor-brick hover:bg-white'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2.5">
                                            <div
                                                className={`w-9 h-9 p-1 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${
                                                    isLodging
                                                        ? 'bg-indigo-100 border-indigo-400'
                                                        : 'bg-paper-100 border-paper-900'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: lm.svgSnippet }}
                                            />
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className={`text-[9px] font-mono font-bold px-1 rounded ${
                                                            isLodging
                                                                ? 'bg-indigo-200 text-indigo-950'
                                                                : 'bg-amber-200 text-amber-950'
                                                        }`}
                                                    >
                                                        #{idx + 1} {lm.tag}
                                                    </span>
                                                    <h3 className="font-bold text-xs sm:text-sm text-paper-900 font-serif leading-tight">
                                                        {lm.name}
                                                    </h3>
                                                </div>
                                                <p className="text-[11px] text-paper-800 mt-1 line-clamp-2">
                                                    {lm.desc}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playChime('bell');
                                                playVoiceNarrator(`Stop ${idx + 1}: ${lm.name}. ${lm.audioNote}`);
                                            }}
                                            className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-[10px] font-bold text-amber-950 flex items-center gap-1 shrink-0 transition"
                                            title="Listen to docent audio commentary"
                                        >
                                            <SpeakerHigh size={13} weight="fill" />
                                            <span>Audio</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Action Ribbon */}
                    <div className="p-3 bg-paper-100 border-t-2 border-paper-300 flex items-center justify-between gap-2 shrink-0">
                        <button
                            onClick={onToggleCruise}
                            className={`flex-1 py-2 px-3 rounded-xl border-2 border-paper-900 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-stamp transition cursor-pointer ${
                                isCruiseActive
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : 'bg-watercolor-navy text-white hover:bg-slate-800'
                            }`}
                        >
                            {isCruiseActive ? <Stop size={16} weight="fill" /> : <Play size={16} weight="fill" />}
                            <span>{isCruiseActive ? 'Stop Cruise' : 'Auto Cruise'}</span>
                        </button>

                        <button
                            onClick={onResetLocation}
                            className="p-2 rounded-xl bg-paper-200 hover:bg-paper-300 border border-paper-900 text-paper-900 text-xs shadow-xs transition cursor-pointer"
                            title="Recenter Camera"
                        >
                            <Crosshair size={18} weight="bold" />
                        </button>
                    </div>
                </>
            )}

            {/* Scrapbook Postcard Modal */}
            {isPostcardOpen && (
                <ScrapbookPostcardModal
                    plan={plan}
                    onClose={() => setIsPostcardOpen(false)}
                />
            )}

            {/* City Search & Jump Modal */}
            <CitySearchModal
                isOpen={isCityModalOpen}
                onClose={() => setIsCityModalOpen(false)}
                onSelectCity={handleCitySelected}
            />
        </aside>
    );
};