'use client';

import React from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { playChime } from '@/lib/audio';
import { AppStage } from '@/types/itinerary';
import {
    MapTrifold,
    SuitcaseSimple,
    Footprints,
    Sparkle,
    Receipt,
    PencilSimple,
    Compass,
    Lightning,
} from '@phosphor-icons/react';
import { QuickExcursionModal } from '@/components/Modals/QuickExcursionModal';

interface MobileNavBarProps {
    onQuickExpenseClick?: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ onQuickExpenseClick }) => {
    const {
        appMode,
        setAppMode,
        currentStage,
        setStage,
        savedPlans,
        setTripModalOpen,
        activeDayNumber,
        launchAmbientDiscoveryOnMap,
    } = useItineraryStore();

    const [isExcursionOpen, setIsExcursionOpen] = React.useState(false);

    const handleStageClick = (stage: AppStage) => {
        playChime('tap');
        if (stage === 'map') {
            launchAmbientDiscoveryOnMap();
        } else {
            setStage(stage);
        }
    };

    const handleCreateTripClick = () => {
        playChime('stamp');
        setTripModalOpen(true);
    };

    return (
        <>
            <nav
                aria-label="Mobile Navigation Bar"
                className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper-100/95 backdrop-blur-md border-t-2 border-paper-300 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
            >
                {appMode === 'planning' ? (
                    /* Planning Mode Navigation Tabs */
                    <div className="grid grid-cols-4 items-center gap-1 max-w-md mx-auto">
                        {/* Trip Hub Tab */}
                        <button
                            type="button"
                            onClick={() => handleStageClick('plans')}
                            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all relative ${
                                currentStage === 'plans'
                                    ? 'bg-watercolor-brick text-white shadow-stamp font-black ring-1 ring-paper-900/30'
                                    : 'text-paper-800 hover:text-paper-900 active:bg-paper-200'
                            }`}
                        >
                            <div className="relative">
                                <SuitcaseSimple size={20} weight={currentStage === 'plans' ? 'fill' : 'bold'} />
                                {savedPlans.length > 0 && (
                                    <span
                                        className={`absolute -top-1.5 -right-2 text-[9px] font-black px-1 py-0.2 rounded-full font-mono ${
                                            currentStage === 'plans'
                                                ? 'bg-amber-300 text-paper-900'
                                                : 'bg-watercolor-brick text-white'
                                        }`}
                                    >
                                        {savedPlans.length}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] mt-0.5 tracking-tight font-serif">Trips</span>
                        </button>

                        {/* Illustrated Map Tab */}
                        <button
                            type="button"
                            onClick={() => handleStageClick('map')}
                            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all ${
                                currentStage === 'map'
                                    ? 'bg-watercolor-brick text-white shadow-stamp font-black ring-1 ring-paper-900/30'
                                    : 'text-paper-800 hover:text-paper-900 active:bg-paper-200'
                            }`}
                        >
                            <MapTrifold size={20} weight={currentStage === 'map' ? 'fill' : 'bold'} />
                            <span className="text-[10px] mt-0.5 tracking-tight font-serif">Map</span>
                        </button>

                        {/* 1-Day Excursion Action */}
                        <button
                            type="button"
                            onClick={() => {
                                playChime('tap');
                                setIsExcursionOpen(true);
                            }}
                            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl text-paper-800 hover:text-paper-900 active:bg-paper-200 transition-all"
                        >
                            <Lightning size={20} weight="fill" className="text-amber-700" />
                            <span className="text-[10px] mt-0.5 tracking-tight font-serif">Excursion</span>
                        </button>

                        {/* New Trip Quick Action */}
                        <button
                            type="button"
                            onClick={handleCreateTripClick}
                            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl bg-amber-400 hover:bg-amber-500 text-paper-900 border border-paper-900 shadow-xs font-black transition-all active:scale-95"
                        >
                            <Sparkle size={18} weight="fill" className="text-watercolor-brick" />
                            <span className="text-[10px] mt-0.5 tracking-tight font-sans font-extrabold">+ New Trip</span>
                        </button>
                    </div>
                ) : (
                /* On-Trip Mode Active Navigation Bar */
                <div className="grid grid-cols-3 items-center gap-2 max-w-md mx-auto">
                    {/* Live Guide Map State */}
                    <div className="flex flex-col items-center justify-center py-1 px-2 rounded-2xl bg-emerald-100 text-emerald-950 border border-emerald-700/40 shadow-2xs">
                        <div className="flex items-center gap-1 font-extrabold text-watercolor-green">
                            <Compass size={18} weight="fill" />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                        </div>
                        <span className="text-[10px] font-bold font-mono">Day {activeDayNumber || 1} Live</span>
                    </div>

                    {/* Quick Expense Logging */}
                    <button
                        type="button"
                        onClick={() => {
                            playChime('stamp');
                            if (onQuickExpenseClick) onQuickExpenseClick();
                        }}
                        className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-paper-900 border-2 border-paper-900 shadow-stamp font-black transition-all active:scale-95"
                    >
                        <Receipt size={18} weight="bold" className="text-paper-900" />
                        <span className="text-[10px] mt-0.5 font-bold">+ Log Expense</span>
                    </button>

                    {/* Exit to Planning Mode */}
                    <button
                        type="button"
                        onClick={() => {
                            playChime('tap');
                            setAppMode('planning');
                            setStage('plans');
                        }}
                        className="flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl bg-paper-200 hover:bg-paper-300 text-paper-900 border border-paper-700 font-bold transition-all active:scale-95"
                    >
                        <PencilSimple size={18} weight="bold" />
                        <span className="text-[10px] mt-0.5">Edit Trips</span>
                    </button>
                </div>
            )}
        </nav>

        <QuickExcursionModal
            isOpen={isExcursionOpen}
            onClose={() => setIsExcursionOpen(false)}
        />
        </>
    );
};

