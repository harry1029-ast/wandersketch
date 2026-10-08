'use client';

import React, { useState } from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { playChime } from '@/lib/audio';
import {
    MapTrifold,
    SuitcaseSimple,
    Footprints,
    PlusCircle,
    Sparkle,
    Lightning,
} from '@phosphor-icons/react';
import { AppMode, AppStage } from '@/types/itinerary';
import { QuickExcursionModal } from '@/components/Modals/QuickExcursionModal';

export const Header: React.FC = () => {
    const {
        appMode,
        setAppMode,
        currentStage,
        setStage,
        savedPlans,
        savePlannerAsNewPlan,
        setTripModalOpen,
    } = useItineraryStore();

    const [isExcursionModalOpen, setIsExcursionModalOpen] = useState(false);

    const handleModeToggle = (mode: AppMode) => {
        if (appMode === mode) return;
        if (mode === 'on-trip') {
            playChime('stamp');
        } else {
            playChime('tap');
        }
        setAppMode(mode);
    };

    const handleStageChange = (stage: AppStage) => {
        playChime('tap');
        setStage(stage);
    };

    const handleQuickAction = () => {
        playChime('stamp');
        if (appMode === 'on-trip') {
            setAppMode('planning');
            setStage('plans');
            return;
        }
        if (currentStage === 'planner') {
            savePlannerAsNewPlan();
        } else if (currentStage === 'plans') {
            setStage('map');
        } else if (currentStage === 'map') {
            setStage('plans');
        }
    };

    return (
        <>
            <header className="h-16 bg-paper-100/95 backdrop-blur-md border-b-2 border-paper-300 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-sm gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
                {/* Brand Logo & Title */}
                <div
                    className="flex items-center gap-3 cursor-pointer shrink-0"
                    onClick={() => {
                        playChime('tap');
                        setStage('plans');
                    }}
                >
                    <div className="w-10 h-10 rounded-2xl bg-watercolor-brick text-white flex items-center justify-center shadow-stamp -rotate-2 border-2 border-paper-900 shrink-0">
                        <MapTrifold size={24} weight="fill" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-black text-lg sm:text-xl text-paper-900 font-serif tracking-tight">WanderSketch</h1>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 hidden lg:inline-block">
                                Illustrated Guide
                            </span>
                        </div>
                        <p className="text-[11px] text-paper-800 hidden xl:block">Interactive Illustrated Itinerary Engine</p>
                    </div>
                </div>

                {/* Center Controls: Mode Toggle Pill & Stage Nav */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Mode Toggle Pill */}
                    <div className="flex items-center bg-paper-200/90 p-1 rounded-2xl border-2 border-paper-900 shadow-sm gap-1">
                        <button
                            type="button"
                            onClick={() => handleModeToggle('planning')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                appMode === 'planning'
                                    ? 'bg-watercolor-brick text-white shadow-stamp font-black ring-1 ring-paper-900/20'
                                    : 'text-paper-800 hover:text-paper-900 hover:bg-paper-300/60'
                            }`}
                            title="Planning Mode: Pre-trip editing, budgeting, and stop customization"
                        >
                            <span>✏️</span>
                            <span className="hidden sm:inline">Planning Mode</span>
                            <span className="sm:hidden">Planning</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleModeToggle('on-trip')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                appMode === 'on-trip'
                                    ? 'bg-watercolor-green text-white shadow-stamp font-black ring-1 ring-paper-900/20'
                                    : 'text-paper-800 hover:text-paper-900 hover:bg-paper-300/60'
                            }`}
                            title="On-Trip Mode: Active exploration, live navigation, and today's schedule"
                        >
                            <span>🧭</span>
                            <span className="hidden sm:inline">On-Trip Mode</span>
                            <span className="sm:hidden">On-Trip</span>
                            {appMode === 'on-trip' && (
                                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping ml-0.5" />
                            )}
                        </button>
                    </div>

                    {/* Stage Navigation (Visible when in Planning Mode) */}
                    {appMode === 'planning' ? (
                        <nav className="hidden md:flex items-center gap-1 sm:gap-2 bg-paper-200/90 p-1 rounded-2xl border-2 border-paper-900 shadow-sm">
                            <button
                                onClick={() => handleStageChange('plans')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    currentStage === 'plans'
                                        ? 'bg-watercolor-brick text-white shadow-sm'
                                        : 'text-paper-800 hover:text-paper-900'
                                }`}
                            >
                                <SuitcaseSimple size={16} weight="bold" />
                                <span>Trip Hub</span>
                                <span className="bg-amber-300 text-paper-900 font-black text-[10px] px-1.5 py-0.5 rounded-full">
                                    {savedPlans.length}
                                </span>
                            </button>

                            <button
                                onClick={() => handleStageChange('planner')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    currentStage === 'planner'
                                        ? 'bg-watercolor-brick text-white shadow-sm'
                                        : 'text-paper-800 hover:text-paper-900'
                                }`}
                            >
                                <Footprints size={16} weight="bold" />
                                <span>Route Curator</span>
                            </button>

                            <button
                                onClick={() => handleStageChange('map')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    currentStage === 'map'
                                        ? 'bg-watercolor-brick text-white shadow-sm'
                                        : 'text-paper-800 hover:text-paper-900'
                                }`}
                            >
                                <MapTrifold size={16} weight="bold" />
                                <span>Illustrated Map</span>
                            </button>
                        </nav>
                    ) : (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-paper-200/90 border-2 border-paper-900 rounded-2xl text-xs font-bold shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                            <span className="text-paper-900">Live Field Guide</span>
                        </div>
                    )}
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => {
                            playChime('tap');
                            setIsExcursionModalOpen(true);
                        }}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-paper-900 font-bold text-xs sm:text-sm border-2 border-paper-900 shadow-xs transition-all active:scale-95 cursor-pointer"
                        title="Launch quick 1-day excursion"
                    >
                        <Lightning size={16} weight="fill" className="text-amber-800" />
                        <span>⚡ Excursion</span>
                    </button>

                    <button
                        onClick={() => {
                            playChime('tap');
                            setTripModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-paper-900 font-extrabold text-xs sm:text-sm border-2 border-paper-900 shadow-stamp transition-all active:scale-95 cursor-pointer"
                        title="Generate New Multi-Day Itinerary with AI"
                    >
                        <Sparkle size={18} weight="fill" className="text-watercolor-brick" />
                        <span>+ New Trip</span>
                    </button>

                    <button
                        onClick={handleQuickAction}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-watercolor-green hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm border-2 border-paper-900 shadow-stamp transition-all active:scale-95 cursor-pointer"
                    >
                        <PlusCircle size={18} weight="bold" className="text-amber-200" />
                        <span>
                            {appMode === 'on-trip'
                                ? 'Edit Itinerary'
                                : currentStage === 'planner'
                                ? 'Save & Launch Map'
                                : currentStage === 'plans'
                                ? 'Open Map'
                                : 'Back to Trips'}
                        </span>
                    </button>
                </div>
            </header>

            {/* Quick Excursion Modal */}
            <QuickExcursionModal
                isOpen={isExcursionModalOpen}
                onClose={() => setIsExcursionModalOpen(false)}
            />
        </>
    );
};