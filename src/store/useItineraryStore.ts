import { create } from 'zustand';
import {
    AppStage,
    AppMode,
    DrawerTab,
    MapDiscoveryMode,
    TravelPlan,
    ScenicZoneKey,
    RouteTheme,
    ScenicZone,
    ItineraryDay,
    ItineraryItem,
    ExpenseCategory,
    Landmark,
} from '@/types/itinerary';
import { MASTER_ZONES, INITIAL_PLANS } from '@/lib/mockData';
import { getCityPack, findCityPackByCoords } from '@/data/cityPacks';
import { fetchPedestrianRoute } from '@/lib/routing';
import { fetchAllPlans, fetchDestinations, saveCustomSpotToDb, deleteCustomSpotFromDb, deletePlanFromDb, fetchAllCustomSpots, fetchItineraryDaysWithItems } from '@/lib/repositories';
import { supabase } from '@/lib/supabaseClient';

export interface BudgetSummary {
    estimatedTotal: number;
    actualTotal: number;
    byCategory: Record<ExpenseCategory, { estimated: number; actual: number }>;
}

export function computeBudgetFromDays(
    days: ItineraryDay[],
    totalBudgetCeiling: number
): {
    updatedDays: ItineraryDay[];
    isOverBudget: boolean;
    budgetSummary: BudgetSummary;
} {
    const byCategory: Record<ExpenseCategory, { estimated: number; actual: number }> = {
        lodging: { estimated: 0, actual: 0 },
        dining: { estimated: 0, actual: 0 },
        ticket: { estimated: 0, actual: 0 },
        transit: { estimated: 0, actual: 0 },
    };

    const updatedDays = days.map((day) => {
        let daySubtotalEstimated = 0;
        let daySubtotalActual = 0;

        (day.items || []).forEach((item) => {
            const est = Number(item.estimatedCost) || 0;
            const act = Number(item.actualCost) || 0;
            daySubtotalEstimated += est;
            daySubtotalActual += act;

            const cat = item.category in byCategory ? item.category : 'ticket';
            byCategory[cat].estimated += est;
            byCategory[cat].actual += act;
        });

        return {
            ...day,
            subtotalEstimated: daySubtotalEstimated,
            subtotalActual: daySubtotalActual,
        };
    });

    const estimatedTotal = Object.values(byCategory).reduce((acc, c) => acc + c.estimated, 0);
    const actualTotal = Object.values(byCategory).reduce((acc, c) => acc + c.actual, 0);

    const isOverBudget =
        totalBudgetCeiling > 0 &&
        (estimatedTotal > totalBudgetCeiling || actualTotal > totalBudgetCeiling);

    return {
        updatedDays,
        isOverBudget,
        budgetSummary: {
            estimatedTotal,
            actualTotal,
            byCategory,
        },
    };
}

export function synthesizeDaysForPlan(plan: TravelPlan, zone: ScenicZone): ItineraryDay[] {
    const todayStr = new Date().toISOString().split('T')[0];
    const planId = plan.id;
    const dayId = `day_1_${planId}`;

    const defaultHotels: Record<ScenicZoneKey, { name: string; notes: string; price: number; coords: [number, number] }> = {
        sha_tin_district: {
            name: 'Royal Park Hotel (帝都酒店)',
            notes: 'Riverside luxury hotel overlooking Sha Tin Central Park & Shing Mun River',
            price: 195,
            coords: [22.379756, 114.188525],
        },
        hong_kong_central: {
            name: 'Mandarin Oriental Hong Kong (香港文華東方酒店)',
            notes: 'Legendary flagship heritage hotel facing Victoria Harbour in Central',
            price: 280,
            coords: [22.2818, 114.1594],
        },
        hong_kong_tsim_sha_tsui: {
            name: 'The Peninsula Hong Kong (香港半島酒店)',
            notes: 'Grande Dame of the Far East with timeless colonial luxury on Salisbury Road',
            price: 320,
            coords: [22.2952, 114.1718],
        },
    };

    const hotel = (zone && (defaultHotels as any)[zone.id]) || (defaultHotels as any)[plan.zoneKey] || (zone ? {
        name: `${zone.name.split('•')[1]?.trim() || zone.name} Heritage Hotel`,
        notes: `Historic boutique accommodations in ${zone.name}`,
        price: 210,
        coords: zone.center,
    } : defaultHotels.sha_tin_district);

    const items: ItineraryItem[] = (plan.spotIds || []).map((sid, idx) => {
        const landmark = zone?.landmarksPool?.find((l) => l.id === sid);
        const isDining = idx === 1 || idx === 3;
        const category: ExpenseCategory = isDining ? 'dining' : 'ticket';
        const cost = isDining ? 35 : 25;
        return {
            id: `item_1_${idx}_${planId}`,
            dayId,
            planId,
            name: landmark ? landmark.name : `Stop #${idx + 1}`,
            category,
            estimatedCost: cost,
            actualCost: 0,
            location: landmark ? landmark.coords : (zone ? zone.center : [22.3812, 114.1888]),
            orderIndex: idx,
        };
    });

    const daySubtotal = hotel.price + items.reduce((acc, i) => acc + i.estimatedCost, 0);

    return [
        {
            id: dayId,
            planId,
            dayNumber: 1,
            calendarDate: todayStr,
            hotelInfo: hotel,
            subtotalEstimated: daySubtotal,
            subtotalActual: 0,
            items,
        },
    ];
}

