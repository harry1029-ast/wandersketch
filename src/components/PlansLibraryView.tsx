'use client';

import React, { useState } from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { MASTER_ZONES } from '@/lib/mockData';
import { playChime } from '@/lib/audio';
import { ContainedIslandModal } from '@/components/Modals/ContainedIslandModal';
import { PlusCircle, Sparkle, Footprints, Clock } from '@phosphor-icons/react';

export const PlansLibraryView: React.FC = () => {
    const { savedPlans, setActivePlanId, setStage } = useItineraryStore();
    const [selectedPlanForIsland, setSelectedPlanForIsland] = useState<string | null>(null);

    const handleOpenIslandModal = (planId: string) => {
        playChime('stamp');
        setActivePlanId(planId);
        setSelectedPlanForIsland(planId);
    };

    const handleCreateNew = () => {
        playChime('tap');
        setStage('planner');
    };

    return (
        <section className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-rice-paper">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header Ribbon */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-paper-300 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl sm:text-3xl font-black text-paper-900 font-serif">
                                Saved Travel Plans
                            </h2>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-paper-900 font-mono">
                                {savedPlans.length} Active Plans
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-paper-800 mt-1 max-w-xl">
                            Each itinerary is an <b>interactive dynamic item</b>. Tap any card to generate a stylized, self-contained mini-map covering only that journey.
                        </p>
                    </div>

                    <button
                        onClick={handleCreateNew}
                        className="px-4 py-2 bg-watercolor-green hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl border-2 border-paper-900 shadow-stamp flex items-center gap-2 transition active:scale-95 shrink-0"
                    >
                        <PlusCircle size={18} weight="bold" className="text-amber-200" />
                        <span>Create New Itinerary</span>
                    </button>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {savedPlans.map((plan) => {
                        const zone = MASTER_ZONES[plan.zoneKey];
                        if (!zone) return null;

                        return (
                            <div
                                key={plan.id}
                                onClick={() => handleOpenIslandModal(plan.id)}
                                className="group relative bg-paper-100 hover:bg-white border-3 border-paper-900 rounded-3xl p-5 shadow-card hover:shadow-float transition-all cursor-pointer flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-watercolor-brick text-white uppercase tracking-wider font-mono">
                                            {zone.city} · {plan.tag}
                                        </span>
                                        <span className="text-xs text-paper-800 font-serif">
                                            {plan.createdAt}
                                        </span>
                                    </div>

                                    <h3 className="font-black text-lg text-paper-900 font-serif leading-snug group-hover:text-watercolor-brick transition-colors">
                                        {plan.title}
                                    </h3>

                                    <p className="text-xs text-paper-800 mt-2 line-clamp-2 leading-relaxed">
                                        Focused on {zone.name}. Features {plan.spotIds.length} stops connected with hand-sketched walking trails.
                                    </p>

                                    {/* Illustrated Mini POI Stickers */}
                                    <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-paper-200 overflow-x-hidden">
                                        {plan.spotIds.slice(0, 4).map((sid) => {
                                            const lm = zone.landmarksPool.find((l) => l.id === sid);
                                            if (!lm) return null;
                                            return (
                                                <div
                                                    key={sid}
                                                    className="w-8 h-8 rounded-xl bg-paper-50 border border-paper-900 p-0.5 shrink-0 flex items-center justify-center text-xs shadow-sm"
                                                    title={lm.name}
                                                    dangerouslySetInnerHTML={{ __html: lm.svgSnippet }}
                                                />
                                            );
                                        })}
                                        {plan.spotIds.length > 4 && (
                                            <span className="text-xs font-bold text-paper-800 px-1">
                                                +{plan.spotIds.length - 4}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Card Footer */}
                                <div className="flex items-center justify-between mt-5 pt-3 border-t-2 border-paper-200 text-xs">
                                    <div className="flex items-center gap-3 text-paper-900 font-bold">
                                        <span className="flex items-center gap-1">
                                            <Footprints size={14} className="text-watercolor-brick" />
                                            {plan.estimatedDistance}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} className="text-watercolor-brick" />
                                            {plan.estimatedDuration}
                                        </span>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenIslandModal(plan.id);
                                        }}
                                        className="px-3 py-1.5 bg-watercolor-brick hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-stamp transition active:scale-95"
                                    >
                                        <Sparkle size={14} weight="fill" className="text-amber-200" />
                                        <span>Stylized Island</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* Contained Hand-Drawn Island Modal */}
            <ContainedIslandModal
                isOpen={Boolean(selectedPlanForIsland)}
                onClose={() => setSelectedPlanForIsland(null)}
            />
        </section>
    );
};