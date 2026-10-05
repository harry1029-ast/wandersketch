'use client';

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { TravelPlan, Landmark } from '@/types/itinerary';
import { MASTER_ZONES } from '@/lib/mockData';
import { playChime } from '@/lib/audio';
import { X, DownloadSimple, Stamp, Sparkle } from '@phosphor-icons/react';

interface ScrapbookPostcardModalProps {
    plan: TravelPlan;
    onClose: () => void;
}

export const ScrapbookPostcardModal: React.FC<ScrapbookPostcardModalProps> = ({ plan, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const zone = MASTER_ZONES[plan.zoneKey] || MASTER_ZONES.toronto_distillery;
    const planLandmarks = (plan.spotIds || [])
        .map((id) => zone.landmarksPool.find((l) => l.id === id))
        .filter(Boolean) as Landmark[];

    const handleDownloadImage = async () => {
        if (!cardRef.current) return;
        try {
            setIsExporting(true);
            playChime('stamp');

            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 2, // 2x retina sharpness
            });

            const link = document.createElement('a');
            link.download = `wandersketch-${plan.title.toLowerCase().replace(/\s+/g, '-')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to export postcard:', err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-paper-100 border-3 border-paper-900 rounded-3xl max-w-xl w-full p-6 shadow-float relative flex flex-col max-h-[92vh]">
                {/* Modal Controls */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-paper-300">
                    <div className="flex items-center gap-2 text-paper-900">
                        <Stamp size={24} weight="fill" className="text-watercolor-brick" />
                        <h2 className="font-serif font-black text-lg">Scrapbook Travel Postcard</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-xl text-paper-700 hover:text-paper-900 hover:bg-paper-200 transition"
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* Printable Card Canvas Target */}
                <div className="overflow-y-auto my-4 py-2 px-1">
                    <div
                        ref={cardRef}
                        className="bg-paper-50 border-4 border-paper-900 rounded-2xl p-6 shadow-stamp relative select-none overflow-hidden bg-rice-paper"
                        style={{ minHeight: '440px' }}
                    >
                        {/* Washi Tape Accent */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-7 bg-watercolor-brick/25 backdrop-blur-xs border-dashed border-x-2 border-watercolor-brick -rotate-1 pointer-events-none" />

                        {/* Vintage Postmark Header */}
                        <div className="flex justify-between items-start mb-4 pt-2">
                            <div>
                                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-watercolor-terracotta">
                                    ★ WANDERSKETCH EXPEDITION DISPATCH ★
                                </span>
                                <h3 className="font-serif font-black text-2xl text-paper-900 leading-tight mt-0.5">
                                    {plan.title}
                                </h3>
                                <p className="text-xs text-paper-700 font-medium">
                                    {zone.name} · {plan.createdAt}
                                </p>
                            </div>

                            {/* Airmail Circle Stamp */}
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-watercolor-brick/80 flex flex-col items-center justify-center -rotate-12 text-watercolor-brick p-1 shrink-0">
                                <span className="text-[8px] font-mono font-bold tracking-tighter">OFFICIAL DISPATCH</span>
                                <span className="font-black text-xs font-serif">{zone.city}</span>
                                <span className="text-[8px] font-mono">{plan.estimatedDistance}</span>
                            </div>
                        </div>

                        {/* Stops Grid / Polaroids */}
                        <div className="my-4">
                            <div className="text-[11px] font-bold text-paper-800 uppercase tracking-wider mb-2 font-mono flex items-center gap-1">
                                <Sparkle size={13} weight="fill" className="text-amber-600" />
                                <span>Illustrated Itinerary Stops ({planLandmarks.length})</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {planLandmarks.map((lm, idx) => (
                                    <div
                                        key={lm.id}
                                        className="p-2.5 rounded-xl bg-paper-100 border-2 border-paper-900 flex flex-col items-center text-center shadow-xs"
                                    >
                                        <div
                                            className="w-10 h-10 mb-1 flex items-center justify-center shrink-0"
                                            dangerouslySetInnerHTML={{ __html: lm.svgSnippet }}
                                        />
                                        <span className="text-[10px] font-mono font-bold text-watercolor-brick">
                                            Stop #{idx + 1}
                                        </span>
                                        <span className="font-serif font-bold text-xs text-paper-900 truncate w-full">
                                            {lm.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Metric Footer Bar */}
                        <div className="mt-5 pt-3 border-t-2 border-dashed border-paper-300 flex items-center justify-between text-xs text-paper-800">
                            <div className="flex items-center gap-3">
                                <span>
                                    <strong>Distance:</strong> {plan.estimatedDistance}
                                </span>
                                <span>•</span>
                                <span>
                                    <strong>Duration:</strong> {plan.estimatedDuration}
                                </span>
                            </div>
                            <div className="font-mono text-[10px] text-paper-700 italic">
                                #WanderSketchJournal
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end gap-3 pt-2 border-t border-paper-300">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-paper-800 hover:bg-paper-200 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDownloadImage}
                        disabled={isExporting}
                        className="px-4 py-2 rounded-xl bg-watercolor-brick hover:bg-red-700 text-white text-xs font-bold border-2 border-paper-900 shadow-stamp flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                    >
                        <DownloadSimple size={16} weight="bold" />
                        <span>{isExporting ? 'Generating PNG...' : 'Download Postcard (.PNG)'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};