export function getActiveDayLandmarks(
    day?: ItineraryDay,
    zone?: ScenicZone
): Landmark[] {
    if (!day) return [];

    const result: Landmark[] = [];

    // 1. Overnight Lodging (if hotelInfo coords exist and lodging not already in items)
    if (day.hotelInfo && day.hotelInfo.name && day.hotelInfo.coords) {
        const hasHotelInItems = (day.items || []).some(
            (item) => item.category === 'lodging' && item.location
        );
        if (!hasHotelInItems) {
            result.push({
                id: `hotel-${day.dayNumber}-${day.id || 'curr'}`,
                name: day.hotelInfo.name,
                category: 'landmark',
                color: '#5c6ac4',
                coords: day.hotelInfo.coords,
                svgSnippet: `
                    <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
                        <rect x="15" y="15" width="70" height="70" rx="20" fill="#5c6ac4" stroke="#2b261b" stroke-width="3"/>
                        <text x="50" y="58" font-size="34" text-anchor="middle">🏨</text>
                    </svg>
                `,
                tag: 'LODGING',
                desc: day.hotelInfo.notes || `Overnight stay for Day ${day.dayNumber}.`,
                audioNote: `Your lodging for Day ${day.dayNumber}: ${day.hotelInfo.name}.`,
                panoUrl: '',
                tips: `Lodging: ${day.hotelInfo.name}`,
            });
        }
    }

    // 2. Day itinerary items with coordinates
    const categoryColorMap: Record<ExpenseCategory, string> = {
        lodging: '#5c6ac4',
        dining: '#e06d53',
        ticket: '#407958',
        transit: '#f4c568',
    };

    const categoryIconMap: Record<ExpenseCategory, string> = {
        lodging: '🏨',
        dining: '🍽️',
        ticket: '🏛️',
        transit: '🚇',
    };

    const categoryDomainMap: Record<ExpenseCategory, Landmark['category']> = {
        lodging: 'landmark',
        dining: 'craft',
        ticket: 'culture',
        transit: 'history',
    };

    (day.items || []).forEach((item, idx) => {
        let coords: [number, number] | undefined = item.location;
        if (!coords && item.category === 'lodging' && day.hotelInfo?.coords) {
            coords = day.hotelInfo.coords;
        }
        if (
            !coords ||
            !Array.isArray(coords) ||
            coords.length !== 2 ||
            typeof coords[0] !== 'number' ||
            typeof coords[1] !== 'number'
        ) {
            return;
        }

        const matchedLandmark = zone?.landmarksPool.find(
            (l) => l.name.toLowerCase() === item.name.toLowerCase()
        );

        const color = categoryColorMap[item.category] || '#c14937';
        const emoji = categoryIconMap[item.category] || '📍';

        const svgSnippet =
            matchedLandmark?.svgSnippet ||
            `
            <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
                <rect x="15" y="15" width="70" height="70" rx="20" fill="${color}" stroke="#2b261b" stroke-width="3"/>
                <text x="50" y="58" font-size="34" text-anchor="middle">${emoji}</text>
            </svg>
        `;

        result.push({
            id: item.id,
            name: item.name,
            category: matchedLandmark?.category || categoryDomainMap[item.category] || 'landmark',
            color: matchedLandmark?.color || color,
            coords: coords,
            svgSnippet,
            tag: item.category.toUpperCase(),
            desc: `Estimated: $${item.estimatedCost}${item.actualCost > 0 ? ` · Actual: $${item.actualCost}` : ''}`,
            audioNote: `Stop #${idx + 1}: ${item.name}.`,
            panoUrl: matchedLandmark?.panoUrl || '',
            tips: `Day ${day.dayNumber} · ${item.category}`,
        });
    });

    return result;
}

interface ItineraryState {
    appMode: AppMode;
    currentStage: AppStage;
    activePlanId: string;
    savedPlans: TravelPlan[];
    zones: Record<string, ScenicZone>;
    isLoadingDb: boolean;

    plannerBuffer: {
        title: string;
        zoneKey: ScenicZoneKey;
        spotIds: string[];
    };

    // Map discovery & drawer tab state
    mapDiscoveryMode: MapDiscoveryMode;
    drawerTab: DrawerTab;
    userRealCoords: [number, number] | null;

    // Last viewed map viewport & zone persistence
    lastMapCenter: [number, number] | null;
    lastMapZoom: number | null;
    lastMapZoneKey: string | null;
    setLastMapViewport: (center: [number, number], zoom: number, zoneKey?: string) => void;

    // Multi-day itinerary & budget state
    selectedTripViewId: string | null;
    daysCacheByPlanId: Record<string, ItineraryDay[]>;
    budgetCeilingByPlanId: Record<string, number>;
    currentItineraryDays: ItineraryDay[];
    activeDayNumber: number;
    totalBudgetCeiling: number;
    isOverBudget: boolean;
    budgetSummary: BudgetSummary;
    isTripModalOpen: boolean;

    // Actions
    initializeFromDatabase: () => Promise<void>;
    setAppMode: (mode: AppMode) => void;
    setStage: (stage: AppStage) => void;
    setActivePlanId: (id: string) => void;
    setMapDiscoveryMode: (mode: MapDiscoveryMode) => void;
    setDrawerTab: (tab: DrawerTab) => void;
    setUserRealCoords: (coords: [number, number] | null) => void;
    addStopToRouteBuffer: (landmarkId: string) => void;
    clearPlannerStops: () => void;
    launchItineraryOnMap: (planId?: string) => void;
    launchAmbientDiscoveryOnMap: (zoneKey?: ScenicZoneKey) => void;
    setSelectedTripViewId: (planId: string | null) => void;
    selectTripForDetail: (planId: string) => Promise<void>;
    createQuickExcursion: (zoneKey?: ScenicZoneKey, customTitle?: string) => Promise<string>;
    turnPlannerRouteIntoExcursion: () => Promise<string>;
    createTripWithDays: (
        planData: Partial<TravelPlan>,
        days: ItineraryDay[],
        totalBudget?: number
    ) => Promise<string>;
    setTripModalOpen: (open: boolean) => void;
    updatePlannerZone: (zoneKey: ScenicZoneKey) => void;
    jumpToCity: (cityData: { name: string; city: string; coords: [number, number]; bounds?: [[number, number], [number, number]] }) => string;
    reorderPlannerStops: (fromIdx: number, toIdx: number) => void;
    removePlannerStop: (idx: number) => void;
    addPlannerCustomStop: (
        name: string,
        coords: [number, number],
        address?: string,
        addToRoute?: boolean
    ) => Promise<string>;
    deletedPersonalSpotIds: string[];
    deletePersonalSpot: (spotId: string) => Promise<void>;
    savePlannerAsNewPlan: () => Promise<string>;
    updateActivePlanTheme: (theme: RouteTheme) => Promise<void>;
    updatePlanTitle: (planId: string, title: string) => Promise<void>;
    deletePlan: (planId: string) => Promise<void>;

    // Multi-day itinerary & budget actions
    setItineraryDays: (days: ItineraryDay[], totalBudget?: number) => void;
    setActiveDay: (dayNumber: number) => void;
    addItineraryItem: (
        dayNumber: number,
        item: Omit<ItineraryItem, 'id' | 'dayId' | 'planId'>
    ) => void;
    removeItineraryItem: (itemId: string) => void;
    updateItemCost: (
        itemId: string,
        estimatedCost?: number,
        actualCost?: number,
        category?: ExpenseCategory
    ) => void;
    swapItineraryItem: (
        dayNumber: number,
        oldItemId: string,
        replacement: {
            name: string;
            estimatedCost: number;
            category?: ExpenseCategory;
            location?: [number, number];
        }
    ) => void;
    updateDayHotel: (
        dayNumber: number,
        hotel: {
            name: string;
            price: number;
            notes?: string;
            coords?: [number, number];
        }
    ) => void;
    recalculateBudget: () => void;
}

let initialMapCenter: [number, number] | null = null;
let initialMapZoom: number | null = null;
let initialMapZoneKey: string | null = null;
let initialCustomZones: Record<string, ScenicZone> = {};

if (typeof window !== 'undefined') {
    try {
        const rawCenter = localStorage.getItem('wandersketch_last_map_center');
        if (rawCenter) initialMapCenter = JSON.parse(rawCenter);
        const rawZoom = localStorage.getItem('wandersketch_last_map_zoom');
        if (rawZoom) initialMapZoom = Number(rawZoom);
        const rawZoneKey = localStorage.getItem('wandersketch_last_map_zone_key');
        if (rawZoneKey) initialMapZoneKey = rawZoneKey;
        const rawCustomZones = localStorage.getItem('wandersketch_custom_zones');
        if (rawCustomZones) initialCustomZones = JSON.parse(rawCustomZones);
    } catch {}
}

