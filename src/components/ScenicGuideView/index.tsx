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
import { Palette, ArrowsOut, NavigationArrow, Crosshair, Sparkle, CalendarBlank, Compass, AirplaneTakeoff } from '@phosphor-icons/react';
import { DiscoveryCategory, DISCOVERY_CATEGORIES, getLandmarkCategoryGroup } from '@/lib/landmarkCategories';

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
    const rawZone = allZones[currentZoneKey] || allZones.sha_tin_district || allZones.toronto_distillery || Object.values(allZones)[0];
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
    const [isParchmentMode, setIsParchmentMode] = useState<boolean>(true);
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

    const categoryMatchedLandmarks = React.useMemo(() => {
        if (activeCategoryFilter === 'all') return [];
        return displayedLandmarks.filter(
            (lm) => getLandmarkCategoryGroup(lm) === activeCategoryFilter
        );
    }, [displayedLandmarks, activeCategoryFilter]);

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
                    if (mapRef.current) {
                        mapRef.current.flyTo(coords, 16, { duration: 1.2 });
                    }
                    syncCurrentLocationDistrict(coords, false);
                },
                (err) => {
                    if (userRealCoords) {
                        setUserCoords(userRealCoords);
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
            if (mapRef.current) {
                mapRef.current.flyTo(userRealCoords, 16, { duration: 1.2 });
            }
        }
    };

    const getCityEmoji = (cityName: string): string => {
        const c = cityName.toLowerCase();
        if (c.includes('toronto')) return '🍁';
        if (c.includes('kyoto')) return '⛩️';
        if (c.includes('paris')) return '🥐';
        if (c.includes('york') || c.includes('nyc')) return '🗽';
        if (c.includes('london')) return '🇬🇧';
        if (c.includes('tokyo')) return '🗼';
        if (c.includes('rome') || c.includes('roma')) return '🏛️';
        if (c.includes('barcelona')) return '🏰';
        if (c.includes('sydney')) return '⛵';
        if (c.includes('seoul')) return '🏯';
        return '🌍';
    };

    const handleJumpToZone = (zKey: string) => {
        playChime('tap');
        updatePlannerZone(zKey);
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
                categoryFilter={activeCategoryFilter}
                onSelectCategoryFilter={setActiveCategoryFilter}
                categoryLandmarks={categoryMatchedLandmarks}
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
                    isParchmentMode={isParchmentMode}
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
                    onCategoryCountChange={setActiveCategoryCount}
                    onMapReady={(map) => {
                        mapRef.current = map;
                    }}
                />

                {/* Mode-Aware Top Bar: Ambient Horizon & District Jumpers, or Multi-Day Carousel */}
                {mapDiscoveryMode === 'ambient' ? (
                    <div className="absolute top-4 left-4 z-20 max-w-[calc(100%-120px)] sm:max-w-[calc(100%-140px)] flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-100/95 backdrop-blur-md border-2 border-paper-900 rounded-2xl shadow-stamp text-xs font-serif font-black text-paper-900">
                            <Sparkle size={15} weight="fill" className="text-amber-500 animate-spin-slow" />
                            <span className="hidden sm:inline">Around Me:</span>
                            <span>~1.2km Horizon</span>
                        </div>
                        <div className="flex items-center gap-1 p-1 bg-paper-100/95 backdrop-blur-md border-2 border-paper-900 rounded-2xl shadow-stamp overflow-x-auto no-scrollbar max-w-full">
                            {/* Slot 1: My Location */}
                            <button
                                onClick={handleJumpToMyLocation}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-paper-50 hover:bg-paper-200 text-paper-900 border border-paper-300 flex items-center gap-1 transition shrink-0 cursor-pointer"
                                title="Detect & center on current GPS location"
                            >
                                <Crosshair size={13} weight="bold" className="text-watercolor-brick" />
                                <span>My Location</span>
                            </button>

                            {/* Slot 2: Current Active City */}
                            <button
                                onClick={() => handleJumpToZone(zone.id)}
                                className="px-2.5 py-1 rounded-xl text-xs font-black transition flex items-center gap-1 shrink-0 bg-watercolor-brick text-white shadow-xs cursor-pointer"
                                title={`Currently exploring ${zone.city || zone.name}`}
                            >
                                <span>{getCityEmoji(zone.city)} {zone.city || zone.name}</span>
                            </button>

                            {/* Slot 3: Quick Alternate City */}
                            {(() => {
                                const fallbackKey = zone.id === 'kyoto_higashiyama' ? 'toronto_distillery' : 'kyoto_higashiyama';
                                const altZone = allZones[fallbackKey] || Object.values(allZones).find((z) => z.id !== zone.id);
                                if (!altZone) return null;
                                return (
                                    <button
                                        key={altZone.id}
                                        onClick={() => handleJumpToZone(altZone.id)}
                                        className="px-2.5 py-1 rounded-xl text-xs font-bold bg-paper-50 hover:bg-paper-200 text-paper-900 border border-paper-300 transition flex items-center gap-1 shrink-0 cursor-pointer"
                                        title={`Quick switch to ${altZone.city}`}
                                    >
                                        <span>{getCityEmoji(altZone.city)} {altZone.city}</span>
                                    </button>
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
                        <div className="absolute top-4 left-4 z-20 max-w-[calc(100%-120px)] sm:max-w-[calc(100%-140px)] flex flex-wrap items-center gap-2">
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
                <div className="absolute top-16 left-4 z-20 max-w-[calc(100%-120px)] sm:max-w-[calc(100%-140px)] flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 select-none">
                    {DISCOVERY_CATEGORIES.map((cat) => {
                        const isActive = activeCategoryFilter === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    playChime('tap');
                                    setActiveCategoryFilter((prev) => (prev === cat.id ? 'all' : cat.id));
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-serif font-bold transition-all shadow-sm border shrink-0 cursor-pointer select-none active:scale-95 ${
                                    isActive
                                        ? `${cat.activeBg} ${cat.activeText} ${cat.borderColor} border-2 shadow-stamp font-black scale-102 ring-1 ring-white/50`
                                        : 'bg-paper-50/95 hover:bg-paper-100 text-paper-900 border-paper-400/80 hover:border-paper-900'
                                }`}
                                title={`Filter canvas to show ${cat.label}`}
                            >
                                <span className="text-sm">{cat.emoji}</span>
                                <span>{cat.label}</span>
                                {isActive && activeCategoryCount > 0 && (
                                    <span className="ml-1 text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                                        {activeCategoryCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

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
                            const nextState = !isLiveGpsActive;
                            setIsLiveGpsActive(nextState);
                            if (nextState) {
                                if (isCruiseActive) setIsCruiseActive(false);
                                const targetCoords = liveGpsCoords || userRealCoords || userCoords;
                                if (targetCoords && mapRef.current) {
                                    mapRef.current.panTo(targetCoords, { animate: true, duration: 0.6 });
                                }
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