'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type L from 'leaflet';
import { useItineraryStore, getActiveDayLandmarks } from '@/store/useItineraryStore';
import { MASTER_ZONES } from '@/lib/mockData';
import { getCityPack, CITY_PACKS } from '@/data/cityPacks';
import { Landmark, ItineraryItem, ExpenseCategory, ScenicZoneKey, ScenicZone } from '@/types/itinerary';
import { fetchSpotsInEnvelope, reverseGeocodeCoords, DynamicMapSpot } from '@/lib/repositories';
import { playChime, playVoiceNarrator } from '@/lib/audio';
import { useGeolocationTracker } from '@/lib/useGeolocationTracker';
import { GuideDrawer } from './GuideDrawer';
import { LandmarkDetailModal } from '@/components/Modals/LandmarkDetailModal';
import { QuickExpenseModal } from '@/components/Modals/QuickExpenseModal';
import { CitySearchModal } from '@/components/Modals/CitySearchModal';
import { ArrowsOut, NavigationArrow, Crosshair, Sparkle, CalendarBlank, Compass, AirplaneTakeoff, MagnifyingGlass, CaretDown, CaretRight, CaretLeft } from '@phosphor-icons/react';
import { DiscoveryCategory, DISCOVERY_CATEGORIES, getLandmarkCategoryGroup } from '@/lib/landmarkCategories';
import { getDistrictBoundary, getDistrictBoundaryKey, getDistrictLatLngBounds, HK_DISTRICT_LIST } from '@/data/districtBoundaries';

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

const POI_LOCAL_CACHE_KEY_PREFIX = 'wandersketch_cached_envelope_spots_v5_';

function getCachedEnvelopeSpots(zoneKey: string): DynamicMapSpot[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(`${POI_LOCAL_CACHE_KEY_PREFIX}${zoneKey}`);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Strictly exclude personal spots from ambient cache
                return parsed.filter(
                    (s: DynamicMapSpot) =>
                        !s.isCustom &&
                        s.tag !== 'Personal Spot' &&
                        !(typeof s.id === 'string' && (s.id.startsWith('custom-') || s.id.startsWith('test-spot-')))
                );
            }
        }
    } catch {
        // Fallback on storage errors
    }
    return [];
}

function saveCachedEnvelopeSpots(zoneKey: string, spots: DynamicMapSpot[]) {
    if (typeof window === 'undefined') return;
    try {
        const sanitized = spots
            .filter(
                (s: DynamicMapSpot) =>
                    !s.isCustom &&
                    s.tag !== 'Personal Spot' &&
                    !(typeof s.id === 'string' && (s.id.startsWith('custom-') || s.id.startsWith('test-spot-')))
            )
            .slice(0, 100);
        localStorage.setItem(
            `${POI_LOCAL_CACHE_KEY_PREFIX}${zoneKey}`,
            JSON.stringify(sanitized)
        );
    } catch {
        // Ignore quota limits
    }
}