export const useItineraryStore = create<ItineraryState>()((set, get) => ({
    appMode: 'planning',
    currentStage: 'plans',
    activePlanId: INITIAL_PLANS[0].id,
    savedPlans: INITIAL_PLANS,
    zones: { ...MASTER_ZONES, ...initialCustomZones },
    isLoadingDb: false,
    isTripModalOpen: false,

    plannerBuffer: {
        title: 'Custom Walking Route',
        zoneKey: (initialMapZoneKey as ScenicZoneKey) || 'sha_tin_district',
        spotIds: [],
    },

    // Map discovery & drawer tab initial state
    mapDiscoveryMode: 'ambient',
    drawerTab: 'curator',
    userRealCoords: null,
    deletedPersonalSpotIds: [],

    // Viewport persistence initial state
    lastMapCenter: initialMapCenter,
    lastMapZoom: initialMapZoom,
    lastMapZoneKey: initialMapZoneKey,

    setLastMapViewport: (center, zoom, zoneKey) => {
        set((state) => ({
            lastMapCenter: center,
            lastMapZoom: zoom,
            lastMapZoneKey: zoneKey || state.lastMapZoneKey,
        }));
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('wandersketch_last_map_center', JSON.stringify(center));
                localStorage.setItem('wandersketch_last_map_zoom', String(zoom));
                if (zoneKey) {
                    localStorage.setItem('wandersketch_last_map_zone_key', zoneKey);
                }
            } catch {}
        }
    },

    // Multi-day itinerary & budget initial state
    selectedTripViewId: null,
    daysCacheByPlanId: {},
    budgetCeilingByPlanId: {},
    currentItineraryDays: [],
    activeDayNumber: 1,
    totalBudgetCeiling: 0,
    isOverBudget: false,
    budgetSummary: {
        estimatedTotal: 0,
        actualTotal: 0,
        byCategory: {
            lodging: { estimated: 0, actual: 0 },
            dining: { estimated: 0, actual: 0 },
            ticket: { estimated: 0, actual: 0 },
            transit: { estimated: 0, actual: 0 },
        },
    },

    setTripModalOpen: (open) => set({ isTripModalOpen: open }),

    initializeFromDatabase: async () => {
        set({ isLoadingDb: true });
        try {
            const [dbPlans, dbDestinations, dbCustomSpots] = await Promise.all([
                fetchAllPlans(),
                fetchDestinations(),
                fetchAllCustomSpots(),
            ]);

            let deletedIds: string[] = [];
            let savedSpotIds: string[] = [];
            if (typeof window !== 'undefined') {
                try {
                    const rawDel = localStorage.getItem('wandersketch_deleted_spot_ids');
                    if (rawDel) deletedIds = JSON.parse(rawDel);
                    const rawSaved = localStorage.getItem('wandersketch_saved_personal_spot_ids');
                    if (rawSaved) savedSpotIds = JSON.parse(rawSaved);
                } catch {}
            }
            let savedCustomZones: Record<string, ScenicZone> = {};
            if (typeof window !== 'undefined') {
                try {
                    const rawCustom = localStorage.getItem('wandersketch_custom_zones');
                    if (rawCustom) savedCustomZones = JSON.parse(rawCustom);
                } catch {}
            }
            const deletedSet = new Set(deletedIds);
            const savedSpotSet = new Set(savedSpotIds);
            // Only hydrate custom spots that the user explicitly saved in their browser session!
            const activeCustomSpots = dbCustomSpots.filter(
                (cs) => !deletedSet.has(cs.id) && savedSpotSet.has(cs.id)
            );

            set((state) => {
                const updatedZones = { ...state.zones, ...savedCustomZones };
                // 1. Merge destinations from DB
                dbDestinations.forEach((dest) => {
                    if (updatedZones[dest.id]) {
                        updatedZones[dest.id] = {
                            ...updatedZones[dest.id],
                            ...dest,
                            landmarksPool: updatedZones[dest.id].landmarksPool,
                        };
                    }
                });

                // Ensure all default master zones and their landmarks are fully preserved
                Object.keys(MASTER_ZONES).forEach((k) => {
                    if (!updatedZones[k] || !updatedZones[k].landmarksPool || updatedZones[k].landmarksPool.length === 0) {
                        updatedZones[k] = MASTER_ZONES[k];
                    } else {
                        // Merge in any missing master landmarks (e.g. from CityPacks)
                        const masterPool = MASTER_ZONES[k]?.landmarksPool || [];
                        if (masterPool.length > 0) {
                            const curPool = updatedZones[k].landmarksPool || [];
                            const curMap = new Map(curPool.map((l) => [l.id, l]));
                            for (const l of masterPool) {
                                if (!curMap.has(l.id)) {
                                    curMap.set(l.id, l);
                                }
                            }
                            updatedZones[k].landmarksPool = Array.from(curMap.values());
                        }
                    }
                });

                // Helper to check if coords are near a zone
                const isSpotInZone = (spotCoords: [number, number], zone: ScenicZone) => {
                    if (zone.bounds) {
                        const [[minLat, minLng], [maxLat, maxLng]] = zone.bounds;
                        if (
                            spotCoords[0] >= minLat - 0.05 &&
                            spotCoords[0] <= maxLat + 0.05 &&
                            spotCoords[1] >= minLng - 0.05 &&
                            spotCoords[1] <= maxLng + 0.05
                        ) {
                            return true;
                        }
                    }
                    if (zone.center) {
                        const dLat = Math.abs(spotCoords[0] - zone.center[0]);
                        const dLng = Math.abs(spotCoords[1] - zone.center[1]);
                        return dLat < 0.25 && dLng < 0.25; // ~25km
                    }
                    return false;
                };

                // 2. Safely distribute custom spots to their respective zones
                activeCustomSpots.forEach((cs) => {
                    let targetKey = cs.destinationId && updatedZones[cs.destinationId] ? cs.destinationId : null;
                    if (!targetKey) {
                        for (const key of Object.keys(updatedZones)) {
                            if (isSpotInZone(cs.coords, updatedZones[key])) {
                                targetKey = key;
                                break;
                            }
                        }
                    }
                    if (targetKey && updatedZones[targetKey]) {
                        const basePool = updatedZones[targetKey].landmarksPool || [];
                        if (!basePool.some((l) => l.id === cs.id)) {
                            updatedZones[targetKey] = {
                                ...updatedZones[targetKey],
                                landmarksPool: [...basePool, cs],
                            };
                        }
                    }
                });

                return {
                    savedPlans: dbPlans.length > 0 ? dbPlans : state.savedPlans,
                    activePlanId: dbPlans.length > 0 ? dbPlans[0].id : state.activePlanId,
                    zones: updatedZones,
                    isLoadingDb: false,
                };
            });
        } catch (err) {
            console.warn('Could not load from Supabase, using fallback data:', err);
            set({ isLoadingDb: false });
        }
    },

    setAppMode: (mode) => {
        if (mode === 'on-trip') {
            set({ appMode: mode, currentStage: 'map' });
        } else {
            set({ appMode: mode });
        }
    },
    setStage: (stage) => {
        if (stage === 'planner' || stage === 'plans') {
            set({ currentStage: stage, appMode: 'planning' });
        } else {
            set({ currentStage: stage });
        }
    },
    setActivePlanId: (id) => set({ activePlanId: id }),
    setMapDiscoveryMode: (mode) => set({ mapDiscoveryMode: mode }),
    setDrawerTab: (tab) => set({ drawerTab: tab }),
    setUserRealCoords: (coords) => set({ userRealCoords: coords }),
    addStopToRouteBuffer: (landmarkId) => {
        const { plannerBuffer } = get();
        if (plannerBuffer.spotIds.includes(landmarkId)) return;
        set({
            plannerBuffer: {
                ...plannerBuffer,
                spotIds: [...plannerBuffer.spotIds, landmarkId],
            },
            drawerTab: 'curator',
        });
    },
    clearPlannerStops: () => {
        const { plannerBuffer } = get();
        set({
            plannerBuffer: {
                ...plannerBuffer,
                spotIds: [],
            },
        });
    },
    launchItineraryOnMap: (planId) => {
        if (planId) {
            const plan = get().savedPlans.find((p) => p.id === planId);
            const targetZoneKey = plan?.zoneKey || 'sha_tin_district';
            const targetZone = get().zones[targetZoneKey] || MASTER_ZONES[targetZoneKey];
            set({
                activePlanId: planId,
                currentStage: 'map',
                mapDiscoveryMode: 'itinerary',
                drawerTab: 'guide',
                lastMapCenter: targetZone?.center || null,
                lastMapZoom: targetZone?.zoom || 15,
                lastMapZoneKey: targetZoneKey,
            });
            if (targetZone?.center && typeof window !== 'undefined') {
                try {
                    localStorage.setItem('wandersketch_last_map_center', JSON.stringify(targetZone.center));
                    localStorage.setItem('wandersketch_last_map_zoom', String(targetZone.zoom || 15));
                    localStorage.setItem('wandersketch_last_map_zone_key', targetZoneKey);
                } catch {}
            }
        } else {
            set({
                currentStage: 'map',
                mapDiscoveryMode: 'itinerary',
                drawerTab: 'guide',
            });
        }
    },
    launchAmbientDiscoveryOnMap: (zoneKey) => {
        if (zoneKey) {
            get().updatePlannerZone(zoneKey);
            const targetZone = get().zones[zoneKey] || MASTER_ZONES[zoneKey];
            set({
                currentStage: 'map',
                mapDiscoveryMode: 'ambient',
                drawerTab: 'curator',
                lastMapCenter: targetZone?.center || null,
                lastMapZoom: targetZone?.zoom || 15,
                lastMapZoneKey: zoneKey,
            });
            if (targetZone?.center && typeof window !== 'undefined') {
                try {
                    localStorage.setItem('wandersketch_last_map_center', JSON.stringify(targetZone.center));
                    localStorage.setItem('wandersketch_last_map_zoom', String(targetZone.zoom || 15));
                    localStorage.setItem('wandersketch_last_map_zone_key', zoneKey);
                } catch {}
            }
        } else {
            set({
                currentStage: 'map',
                mapDiscoveryMode: 'ambient',
                drawerTab: 'curator',
            });
        }
    },

    setSelectedTripViewId: (planId) => set({ selectedTripViewId: planId }),

    selectTripForDetail: async (planId) => {
        const { savedPlans, zones, daysCacheByPlanId, budgetCeilingByPlanId } = get();
        const plan = savedPlans.find((p) => p.id === planId) || savedPlans[0];
        if (!plan) return;

        const zone = zones[plan.zoneKey] || MASTER_ZONES[plan.zoneKey] || MASTER_ZONES.sha_tin_district;

        // Check cache first
        let days = daysCacheByPlanId[planId];
        let ceiling = budgetCeilingByPlanId[planId] || plan.totalBudget || 0;

        if (!days || days.length === 0) {
            try {
                const dbDays = await fetchItineraryDaysWithItems(planId);
                if (dbDays && dbDays.length > 0) {
                    days = dbDays;
                }
            } catch (e) {
                console.warn('Could not fetch days from DB for plan:', planId, e);
            }
        }

        if (!days || days.length === 0) {
            days = synthesizeDaysForPlan(plan, zone);
            if (ceiling === 0) {
                ceiling = days.reduce((acc, d) => acc + d.subtotalEstimated, 0);
            }
        }

        const { updatedDays, isOverBudget, budgetSummary } = computeBudgetFromDays(days, ceiling);

        set({
            activePlanId: planId,
            selectedTripViewId: planId,
            currentItineraryDays: updatedDays,
            totalBudgetCeiling: ceiling,
            isOverBudget,
            budgetSummary,
            activeDayNumber: 1,
            currentStage: 'plans',
            daysCacheByPlanId: {
                ...get().daysCacheByPlanId,
                [planId]: updatedDays,
            },
            budgetCeilingByPlanId: {
                ...get().budgetCeilingByPlanId,
                [planId]: ceiling,
            },
        });
    },

    createQuickExcursion: async (zoneKey = 'sha_tin_district', customTitle) => {
        const { zones } = get();
        const zone = zones[zoneKey] || MASTER_ZONES[zoneKey] || MASTER_ZONES.sha_tin_district;
        const newId = `excursion_${Date.now()}`;
        const todayStr = new Date().toISOString().split('T')[0];

        const spotIds = zone.landmarksPool.slice(0, 4).map((l) => l.id);
        const stopCoords = spotIds
            .map((sid) => zone.landmarksPool.find((l) => l.id === sid)?.coords)
            .filter(Boolean) as [number, number][];

        const routeData = await fetchPedestrianRoute(stopCoords);
        const title = customTitle || `${zone.name.split(' ')[0]} ${zone.city} 1-Day Excursion`;

        const newPlan: TravelPlan = {
            id: newId,
            title,
            zoneKey: zone.id as ScenicZoneKey,
            createdAt: todayStr,
            tag: '1-Day Excursion',
            estimatedDistance: `${routeData.distanceKm} km`,
            estimatedDuration: `${routeData.durationMinutes} mins`,
            activeRouteKey: 'classic',
            spotIds,
            themeRoutes: {
                classic: spotIds,
                culture: spotIds.slice(0, 3),
                rain: spotIds.slice(0, 2),
            },
            isExcursion: true,
            daysCount: 1,
            totalBudget: 350,
        };

        const days = synthesizeDaysForPlan(newPlan, zone);
        const ceiling = 350;
        const { updatedDays, isOverBudget, budgetSummary } = computeBudgetFromDays(days, ceiling);

        set((state) => ({
            savedPlans: [newPlan, ...state.savedPlans],
            activePlanId: newId,
            selectedTripViewId: newId,
            currentItineraryDays: updatedDays,
            totalBudgetCeiling: ceiling,
            isOverBudget,
            budgetSummary,
            activeDayNumber: 1,
            currentStage: 'plans',
            daysCacheByPlanId: {
                ...state.daysCacheByPlanId,
                [newId]: updatedDays,
            },
            budgetCeilingByPlanId: {
                ...state.budgetCeilingByPlanId,
                [newId]: ceiling,
            },
        }));

        try {
            await supabase.from('travel_plans').insert({
                id: newPlan.id,
                title: newPlan.title,
                destination_id: newPlan.zoneKey,
                tag: newPlan.tag,
                estimated_distance: newPlan.estimatedDistance,
                estimated_duration: newPlan.estimatedDuration,
                active_route_key: newPlan.activeRouteKey,
                spot_ids: newPlan.spotIds,
                theme_routes: newPlan.themeRoutes,
            });
        } catch (err) {
            console.warn('Could not sync excursion to Supabase:', err);
        }

        return newId;
    },

    turnPlannerRouteIntoExcursion: async () => {
        const { plannerBuffer, zones } = get();
        const zone = zones[plannerBuffer.zoneKey] || MASTER_ZONES[plannerBuffer.zoneKey];
        const newId = `excursion_${Date.now()}`;
        const todayStr = new Date().toISOString().split('T')[0];

        const stopCoords = plannerBuffer.spotIds
            .map((sid) => zone.landmarksPool.find((l) => l.id === sid)?.coords)
            .filter(Boolean) as [number, number][];

        const routeData = await fetchPedestrianRoute(stopCoords);
        const title = `${plannerBuffer.title || zone.name} 1-Day Excursion`;

        const newPlan: TravelPlan = {
            id: newId,
            title,
            zoneKey: plannerBuffer.zoneKey,
            createdAt: todayStr,
            tag: '1-Day Excursion',
            estimatedDistance: `${routeData.distanceKm} km`,
            estimatedDuration: `${routeData.durationMinutes} mins`,
            activeRouteKey: 'classic',
            spotIds: [...plannerBuffer.spotIds],
            themeRoutes: {
                classic: [...plannerBuffer.spotIds],
                culture: plannerBuffer.spotIds.slice(0, 3),
                rain: plannerBuffer.spotIds.slice(0, 2),
            },
            isExcursion: true,
            daysCount: 1,
            totalBudget: 400,
        };

        const days = synthesizeDaysForPlan(newPlan, zone);
        const ceiling = 400;
        const { updatedDays, isOverBudget, budgetSummary } = computeBudgetFromDays(days, ceiling);

        set((state) => ({
            savedPlans: [newPlan, ...state.savedPlans],
            activePlanId: newId,
            selectedTripViewId: newId,
            currentItineraryDays: updatedDays,
            totalBudgetCeiling: ceiling,
            isOverBudget,
            budgetSummary,
            activeDayNumber: 1,
            currentStage: 'plans',
            daysCacheByPlanId: {
                ...state.daysCacheByPlanId,
                [newId]: updatedDays,
            },
            budgetCeilingByPlanId: {
                ...state.budgetCeilingByPlanId,
                [newId]: ceiling,
            },
        }));

        try {
            await supabase.from('travel_plans').insert({
                id: newPlan.id,
                title: newPlan.title,
                destination_id: newPlan.zoneKey,
                tag: newPlan.tag,
                estimated_distance: newPlan.estimatedDistance,
                estimated_duration: newPlan.estimatedDuration,
                active_route_key: newPlan.activeRouteKey,
                spot_ids: newPlan.spotIds,
                theme_routes: newPlan.themeRoutes,
            });
        } catch (err) {
            console.warn('Could not sync excursion to Supabase:', err);
        }

        return newId;
    },

    createTripWithDays: async (planData, days, totalBudget) => {
        const { zones } = get();
        const planId = planData.id || `trip_${Date.now()}`;
        const zoneKey = planData.zoneKey || 'sha_tin_district';
        const zone = zones[zoneKey] || MASTER_ZONES[zoneKey] || MASTER_ZONES.sha_tin_district;
        const ceiling = totalBudget ?? 1500;

        const spotIds = planData.spotIds || (zone?.landmarksPool ? zone.landmarksPool.slice(0, 4).map((l) => l.id) : []);

        const newPlan: TravelPlan = {
            id: planId,
            title: planData.title || `${zone.city} ${days.length}-Day Journey`,
            zoneKey,
            createdAt: new Date().toISOString().split('T')[0],
            tag: planData.tag || `${days.length} Days`,
            estimatedDistance: `${(days.length * 2.8).toFixed(1)} km`,
            estimatedDuration: `${days.length} days`,
            activeRouteKey: 'classic',
            spotIds,
            themeRoutes: {
                classic: spotIds,
                culture: spotIds.slice(0, 3),
                rain: spotIds.slice(0, 2),
            },
            isExcursion: days.length === 1,
            daysCount: days.length,
            totalBudget: ceiling,
        };

        const { updatedDays, isOverBudget, budgetSummary } = computeBudgetFromDays(days, ceiling);

        set((state) => ({
            savedPlans: [newPlan, ...state.savedPlans],
            activePlanId: planId,
            selectedTripViewId: planId,
            currentItineraryDays: updatedDays,
            totalBudgetCeiling: ceiling,
            isOverBudget,
            budgetSummary,
            activeDayNumber: 1,
            currentStage: 'plans',
            daysCacheByPlanId: {
                ...state.daysCacheByPlanId,
                [planId]: updatedDays,
            },
            budgetCeilingByPlanId: {
                ...state.budgetCeilingByPlanId,
                [planId]: ceiling,
            },
        }));

        try {
            await supabase.from('travel_plans').insert({
                id: newPlan.id,
                title: newPlan.title,
                destination_id: newPlan.zoneKey,
                tag: newPlan.tag,
                estimated_distance: newPlan.estimatedDistance,
                estimated_duration: newPlan.estimatedDuration,
                active_route_key: newPlan.activeRouteKey,
                spot_ids: newPlan.spotIds,
                theme_routes: newPlan.themeRoutes,
            });
        } catch (err) {
            console.warn('Could not sync trip plan to Supabase:', err);
        }

        return planId;
    },

    updatePlannerZone: (zoneKey) => {
        const zone = get().zones[zoneKey] || MASTER_ZONES[zoneKey];
        if (!zone) return;
        const isAmbient = get().mapDiscoveryMode === 'ambient';
        // Authentic curated landmarks only; NEVER auto-pick personal spots as default route stops!
        const defaultStops = (zone.landmarksPool || [])
            .filter((l) => !l.isCustom && l.tag !== 'Personal Spot' && !l.id.startsWith('custom-'))
            .slice(0, 4)
            .map((l) => l.id);
        set({
            plannerBuffer: {
                title: `Explore ${zone.name}`,
                zoneKey,
                spotIds: isAmbient ? [] : defaultStops,
            },
        });
    },

    jumpToCity: (cityData) => {
        const [lat, lng] = cityData.coords;
        const baseSlug = `dest_${cityData.city.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
        const currentZones = get().zones;

        // 1. Look up any preloaded City Pack (instant in-memory hit)
        const pack = getCityPack(cityData.city) || getCityPack(baseSlug) || findCityPackByCoords(lat, lng);

        // Check if a zone for this city already exists (by slug or city name)
        const existingKey = Object.keys(currentZones).find(
            (k) =>
                k === baseSlug ||
                (pack && k === pack.id) ||
                currentZones[k]?.city.toLowerCase() === cityData.city.toLowerCase() ||
                (cityData.city.length > 4 && currentZones[k]?.city.toLowerCase().includes(cityData.city.toLowerCase()))
        );

        if (existingKey) {
            const existingZone = currentZones[existingKey];
            const sanitizedFacilities = (existingZone.facilities || []).filter(
                (f) =>
                    !f.name.toLowerCase().includes('artisan cafe') &&
                    !f.name.toLowerCase().includes('visitor information') &&
                    !f.name.toLowerCase().includes('public restroom facilities') &&
                    !f.name.toLowerCase().includes('scenic photography spot')
            );
            const isAmbient = get().mapDiscoveryMode === 'ambient';
            const masterFallback = MASTER_ZONES[existingKey] || (pack ? { landmarksPool: pack.landmarks } : null);
            let landmarksPool = existingZone.landmarksPool || [];
            if (pack && pack.landmarks.length > 0) {
                const poolMap = new Map(landmarksPool.map((l) => [l.id, l]));
                for (const l of pack.landmarks) {
                    if (!poolMap.has(l.id)) {
                        poolMap.set(l.id, l);
                    }
                }
                landmarksPool = Array.from(poolMap.values());
            } else if (landmarksPool.length === 0 && masterFallback?.landmarksPool) {
                landmarksPool = masterFallback.landmarksPool;
            }
            const targetCenter = (pack && pack.center) || existingZone.center;
            const targetZoom = (pack && pack.zoom) || existingZone.zoom || 15;
            set((state) => ({
                zones: {
                    ...state.zones,
                    [existingKey]: {
                        ...existingZone,
                        landmarksPool,
                        facilities: sanitizedFacilities.length > 0 ? sanitizedFacilities : (pack ? pack.facilities : []),
                    },
                },
                plannerBuffer: {
                    ...state.plannerBuffer,
                    title: `Explore ${existingZone.name}`,
                    zoneKey: existingKey,
                    spotIds: isAmbient ? [] : state.plannerBuffer.spotIds,
                },
                lastMapZoneKey: existingKey,
                lastMapCenter: targetCenter,
                lastMapZoom: targetZoom,
            }));
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('wandersketch_last_map_center', JSON.stringify(targetCenter));
                    localStorage.setItem('wandersketch_last_map_zoom', String(targetZoom));
                    localStorage.setItem('wandersketch_last_map_zone_key', existingKey);
                } catch {}
            }
            return existingKey;
        }

        const delta = 0.025;
        const bounds: [[number, number], [number, number]] = (pack && pack.bounds) || cityData.bounds || [
            [lat - delta, lng - delta],
            [lat + delta, lng + delta],
        ];

        const targetId = pack ? pack.id : baseSlug;
        const newZone: ScenicZone = {
            id: targetId,
            name: (pack && pack.districtName) || cityData.name || `${cityData.city} Exploration`,
            city: (pack && pack.cityName) || cityData.city || 'Custom Destination',
            center: (pack && pack.center) || cityData.coords,
            zoom: (pack && pack.zoom) || 15,
            userOrigin: (pack && pack.userOrigin) || cityData.coords,
            bounds,
            facilities: (pack ? pack.facilities : []).filter(
                (f) =>
                    !f.name.toLowerCase().includes('artisan cafe') &&
                    !f.name.toLowerCase().includes('visitor information') &&
                    !f.name.toLowerCase().includes('public restroom facilities') &&
                    !f.name.toLowerCase().includes('scenic photography spot')
            ),
            landmarksPool: pack ? pack.landmarks : [],
        };

        set((state) => {
            const updatedZones = {
                ...state.zones,
                [baseSlug]: newZone,
            };
            if (typeof window !== 'undefined') {
                try {
                    const customZones = JSON.parse(localStorage.getItem('wandersketch_custom_zones') || '{}');
                    customZones[baseSlug] = newZone;
                    localStorage.setItem('wandersketch_custom_zones', JSON.stringify(customZones));
                    localStorage.setItem('wandersketch_last_map_center', JSON.stringify(newZone.center));
                    localStorage.setItem('wandersketch_last_map_zoom', String(newZone.zoom || 15));
                    localStorage.setItem('wandersketch_last_map_zone_key', baseSlug);
                } catch {}
            }
            return {
                zones: updatedZones,
                plannerBuffer: {
                    title: `Explore ${newZone.name}`,
                    zoneKey: baseSlug,
                    spotIds: [],
                },
                lastMapZoneKey: baseSlug,
                lastMapCenter: newZone.center,
                lastMapZoom: newZone.zoom || 15,
            };
        });

        return baseSlug;
    },

    reorderPlannerStops: (fromIdx, toIdx) => {
        const { spotIds } = get().plannerBuffer;
        if (toIdx < 0 || toIdx >= spotIds.length) return;
        const updated = [...spotIds];
        const [moved] = updated.splice(fromIdx, 1);
        updated.splice(toIdx, 0, moved);
        set((state) => ({ plannerBuffer: { ...state.plannerBuffer, spotIds: updated } }));
    },

    removePlannerStop: (idx) => {
        const { spotIds } = get().plannerBuffer;
        set((state) => ({
            plannerBuffer: {
                ...state.plannerBuffer,
                spotIds: spotIds.filter((_, i) => i !== idx),
            },
        }));
    },

    addPlannerCustomStop: async (name, coords, address, addToRoute: boolean = false) => {
        const { zoneKey, spotIds } = get().plannerBuffer;
        const zone = get().zones[zoneKey] || MASTER_ZONES[zoneKey];
        if (!zone) return '';

        // Check if an existing curated landmark matches
        const existing = zone.landmarksPool.find(
            (l) =>
                l.name.toLowerCase() === name.toLowerCase() ||
                (Math.abs(l.coords[0] - coords[0]) < 0.0005 && Math.abs(l.coords[1] - coords[1]) < 0.0005)
        );

        if (existing) {
            if (addToRoute && !spotIds.includes(existing.id)) {
                set((state) => ({
                    plannerBuffer: { ...state.plannerBuffer, spotIds: [...spotIds, existing.id] },
                }));
            }
            return existing.id;
        }

        const newId = `custom-${Date.now()}`;
        const newLandmark: Landmark = {
            id: newId,
            destinationId: zoneKey,
            name,
            category: 'craft',
            color: '#f4c568',
            coords: coords,
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">⭐</text>
        </svg>
      `,
            tag: 'Personal Spot',
            desc: address || `Custom stop added by user: ${name}.`,
            audioNote: `You have arrived at your custom stop: ${name}.`,
            panoUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
            tips: 'Personal Spot saved by user',
            isCustom: true,
        };

        // If this ID was previously marked deleted, unmark it; and add to saved list in localStorage
        const currentDeleted = get().deletedPersonalSpotIds || [];
        const updatedDeleted = currentDeleted.filter((id) => id !== newId);
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('wandersketch_deleted_spot_ids', JSON.stringify(updatedDeleted));
                const rawSaved = localStorage.getItem('wandersketch_saved_personal_spot_ids');
                const savedList: string[] = rawSaved ? JSON.parse(rawSaved) : [];
                if (!savedList.includes(newId)) {
                    localStorage.setItem(
                        'wandersketch_saved_personal_spot_ids',
                        JSON.stringify([...savedList, newId])
                    );
                }
            } catch {}
        }

        // Update in-memory pool and bounds for the active session immutably
        const currentPool = zone.landmarksPool || [];
        const updatedPool = [...currentPool.filter((l) => l.id !== newId), newLandmark];
        let updatedBounds = zone.bounds;
        if (zone.bounds) {
            const [[minLat, minLng], [maxLat, maxLng]] = zone.bounds;
            updatedBounds = [
                [Math.min(minLat, coords[0] - 0.005), Math.min(minLng, coords[1] - 0.005)],
                [Math.max(maxLat, coords[0] + 0.005), Math.max(maxLng, coords[1] + 0.005)],
            ];
        }

        const updatedZone: ScenicZone = {
            ...zone,
            landmarksPool: updatedPool,
            bounds: updatedBounds,
        };

        const updatedZones = {
            ...get().zones,
            [zoneKey]: updatedZone,
        };

        set((state) => ({
            deletedPersonalSpotIds: updatedDeleted,
            zones: updatedZones,
            plannerBuffer: {
                ...state.plannerBuffer,
                spotIds: addToRoute ? [...spotIds, newId] : spotIds,
            },
        }));

        // Async sync to Supabase custom_spots table
        try {
            await saveCustomSpotToDb({
                id: newId,
                destinationId: zoneKey,
                name,
                category: 'craft',
                color: '#f4c568',
                coords,
                address,
                tag: 'Personal Spot',
                description: address,
                audioNote: `You have arrived at ${name}.`,
            });
        } catch (err) {
            console.warn('Could not sync custom spot to database:', err);
        }

        return newId;
    },

    deletePersonalSpot: async (spotId: string) => {
        const { zones, plannerBuffer, savedPlans, deletedPersonalSpotIds } = get();

        // 1. Remove from plannerBuffer.spotIds
        const updatedSpotIds = plannerBuffer.spotIds.filter((id) => id !== spotId);

        // 2. Remove from all zones' landmarksPool
        const updatedZones = { ...zones };
        for (const key of Object.keys(updatedZones)) {
            const z = updatedZones[key];
            if (z && z.landmarksPool) {
                updatedZones[key] = {
                    ...z,
                    landmarksPool: z.landmarksPool.filter((l) => l.id !== spotId),
                };
            }
        }

        // 3. Remove from saved plans if present
        const updatedPlans = savedPlans.map((p) => {
            if (p.spotIds.includes(spotId)) {
                return {
                    ...p,
                    spotIds: p.spotIds.filter((id) => id !== spotId),
                };
            }
            return p;
        });

        // 4. Mark in persistent deleted spot IDs and remove from saved personal spots
        const updatedDeleted = Array.from(new Set([...(deletedPersonalSpotIds || []), spotId]));
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('wandersketch_deleted_spot_ids', JSON.stringify(updatedDeleted));
                const rawSaved = localStorage.getItem('wandersketch_saved_personal_spot_ids');
                const savedList: string[] = rawSaved ? JSON.parse(rawSaved) : [];
                localStorage.setItem(
                    'wandersketch_saved_personal_spot_ids',
                    JSON.stringify(savedList.filter((id: string) => id !== spotId))
                );
            } catch {}
        }

        set({
            deletedPersonalSpotIds: updatedDeleted,
            zones: updatedZones,
            plannerBuffer: {
                ...plannerBuffer,
                spotIds: updatedSpotIds,
            },
            savedPlans: updatedPlans,
        });

        // 5. Delete from database
        await deleteCustomSpotFromDb(spotId);
    },

    savePlannerAsNewPlan: async () => {
        const { title, zoneKey, spotIds } = get().plannerBuffer;
        const zone = get().zones[zoneKey] || MASTER_ZONES[zoneKey];
        const id = `plan_${Date.now()}`;

        const stopCoords = spotIds
            .map((sid) => zone.landmarksPool.find((l) => l.id === sid)?.coords)
            .filter(Boolean) as [number, number][];

        const routeData = await fetchPedestrianRoute(stopCoords);

        const newPlan: TravelPlan = {
            id,
            title: title.trim() || 'My Custom Travel Plan',
            zoneKey,
            createdAt: new Date().toISOString().split('T')[0],
            tag: 'Custom',
            estimatedDistance: `${routeData.distanceKm} km`,
            estimatedDuration: `${routeData.durationMinutes} mins`,
            activeRouteKey: 'classic',
            spotIds: [...spotIds],
            themeRoutes: {
                classic: [...spotIds],
                culture: spotIds.slice(0, 3),
                rain: spotIds.slice(0, 2),
            },
        };

        // Optimistic store update
        set((state) => ({
            savedPlans: [newPlan, ...state.savedPlans],
            activePlanId: id,
            currentStage: 'map',
        }));

        // Persist to Supabase
        try {
            await supabase.from('travel_plans').insert({
                id: newPlan.id,
                title: newPlan.title,
                destination_id: newPlan.zoneKey,
                tag: newPlan.tag,
                estimated_distance: newPlan.estimatedDistance,
                estimated_duration: newPlan.estimatedDuration,
                active_route_key: newPlan.activeRouteKey,
                spot_ids: newPlan.spotIds,
                theme_routes: newPlan.themeRoutes,
            });
        } catch (err) {
            console.error('Failed to sync plan to Supabase:', err);
        }

        return id;
    },

    updateActivePlanTheme: async (theme) => {
        const { activePlanId, savedPlans, zones } = get();
        const plan = savedPlans.find((p) => p.id === activePlanId);
        if (!plan) return;

        const zone = zones[plan.zoneKey] || MASTER_ZONES[plan.zoneKey];
        const newSpotIds = plan.themeRoutes[theme] || plan.spotIds;
        const stopCoords = newSpotIds
            .map((sid) => zone.landmarksPool.find((l) => l.id === sid)?.coords)
            .filter(Boolean) as [number, number][];

        const routeData = await fetchPedestrianRoute(stopCoords);

        const updated = savedPlans.map((p) => {
            if (p.id !== activePlanId) return p;
            return {
                ...p,
                activeRouteKey: theme,
                spotIds: newSpotIds,
                estimatedDistance: `${routeData.distanceKm} km`,
                estimatedDuration: `${routeData.durationMinutes} mins`,
            };
        });

        set({ savedPlans: updated });

        try {
            await supabase
                .from('travel_plans')
                .update({ active_route_key: theme })
                .eq('id', activePlanId);
        } catch (err) {
            console.warn('Could not sync theme change to DB:', err);
        }
    },

    updatePlanTitle: async (planId, title) => {
        set((state) => ({
            savedPlans: state.savedPlans.map((p) => (p.id === planId ? { ...p, title } : p)),
        }));

        try {
            await supabase.from('travel_plans').update({ title }).eq('id', planId);
        } catch (err) {
            console.warn('Could not sync title change to DB:', err);
        }
    },

    deletePlan: async (planId) => {
        const { savedPlans, activePlanId, selectedTripViewId } = get();
        const filtered = savedPlans.filter((p) => p.id !== planId);

        set({
            savedPlans: filtered,
            activePlanId: activePlanId === planId ? (filtered[0]?.id || '') : activePlanId,
            selectedTripViewId: selectedTripViewId === planId ? null : selectedTripViewId,
        });

        await deletePlanFromDb(planId);
    },

    setItineraryDays: (days, totalBudget) => {
        const ceiling = totalBudget !== undefined ? totalBudget : get().totalBudgetCeiling;
        const { updatedDays, isOverBudget, budgetSummary } = computeBudgetFromDays(days, ceiling);
        const activeDay = get().activeDayNumber;
        const activePlanId = get().activePlanId;
        set((state) => ({
            currentItineraryDays: updatedDays,
            totalBudgetCeiling: ceiling,
            isOverBudget,
            budgetSummary,
            activeDayNumber: updatedDays.length > 0 && activeDay <= updatedDays.length ? activeDay : 1,
            daysCacheByPlanId: {
                ...state.daysCacheByPlanId,
                [activePlanId]: updatedDays,
            },
            budgetCeilingByPlanId: {
                ...state.budgetCeilingByPlanId,
                [activePlanId]: ceiling,
            },
        }));
    },

    setActiveDay: (dayNumber) => set({ activeDayNumber: dayNumber }),

    addItineraryItem: (dayNumber, itemData) => {
        const { currentItineraryDays, totalBudgetCeiling, activePlanId } = get();
        const updated = currentItineraryDays.map((day) => {
            if (day.dayNumber !== dayNumber) return day;
            const dayItems = day.items ? [...day.items] : [];
            const newItem: ItineraryItem = {
                ...itemData,
                id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                dayId: day.id,
                planId: day.planId || activePlanId,
                orderIndex: dayItems.length,
            };
            return {
                ...day,
                items: [...dayItems, newItem],
            };
        });
        const { updatedDays, isOverBudget, budgetSummary } = computeBudgetFromDays(updated, totalBudgetCeiling);
        set({
            currentItineraryDays: updatedDays,
            isOverBudget,
            budgetSummary,
        });
    },

    removeItineraryItem: (itemId) => {
        const { currentItineraryDays, totalBudgetCeiling } = get();
        const updated = currentItineraryDays.map((day) => {
            if (!day.items || !day.items.some((i) => i.id === itemId)) return day;
            const filtered = day.items
                .filter((i) => i.id !== itemId)
                .map((item, idx) => ({ ...item, orderIndex: idx }));
            return {
                ...day,
                items: filtered,
            };
        });
        const { updatedDays, isOverBudget, budgetSummary } = computeBudgetFromDays(updated, totalBudgetCeiling);
        set({
            currentItineraryDays: updatedDays,
            isOverBudget,
            budgetSummary,
        });
    },

    updateItemCost: (itemId, estimatedCost, actualCost, category) => {
        const { currentItineraryDays, totalBudgetCeiling } = get();
        const updated = currentItineraryDays.map((day) => {
            if (!day.items || !day.items.some((i) => i.id === itemId)) return day;
            const updatedItems = day.items.map((item) => {
                if (item.id !== itemId) return item;
                return {
                    ...item,
                    category: category !== undefined ? category : item.category,
                    estimatedCost: estimatedCost !== undefined ? estimatedCost : item.estimatedCost,
                    actualCost: actualCost !== undefined ? actualCost : item.actualCost,
                };
            });
            return {
                ...day,
                items: updatedItems,
            };
        });
        const { updatedDays, isOverBudget, budgetSummary } = computeBudgetFromDays(updated, totalBudgetCeiling);
        set({
            currentItineraryDays: updatedDays,
            isOverBudget,
            budgetSummary,
        });
    },

    swapItineraryItem: (dayNumber, oldItemId, replacement) => {
        const { currentItineraryDays, totalBudgetCeiling } = get();
        const updated = currentItineraryDays.map((day) => {
            if (day.dayNumber !== dayNumber) return day;
            let hotelInfo = day.hotelInfo;
            const updatedItems = (day.items || []).map((item) => {
                if (item.id !== oldItemId) return item;
                if (item.category === 'lodging') {
                    hotelInfo = {
                        ...hotelInfo,
                        name: replacement.name.replace(/^Stay at\s+/i, ''),
                        price: replacement.estimatedCost,
                    };
                }
                return {
                    ...item,
                    name: replacement.name,
                    estimatedCost: replacement.estimatedCost,
                    category: replacement.category || item.category,
                    location: replacement.location || item.location,
                };
            });
            return {
                ...day,
                hotelInfo,
                items: updatedItems,
            };
        });
        const { updatedDays, isOverBudget, budgetSummary } = computeBudgetFromDays(updated, totalBudgetCeiling);
        set({
            currentItineraryDays: updatedDays,
            isOverBudget,
            budgetSummary,
        });
    },

    updateDayHotel: (dayNumber, hotel) => {
        const { currentItineraryDays, totalBudgetCeiling } = get();
        const updated = currentItineraryDays.map((day) => {
            if (day.dayNumber !== dayNumber) return day;
            let lodgingFound = false;
            const updatedItems = (day.items || []).map((item) => {
                if (item.category === 'lodging') {
                    lodgingFound = true;
                    return {
                        ...item,
                        name: `Stay at ${hotel.name}`,
                        estimatedCost: hotel.price,
                        location: hotel.coords || item.location,
                    };
                }
                return item;
            });

            if (!lodgingFound) {
                updatedItems.unshift({
                    id: `item_${day.dayNumber}_lodging_${Date.now()}`,
                    dayId: day.id,
                    planId: day.planId,
                    name: `Stay at ${hotel.name}`,
                    category: 'lodging',
                    estimatedCost: hotel.price,
                    actualCost: 0,
                    location: hotel.coords,
                    orderIndex: 0,
                });
            }

            return {
                ...day,
                hotelInfo: {
                    ...day.hotelInfo,
                    name: hotel.name,
                    price: hotel.price,
                    notes: hotel.notes || day.hotelInfo?.notes,
                    coords: hotel.coords || day.hotelInfo?.coords,
                },
                items: updatedItems,
            };
        });
        const { updatedDays, isOverBudget, budgetSummary } = computeBudgetFromDays(updated, totalBudgetCeiling);
        set({
            currentItineraryDays: updatedDays,
            isOverBudget,
            budgetSummary,
        });
    },

    recalculateBudget: () => {
        const { currentItineraryDays, totalBudgetCeiling } = get();
        const { updatedDays, isOverBudget, budgetSummary } = computeBudgetFromDays(
            currentItineraryDays,
            totalBudgetCeiling
        );
        set({
            currentItineraryDays: updatedDays,
            isOverBudget,
            budgetSummary,
        });
    },
}));