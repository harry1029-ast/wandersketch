'use client';

import React from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { MASTER_ZONES } from '@/lib/mockData';
import { Landmark, RouteTheme } from '@/types/itinerary';
import { playChime, playVoiceNarrator } from '@/lib/audio';
import {
    ArrowLeft,
    Play,
    Stop,
    SpeakerHigh,
    PencilSimple,
    Faders,
    Crosshair,
} from '@phosphor-icons/react';

interface GuideDrawerProps {
    onSelectLandmark: (landmark: Landmark) => void;
    isCruiseActive: boolean;
    onToggleCruise: () => void;
    onResetLocation: () => void;
    filterRestrooms: boolean;
    setFilterRestrooms: (val: boolean) => void;
    filterCafes: boolean;
    setFilterCafes: (val: boolean) => void;
}

export const GuideDrawer: React.FC<GuideDrawerProps> = ({
    onSelectLandmark,
    isCruiseActive,
    onToggleCruise,
    onResetLocation,
    filterRestrooms,
    setFilterRestrooms,
    filterCafes,
    setFilterCafes,
}) => {
    const { activePlanId, savedPlans, setStage, updateActivePlanTheme } = useItineraryStore();

    const plan = savedPlans.find((p) => p.id === activePlanId) || savedPlans[0];
    const zone = MASTER_ZONES[plan?.zoneKey] || MASTER_ZONES.toronto_distillery;
    const orderedLandmarks = (plan?.spotIds || [])
        .map((id) => zone.landmarksPool.find((l) => l.id === id))
        .filter(Boolean) as Landmark[];

    const handleThemeChange = (theme: RouteTheme) => {
        playChime('stamp');
        updateActivePlanTheme(theme);
    };

    return (
        <aside className="w-full md:w-[420px] lg:w-[460px] bg-paper-100 border-r-2 border-paper-300 flex flex-col z-20 shadow-xl shrink-0 h-full">
            {/* Top Banner */}
            <div className="p-3.5 border-b-2 border-paper-200 bg-paper-50 space-y-2">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setStage('plans')}
                        className="text-xs font-bold text-paper-800 hover:text-paper-900 flex items-center gap-1 group"
                    >
                        <ArrowLeft size={14} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
                        <span>Back to Plans Library</span>
                    </button>
                    <span className="text-[11px] font-mono text-paper-800">{plan.createdAt}</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h2 className="font-black text-lg text-paper-900 font-serif leading-tight">
                            {plan.title}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-watercolor-brick text-white">
                                {zone.city}
                            </span>
                            <span className="text-[11px] font-bold text-paper-800">Dynamic Guide Active</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setStage('planner')}
                        title="Edit itinerary waypoints"
                        className="p-2 rounded-xl bg-paper-200 hover:bg-paper-300 border border-paper-900 text-xs font-bold text-paper-900 shrink-0"
                    >
                        <PencilSimple size={16} weight="bold" />
                    </button>
                </div>

                {/* Theme Route Switcher */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {(['classic', 'culture', 'rain'] as RouteTheme[]).map((theme) => {
                        const isActive = plan.activeRouteKey === theme;
                        const labels: Record<RouteTheme, string> = {
                            classic: '🌟 Classic',
                            culture: '🎨 Cultural',
                            rain: '☂️ Rain Cover',
                        };
                        return (
                            <button
                                key={theme}
                                onClick={() => handleThemeChange(theme)}
                                className={`px-2 py-1.5 rounded-xl text-xs font-bold border-2 transition-all text-center ${isActive
                                        ? 'border-paper-900 bg-watercolor-navy text-white shadow-sm'
                                        : 'border-paper-300 bg-paper-100 text-paper-900 hover:bg-paper-200'
                                    }`}
                            >
                                {labels[theme]}
                            </button>
                        );
                    })}
                </div>

                {/* Facility Filter Toggles */}
                <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-paper-800 font-bold text-[11px] flex items-center gap-1">
                        <Faders size={14} weight="bold" /> Amenities:
                    </span>
                    <div className="flex items-center gap-2">
                        <label className="cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-md bg-paper-200 border border-paper-300 text-[11px] font-bold">
                            <input
                                type="checkbox"
                                checked={filterRestrooms}
                                onChange={(e) => setFilterRestrooms(e.target.checked)}
                                className="rounded accent-watercolor-brick"
                            />
                            <span>🚻 Restroom</span>
                        </label>
                        <label className="cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-md bg-paper-200 border border-paper-300 text-[11px] font-bold">
                            <input
                                type="checkbox"
                                checked={filterCafes}
                                onChange={(e) => setFilterCafes(e.target.checked)}
                                className="rounded accent-watercolor-brick"
                            />
                            <span>☕ Cafe</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="px-4 py-2 bg-paper-200/90 border-b-2 border-paper-300 flex items-center justify-around text-center text-xs">
                <div>
                    <div className="text-paper-800 text-[10px] font-bold uppercase">Walking Distance</div>
                    <div className="font-black text-watercolor-brick font-serif text-sm">{plan.estimatedDistance}</div>
                </div>
                <div className="w-px h-6 bg-paper-300" />
                <div>
                    <div className="text-paper-800 text-[10px] font-bold uppercase">Duration</div>
                    <div className="font-black text-paper-900 font-serif text-sm">{plan.estimatedDuration}</div>
                </div>
                <div className="w-px h-6 bg-paper-300" />
                <div>
                    <div className="text-paper-800 text-[10px] font-bold uppercase">Waypoints</div>
                    <div className="font-black text-watercolor-green font-serif text-sm">{orderedLandmarks.length} Stops</div>
                </div>
            </div>

            {/* Sequential Spot Cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {orderedLandmarks.map((landmark, index) => (
                    <div
                        key={landmark.id}
                        onClick={() => onSelectLandmark(landmark)}
                        className="group relative bg-paper-50 hover:bg-white border-2 border-paper-900 rounded-2xl p-3.5 transition-all shadow-sm hover:shadow-card cursor-pointer"
                    >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-10 h-10 p-0.5 rounded-xl bg-paper-100 border border-paper-900 shrink-0 flex items-center justify-center"
                                    dangerouslySetInnerHTML={{ __html: landmark.svgSnippet }}
                                />
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-950 border border-paper-900 font-mono">
                                            #{index + 1}
                                        </span>
                                        <span className="text-[11px] font-bold text-watercolor-brick">{landmark.tag}</span>
                                    </div>
                                    <h4 className="font-extrabold text-paper-900 text-sm font-serif leading-tight group-hover:text-watercolor-brick transition-colors">
                                        {landmark.name}
                                    </h4>
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    playChime('tap');
                                    playVoiceNarrator(`${landmark.name}. ${landmark.audioNote}`);
                                }}
                                className="p-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-paper-900 flex items-center gap-1 shrink-0 text-xs font-bold"
                            >
                                <SpeakerHigh size={14} weight="fill" className="text-watercolor-brick" />
                                <span>Audio</span>
                            </button>
                        </div>
                        <p className="text-xs text-paper-800 line-clamp-2 leading-relaxed pl-12">{landmark.desc}</p>
                    </div>
                ))}
            </div>

            {/* Bottom Status & Cruise Control */}
            <div className="p-3 bg-paper-200 border-t-2 border-paper-300 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-watercolor-brick inline-block animate-ping" />
                    <span className="font-bold text-paper-900">
                        {isCruiseActive ? 'Simulated Walk in Progress' : 'Smart Guide Ready'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={onToggleCruise}
                        className={`px-3 py-1 rounded-xl text-white font-bold text-xs border border-paper-900 flex items-center gap-1 shadow-sm transition active:scale-95 ${isCruiseActive ? 'bg-watercolor-brick animate-pulse' : 'bg-watercolor-green hover:bg-emerald-700'
                            }`}
                    >
                        {isCruiseActive ? <Stop size={14} weight="fill" /> : <Play size={14} weight="fill" className="text-amber-200" />}
                        <span>{isCruiseActive ? 'Stop Cruise' : 'Auto Cruise'}</span>
                    </button>
                    <button
                        onClick={onResetLocation}
                        title="Reset location to entrance"
                        className="p-1.5 bg-paper-50 hover:bg-paper-100 text-paper-900 border border-paper-900 rounded-xl font-bold shadow-sm"
                    >
                        <Crosshair size={16} weight="bold" />
                    </button>
                </div>
            </div>
        </aside>
    );
};