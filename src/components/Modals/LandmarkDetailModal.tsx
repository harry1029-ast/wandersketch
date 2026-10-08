'use client';

import React from 'react';
import { Landmark } from '@/types/itinerary';
import { playChime, playVoiceNarrator } from '@/lib/audio';
import { X, SpeakerHigh, Lightbulb, Camera, Coins } from '@phosphor-icons/react';

interface LandmarkDetailModalProps {
    landmark: Landmark | null;
    onClose: () => void;
    onRecordExpense?: () => void;
}

export const LandmarkDetailModal: React.FC<LandmarkDetailModalProps> = ({
    landmark,
    onClose,
    onRecordExpense,
}) => {
    if (!landmark) return null;

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
                            {landmark.tag}
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
                {landmark.desc}
            </p>

            <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200 mb-3 text-xs text-paper-900">
                <div className="font-bold flex items-center gap-1 text-amber-900 mb-0.5">
                    <Lightbulb size={14} weight="fill" />
                    <span>Visiting Tip</span>
                </div>
                <p className="text-[11px] text-paper-800">{landmark.tips}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-paper-300">
                <div className="flex items-center gap-1.5">
                    {onRecordExpense && (
                        <button
                            type="button"
                            onClick={onRecordExpense}
                            className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 rounded-xl font-bold text-xs border border-paper-900 shadow-xs flex items-center gap-1 transition active:scale-95"
                            title="Record actual spend for this landmark"
                        >
                            <Coins size={14} weight="bold" className="text-emerald-700" />
                            <span>Record</span>
                        </button>
                    )}
                    <span className="text-[11px] font-bold text-paper-700 flex items-center gap-1">
                        <Camera size={14} /> Photo Landmark
                    </span>
                </div>
                <button
                    onClick={handlePlayVoice}
                    className="px-3.5 py-1.5 bg-watercolor-brick hover:bg-red-700 text-white rounded-xl font-bold text-xs border border-paper-900 shadow-stamp flex items-center gap-1.5 transition active:scale-95"
                >
                    <SpeakerHigh size={15} weight="fill" />
                    <span>Play Audio Guide</span>
                </button>
            </div>
        </div>
    );
};