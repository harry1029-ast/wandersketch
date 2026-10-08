'use client';

import React, { useState } from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { playChime } from '@/lib/audio';
import { MASTER_ZONES } from '@/lib/mockData';
import {
    X,
    Sparkle,
    MapPin,
    CalendarBlank,
    Users,
    CurrencyDollar,
    Bed,
    ForkKnife,
    SneakerMove,
    Buildings,
    CircleNotch,
    Check,
} from '@phosphor-icons/react';

interface TripCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TripCreationModal: React.FC<TripCreationModalProps> = ({ isOpen, onClose }) => {
    const {
        plannerBuffer,
        setItineraryDays,
        setStage,
    } = useItineraryStore();

    // Default dates: Today and 3 days from now
    const todayStr = new Date().toISOString().split('T')[0];
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 2);
    const defaultEndStr = defaultEnd.toISOString().split('T')[0];

    const currentZoneName = MASTER_ZONES[plannerBuffer.zoneKey]?.name || 'Toronto Distillery District';

    const [destination, setDestination] = useState(currentZoneName);
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(defaultEndStr);
    const [partySize, setPartySize] = useState(2);
    const [totalBudget, setTotalBudget] = useState(1500);

    // Preferences
    const [lodgingTier, setLodgingTier] = useState<'budget' | 'comfort' | 'luxury'>('comfort');
    const [diningTastes, setDiningTastes] = useState<string[]>(['Local Specialties', 'Artisan Cafes']);
    const [walkingEndurance, setWalkingEndurance] = useState<'relaxed' | 'moderate' | 'active'>('moderate');
    const [attractionTypes, setAttractionTypes] = useState<string[]>(['Culture & Arts', 'Historic Landmarks']);

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    // Calculate number of days
    const calcDays = () => {
        const s = new Date(startDate);
        const e = new Date(endDate);
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
        const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return Math.max(1, Math.min(14, diff));
    };

    const tripDays = calcDays();
    const dailyPerPerson = Math.round(totalBudget / tripDays / partySize);

    const toggleDiningTaste = (taste: string) => {
        playChime('tap');
        setDiningTastes((prev) =>
            prev.includes(taste) ? prev.filter((t) => t !== taste) : [...prev, taste]
        );
    };

    const toggleAttractionType = (type: string) => {
        playChime('tap');
        setAttractionTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    const handleQuickDest = (name: string) => {
        playChime('tap');
        setDestination(name);
    };

    const handleQuickBudget = (amt: number) => {
        playChime('tap');
        setTotalBudget(amt);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);
        playChime('stamp');

        try {
            const res = await fetch('/api/itinerary/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: destination.trim() || 'Toronto',
                    startDate,
                    endDate,
                    partySize,
                    totalBudget,
                    preferences: {
                        lodgingTier,
                        diningTastes,
                        walkingEndurance,
                        attractionTypes,
                    },
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Generation failed (${res.status})`);
            }

            const data = await res.json();
            if (data.days && Array.isArray(data.days)) {
                setItineraryDays(data.days, totalBudget);
                setStage('planner');
                playChime('stamp');
                onClose();
            } else {
                throw new Error('Received invalid itinerary data from server');
            }
        } catch (err: any) {
            console.error('Failed to generate trip:', err);
            setErrorMsg(err.message || 'Could not generate itinerary. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-paper-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-paper-100 border-3 border-paper-900 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-float relative flex flex-col max-h-[92vh] overflow-y-auto">

                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-paper-300">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-watercolor-brick text-white flex items-center justify-center shadow-stamp -rotate-2 border-2 border-paper-900">
                            <Sparkle size={22} weight="fill" className="text-amber-200" />
                        </div>
                        <div>
                            <h2 className="font-serif font-black text-xl text-paper-900 leading-tight">
                                Plan New Journey
                            </h2>
                            <p className="text-xs text-paper-800">
                                AI Hand-Drawn Itinerary & Multi-Day Budget Intake
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            playChime('tap');
                            onClose();
                        }}
                        disabled={isLoading}
                        className="p-1.5 rounded-xl text-paper-700 hover:text-paper-900 hover:bg-paper-200 transition"
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {errorMsg && (
                    <div className="mt-4 p-3 bg-red-100 border-2 border-red-800 rounded-2xl text-xs text-red-950 font-bold">
                        ⚠️ {errorMsg}
                    </div>
                )}

                {/* Intake Form */}
                <form onSubmit={handleSubmit} className="mt-5 space-y-5">

                    {/* 1. Destination Field */}
                    <div className="bg-paper-50 border-2 border-paper-900 rounded-2xl p-4 shadow-sm">
                        <label className="block text-xs font-black text-paper-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <MapPin size={16} weight="fill" className="text-watercolor-brick" />
                            <span>Destination City or District</span>
                        </label>
                        <input
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="e.g. Toronto Distillery District, Kyoto, Paris..."
                            required
                            className="w-full bg-paper-100 border-2 border-paper-300 focus:border-paper-900 rounded-xl px-3.5 py-2 text-sm font-bold text-paper-900 focus:outline-none placeholder:text-paper-700/50"
                        />
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                            <span className="text-[11px] font-bold text-paper-700">Quick Picks:</span>
                            {['Toronto Distillery', 'Kyoto Higashiyama', 'Paris Le Marais', 'Tokyo', 'Rome'].map((dest) => (
                                <button
                                    key={dest}
                                    type="button"
                                    onClick={() => handleQuickDest(dest)}
                                    className="px-2 py-0.5 rounded-lg bg-paper-200 hover:bg-paper-300 border border-paper-900 text-[11px] font-bold text-paper-900 transition"
                                >
                                    {dest}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Dates & Duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="bg-paper-50 border-2 border-paper-900 rounded-2xl p-3.5 shadow-sm">
                            <label className="block text-xs font-black text-paper-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <CalendarBlank size={16} weight="bold" className="text-watercolor-green" />
                                <span>Start Date</span>
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-paper-100 border-2 border-paper-300 focus:border-paper-900 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-paper-900 focus:outline-none"
                            />
                        </div>
                        <div className="bg-paper-50 border-2 border-paper-900 rounded-2xl p-3.5 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-black text-paper-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <CalendarBlank size={16} weight="bold" className="text-watercolor-green" />
                                    <span>End Date</span>
                                </label>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-mono">
                                    {tripDays} {tripDays === 1 ? 'Day' : 'Days'}
                                </span>
                            </div>
                            <input
                                type="date"
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-paper-100 border-2 border-paper-300 focus:border-paper-900 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-paper-900 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* 3. Party Size & Total Budget Ceiling */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Party Size */}
                        <div className="bg-paper-50 border-2 border-paper-900 rounded-2xl p-3.5 shadow-sm">
                            <label className="block text-xs font-black text-paper-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Users size={16} weight="bold" className="text-watercolor-brick" />
                                <span>Party Size</span>
                            </label>
                            <div className="flex items-center justify-between bg-paper-100 border-2 border-paper-300 rounded-xl p-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        playChime('tap');
                                        setPartySize((p) => Math.max(1, p - 1));
                                    }}
                                    className="w-8 h-8 rounded-lg bg-paper-200 hover:bg-paper-300 text-paper-900 font-black text-sm flex items-center justify-center border border-paper-700 active:scale-95 transition"
                                >
                                    -
                                </button>
                                <span className="text-sm font-black text-paper-900 font-serif">
                                    {partySize} {partySize === 1 ? 'Traveler' : 'Travelers'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        playChime('tap');
                                        setPartySize((p) => Math.min(10, p + 1));
                                    }}
                                    className="w-8 h-8 rounded-lg bg-paper-200 hover:bg-paper-300 text-paper-900 font-black text-sm flex items-center justify-center border border-paper-700 active:scale-95 transition"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Budget Input */}
                        <div className="bg-paper-50 border-2 border-paper-900 rounded-2xl p-3.5 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-black text-paper-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <CurrencyDollar size={16} weight="bold" className="text-emerald-700" />
                                    <span>Total Budget</span>
                                </label>
                                <span className="text-[10px] font-bold text-paper-700">
                                    ~${dailyPerPerson}/day ea.
                                </span>
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-paper-700 font-black text-sm">$</span>
                                <input
                                    type="number"
                                    value={totalBudget}
                                    onChange={(e) => setTotalBudget(Math.max(50, Number(e.target.value) || 0))}
                                    step="50"
                                    min="100"
                                    className="w-full bg-paper-100 border-2 border-paper-300 focus:border-paper-900 rounded-xl pl-7 pr-3 py-1.5 text-xs sm:text-sm font-black text-paper-900 focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                                {[800, 1500, 3000, 5000].map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => handleQuickBudget(amt)}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                                            totalBudget === amt
                                                ? 'bg-emerald-700 text-white border-emerald-900'
                                                : 'bg-paper-200 text-paper-900 border-paper-700 hover:bg-paper-300'
                                        }`}
                                    >
                                        ${amt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 4. Preferences Section */}
                    <div className="space-y-3.5 pt-1 border-t-2 border-paper-200">
                        <h4 className="text-xs font-black text-paper-900 uppercase tracking-wider">
                            Trip Style & Preferences
                        </h4>

                        {/* Lodging Tier */}
                        <div>
                            <label className="block text-[11px] font-bold text-paper-800 mb-1.5 flex items-center gap-1">
                                <Bed size={14} className="text-watercolor-brick" />
                                <span>Lodging Tier</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { key: 'budget', label: 'Budget', desc: 'Hostel / Pods' },
                                    { key: 'comfort', label: 'Comfort', desc: 'Boutique Inn' },
                                    { key: 'luxury', label: 'Luxury', desc: '5★ / Heritage' },
                                ].map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => {
                                            playChime('tap');
                                            setLodgingTier(item.key as any);
                                        }}
                                        className={`p-2 rounded-xl text-left border-2 transition ${
                                            lodgingTier === item.key
                                                ? 'bg-watercolor-brick text-white border-paper-900 shadow-sm'
                                                : 'bg-paper-50 text-paper-900 border-paper-300 hover:border-paper-900'
                                        }`}
                                    >
                                        <div className="text-xs font-black">{item.label}</div>
                                        <div className={`text-[10px] ${lodgingTier === item.key ? 'text-amber-100' : 'text-paper-700'}`}>
                                            {item.desc}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dining Tastes */}
                        <div>
                            <label className="block text-[11px] font-bold text-paper-800 mb-1.5 flex items-center gap-1">
                                <ForkKnife size={14} className="text-amber-700" />
                                <span>Dining & Flavors</span>
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    'Local Specialties',
                                    'Fine Dining',
                                    'Vegan / Green',
                                    'Street Food & Markets',
                                    'Artisan Cafes',
                                ].map((taste) => {
                                    const isSelected = diningTastes.includes(taste);
                                    return (
                                        <button
                                            key={taste}
                                            type="button"
                                            onClick={() => toggleDiningTaste(taste)}
                                            className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition ${
                                                isSelected
                                                    ? 'bg-amber-100 text-amber-950 border-paper-900 shadow-xs'
                                                    : 'bg-paper-50 text-paper-800 border-paper-300 hover:border-paper-900'
                                            }`}
                                        >
                                            {isSelected && <Check size={12} weight="bold" />}
                                            <span>{taste}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Walking Endurance */}
                        <div>
                            <label className="block text-[11px] font-bold text-paper-800 mb-1.5 flex items-center gap-1">
                                <SneakerMove size={14} className="text-teal-700" />
                                <span>Walking Pace</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { key: 'relaxed', label: 'Leisurely', desc: 'Relaxed strolls' },
                                    { key: 'moderate', label: 'Moderate', desc: 'Standard walk' },
                                    { key: 'active', label: 'Active', desc: 'Fast & brisk' },
                                ].map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => {
                                            playChime('tap');
                                            setWalkingEndurance(item.key as any);
                                        }}
                                        className={`p-2 rounded-xl text-left border-2 transition ${
                                            walkingEndurance === item.key
                                                ? 'bg-watercolor-green text-white border-paper-900 shadow-sm'
                                                : 'bg-paper-50 text-paper-900 border-paper-300 hover:border-paper-900'
                                        }`}
                                    >
                                        <div className="text-xs font-black">{item.label}</div>
                                        <div className={`text-[10px] ${walkingEndurance === item.key ? 'text-emerald-100' : 'text-paper-700'}`}>
                                            {item.desc}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Attraction Types */}
                        <div>
                            <label className="block text-[11px] font-bold text-paper-800 mb-1.5 flex items-center gap-1">
                                <Buildings size={14} className="text-indigo-700" />
                                <span>Attraction Categories</span>
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    'Culture & Arts',
                                    'Historic Landmarks',
                                    'Nature & Parks',
                                    'Shopping & Boutiques',
                                    'Scenic Panoramas',
                                ].map((att) => {
                                    const isSelected = attractionTypes.includes(att);
                                    return (
                                        <button
                                            key={att}
                                            type="button"
                                            onClick={() => toggleAttractionType(att)}
                                            className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition ${
                                                isSelected
                                                    ? 'bg-indigo-100 text-indigo-950 border-paper-900 shadow-xs'
                                                    : 'bg-paper-50 text-paper-800 border-paper-300 hover:border-paper-900'
                                            }`}
                                        >
                                            {isSelected && <Check size={12} weight="bold" />}
                                            <span>{att}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t-2 border-paper-300 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                playChime('tap');
                                onClose();
                            }}
                            disabled={isLoading}
                            className="px-4 py-2.5 rounded-2xl bg-paper-200 hover:bg-paper-300 text-paper-900 font-bold text-xs sm:text-sm border-2 border-paper-900 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2.5 rounded-2xl bg-watercolor-brick hover:bg-red-700 text-white font-black text-xs sm:text-sm border-2 border-paper-900 shadow-stamp flex items-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <CircleNotch size={18} className="animate-spin" />
                                    <span>Curating Hand-Drawn Journey...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkle size={18} weight="fill" className="text-amber-200" />
                                    <span>Generate Hand-Drawn Itinerary ➔</span>
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

