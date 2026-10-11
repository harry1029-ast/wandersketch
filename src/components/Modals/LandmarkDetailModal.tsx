'use client';

import React from 'react';
import { Landmark } from '@/types/itinerary';
import { playChime, playVoiceNarrator } from '@/lib/audio';
import { isCommercialChain } from '@/lib/chainBrands';
import { X, SpeakerHigh, Lightbulb, Camera, Coins, Trash } from '@phosphor-icons/react';

interface LandmarkDetailModalProps {
    landmark: Landmark | null;
    onClose: () => void;
    onRecordExpense?: () => void;
    onAddToRoute?: () => void;
    onDeleteSpot?: (id: string) => void;
    isInRoute?: boolean;
}

export const LandmarkDetailModal: React.FC<LandmarkDetailModalProps> = ({
    landmark,
    onClose,
    onRecordExpense,
    onAddToRoute,
    onDeleteSpot,
    isInRoute = false,
}) => {
    if (!landmark) return null;

    const isChain = isCommercialChain(landmark.name);
    const displayTag = isChain && landmark.tag === 'CAFE' ? 'COFFEE' : landmark.tag;
    const displayDesc = isChain && landmark.desc.includes('Artisan cafe') ? 'Coffee & quick refreshments' : landmark.desc;
    const displayTip = isChain && landmark.tips?.includes('Artisan cafe') ? 'Quick refreshments & cafe seating' : landmark.tips;

    const handlePlayVoice = () => {
        playChime('tap');
        playVoiceNarrator(`${landmark.name}. ${landmark.audioNote}`);
    };

    return (
        <div className="absolute bottom-6 right-6 z-30 w-88 max-w-[calc(100vw-3rem)] rounded-3xl bg-paper-50 border-3 border-paper-900 p-4 shadow-float transition-all select-none">
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-12 h-12 p-1 rounded-2xl bg-paper-100 border-2 border-paper-900 shrink-0 flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: landmark.svgSnippet }}
                    />
                    <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-watercolor-brick text-white uppercase tracking-wider font-mono">
                            {displayTag}
                        </span>
                        <h3 className="font-black text-paper-900 text-base font-serif leading-tight mt-1">
                            {landmark.name}
                        </h3>
                    </div>
                </div>
                <button onClick={onClose} className="text-paper-800 hover:text-paper-900 p-1">
                    <X size={18} weight="bold" />
                </button>
            </div>

            <p className="text-xs text-paper-800 leading-relaxed mb-3">
                {displayDesc}
            </p>

            <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200 mb-3 text-xs text-paper-900">
                <div className="font-bold flex items-center gap-1 text-amber-900 mb-0.5">
                    <Lightbulb size={14} weight="fill" />
                    <span>Visiting Tip</span>
                </div>
                <p className="text-[11px] text-paper-800">{displayTip}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-paper-300 gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {onAddToRoute && (
                        isInRoute ? (
                            <span className="px-2 py-1 bg-amber-100 text-amber-950 rounded-xl font-bold text-xs border border-amber-300 flex items-center gap-1">
                                ✓ In Route
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    playChime('stamp');
                                    onAddToRoute();
                                }}
                                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-paper-900 rounded-xl font-bold text-xs border border-paper-900 shadow-xs flex items-center gap-1 transition active:scale-95"
                                title="Add this landmark as a stop in your walking route"
                            >
                                <span>➕ Add to Route</span>
                            </button>
                        )
                    )}
                    {onRecordExpense && (
                        <button
                            type="button"
                            onClick={onRecordExpense}
                            className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 rounded-xl font-bold text-xs border border-paper-900 shadow-xs flex items-center gap-1 transition active:scale-95"
                            title="Record actual spend for this landmark"
                        >
                            <Coins size={14} weight="bold" className="text-emerald-700" />
                            <span>Record</span>
                        </button>
                    )}
                    {onDeleteSpot && (landmark.isCustom || landmark.tag === 'Personal Spot') && (
                        <button
                            type="button"
                            onClick={() => {
                                playChime('tap');
                                onDeleteSpot(landmark.id);
                            }}
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-xl font-bold text-xs border border-red-300 shadow-xs flex items-center gap-1 transition active:scale-95"
                            title="Delete this personal spot"
                        >
                            <Trash size={13} weight="bold" />
                            <span>Delete</span>
                        </button>
                    )}
                </div>
                <button
                    onClick={handlePlayVoice}
                    className="px-3 py-1 bg-watercolor-brick hover:bg-red-700 text-white rounded-xl font-bold text-xs border border-paper-900 shadow-stamp flex items-center gap-1.5 transition active:scale-95 shrink-0"
                >
                    <SpeakerHigh size={15} weight="fill" />
                    <span>Audio</span>
                </button>
            </div>
        </div>
    );
};