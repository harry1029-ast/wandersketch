'use client';

import React, { useState } from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { MASTER_ZONES } from '@/lib/mockData';
import { playChime } from '@/lib/audio';
import { ScenicZoneKey } from '@/types/itinerary';
import {
    Sparkle,
    MapPin,
    CaretUp,
    CaretDown,
    Trash,
    Plus,
    Coffee,
    ArrowCounterClockwise
} from '@phosphor-icons/react';
import { SpotSearchAutocomplete } from '@/components/SpotSearchAutocomplete';

export const PlannerView: React.FC = () => {
    const {
        plannerBuffer,
        updatePlannerZone,
        reorderPlannerStops,
        removePlannerStop,
        addPlannerCustomStop,
        savePlannerAsNewPlan,
        setStage,
    } = useItineraryStore();

    const [planTitle, setPlanTitle] = useState(plannerBuffer.title);

    const zone = MASTER_ZONES[plannerBuffer.zoneKey];
    const orderedLandmarks = plannerBuffer.spotIds
        .map((id) => zone.landmarksPool.find((l) => l.id === id))
        .filter(Boolean);

    const handleZoneSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        playChime('tap');
        const newZone = e.target.value as ScenicZoneKey;
        updatePlannerZone(newZone);
        setPlanTitle(`Explore ${MASTER_ZONES[newZone].name}`);
    };

    const handleAddPresetCoffee = async () => {
        playChime('stamp');
        const available = zone.landmarksPool.find((l) => !plannerBuffer.spotIds.includes(l.id));
        if (available) {
            await addPlannerCustomStop(available.name, available.coords, available.desc);
        }
    };

    const handleRestoreDefaults = () => {
        playChime('tap');
        updatePlannerZone(plannerBuffer.zoneKey);
    };

    const handleSaveAndLaunch = () => {
        playChime('stamp');
        savePlannerAsNewPlan();
    };

    return (
        <section className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-rice-paper">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Step 1 Banner */}
                <div className="relative bg-paper-100 border-3 border-paper-900 rounded-3xl p-6 shadow-card overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-watercolor-brick text-white uppercase tracking-wider font-mono">
                                Step 1 · Curate & Order Waypoints
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-paper-900 font-serif mt-2">
                                Draft Your Travel Story
                            </h2>
                            <p className="text-xs sm:text-sm text-paper-800 mt-1 max-w-xl leading-relaxed">
                                Choose your destination district and adjust stops. When ready, click <b>Save & Open Map</b> to generate your custom illustrated guide.
                            </p>
                        </div>
                        <button
                            onClick={handleSaveAndLaunch}
                            className="px-5 py-2.5 bg-watercolor-brick hover:bg-red-700 text-white font-black text-sm rounded-2xl border-2 border-paper-900 shadow-stamp flex items-center gap-2 transition active:scale-95 shrink-0"
                        >
                            <Sparkle size={18} weight="fill" className="text-amber-200" />
                            <span>Save & Launch Map ➔</span>
                        </button>
                    </div>
                </div>

                {/* Plan Metadata Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 bg-paper-50 border-2 border-paper-900 rounded-2xl p-4 shadow-sm">
                        <label className="block text-xs font-black text-paper-900 uppercase mb-1">
                            Itinerary Title
                        </label>
                        <input
                            type="text"
                            value={planTitle}
                            onChange={(e) => setPlanTitle(e.target.value)}
                            className="w-full bg-paper-100 border-2 border-paper-300 focus:border-paper-900 rounded-xl px-3 py-2 text-sm font-bold text-paper-900 focus:outline-none"
                        />
                    </div>

                    <div className="bg-paper-50 border-2 border-paper-900 rounded-2xl p-4 shadow-sm">
                        <label className="block text-xs font-black text-paper-900 uppercase mb-1">
                            Destination District
                        </label>
                        <select
                            value={plannerBuffer.zoneKey}
                            onChange={handleZoneSelect}
                            className="w-full bg-paper-100 border-2 border-paper-300 focus:border-paper-900 rounded-xl px-3 py-2 text-sm font-bold text-paper-900 focus:outline-none cursor-pointer"
                        >
                            <option value="toronto_distillery">Toronto · Historic Distillery & Waterfront</option>
                            <option value="kyoto_higashiyama">Kyoto · Higashiyama Temple Walk</option>
                            <option value="paris_marais">Paris · Le Marais Courtyards</option>
                        </select>
                    </div>
                </div>

                {/* Ordered Stops List */}
                <div className="bg-paper-100 border-2 border-paper-900 rounded-3xl p-5 shadow-card space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-paper-200 pb-3">
                        <div>
                            <h3 className="font-black text-lg text-paper-900 font-serif flex items-center gap-2">
                                <MapPin size={20} weight="fill" className="text-watercolor-brick" />
                                <span>Selected Stops Sequence</span>
                            </h3>
                            <p className="text-xs text-paper-800">
                                Move stops up or down to plan your walking sequence.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleAddPresetCoffee}
                                className="px-2.5 py-1 rounded-xl bg-paper-200 border border-paper-900 text-xs font-bold hover:bg-paper-300 transition flex items-center gap-1"
                            >
                                <Coffee size={14} />
                                <span>+ Add Cafe Break</span>
                            </button>
                            <button
                                onClick={handleRestoreDefaults}
                                className="px-2.5 py-1 rounded-xl bg-paper-200 border border-paper-900 text-xs font-bold hover:bg-paper-300 transition flex items-center gap-1"
                            >
                                <ArrowCounterClockwise size={14} />
                                <span>Reset</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {orderedLandmarks.map((landmark, index) => {
                            if (!landmark) return null;
                            return (
                                <div
                                    key={landmark.id}
                                    className="flex items-center justify-between p-3 bg-paper-50 border-2 border-paper-900 rounded-2xl shadow-sm hover:border-watercolor-brick transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-7 h-7 rounded-full bg-watercolor-brick text-white font-black text-xs flex items-center justify-center shadow-stamp">
                                            {index + 1}
                                        </span>
                                        <div
                                            className="w-9 h-9 p-0.5 rounded-xl bg-paper-100 border border-paper-900 flex items-center justify-center shrink-0"
                                            dangerouslySetInnerHTML={{ __html: landmark.svgSnippet }}
                                        />
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 font-mono">
                                                    {landmark.tag}
                                                </span>
                                                <h4 className="font-extrabold text-paper-900 text-sm font-serif">
                                                    {landmark.name}
                                                </h4>
                                            </div>
                                            <p className="text-[11px] text-paper-800 line-clamp-1">
                                                {landmark.desc}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => reorderPlannerStops(index, index - 1)}
                                            disabled={index === 0}
                                            className={`p-1.5 rounded-lg text-paper-900 ${index === 0 ? 'opacity-30' : 'hover:bg-paper-200'
                                                }`}
                                            title="Move Up"
                                        >
                                            <CaretUp size={16} weight="bold" />
                                        </button>
                                        <button
                                            onClick={() => reorderPlannerStops(index, index + 1)}
                                            disabled={index === orderedLandmarks.length - 1}
                                            className={`p-1.5 rounded-lg text-paper-900 ${index === orderedLandmarks.length - 1 ? 'opacity-30' : 'hover:bg-paper-200'
                                                }`}
                                            title="Move Down"
                                        >
                                            <CaretDown size={16} weight="bold" />
                                        </button>
                                        <button
                                            onClick={() => removePlannerStop(index)}
                                            className="p-1.5 hover:bg-red-100 text-watercolor-brick rounded-lg"
                                            title="Remove Stop"
                                        >
                                            <Trash size={16} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add Custom Spot Field */}
                    <div className="pt-2">
                        <SpotSearchAutocomplete
                            currentZone={zone}
                            onSelectSpot={async (name, coords, address) => {
                                playChime('stamp');
                                await addPlannerCustomStop(name, coords, address);
                            }}
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setStage('plans')}
                            className="px-5 py-2.5 bg-paper-200 hover:bg-paper-300 text-paper-900 font-bold text-xs sm:text-sm rounded-2xl border-2 border-paper-900"
                        >
                            Cancel & View Plans
                        </button>
                        <button
                            onClick={handleSaveAndLaunch}
                            className="px-6 py-2.5 bg-watercolor-brick hover:bg-red-700 text-white font-black text-xs sm:text-sm rounded-2xl border-2 border-paper-900 shadow-stamp flex items-center gap-2 transition active:scale-95"
                        >
                            <Sparkle size={18} weight="fill" className="text-amber-200" />
                            <span>Save & Open Illustrated Map</span>
                        </button>
                    </div>

                </div>
            </div>
        </section>
    );
};