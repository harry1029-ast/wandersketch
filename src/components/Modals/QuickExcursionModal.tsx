'use client';

import React, { useState } from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { playChime } from '@/lib/audio';
import { MASTER_ZONES } from '@/lib/mockData';
import { ScenicZoneKey } from '@/types/itinerary';
import {
    X,
    Lightning,
    MapPin,
    CheckCircle,
    Footprints,
    Bed,
    ForkKnife,
    Ticket,
} from '@phosphor-icons/react';

interface QuickExcursionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QuickExcursionModal: React.FC<QuickExcursionModalProps> = ({ isOpen, onClose }) => {
    const { createQuickExcursion } = useItineraryStore();
    const [selectedZone, setSelectedZone] = useState<ScenicZoneKey>('kyoto_higashiyama');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const zone = MASTER_ZONES[selectedZone];

    const handleCreate = async () => {
        setIsSubmitting(true);
        playChime('stamp');
        try {
            await createQuickExcursion(selectedZone);
            onClose();
        } catch (err) {
            console.error('Failed to create quick excursion:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-paper-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-paper-100 border-3 border-paper-900 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-float relative flex flex-col space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-paper-300 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-400 text-paper-900 border-2 border-paper-900 flex items-center justify-center shadow-stamp shrink-0">
                            <Lightning size={22} weight="fill" className="text-paper-900" />
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-paper-900 font-serif leading-tight">
                                Quick 1-Day Excursion
                            </h3>
                            <p className="text-xs text-paper-800">
                                Launch an instant single-day trip & walking route with 1 click
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl hover:bg-paper-200 text-paper-700 transition"
                    >
                        <X size={18} weight="bold" />
                    </button>
                </div>

                {/* City Picker Cards */}
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-paper-900 tracking-wider">
                        Choose Destination District
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {(Object.keys(MASTER_ZONES) as ScenicZoneKey[]).map((zk) => {
                            const z = MASTER_ZONES[zk];
                            const isSelected = selectedZone === zk;
                            return (
                                <button
                                    key={zk}
                                    type="button"
                                    onClick={() => {
                                        playChime('tap');
                                        setSelectedZone(zk);
                                    }}
                                    className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-2 ${
                                        isSelected
                                            ? 'bg-amber-100 border-paper-900 shadow-stamp ring-2 ring-amber-400'
                                            : 'bg-paper-50 hover:bg-paper-200 border-paper-400 text-paper-800'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-paper-200 text-paper-900 font-mono">
                                                {z.city}
                                            </span>
                                            {isSelected && (
                                                <CheckCircle size={16} weight="fill" className="text-amber-700" />
                                            )}
                                        </div>
                                        <h4 className="font-serif font-black text-xs text-paper-900 mt-1 line-clamp-1">
                                            {z.name.replace(z.city, '').trim()}
                                        </h4>
                                    </div>
                                    <span className="text-[10px] text-paper-700 font-bold">
                                        {z.landmarksPool.length} hand-picked POIs
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Excursion Highlights Preview */}
                <div className="bg-paper-50 border-2 border-paper-900 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-paper-900">
                        <span className="flex items-center gap-1.5">
                            <MapPin size={16} weight="fill" className="text-watercolor-brick" />
                            <span>Included in this Excursion:</span>
                        </span>
                        <span className="font-mono text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                            $350 Estimated Budget
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-paper-800 pt-1 border-t border-paper-200">
                        <div className="flex items-center gap-1.5">
                            <Bed size={15} weight="bold" className="text-indigo-800 shrink-0" />
                            <span className="line-clamp-1">Curated district lodging</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Footprints size={15} weight="bold" className="text-watercolor-brick shrink-0" />
                            <span className="line-clamp-1">4 signature waypoints</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <ForkKnife size={15} weight="bold" className="text-amber-800 shrink-0" />
                            <span className="line-clamp-1">Artisan lunch & dinner</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Ticket size={15} weight="bold" className="text-teal-800 shrink-0" />
                            <span className="line-clamp-1">OSRM pedestrian route</span>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-2xl bg-paper-200 hover:bg-paper-300 text-paper-900 font-bold text-xs border border-paper-700"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-paper-900 font-black text-xs sm:text-sm border-2 border-paper-900 shadow-stamp flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
                    >
                        <Lightning size={18} weight="fill" className="text-paper-900" />
                        <span>{isSubmitting ? 'Creating Excursion...' : `Launch 1-Day Excursion in ${zone.city}`}</span>
                    </button>
                </div>

            </div>
        </div>
    );
};

