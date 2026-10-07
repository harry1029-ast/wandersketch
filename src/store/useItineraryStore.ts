import { create } from 'zustand';
import { AppStage, TravelPlan, ScenicZoneKey, RouteTheme, ScenicZone } from '@/types/itinerary';
import { MASTER_ZONES, INITIAL_PLANS } from '@/lib/mockData';
import { fetchPedestrianRoute } from '@/lib/routing';
import { fetchAllPlans, fetchDestinations, saveCustomSpotToDb, deletePlanFromDb, fetchAllCustomSpots } from '@/lib/repositories';
import { supabase } from '@/lib/supabaseClient';

interface ItineraryState {
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

    // Actions
    initializeFromDatabase: () => Promise<void>;
    setStage: (stage: AppStage) => void;
    setActivePlanId: (id: string) => void;
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
}

export const useItineraryStore = create<ItineraryState>()((set, get) => ({
    currentStage: 'plans',
    activePlanId: INITIAL_PLANS[0].id,
    savedPlans: INITIAL_PLANS,
    zones: MASTER_ZONES,
    isLoadingDb: false,

    plannerBuffer: {
        title: 'Toronto Lakefront & Distillery Autumn Walk',
        zoneKey: 'toronto_distillery',
        spotIds: ['td-1', 'td-2', 'td-3', 'td-4', 'td-5'],
    },

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

    setStage: (stage) => set({ currentStage: stage }),
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
}));