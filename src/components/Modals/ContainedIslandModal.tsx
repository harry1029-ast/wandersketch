'use client';

import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import { useItineraryStore } from '@/store/useItineraryStore';
import { MASTER_ZONES } from '@/lib/mockData';
import { playChime, playVoiceNarrator } from '@/lib/audio';
import {
    X,
    PaintBrush,
    Compass,
    Headphones,
    Footprints,
    Clock,
    ArrowRight,
} from '@phosphor-icons/react';

interface ContainedIslandModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ISLAND_ANCHOR_SLOTS = [
    { x: 230, y: 310 },
    { x: 340, y: 220 },
    { x: 450, y: 170 },
    { x: 570, y: 200 },
    { x: 500, y: 330 },
    { x: 380, y: 370 },
    { x: 280, y: 260 },
];

export const ContainedIslandModal: React.FC<ContainedIslandModalProps> = ({
    isOpen,
    onClose,
}) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const { activePlanId, savedPlans, setStage } = useItineraryStore();
    const [activeSpeechTip, setActiveSpeechTip] = useState<string | null>(null);

    const plan = savedPlans.find((p) => p.id === activePlanId) || savedPlans[0];
    const zone = MASTER_ZONES[plan?.zoneKey] || MASTER_ZONES.toronto_distillery;
    const orderedLandmarks = (plan?.spotIds || [])
        .map((id) => zone.landmarksPool.find((l) => l.id === id))
        .filter(Boolean);

    useEffect(() => {
        if (!isOpen || !svgRef.current || orderedLandmarks.length === 0) return;
        const svg = svgRef.current;

        // Clear dynamic drawn elements
        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }

        // Set up SVG Defs for organic shadow & wave patterns
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
      <filter id="islandShadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#3c311f" flood-opacity="0.22" />
      </filter>
      <pattern id="wavePattern" width="24" height="12" patternUnits="userSpaceOnUse">
        <path d="M 0,6 Q 6,0 12,6 T 24,6" fill="none" stroke="#68a3bd" stroke-width="1.2" opacity="0.65" />
      </pattern>
    `;
        svg.appendChild(defs);

        const rc = rough.svg(svg);

        // 1. Surrounding Moat / Water Contour
        const islandOuterMoatPath =
            'M 130,90 C 230,40 570,45 670,95 C 750,140 765,330 690,410 C 610,480 230,475 125,415 C 45,340 50,150 130,90 Z';
        const islandInnerLandPath =
            'M 155,115 C 240,75 550,75 645,115 C 715,150 725,305 660,380 C 585,440 250,440 150,385 C 85,315 85,160 155,115 Z';

        const moat = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        moat.setAttribute('d', islandOuterMoatPath);
        moat.setAttribute('fill', '#8fc1d4');
        moat.setAttribute('stroke', '#2b261b');
        moat.setAttribute('stroke-width', '3');
        moat.setAttribute('filter', 'url(#islandShadow)');
        svg.appendChild(moat);

        const ripples = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        ripples.setAttribute('d', islandOuterMoatPath);
        ripples.setAttribute('fill', 'url(#wavePattern)');
        svg.appendChild(ripples);

        // 2. Inner Landmass Parcel
        const land = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        land.setAttribute('d', islandInnerLandPath);
        land.setAttribute('fill', '#ebdcb8');
        land.setAttribute('stroke', '#2b261b');
        land.setAttribute('stroke-width', '3.5');
        svg.appendChild(land);

        // 3. Botanical Grove (North)
        svg.appendChild(
            rc.path('M 260,110 C 340,90 470,90 530,115 C 500,170 300,165 260,110 Z', {
                fill: '#86ba98',
                fillStyle: 'solid',
                roughness: 1.8,
                stroke: '#2b261b',
                strokeWidth: 2,
            })
        );

        // 4. Cobblestone Main Thoroughfare
        svg.appendChild(
            rc.path('M 210,340 Q 380,260 590,170', {
                stroke: 'rgba(214, 193, 150, 0.95)',
                strokeWidth: 26,
                roughness: 2.2,
                bowing: 2.0,
            })
        );

        // 5. Stylized Tiled Roof Clusters
        const roofPositions: [number, number, number, number, string][] = [
            [280, 180, 48, 30, '#c14937'],
            [350, 160, 42, 28, '#c97a3e'],
            [480, 140, 52, 32, '#a73a2d'],
            [440, 280, 46, 28, '#4a6750'],
            [520, 260, 50, 32, '#c14937'],
        ];

        roofPositions.forEach(([x, y, w, h, col]) => {
            svg.appendChild(
                rc.rectangle(x, y, w, h, {
                    fill: col,
                    fillStyle: 'solid',
                    roughness: 1.4,
                    stroke: '#2b261b',
                    strokeWidth: 2,
                })
            );
            svg.appendChild(
                rc.line(x, y + h / 2, x + w, y + h / 2, {
                    stroke: '#2b261b',
                    strokeWidth: 1.5,
                    roughness: 1.2,
                })
            );
        });

        // 6. Sketched Walking Route Trails
        for (
            let i = 0;
            i < Math.min(orderedLandmarks.length - 1, ISLAND_ANCHOR_SLOTS.length - 1);
            i++
        ) {
            const p1 = ISLAND_ANCHOR_SLOTS[i];
            const p2 = ISLAND_ANCHOR_SLOTS[i + 1];

            // Sand underlay
            svg.appendChild(
                rc.line(p1.x, p1.y + 15, p2.x, p2.y + 15, {
                    roughness: 2.0,
                    stroke: 'rgba(244, 197, 104, 0.75)',
                    strokeWidth: 7,
                    bowing: 2.2,
                })
            );

            // Terracotta dashed pencil route
            svg.appendChild(
                rc.line(p1.x, p1.y + 15, p2.x, p2.y + 15, {
                    roughness: 1.5,
                    stroke: '#c14937',
                    strokeWidth: 2.2,
                    strokeLineDash: [6, 5],
                    bowing: 1.8,
                })
            );

            // Milestone footstep circle
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y + 30) / 2;
            svg.appendChild(
                rc.circle(midX, midY, 6, {
                    fill: '#f4c568',
                    fillStyle: 'solid',
                    roughness: 1.2,
                    stroke: '#2b261b',
                    strokeWidth: 1.2,
                })
            );
        }
    }, [isOpen, plan, orderedLandmarks.length]);

    if (!isOpen || !plan) return null;

    const handleSpotClick = (name: string, audioNote: string) => {
        playChime('tap');
        setActiveSpeechTip(name);
        playVoiceNarrator(`${name}.${audioNote}`);
    };

    const handleLaunchFullMap = () => {
        playChime('stamp');
        onClose();
        setStage('map');
    };

    return (
        <div className="fixed inset-0 z-50 bg-paper-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="relative bg-paper-100 border-4 border-paper-900 rounded-3xl max-w-4xl w-full shadow-2xl p-4 sm:p-6 space-y-4 my-auto">

                {/* Top Header */}
                <div className="flex items-start justify-between border-b-2 border-paper-300 pb-3 gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-watercolor-brick text-white uppercase tracking-wider font-mono">
                                Stylized Mini-Map · Contained Parcel
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-serif">
                                {zone.city} · {zone.name}
                            </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-paper-900 font-serif mt-1">
                            {plan.title}
                        </h3>
                        <p className="text-xs text-paper-800 mt-0.5">
                            Isolated micro-corridor covering only this itinerary’s points of interest.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-paper-200 hover:bg-paper-300 text-paper-900 border border-paper-900 shrink-0 transition"
                    >
                        <X size={18} weight="bold" />
                    </button>
                </div>

                {/* Toolbar Notice */}
                <div className="flex items-center justify-between text-xs px-1">
                    <div className="flex items-center gap-1.5 font-bold text-watercolor-brick">
                        <PaintBrush size={16} weight="fill" />
                        <span>Organic Watercolor Canvas View</span>
                    </div>
                    <div className="text-[11px] font-bold text-paper-800 flex items-center gap-1">
                        <Headphones size={15} weight="bold" className="text-watercolor-brick" />
                        <span>Tap any landmark to hear the audio guide</span>
                    </div>
                </div>

                {/* Contained Island Canvas Area */}
                <div className="relative rounded-2xl border-3 border-paper-900 overflow-hidden bg-[#f7f2e4] h-[340px] sm:h-[400px] shadow-inner select-none flex items-center justify-center">
                    <svg
                        ref={svgRef}
                        viewBox="0 0 800 500"
                        className="w-full h-full"
                        preserveAspectRatio="xMidYMid meet"
                    />

                    {/* Interactive Scaled POI Pins */}
                    <div className="absolute inset-0 pointer-events-none">
                        {orderedLandmarks.map((lm, idx) => {
                            if (!lm) return null;
                            const slot = ISLAND_ANCHOR_SLOTS[idx % ISLAND_ANCHOR_SLOTS.length];
                            const leftPercent = (slot.x / 800) * 100;
                            const topPercent = (slot.y / 500) * 100;

                            return (
                                <div
                                    key={lm.id}
                                    onClick={() => handleSpotClick(lm.name, lm.audioNote)}
                                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                                    className="absolute pointer-events-auto cursor-pointer group flex flex-col items-center -translate-x-1/2 -translate-y-full hover:scale-115 transition-transform"
                                >
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-watercolor-brick text-white rounded-full border border-white font-black text-[9px] flex items-center justify-center shadow-stamp z-30 group-hover:bg-amber-500 transition-colors">
                                        {idx + 1}
                                    </span>

                                    <div
                                        className="w-8 h-8 sm:w-9 sm:h-9 p-0.5 rounded-xl bg-paper-50 border-[1.5px] border-paper-900 shadow-stamp flex items-center justify-center group-hover:border-watercolor-brick transition-all"
                                        dangerouslySetInnerHTML={{ __html: lm.svgSnippet }}
                                    />

                                    <div className="mt-0.5 px-1.5 py-0.5 rounded-md bg-paper-50/95 border border-paper-900 shadow-sm text-[9px] font-black text-paper-900 whitespace-nowrap max-w-[85px] truncate font-serif group-hover:bg-amber-100">
                                        {lm.name.split(' ')[0]}
                                    </div>

                                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 bg-paper-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap z-40">
                                        🎧 Listen · {lm.tag}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Compass Stamp */}
                    <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-paper-50/95 border-2 border-paper-900 flex items-center justify-center pointer-events-none opacity-90 shadow-sm">
                        <Compass size={22} weight="fill" className="text-watercolor-brick" />
                    </div>

                    {/* Active Audio Banner */}
                    {activeSpeechTip && (
                        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-paper-900/90 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                            <Headphones size={14} className="text-amber-300" />
                            <span>Narrating: {activeSpeechTip}</span>
                        </div>
                    )}
                </div>

                {/* Waypoints Sequence Carousel */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-extrabold text-xs text-paper-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Footprints size={14} className="text-watercolor-brick" />
                            <span>Itinerary Flow & Walking Breakdown</span>
                        </h4>
                        <span className="text-xs font-bold text-watercolor-brick font-serif flex items-center gap-2">
                            <span className="flex items-center gap-1">
                                <Footprints size={12} /> {plan.estimatedDistance}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={12} /> {plan.estimatedDuration}
                            </span>
                        </span>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {orderedLandmarks.map((lm, index) => {
                            if (!lm) return null;
                            return (
                                <React.Fragment key={lm.id}>
                                    <div
                                        onClick={() => handleSpotClick(lm.name, lm.audioNote)}
                                        className="flex items-center gap-2 p-2 bg-paper-50 rounded-2xl border-2 border-paper-900 shrink-0 shadow-sm hover:border-watercolor-brick cursor-pointer transition"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-xl bg-paper-100 border border-paper-900 p-0.5 flex items-center justify-center shrink-0"
                                            dangerouslySetInnerHTML={{ __html: lm.svgSnippet }}
                                        />
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-4 h-4 bg-watercolor-brick text-white rounded-full flex items-center justify-center text-[9px] font-black">
                                                    {index + 1}
                                                </span>
                                                <span className="text-xs font-bold text-paper-900 truncate max-w-[110px] font-serif">
                                                    {lm.name.split(' ')[0]}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-paper-700">{lm.tag}</span>
                                        </div>
                                    </div>

                                    {index < orderedLandmarks.length - 1 && (
                                        <div className="flex flex-col items-center justify-center shrink-0 px-1 text-[10px] font-bold text-paper-700">
                                            <span>~4-6 min</span>
                                            <ArrowRight size={14} className="text-watercolor-brick" />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-between pt-2 border-t-2 border-paper-300">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-paper-200 hover:bg-paper-300 rounded-xl text-xs font-bold text-paper-900 border border-paper-900"
                    >
                        Close
                    </button>

                    <button
                        onClick={handleLaunchFullMap}
                        className="px-5 py-2 bg-watercolor-brick hover:bg-red-700 text-white rounded-xl text-xs font-black border-2 border-paper-900 shadow-stamp flex items-center gap-1.5 transition active:scale-95"
                    >
                        <Compass size={16} weight="bold" />
                        <span>Launch Full Guided Map ➔</span>
                    </button>
                </div>

            </div>
        </div>
    );
};