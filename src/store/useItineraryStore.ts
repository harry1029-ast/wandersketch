import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppStage, TravelPlan, ScenicZoneKey, RouteTheme } from '@/types/itinerary';
import { INITIAL_PLANS, MASTER_ZONES } from '@/lib/mockData';

interface ItineraryState {
    currentStage: AppStage;
    activePlanId: string;
    savedPlans: TravelPlan[];

    // Working buffer for the Planner screen
    plannerBuffer: {
        title: string;
        zoneKey: ScenicZoneKey;
        spotIds: string[];
    };

    // Actions
    setStage: (stage: AppStage) => void;
    setActivePlanId: (id: string) => void;
    updatePlannerZone: (zoneKey: ScenicZoneKey) => void;
    reorderPlannerStops: (fromIdx: number, toIdx: number) => void;
    removePlannerStop: (idx: number) => void;
    addPlannerCustomStop: (name: string) => void;
    savePlannerAsNewPlan: () => string;
    updateActivePlanTheme: (theme: RouteTheme) => void;
    updatePlanTitle: (planId: string, title: string) => void;
}

export const useItineraryStore = create<ItineraryState>()(
    persist(
        (set, get) => ({
            currentStage: 'plans',
            activePlanId: INITIAL_PLANS[0].id,
            savedPlans: INITIAL_PLANS,

            plannerBuffer: {
                title: 'Toronto Lakefront & Distillery Autumn Walk',
                zoneKey: 'toronto_distillery',
                spotIds: ['td-1', 'td-2', 'td-3', 'td-4', 'td-5'],
            },

            setStage: (stage) => set({ currentStage: stage }),
            setActivePlanId: (id) => set({ activePlanId: id }),

            updatePlannerZone: (zoneKey) => {
                const zone = MASTER_ZONES[zoneKey];
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

            addPlannerCustomStop: (name) => {
                const { zoneKey, spotIds } = get().plannerBuffer;
                const zone = MASTER_ZONES[zoneKey];
                if (!zone) return;

                const newId = `custom-${Date.now()}`;
                const newLandmark = {
                    id: newId,
                    name,
                    category: 'craft' as const,
                    color: '#f4c568',
                    coords: [
                        zone.center[0] + (Math.random() - 0.5) * 0.003,
                        zone.center[1] + (Math.random() - 0.5) * 0.003,
                    ] as [number, number],
                    svgSnippet: `
            <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
              <circle cx="50" cy="50" r="34" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
              <text x="50" y="58" font-size="22" text-anchor="middle">✨</text>
            </svg>
          `,
                    tag: 'Personal Spot',
                    desc: `Custom stop added by user: ${name}.`,
                    audioNote: `You have arrived at your custom stop: ${name}.`,
                    panoUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
                    tips: 'Check out local seasonal recommendations when you arrive.',
                };

                zone.landmarksPool.push(newLandmark);
                set((state) => ({
                    plannerBuffer: { ...state.plannerBuffer, spotIds: [...spotIds, newId] },
                }));
            },

            savePlannerAsNewPlan: () => {
                const { title, zoneKey, spotIds } = get().plannerBuffer;
                const id = `plan_${Date.now()}`;
                const newPlan: TravelPlan = {
                    id,
                    title: title.trim() || 'My Custom Travel Plan',
                    zoneKey,
                    createdAt: new Date().toISOString().split('T')[0],
                    tag: 'Custom',
                    estimatedDistance: `${(spotIds.length * 0.5).toFixed(1)} km`,
                    estimatedDuration: `${(spotIds.length * 0.5).toFixed(1)} hrs`,
                    activeRouteKey: 'classic',
                    spotIds: [...spotIds],
                    themeRoutes: {
                        classic: [...spotIds],
                        culture: spotIds.slice(0, 3),
                        rain: spotIds.slice(0, 2),
                    },
                };

                set((state) => ({
                    savedPlans: [newPlan, ...state.savedPlans],
                    activePlanId: id,
                    currentStage: 'map',
                }));
                return id;
            },

            updateActivePlanTheme: (theme) => {
                const { activePlanId, savedPlans } = get();
                const updated = savedPlans.map((p) => {
                    if (p.id !== activePlanId) return p;
                    return {
                        ...p,
                        activeRouteKey: theme,
                        spotIds: p.themeRoutes[theme] || p.spotIds,
                    };
                });
                set({ savedPlans: updated });
            },

            updatePlanTitle: (planId, title) => {
                set((state) => ({
                    savedPlans: state.savedPlans.map((p) => (p.id === planId ? { ...p, title } : p)),
                }));
            },
        }),
        { name: 'wandersketch-itinerary-storage' }
    )
);