export const ScenicGuideView: React.FC = () => {
    const {
        appMode,
        activePlanId,
        savedPlans,
        zones,
        currentItineraryDays,
        activeDayNumber,
        setActiveDay,
        mapDiscoveryMode,
        setMapDiscoveryMode,
        plannerBuffer,
        updatePlannerZone,
        jumpToCity,
        addStopToRouteBuffer,
        addPlannerCustomStop,
        userRealCoords,
        setUserRealCoords,
        launchItineraryOnMap,
        launchAmbientDiscoveryOnMap,
        deletePersonalSpot,
    } = useItineraryStore();

    const allZones = zones || MASTER_ZONES;
    const plan = savedPlans.find((p) => p.id === activePlanId) || savedPlans[0];
    const currentZoneKey = mapDiscoveryMode === 'ambient' ? plannerBuffer.zoneKey : (plan?.zoneKey || plannerBuffer.zoneKey);
    const rawZone = allZones[currentZoneKey] || allZones.sha_tin_district || Object.values(allZones)[0];
    const zone: ScenicZone = React.useMemo(() => {
        const pack = getCityPack(currentZoneKey) || (rawZone.city ? getCityPack(rawZone.city) : null);
        let landmarksPool = rawZone.landmarksPool || [];
        if (pack && pack.landmarks && pack.landmarks.length > 0) {
            const poolMap = new Map(landmarksPool.map((l) => [l.id, l]));
            for (const l of pack.landmarks) {
                if (!poolMap.has(l.id)) {
                    poolMap.set(l.id, l);
                }
            }
            landmarksPool = Array.from(poolMap.values());
            return {
                ...rawZone,
                landmarksPool,
                facilities: rawZone.facilities && rawZone.facilities.length > 0 ? rawZone.facilities : pack.facilities,
                bounds: rawZone.bounds || pack.bounds,
            };
        }
        const masterFallback = MASTER_ZONES[currentZoneKey] || (rawZone.city?.toLowerCase().includes('sha tin') ? MASTER_ZONES.sha_tin_district : null);
        if (masterFallback && masterFallback.landmarksPool && masterFallback.landmarksPool.length > 0) {
            return {
                ...rawZone,
                landmarksPool: masterFallback.landmarksPool,
                facilities: rawZone.facilities && rawZone.facilities.length > 0 ? rawZone.facilities : masterFallback.facilities,
            };
        }
        return rawZone;
    }, [rawZone, currentZoneKey]);

    const activeDay = currentItineraryDays.find((d) => d.dayNumber === activeDayNumber);
    const dayLandmarks = React.useMemo(() => getActiveDayLandmarks(activeDay, zone), [activeDay, zone]);

    const [activeLandmark, setActiveLandmark] = useState<Landmark | null>(null);
    const [userCoords, setUserCoords] = useState<[number, number]>(zone.userOrigin);
    const [isLiveGpsActive, setIsLiveGpsActive] = useState<boolean>(false);
    const [isUserLocationPinned, setIsUserLocationPinned] = useState<boolean>(false);
    const [isCruiseActive, setIsCruiseActive] = useState<boolean>(false);
    const [isCitySearchOpen, setIsCitySearchOpen] = useState<boolean>(false);
    const [filterRestrooms, setFilterRestrooms] = useState<boolean>(true);
    const [filterCafes, setFilterCafes] = useState<boolean>(true);
    const [isIslandModalOpen, setIsIslandModalOpen] = useState<boolean>(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
    const [expenseModalItem, setExpenseModalItem] = useState<ItineraryItem | null>(null);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
    const [activeCategoryFilter, setActiveCategoryFilter] = useState<DiscoveryCategory>('all');
    const [activeCategoryCount, setActiveCategoryCount] = useState<number>(0);
    const [searchedBounds, setSearchedBounds] = useState<{
        minLat: number;
        minLng: number;
        maxLat: number;
        maxLng: number;
    } | null>(null);
    const [categoryBatchPage, setCategoryBatchPage] = useState<number>(0);
    const [hoveredLandmarkId, setHoveredLandmarkId] = useState<string | null>(null);
    const [hasMovedAway, setHasMovedAway] = useState<boolean>(false);
    const [selectedDistrictKey, setSelectedDistrictKey] = useState<string | null>(null);
    const [territoryMode, setTerritoryMode] = useState<'explore' | 'select'>('explore');
    const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState<boolean>(false);
    const districtDropdownRef = useRef<HTMLDivElement>(null);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState<boolean>(false);

    // Invalidate map size when desktop sidebar collapses/expands so tiles fill 100% width
    useEffect(() => {
        const timer1 = setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        }, 150);
        const timer2 = setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        }, 350);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [isDesktopCollapsed]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (districtDropdownRef.current && !districtDropdownRef.current.contains(e.target as Node)) {
                setIsDistrictDropdownOpen(false);
            }
        };
        if (isDistrictDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDistrictDropdownOpen]);

    const searchedBoundsRef = useRef(searchedBounds);
    searchedBoundsRef.current = searchedBounds;
    const activeCategoryFilterRef = useRef(activeCategoryFilter);
    activeCategoryFilterRef.current = activeCategoryFilter;

    const handleSelectCategoryFilter = (cat: DiscoveryCategory) => {
        playChime('tap');
        if (cat === activeCategoryFilter || cat === 'all') {
            setActiveCategoryFilter('all');
            setHasMovedAway(false);
            setSearchedBounds(null);
            setCategoryBatchPage(0);
            setHoveredLandmarkId(null);
        } else {
            setActiveCategoryFilter(cat);
            setCategoryBatchPage(0);
            setHoveredLandmarkId(null);
            setHasMovedAway(false);
            if (mapRef.current) {
                const b = mapRef.current.getBounds();
                setSearchedBounds({
                    minLat: b.getSouth(),
                    minLng: b.getWest(),
                    maxLat: b.getNorth(),
                    maxLng: b.getEast(),
                });
            } else if (zone.bounds) {
                const [[minLat, minLng], [maxLat, maxLng]] = zone.bounds;
                setSearchedBounds({ minLat, minLng, maxLat, maxLng });
            }
            setIsMobileDrawerOpen(true);
        }
    };

    const handleClearCategoryFilter = () => {
        playChime('tap');
        setActiveCategoryFilter('all');
        setHasMovedAway(false);
        setSearchedBounds(null);
        setCategoryBatchPage(0);
        setHoveredLandmarkId(null);
    };

    const handleNextCategoryBatch = () => {
        playChime('tap');
        setCategoryBatchPage((prev) => prev + 1);
        setHoveredLandmarkId(null);
    };

    const handlePrevCategoryBatch = () => {
        playChime('tap');
        setCategoryBatchPage((prev) => Math.max(0, prev - 1));
        setHoveredLandmarkId(null);
    };

    const handleSearchThisArea = () => {
        playChime('tap');
        if (mapRef.current) {
            const b = mapRef.current.getBounds();
            setSearchedBounds({
                minLat: b.getSouth(),
                minLng: b.getWest(),
                maxLat: b.getNorth(),
                maxLng: b.getEast(),
            });
        }
        setCategoryBatchPage(0);
        setHoveredLandmarkId(null);
        setHasMovedAway(false);
    };

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

    // Dynamic spots queried from PostGIS ST_MakeEnvelope and ambient POI engine (with localStorage instant cache)
    const [envelopeSpots, setEnvelopeSpots] = useState<DynamicMapSpot[]>(() => {
        return getCachedEnvelopeSpots(currentZoneKey);
    });
    const discoveredSpotsMapRef = useRef<Map<string, DynamicMapSpot>>(new Map());
    const lastQueriedCenterRef = useRef<[number, number] | null>(null);
    const boundsTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Synchronize in-memory spot map on mount or when current zone changes
    useEffect(() => {
        const cached = getCachedEnvelopeSpots(currentZoneKey);
        if (cached && cached.length > 0) {
            for (const s of cached) {
                discoveredSpotsMapRef.current.set(s.id, s);
            }
            setEnvelopeSpots(cached);
        }

        // Also check if initial zone coordinates overlap any City Pack
        if (zone.bounds) {
            const [[minLat, minLng], [maxLat, maxLng]] = zone.bounds;
            const uniquePacks = Array.from(new Set(Object.values(CITY_PACKS)));
            let hasNew = false;
            for (const p of uniquePacks) {
                if (p.bounds) {
                    const [[pMinLat, pMinLng], [pMaxLat, pMaxLng]] = p.bounds;
                    const overlaps = !(maxLat < pMinLat || minLat > pMaxLat || maxLng < pMinLng || minLng > pMaxLng);
                    if (overlaps && p.landmarks) {
                        for (const lm of p.landmarks) {
                            if (!discoveredSpotsMapRef.current.has(lm.id)) {
                                discoveredSpotsMapRef.current.set(lm.id, {
                                    id: lm.id,
                                    name: lm.name,
                                    category: lm.category,
                                    color: lm.color,
                                    coords: lm.coords,
                                    svgSnippet: lm.svgSnippet,
                                    tag: lm.tag,
                                    desc: lm.desc,
                                    audioNote: lm.audioNote,
                                    isCustom: false,
                                    importanceScore: lm.importanceScore ?? 85,
                                    prominenceTier: lm.prominenceTier ?? 1,
                                });
                                hasNew = true;
                            }
                        }
                    }
                }
            }
            if (hasNew) {
                const merged = Array.from(discoveredSpotsMapRef.current.values());
                setEnvelopeSpots(merged);
            }
        }
    }, [currentZoneKey, zone.bounds]);

    const handleBoundsChange = React.useCallback(
        (b: { minLat: number; minLng: number; maxLat: number; maxLng: number }) => {
            if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
            boundsTimerRef.current = setTimeout(async () => {
                const centerLat = (b.minLat + b.maxLat) / 2;
                const centerLng = (b.minLng + b.maxLng) / 2;

                // Check if camera moved away from searched area during active category search
                if (activeCategoryFilterRef.current !== 'all' && searchedBoundsRef.current) {
                    const sb = searchedBoundsRef.current;
                    const searchedCenterLat = (sb.minLat + sb.maxLat) / 2;
                    const searchedCenterLng = (sb.minLng + sb.maxLng) / 2;
                    const dLat = (centerLat - searchedCenterLat) * 111000;
                    const dLng = (centerLng - searchedCenterLng) * 111000 * Math.cos((centerLat * Math.PI) / 180);
                    const distFromSearch = Math.sqrt(dLat * dLat + dLng * dLng);
                    if (distFromSearch > 350) {
                        setHasMovedAway(true);
                    }
                }

                // 1. City Pack In-Memory Pipeline:
                // Check if current viewport overlaps ANY curated City Pack in memory (0ms latency).
                const uniquePacks = Array.from(new Set(Object.values(CITY_PACKS)));
                const overlappingPacks = uniquePacks.filter((p) => {
                    if (!p.bounds) return false;
                    const [[pMinLat, pMinLng], [pMaxLat, pMaxLng]] = p.bounds;
                    return !(b.maxLat < pMinLat || b.minLat > pMaxLat || b.maxLng < pMinLng || b.minLng > pMaxLng);
                });

                if (overlappingPacks.length > 0) {
                    let hasNew = false;
                    for (const p of overlappingPacks) {
                        if (p.landmarks) {
                            for (const lm of p.landmarks) {
                                if (!discoveredSpotsMapRef.current.has(lm.id)) {
                                    discoveredSpotsMapRef.current.set(lm.id, {
                                        id: lm.id,
                                        name: lm.name,
                                        category: lm.category,
                                        color: lm.color,
                                        coords: lm.coords,
                                        svgSnippet: lm.svgSnippet,
                                        tag: lm.tag,
                                        desc: lm.desc,
                                        audioNote: lm.audioNote,
                                        isCustom: false,
                                        importanceScore: lm.importanceScore ?? 85,
                                        prominenceTier: lm.prominenceTier ?? 1,
                                    });
                                    hasNew = true;
                                }
                            }
                        }
                    }
                    if (hasNew) {
                        const merged = Array.from(discoveredSpotsMapRef.current.values());
                        setEnvelopeSpots(merged);
                        saveCachedEnvelopeSpots(currentZoneKey, merged);
                    }
                    return; // Instant 0ms in-memory display, skip redundant network fetch
                }

                // Distance guard: don't query if camera only moved < 220 meters from last fetched center
                if (lastQueriedCenterRef.current) {
                    const [prevLat, prevLng] = lastQueriedCenterRef.current;
                    const dLat = (centerLat - prevLat) * 111000;
                    const dLng = (centerLng - prevLng) * 111000 * Math.cos((centerLat * Math.PI) / 180);
                    const distMeters = Math.sqrt(dLat * dLat + dLng * dLng);
                    if (distMeters < 220 && discoveredSpotsMapRef.current.size > 0) {
                        return; // Keep existing spots, skip redundant network call
                    }
                }

                lastQueriedCenterRef.current = [centerLat, centerLng];

                const results = await fetchSpotsInEnvelope(b.minLat, b.minLng, b.maxLat, b.maxLng);
                if (results && results.length > 0) {
                    let hasNew = false;
                    for (const r of results) {
                        if (!discoveredSpotsMapRef.current.has(r.id)) {
                            discoveredSpotsMapRef.current.set(r.id, r);
                            hasNew = true;
                        }
                    }
                    if (hasNew || envelopeSpots.length === 0) {
                        const merged = Array.from(discoveredSpotsMapRef.current.values());
                        setEnvelopeSpots(merged);
                        saveCachedEnvelopeSpots(currentZoneKey, merged);
                    }
                }
            }, 600);
        },
        [envelopeSpots.length, currentZoneKey, zone.bounds, zone.landmarksPool]
    );

    const orderedLandmarks = React.useMemo(() => {
        if (mapDiscoveryMode === 'ambient') {
            return (plannerBuffer.spotIds || [])
                .map((id) => {
                    const foundInZone = zone.landmarksPool.find((l) => l.id === id);
                    if (foundInZone) return foundInZone;
                    const foundInEnvelope = envelopeSpots.find((s) => s.id === id);
                    if (foundInEnvelope) {
                        return {
                            id: foundInEnvelope.id,
                            name: foundInEnvelope.name,
                            category: foundInEnvelope.category as any,
                            color: foundInEnvelope.color,
                            coords: foundInEnvelope.coords,
                            svgSnippet: foundInEnvelope.svgSnippet,
                            tag: foundInEnvelope.tag,
                            desc: foundInEnvelope.desc,
                            audioNote: foundInEnvelope.audioNote,
                            panoUrl: '',
                            tips: foundInEnvelope.isCustom ? 'Personal Spot saved by user' : '',
                            isCustom: Boolean(foundInEnvelope.isCustom),
                            importanceScore: foundInEnvelope.importanceScore,
                            prominenceTier: foundInEnvelope.prominenceTier,
                        } as Landmark;
                    }
                    return null;
                })
                .filter(Boolean) as Landmark[];
        }
        if (dayLandmarks.length > 0) return dayLandmarks;
        return (plan?.spotIds || [])
            .map((id) => zone.landmarksPool.find((l) => l.id === id))
            .filter(Boolean) as Landmark[];
    }, [mapDiscoveryMode, plannerBuffer.spotIds, zone.landmarksPool, envelopeSpots, dayLandmarks, plan?.spotIds]);

    // Merge curated itinerary waypoints with zone landmark pool and dynamic envelope spots
    const displayedLandmarks: Landmark[] = React.useMemo(() => {
        const pool = zone.landmarksPool;
        const existingIds = new Set(orderedLandmarks.map((l) => l.id));
        const poolExtras = pool.filter((l) => !existingIds.has(l.id));

        const allKnown = [...orderedLandmarks, ...poolExtras];
        const allKnownIds = new Set(allKnown.map((l) => l.id));

        // Ambient envelope spots: strictly authentic public places, NEVER un-saved personal spots!
        const envelopeExtras: Landmark[] = envelopeSpots
            .filter(
                (s) =>
                    !allKnownIds.has(s.id) &&
                    !s.isCustom &&
                    s.tag !== 'Personal Spot' &&
                    !(typeof s.id === 'string' && (s.id.startsWith('custom-') || s.id.startsWith('test-spot-')))
            )
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
                tips: '',
                isCustom: false,
                importanceScore: s.importanceScore,
                prominenceTier: s.prominenceTier,
            }));
        return [...allKnown, ...envelopeExtras];
    }, [orderedLandmarks, zone.landmarksPool, envelopeSpots]);

    const allKnownLandmarks = React.useMemo(() => {
        const map = new Map<string, Landmark>();
        for (const lm of displayedLandmarks) {
            map.set(lm.id, lm);
        }
        for (const pack of Object.values(CITY_PACKS)) {
            if (pack.landmarks) {
                for (const lm of pack.landmarks) {
                    if (!map.has(lm.id)) {
                        map.set(lm.id, lm);
                    }
                }
            }
        }
        return Array.from(map.values());
    }, [displayedLandmarks]);

    const matchingCategoryLandmarks = React.useMemo(() => {
        if (activeCategoryFilter === 'all') return [];
        const matching = allKnownLandmarks.filter(
            (lm) => getLandmarkCategoryGroup(lm) === activeCategoryFilter
        );
        if (searchedBounds) {
            const inBounds = matching.filter(
                (lm) =>
                    lm.coords[0] >= searchedBounds.minLat &&
                    lm.coords[0] <= searchedBounds.maxLat &&
                    lm.coords[1] >= searchedBounds.minLng &&
                    lm.coords[1] <= searchedBounds.maxLng
            );
            return inBounds.sort((a, b) => (b.importanceScore ?? 80) - (a.importanceScore ?? 80));
        }
        return matching.sort((a, b) => (b.importanceScore ?? 80) - (a.importanceScore ?? 80));
    }, [allKnownLandmarks, activeCategoryFilter, searchedBounds]);

    const CATEGORY_BATCH_SIZE = 12;
    const totalCategoryPages = Math.max(1, Math.ceil(matchingCategoryLandmarks.length / CATEGORY_BATCH_SIZE));
    const categoryBatchStartIdx = categoryBatchPage * CATEGORY_BATCH_SIZE;
    const categoryBatchEndIdx = Math.min((categoryBatchPage + 1) * CATEGORY_BATCH_SIZE, matchingCategoryLandmarks.length);

    const visibleBatchCategoryLandmarks = React.useMemo(() => {
        if (activeCategoryFilter === 'all') return [];
        return matchingCategoryLandmarks.slice(categoryBatchStartIdx, categoryBatchEndIdx);
    }, [matchingCategoryLandmarks, categoryBatchStartIdx, categoryBatchEndIdx, activeCategoryFilter]);

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
        // When inspecting a specific landmark, turn off continuous live GPS so it won't pull the camera back
        if (isLiveGpsActive) {
            setIsLiveGpsActive(false);
        }
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

    useEffect(() => {
        if (appMode === 'on-trip') {
            setIsLiveGpsActive(true);
        } else {
            setIsLiveGpsActive(false);
        }
    }, [appMode]);

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
        if (!mapRef.current) return;
        if (selectedDistrictKey) {
            const bounds = getDistrictLatLngBounds(selectedDistrictKey);
            if (bounds) {
                mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
                return;
            }
        }
        if (zone.bounds) {
            mapRef.current.fitBounds(zone.bounds, { padding: [40, 40] });
        }
    };

    const handleDistrictSelected = (key: string | null) => {
        setSelectedDistrictKey(key);
        if (key) {
            const matchingPack = Object.values(CITY_PACKS).find((p) => getDistrictBoundaryKey(p.id) === key);
            if (matchingPack) {
                updatePlannerZone(matchingPack.id);
                setUserCoords(matchingPack.userOrigin);
            }
        }
    };

    const handleSelectDistrictFromDropdown = (distKey: string, packId: string) => {
        playChime('stamp');
        setIsDistrictDropdownOpen(false);
        setSelectedDistrictKey(distKey);

        const pack = CITY_PACKS[packId] || Object.values(CITY_PACKS).find((p) => getDistrictBoundaryKey(p.id) === distKey);
        if (pack) {
            updatePlannerZone(pack.id);
            setUserCoords(pack.userOrigin);
        }

        if (mapRef.current) {
            const bounds = getDistrictLatLngBounds(distKey);
            if (bounds) {
                mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
            } else if (pack) {
                mapRef.current.flyTo(pack.center, 13, { duration: 1.2 });
            }
        }
    };

    const handleResetLocation = () => {
        playChime('tap');
        if (isLiveGpsActive) setIsLiveGpsActive(false);
        setIsUserLocationPinned(false);
        const originCoords = orderedLandmarks.length > 0 ? orderedLandmarks[0].coords : zone.userOrigin;
        setUserCoords(originCoords);
        if (mapRef.current) {
            mapRef.current.flyTo(originCoords, 16);
        }
    };

    const hasSyncedGpsDistrictRef = useRef(false);

    // Reverse-geocode user GPS coordinates to automatically sync the active district
    const syncCurrentLocationDistrict = React.useCallback(
        async (coords: [number, number], force: boolean = false) => {
            if (hasSyncedGpsDistrictRef.current && !force) return;
            try {
                const geoInfo = await reverseGeocodeCoords(coords[0], coords[1]);
                if (geoInfo) {
                    hasSyncedGpsDistrictRef.current = true;
                    const currentCity = (zone.city || '').toLowerCase();
                    const targetDistrict = (geoInfo.district || geoInfo.city || '').toLowerCase();
                    if (!currentCity.includes(targetDistrict) && !targetDistrict.includes(currentCity)) {
                        const slug = jumpToCity({
                            name: `${geoInfo.district} Exploration`,
                            city: geoInfo.district || geoInfo.city,
                            coords: coords,
                            bounds: geoInfo.bounds,
                        });
                        updatePlannerZone(slug);
                    }
                }
            } catch (err) {
                console.warn('Could not reverse geocode user district:', err);
            }
        },
        [zone.city, jumpToCity, updatePlannerZone]
    );

    const hasAutoDetectedOnMountRef = useRef(false);

    // Auto-detect user GPS once on initial mount in ambient mode
    useEffect(() => {
        if (hasAutoDetectedOnMountRef.current) return;
        hasAutoDetectedOnMountRef.current = true;

        if (typeof window !== 'undefined' && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                    setUserRealCoords(coords);
                    if (mapDiscoveryMode === 'ambient') {
                        setUserCoords(coords);
                        if (mapRef.current) {
                            mapRef.current.flyTo(coords, 16, { duration: 1.2 });
                        }
                        syncCurrentLocationDistrict(coords, false);
                    }
                },
                (err) => {
                    console.info('Geolocation access not granted, using zone origin:', err.message);
                },
                { enableHighAccuracy: true, timeout: 6000 }
            );
        }
    }, [mapDiscoveryMode, setUserRealCoords, syncCurrentLocationDistrict]);

    // "My Location" tracks and places user at their position JUST ONCE
    const handleJumpToMyLocation = () => {
        playChime('tap');
        // Ensure continuous live follow mode is off
        setIsLiveGpsActive(false);

        if (typeof window !== 'undefined' && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                    setUserRealCoords(coords);
                    setUserCoords(coords);
                    setIsUserLocationPinned(true);
                    if (mapRef.current) {
                        mapRef.current.flyTo(coords, 16, { duration: 1.2 });
                    }
                    syncCurrentLocationDistrict(coords, false);
                },
                (err) => {
                    if (userRealCoords) {
                        setUserCoords(userRealCoords);
                        setIsUserLocationPinned(true);
                        if (mapRef.current) {
                            mapRef.current.flyTo(userRealCoords, 16, { duration: 1.2 });
                        }
                    } else {
                        console.info('Could not access current location:', err.message);
                    }
                },
                { enableHighAccuracy: true, timeout: 6000 }
            );
        } else if (userRealCoords) {
            setUserCoords(userRealCoords);
            setIsUserLocationPinned(true);
            if (mapRef.current) {
                mapRef.current.flyTo(userRealCoords, 16, { duration: 1.2 });
            }
        }
    };

    const getCityEmoji = (cityName: string): string => {
        const c = cityName.toLowerCase();
        if (c.includes('hong') || c.includes('sha tin') || c.includes('central') || c.includes('kowloon') || c.includes('sai kung')) return '🏙️';
        if (c.includes('york') || c.includes('nyc')) return '🗽';
        if (c.includes('london')) return '🇬🇧';
        if (c.includes('tokyo')) return '🗼';
        if (c.includes('rome') || c.includes('roma')) return '🏛️';
        return '🌍';
    };

    const handleJumpToZone = (zKey: string) => {
        playChime('tap');
        updatePlannerZone(zKey);
        const bKey = getDistrictBoundaryKey(zKey);
        if (bKey) {
            setSelectedDistrictKey(bKey);
        }
        const targetZone = allZones[zKey];
        if (targetZone) {
            setUserCoords(targetZone.userOrigin);
            if (mapRef.current) {
                mapRef.current.flyTo(targetZone.center, targetZone.zoom || 15, { duration: 1.2 });
            }
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
        setUserCoords(cityData.coords);
        if (mapRef.current) {
            mapRef.current.flyTo(cityData.coords, 15, { duration: 1.5 });
        }
    };

    const handleAddToRoute = (lm: Landmark) => {
        playChime('stamp');
        if (!zone.landmarksPool.some((l) => l.id === lm.id)) {
            zone.landmarksPool.push(lm);
        }
        addStopToRouteBuffer(lm.id);
    };

    const handleDeletePersonalSpot = (spotId: string) => {
        playChime('tap');
        deletePersonalSpot(spotId);
        discoveredSpotsMapRef.current.delete(spotId);
        setEnvelopeSpots((prev) => {
            const next = prev.filter((s) => s.id !== spotId);
            saveCachedEnvelopeSpots(currentZoneKey, next);
            return next;
        });
        if (activeLandmark?.id === spotId) {
            setActiveLandmark(null);
        }
    };

    const handleMapClick = () => {
        // Dismiss open detail modal when tapping on empty map canvas
        if (activeLandmark) {
            setActiveLandmark(null);
        }
    };

    useEffect(() => {
        return () => {
            if (cruiseIntervalRef.current) clearInterval(cruiseIntervalRef.current);
        };
    }, []);

    return (
        <div className="flex-1 flex overflow-hidden relative w-full h-[calc(100vh-4rem)]">
            {/* Backdrop on mobile when bottom sheet is open */}
            {isMobileDrawerOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
                    onClick={() => setIsMobileDrawerOpen(false)}
                />
            )}

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
                onDeletePersonalSpot={handleDeletePersonalSpot}
                isMobileOpen={isMobileDrawerOpen}
                onCloseMobile={() => setIsMobileDrawerOpen(false)}
                isDesktopCollapsed={isDesktopCollapsed}
                onToggleDesktopCollapse={() => setIsDesktopCollapsed((prev) => !prev)}
                categoryFilter={activeCategoryFilter}
                onSelectCategoryFilter={handleSelectCategoryFilter}
                categoryLandmarks={visibleBatchCategoryLandmarks}
                totalCategoryCount={matchingCategoryLandmarks.length}
                currentBatchPage={categoryBatchPage}
                totalPages={totalCategoryPages}
                categoryBatchStartIdx={categoryBatchStartIdx}
                onNextBatch={handleNextCategoryBatch}
                onPrevBatch={handlePrevCategoryBatch}
                onClearCategoryFilter={handleClearCategoryFilter}
                hoveredLandmarkId={hoveredLandmarkId}
                onHoverLandmark={setHoveredLandmarkId}
            />

            <div className="flex-1 h-full relative">
                {/* Mobile Bottom Peek Pill (Google Maps / Apple Maps style) */}
                {!isMobileDrawerOpen && (
                    <div className="md:hidden fixed bottom-18 left-3 right-3 z-30 pointer-events-none">
                        <div
                            onClick={() => {
                                playChime('tap');
                                setIsMobileDrawerOpen(true);
                            }}
                            className="pointer-events-auto flex items-center justify-between p-3 bg-paper-50/95 backdrop-blur-md border-2 border-paper-900 rounded-2xl shadow-float cursor-pointer active:scale-98 transition-all"
                        >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className="w-8 h-8 rounded-xl bg-watercolor-brick text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Compass size={18} weight="fill" />
                                </div>
                                <div className="truncate">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-extrabold text-xs text-paper-900 font-serif truncate">
                                            {activeLandmark?.name || (activeDay ? `Day ${activeDayNumber} Guide` : plan?.title || 'Field Guide')}
                                        </span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-200 text-amber-950 rounded font-mono shrink-0">
                                            {orderedLandmarks.length} stops
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-paper-700 truncate">Tap to open stop schedule, amenities & audio notes</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 pl-2 text-watercolor-brick font-black text-xs">
                                <span>Stops</span>
                                <span>▲</span>
                            </div>
                        </div>
                    </div>
                )}

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
                    showUserLocation={isLiveGpsActive || isUserLocationPinned}
                    onOpenIslandView={() => {
                        playChime('stamp');
                        setIsIslandModalOpen(true);
                    }}
                    onBoundsChange={handleBoundsChange}
                    onRecordExpense={handleRecordExpense}
                    onAddToRoute={handleAddToRoute}
                    onDeletePersonalSpot={handleDeletePersonalSpot}
                    onMapClick={handleMapClick}
                    mapDiscoveryMode={mapDiscoveryMode}
                    categoryFilter={activeCategoryFilter}
                    visibleCategoryLandmarks={visibleBatchCategoryLandmarks}
                    categoryBatchStartIdx={categoryBatchStartIdx}
                    hoveredLandmarkId={hoveredLandmarkId}
                    selectedDistrictKey={selectedDistrictKey}
                    onSelectDistrict={handleDistrictSelected}
                    territoryMode={territoryMode}
                    onCategoryCountChange={setActiveCategoryCount}
                    onMapReady={(map) => {
                        mapRef.current = map;
                    }}
                />

                {/* Google Maps-Style Collapse/Expand Side Panel Edge Tab (Centered on Border) */}
                <div className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 group pointer-events-auto">
                    <button
                        type="button"
                        onClick={() => {
                            playChime('tap');
                            setIsDesktopCollapsed((prev) => !prev);
                        }}
                        className="flex items-center justify-center w-5.5 h-12 bg-[#fdfbf7] hover:bg-white text-paper-900 border-y-2 border-r-2 border-paper-900 rounded-r-lg shadow-stamp cursor-pointer transition-all hover:w-6.5 active:scale-95 select-none"
                        style={{ backgroundColor: '#fdfbf7' }}
                        title={isDesktopCollapsed ? 'Expand side panel' : 'Collapse side panel'}
                        aria-label={isDesktopCollapsed ? 'Expand side panel' : 'Collapse side panel'}
                    >
                        {isDesktopCollapsed ? (
                            <CaretRight size={14} weight="bold" className="text-paper-900 group-hover:text-watercolor-brick transition-colors" />
                        ) : (
                            <CaretLeft size={14} weight="bold" className="text-paper-900 group-hover:text-watercolor-brick transition-colors" />
                        )}
                    </button>
                    <div className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-paper-900 text-paper-50 text-[11px] font-serif font-black rounded-lg shadow-float whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                        {isDesktopCollapsed ? 'Expand side panel' : 'Collapse side panel'}
                    </div>
                </div>

                {/* Active Glowing District Boundary Banner */}
                {selectedDistrictKey && (() => {
                    const boundary = getDistrictBoundary(selectedDistrictKey);
                    const matchingPack = Object.values(CITY_PACKS).find((p) => getDistrictBoundaryKey(p.id) === selectedDistrictKey);
                    const spotCount = matchingPack?.landmarks?.length || 0;
                    return (
                        <div className="absolute top-28 left-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-paper-50/95 backdrop-blur-md border-2 border-paper-900 rounded-2xl shadow-stamp animate-slide-up transition-all duration-300">
                            <div className="w-5 h-5 rounded-full bg-amber-300 border border-amber-500 flex items-center justify-center text-xs shrink-0 shadow-2xs">
                                🏮
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-serif font-black text-paper-900 leading-tight">
                                    {boundary?.name || selectedDistrictKey}
                                </span>
                                <span className="text-[10px] text-amber-900 font-mono font-bold leading-tight">
                                    ✨ Glowing District Border • {spotCount} spots
                                </span>
                            </div>
                            {territoryMode === 'select' ? (
                                <button
                                    onClick={() => {
                                        playChime('tap');
                                        setTerritoryMode('explore');
                                    }}
                                    className="ml-1 px-2.5 py-1 rounded-xl bg-paper-900 hover:bg-paper-800 text-paper-50 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                                    title="Switch to Pan & Explore mode to browse places inside this district"
                                >
                                    <span>🖐️ Explore District</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        playChime('tap');
                                        setTerritoryMode('select');
                                    }}
                                    className="ml-1 px-2 py-0.5 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-950 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                                    title="Switch to Select mode to pick another district"
                                >
                                    <span>🏮 Select Mode</span>
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedDistrictKey(null)}
                                className="ml-1 px-2 py-0.5 rounded-full bg-paper-200 hover:bg-paper-300 text-[11px] font-bold text-paper-800 transition cursor-pointer"
                                title="Clear Boundary Highlight"
                            >
                                ✕ Clear
                            </button>
                        </div>
                    );
                })()}

                {/* Mode-Aware Top Bar: Ambient Horizon & District Jumpers, or Multi-Day Carousel */}
                {mapDiscoveryMode === 'ambient' ? (
                    <div className={`absolute top-4 left-4 ${isDistrictDropdownOpen ? 'z-40' : 'z-20'} max-w-[calc(100%-120px)] sm:max-w-[calc(100%-140px)] flex flex-wrap items-center gap-2 transition-all duration-300`}>
                        {appMode === 'on-trip' && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-100/95 backdrop-blur-md border-2 border-paper-900 rounded-2xl shadow-stamp text-xs font-serif font-black text-paper-900 animate-fade-in">
                                <Sparkle size={15} weight="fill" className="text-amber-500 animate-spin-slow" />
                                <span className="hidden sm:inline">Around Me:</span>
                                <span>~1.2km Horizon</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1 p-1 bg-paper-100/95 backdrop-blur-md border-2 border-paper-900 rounded-2xl shadow-stamp max-w-full">
                            {/* Slot 1: My Location */}
                            <button
                                onClick={handleJumpToMyLocation}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-paper-50 hover:bg-paper-200 text-paper-900 border border-paper-300 flex items-center gap-1 transition shrink-0 cursor-pointer"
                                title="Detect & center on current GPS location"
                            >
                                <Crosshair size={13} weight="bold" className="text-watercolor-brick" />
                                <span>My Location</span>
                            </button>

                            {/* Slot 2: Current Active City Overview */}
                            <button
                                onClick={() => {
                                    playChime('tap');
                                    setSelectedDistrictKey(null);
                                    if (mapRef.current) {
                                        if ((zone.city || '').toLowerCase().includes('hong kong')) {
                                            const hkBounds: [[number, number], [number, number]] = [
                                                [22.18, 113.82],
                                                [22.56, 114.44],
                                            ];
                                            mapRef.current.fitBounds(hkBounds, { padding: [20, 20], maxZoom: 12 });
                                        } else if (zone.bounds) {
                                            mapRef.current.fitBounds(zone.bounds, { padding: [30, 30] });
                                        }
                                    }
                                }}
                                className="px-2.5 py-1 rounded-xl text-xs font-black transition flex items-center gap-1 shrink-0 bg-watercolor-brick text-white shadow-xs cursor-pointer active:scale-95"
                                title={`Currently exploring ${zone.city || zone.name}. Tap to view city overview.`}
                            >
                                <span>{getCityEmoji(zone.city)} {zone.city || zone.name}</span>
                            </button>

                            {/* Slot 3: All Districts Dropdown Menu */}
                            {(() => {
                                const selectedDistrictBoundary = selectedDistrictKey ? getDistrictBoundary(selectedDistrictKey) : null;
                                const activeDistrictLabel =
                                    selectedDistrictBoundary?.name ||
                                    (zone.name.includes('•') ? zone.name.split('•')[1]?.trim() : zone.name) ||
                                    'Districts';

                                const isHongKong =
                                    (zone.city || '').toLowerCase().includes('hong kong') ||
                                    zone.id.startsWith('hong_kong') ||
                                    zone.id.includes('sha_tin') ||
                                    zone.id === 'central';

                                const districtOptions = isHongKong
                                    ? HK_DISTRICT_LIST
                                    : Object.values(allZones)
                                          .filter((z) => z.city === zone.city || z.id === zone.id)
                                          .map((z) => ({ key: z.id, label: z.name, packId: z.id }));

                                return (
                                    <div className="relative shrink-0" ref={districtDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                playChime('tap');
                                                setIsDistrictDropdownOpen((prev) => !prev);
                                            }}
                                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer select-none active:scale-95 ${
                                                selectedDistrictKey
                                                    ? 'bg-amber-300 hover:bg-amber-400 text-paper-950 border-2 border-paper-900 shadow-2xs font-black'
                                                    : 'bg-paper-50 hover:bg-paper-200 text-paper-900 border border-paper-300'
                                            }`}
                                            title="Select any district from the list to focus and explore"
                                        >
                                            <span>🏮</span>
                                            <span className="max-w-[150px] truncate">{activeDistrictLabel}</span>
                                            <CaretDown size={11} weight="bold" className={`transition-transform duration-200 ${isDistrictDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isDistrictDropdownOpen && (
                                            <div
                                                className="absolute top-full mt-2 left-0 z-50 w-72 max-w-[calc(100vw-2rem)] max-h-84 bg-[#fdfbf7] border-2 border-paper-900 rounded-2xl shadow-float p-1.5 flex flex-col gap-1 animate-slide-up"
                                                style={{ backgroundColor: '#fdfbf7' }}
                                            >
                                                <div
                                                    className="px-2.5 py-1.5 border-b border-paper-300 flex items-center justify-between shrink-0"
                                                    style={{ backgroundColor: '#fdfbf7' }}
                                                >
                                                    <span className="text-[11px] font-serif font-black text-paper-900 uppercase tracking-wider">
                                                        {isHongKong ? 'Hong Kong Districts (18)' : 'Explore Districts'}
                                                    </span>
                                                    {selectedDistrictKey && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                playChime('tap');
                                                                setSelectedDistrictKey(null);
                                                                setIsDistrictDropdownOpen(false);
                                                            }}
                                                            className="text-[10px] font-mono font-bold text-watercolor-brick hover:underline cursor-pointer"
                                                        >
                                                            Clear
                                                        </button>
                                                    )}
                                                </div>
                                                <div
                                                    className="flex flex-col gap-0.5 max-h-64 overflow-y-auto no-scrollbar custom-parchment-scrollbar"
                                                    style={{ backgroundColor: '#fdfbf7' }}
                                                >
                                                    {districtOptions.map((dist) => {
                                                        const isSelected = selectedDistrictKey === dist.key;
                                                        const count = CITY_PACKS[dist.packId]?.landmarks?.length || 0;
                                                        return (
                                                            <button
                                                                key={dist.key}
                                                                type="button"
                                                                onClick={() => {
                                                                    handleSelectDistrictFromDropdown(dist.key, dist.packId);
                                                                }}
                                                                className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-serif transition flex items-center justify-between cursor-pointer text-left ${
                                                                    isSelected
                                                                        ? 'bg-watercolor-brick text-white shadow-xs font-black'
                                                                        : 'text-paper-900 hover:bg-amber-100 font-bold'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2 truncate">
                                                                    <span className="text-sm shrink-0">🏮</span>
                                                                    <span className="truncate">{dist.label}</span>
                                                                </div>
                                                                <span
                                                                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full shrink-0 font-bold ${
                                                                        isSelected
                                                                            ? 'bg-red-950/40 text-amber-100'
                                                                            : 'bg-paper-200 text-paper-800'
                                                                    }`}
                                                                >
                                                                    {count} spots
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* + City Search Trigger */}
                            <button
                                onClick={() => setIsCitySearchOpen(true)}
                                className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-200 hover:bg-amber-300 text-paper-900 border border-paper-900 flex items-center gap-1 transition shrink-0 shadow-2xs cursor-pointer active:scale-95"
                                title="Search and jump to any city in the world"
                            >
                                <AirplaneTakeoff size={13} weight="bold" className="text-paper-900" />
                                <span>+ City</span>
                            </button>
                        </div>
                        {savedPlans.length > 0 && (
                            <button
                                onClick={() => {
                                    playChime('stamp');
                                    launchItineraryOnMap(activePlanId);
                                }}
                                className="px-3 py-1.5 bg-amber-300 hover:bg-amber-400 text-paper-900 border-2 border-paper-900 rounded-2xl text-xs font-black shadow-stamp flex items-center gap-1.5 transition active:scale-95"
                                title="Switch back to active Trip Itinerary"
                            >
                                <CalendarBlank size={14} weight="bold" />
                                <span className="hidden sm:inline">Load Trip Itinerary</span>
                                <span className="sm:hidden">Trip</span>
                            </button>
                        )}
                    </div>
                ) : (
                    /* Sticky Day-Picker Carousel in Itinerary Mode */
                    currentItineraryDays.length > 0 && (
                        <div className="absolute top-4 left-4 z-20 max-w-[calc(100%-120px)] sm:max-w-[calc(100%-140px)] flex flex-wrap items-center gap-2 transition-all duration-300">
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
                            <button
                                onClick={() => {
                                    playChime('tap');
                                    launchAmbientDiscoveryOnMap();
                                }}
                                className="px-3 py-1.5 rounded-2xl text-xs font-black bg-amber-100 hover:bg-amber-200 text-paper-900 border-2 border-paper-900 shadow-stamp flex items-center gap-1.5 shrink-0 transition active:scale-95"
                                title="Switch to Ambient Discovery mode (around me)"
                            >
                                <Sparkle size={14} weight="fill" className="text-amber-600" />
                                <span className="hidden sm:inline">Explore Around Me</span>
                                <span className="sm:hidden">Explore</span>
                            </button>
                            {appMode === 'on-trip' && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 text-white border-2 border-emerald-950 rounded-2xl shadow-stamp text-xs font-black shrink-0 select-none animate-fade-in">
                                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shrink-0"></span>
                                    <span className="hidden sm:inline">🌿 Eco-Island Theme Active</span>
                                    <span className="sm:hidden">🌿 Eco Theme</span>
                                </div>
                            )}
                        </div>
                    )
                )}

                {/* Google Maps-Style Quick Category Discovery Pills Bar */}
                <div className="absolute top-16 left-4 z-20 max-w-[calc(100%-120px)] sm:max-w-[calc(100%-140px)] flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 select-none transition-all duration-300">
                    {DISCOVERY_CATEGORIES.map((cat) => {
                        const isActive = activeCategoryFilter === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    handleSelectCategoryFilter(cat.id);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-serif font-bold transition-all shadow-sm border shrink-0 cursor-pointer select-none active:scale-95 ${
                                    isActive
                                        ? `${cat.activeBg} ${cat.activeText} ${cat.borderColor} border-2 shadow-stamp font-black scale-102 ring-1 ring-white/50`
                                        : 'bg-paper-50 hover:bg-paper-100 text-paper-900 border-paper-400/80 hover:border-paper-900'
                                }`}
                                style={
                                    isActive
                                        ? { backgroundColor: cat.solidBg, borderColor: cat.solidBorder, color: '#ffffff' }
                                        : { backgroundColor: '#fdfbf7', color: '#2b261b' }
                                }
                                title={`Filter canvas to show ${cat.label}`}
                            >
                                <span className="text-sm">{cat.emoji}</span>
                                <span>{cat.label}</span>
                                {isActive && matchingCategoryLandmarks.length > 0 && (
                                    <span className="ml-1 text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                                        {matchingCategoryLandmarks.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Floating "Search this area" Button (Google Maps style when user panned away) */}
                {hasMovedAway && activeCategoryFilter !== 'all' && (
                    <div className="absolute top-26 sm:top-28 left-1/2 -translate-x-1/2 z-30 animate-fade-in pointer-events-auto">
                        <button
                            type="button"
                            onClick={handleSearchThisArea}
                            className="flex items-center gap-2 px-4 py-2 bg-paper-50 hover:bg-white text-paper-900 border-2 border-paper-900 rounded-full shadow-float font-serif font-black text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                            <MagnifyingGlass size={16} weight="bold" className="text-watercolor-brick" />
                            <span>Search this area</span>
                        </button>
                    </div>
                )}

                {/* Territory Interaction Mode Toggle Dock (Mode A: Free Pan & Explore vs Mode B: Territory Select) */}
                <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-auto select-none">
                    {/* Floating Hint when in Select Mode */}
                    {territoryMode === 'select' && (
                        <div className="px-3 py-1 rounded-full bg-amber-400 text-paper-950 font-serif font-black text-[11px] border-2 border-paper-900 shadow-stamp flex items-center gap-1.5 animate-bounce-subtle">
                            <span>🏮</span>
                            <span>Hover to preview, click to select district boundary</span>
                        </div>
                    )}

                    {/* Segmented Mode Toggle Pill */}
                    <div className="p-1 bg-paper-50/95 backdrop-blur-md border-2 border-paper-900 rounded-full shadow-float flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => {
                                playChime('tap');
                                setTerritoryMode('explore');
                            }}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-serif font-black transition-all cursor-pointer ${
                                territoryMode === 'explore'
                                    ? 'bg-paper-900 text-paper-50 shadow-stamp scale-102 ring-1 ring-paper-900'
                                    : 'text-paper-700 hover:text-paper-900 hover:bg-paper-200/70'
                            }`}
                            title="Free Pan & Explore Mode (Default): Freely drag, pan, zoom, and inspect landmarks without boundary clicks"
                        >
                            <span className="text-sm">🖐️</span>
                            <span>Pan & Explore</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                playChime('tap');
                                setTerritoryMode('select');
                            }}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-serif font-black transition-all cursor-pointer ${
                                territoryMode === 'select'
                                    ? 'bg-amber-400 text-stone-950 shadow-stamp scale-102 ring-1 ring-amber-600 font-black'
                                    : 'text-paper-700 hover:text-paper-900 hover:bg-paper-200/70'
                            }`}
                            title="Territory Select Mode: Hover and click districts to highlight borders and filter areas"
                        >
                            <span className="text-sm">🏮</span>
                            <span>Select Territories</span>
                            {selectedDistrictKey && (
                                <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Floating Map Controls (Option A: Streamlined Navigation Controls) */}
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <button
                        onClick={() => {
                            playChime('tap');
                            const nextState = !isLiveGpsActive;
                            setIsLiveGpsActive(nextState);
                            if (nextState) {
                                if (isCruiseActive) setIsCruiseActive(false);
                                const targetCoords = liveGpsCoords || userRealCoords || userCoords;
                                if (targetCoords && mapRef.current) {
                                    mapRef.current.panTo(targetCoords, { animate: true, duration: 0.6 });
                                }
                            } else {
                                setIsUserLocationPinned(false);
                            }
                        }}
                        title={isLiveGpsActive ? 'Disable Live GPS Tracking' : 'Enable Live GPS Tracking'}
                        className={`p-2.5 rounded-2xl border-2 border-paper-900 shadow-card transition active:scale-95 cursor-pointer ${
                            isLiveGpsActive
                                ? 'bg-watercolor-brick text-white animate-pulse'
                                : 'bg-paper-50 hover:bg-paper-100 text-paper-900'
                        }`}
                    >
                        <NavigationArrow
                            size={20}
                            weight={isLiveGpsActive ? 'fill' : 'bold'}
                            className={isLiveGpsActive ? 'text-white' : 'text-watercolor-brick'}
                        />
                    </button>
                    <button
                        onClick={handleFitBounds}
                        title="Fit Current District View"
                        className="p-2.5 rounded-2xl bg-paper-50 hover:bg-paper-100 border-2 border-paper-900 text-paper-900 shadow-card transition active:scale-95 cursor-pointer"
                    >
                        <ArrowsOut size={20} weight="bold" />
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
                    onAddToRoute={() => activeLandmark && handleAddToRoute(activeLandmark)}
                    onDeleteSpot={handleDeletePersonalSpot}
                    isInRoute={activeLandmark ? orderedLandmarks.some((l) => l.id === activeLandmark.id) : false}
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

                {/* City Search & Jump Modal */}
                <CitySearchModal
                    isOpen={isCitySearchOpen}
                    onClose={() => setIsCitySearchOpen(false)}
                    onSelectCity={handleCitySelected}
                />
            </div>
        </div>
    );
};