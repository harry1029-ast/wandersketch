import { create } from 'zustand';
import {
    AppStage,
    AppMode,
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
import { fetchPedestrianRoute } from '@/lib/routing';
import { fetchAllPlans, fetchDestinations, saveCustomSpotToDb, deletePlanFromDb, fetchAllCustomSpots } from '@/lib/repositories';
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

    // Multi-day itinerary & budget state
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
    setTripModalOpen: (open: boolean) => void;
    updatePlannerZone: (zoneKey: ScenicZoneKey) => void;
    reorderPlannerStops: (fromIdx: number, toIdx: number) => void;
    removePlannerStop: (idx: number) => void;
    addPlannerCustomStop: (
        name: string,
        coords: [number, number],
        address?: string
    ) => Promise<string>;
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

export const useItineraryStore = create<ItineraryState>()((set, get) => ({
    appMode: 'planning',
    currentStage: 'plans',
    activePlanId: INITIAL_PLANS[0].id,
    savedPlans: INITIAL_PLANS,
    zones: MASTER_ZONES,
    isLoadingDb: false,
    isTripModalOpen: false,

    plannerBuffer: {
        title: 'Toronto Lakefront & Distillery Autumn Walk',
        zoneKey: 'toronto_distillery',
        spotIds: ['td-1', 'td-2', 'td-3', 'td-4', 'td-5'],
    },

    // Multi-day itinerary & budget initial state
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

            set((state) => {
                const updatedZones = { ...state.zones };
                dbDestinations.forEach((dest) => {
                    if (updatedZones[dest.id]) {
                        // Keep default curated landmarks and append any custom spots belonging to this zone
                        const basePool = updatedZones[dest.id].landmarksPool;
                        const existingIds = new Set(basePool.map((l) => l.id));
                        const zoneCustom = dbCustomSpots.filter(
                            (cs: any) => (cs.destinationId === dest.id || !cs.destinationId) && !existingIds.has(cs.id)
                        );

                        updatedZones[dest.id] = {
                            ...updatedZones[dest.id],
                            ...dest,
                            landmarksPool: [...basePool, ...zoneCustom],
                        };
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

    updatePlannerZone: (zoneKey) => {
        const zone = get().zones[zoneKey] || MASTER_ZONES[zoneKey];
        if (!zone) return;
        set({
            plannerBuffer: {
                title: `Explore ${zone.name}`,
                zoneKey,
                spotIds: zone.landmarksPool.slice(0, 4).map((l) => l.id),
            },
        });
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
        if (spotIds.length <= 2) return;
        set((state) => ({
            plannerBuffer: {
                ...state.plannerBuffer,
                spotIds: spotIds.filter((_, i) => i !== idx),
            },
        }));
    },

    addPlannerCustomStop: async (name, coords, address) => {
        const { zoneKey, spotIds } = get().plannerBuffer;
        const zone = get().zones[zoneKey] || MASTER_ZONES[zoneKey];
        if (!zone) return '';

        const newId = `custom-${Date.now()}`;
        const newLandmark = {
            id: newId,
            name,
            category: 'craft' as const,
            color: '#f4c568',
            coords: coords,
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">✨</text>
        </svg>
      `,
            tag: 'Personal Spot',
            desc: address || `Custom stop added by user: ${name}.`,
            audioNote: `You have arrived at your custom stop: ${name}.`,
            panoUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
            tips: 'Check out local seasonal recommendations when you arrive.',
        };

        // Update in-memory pool for the active session
        zone.landmarksPool.push(newLandmark);
        set((state) => ({
            plannerBuffer: { ...state.plannerBuffer, spotIds: [...spotIds, newId] },
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
        const { savedPlans, activePlanId } = get();
        const filtered = savedPlans.filter((p) => p.id !== planId);

        set({
            savedPlans: filtered,
            activePlanId: activePlanId === planId ? (filtered[0]?.id || '') : activePlanId,
        });

        await deletePlanFromDb(planId);
    },

    setItineraryDays: (days, totalBudget) => {
        const ceiling = totalBudget !== undefined ? totalBudget : get().totalBudgetCeiling;
        const { updatedDays, isOverBudget, budgetSummary } = computeBudgetFromDays(days, ceiling);
        const activeDay = get().activeDayNumber;
        set({
            currentItineraryDays: updatedDays,
            totalBudgetCeiling: ceiling,
            isOverBudget,
            budgetSummary,
            activeDayNumber: updatedDays.length > 0 && activeDay <= updatedDays.length ? activeDay : 1,
        });
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