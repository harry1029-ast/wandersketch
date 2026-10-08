'use client';

import React from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { playChime } from '@/lib/audio';
import { MapTrifold, BookmarkSimple, PencilSimpleLine, PlusCircle, Sparkle } from '@phosphor-icons/react';

export const Header: React.FC = () => {
    const { currentStage, setStage, savedPlans, savePlannerAsNewPlan, setTripModalOpen } = useItineraryStore();

    const handleStageChange = (stage: 'planner' | 'plans' | 'map') => {
        playChime('tap');
        setStage(stage);
    };

    const handleQuickAction = () => {
        playChime('stamp');
        if (currentStage === 'planner') {
            savePlannerAsNewPlan();
        } else if (currentStage === 'plans') {
            setStage('planner');
        }
    };

    return (
        <header className="h-16 bg-paper-100/95 backdrop-blur-md border-b-2 border-paper-300 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-sm">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleStageChange('plans')}>
                <div className="w-10 h-10 rounded-2xl bg-watercolor-brick text-white flex items-center justify-center shadow-stamp -rotate-2 border-2 border-paper-900">
                    <MapTrifold size={24} weight="fill" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="font-black text-lg sm:text-xl text-paper-900 font-serif tracking-tight">WanderSketch</h1>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 hidden sm:inline-block">
                            Illustrated Guide
                        </span>
                    </div>
                    <p className="text-[11px] text-paper-800 hidden md:block">Interactive Illustrated Itinerary Engine</p>
                </div>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2 bg-paper-200/90 p-1 rounded-2xl border-2 border-paper-900 shadow-sm">
                <button
                    onClick={() => handleStageChange('planner')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${currentStage === 'planner'
                        ? 'bg-watercolor-brick text-white shadow-sm'
                        : 'text-paper-800 hover:text-paper-900'
                        }`}
                >
                    <PencilSimpleLine size={16} weight="bold" />
                    <span>Trip Planner</span>
                </button>

                <button
                    onClick={() => handleStageChange('plans')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${currentStage === 'plans'
                        ? 'bg-watercolor-brick text-white shadow-sm'
                        : 'text-paper-800 hover:text-paper-900'
                        }`}
                >
                    <BookmarkSimple size={16} weight="bold" />
                    <span>My Plans</span>
                    <span className="bg-amber-300 text-paper-900 font-black text-[10px] px-1.5 py-0.5 rounded-full">
                        {savedPlans.length}
                    </span>
                </button>

                <button
                    onClick={() => handleStageChange('map')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${currentStage === 'map'
                        ? 'bg-watercolor-brick text-white shadow-sm'
                        : 'text-paper-800 hover:text-paper-900'
                        }`}
                >
                    <MapTrifold size={16} weight="bold" />
                    <span>Illustrated Map</span>
                </button>
            </nav>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => {
                        playChime('tap');
                        setTripModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-paper-900 font-extrabold text-xs sm:text-sm border-2 border-paper-900 shadow-stamp transition-all active:scale-95"
                    title="Generate New Multi-Day Itinerary with AI"
                >
                    <Sparkle size={18} weight="fill" className="text-watercolor-brick" />
                    <span>+ New Trip</span>
                </button>

                <button
                    onClick={handleQuickAction}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-watercolor-green hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm border-2 border-paper-900 shadow-stamp transition-all active:scale-95"
                >
                    <PlusCircle size={18} weight="bold" className="text-amber-200" />
                    <span>{currentStage === 'planner' ? 'Save & Launch Map' : 'New Plan'}</span>
                </button>
            </div>
        </header>
    );
};