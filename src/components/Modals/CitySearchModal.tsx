'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass, SpinnerGap, MapPin, X, AirplaneTakeoff, Sparkle } from '@phosphor-icons/react';
import { playChime } from '@/lib/audio';

interface CityResult {
    placeId: number;
    name: string;
    displayName: string;
    coords: [number, number];
    city: string;
    country: string;
    boundingbox?: [[number, number], [number, number]];
}

interface CitySearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCity: (cityData: {
        name: string;
        city: string;
        coords: [number, number];
        bounds?: [[number, number], [number, number]];
    }) => void;
}

const POPULAR_WORLD_CITIES = [
    { name: 'Hong Kong', country: 'Hong Kong', coords: [22.3812, 114.1888] as [number, number], emoji: '🏙️' },
    { name: 'New York', country: 'United States', coords: [40.7128, -74.006] as [number, number], emoji: '🗽' },
    { name: 'London', country: 'United Kingdom', coords: [51.5074, -0.1278] as [number, number], emoji: '🇬🇧' },
    { name: 'Tokyo', country: 'Japan', coords: [35.6762, 139.6503] as [number, number], emoji: '🗼' },
    { name: 'Rome', country: 'Italy', coords: [41.9028, 12.4964] as [number, number], emoji: '🏛️' },
    { name: 'Paris', country: 'France', coords: [48.8566, 2.3522] as [number, number], emoji: '🥐' },
    { name: 'Kyoto', country: 'Japan', coords: [35.0116, 135.7681] as [number, number], emoji: '⛩️' },
    { name: 'Toronto', country: 'Canada', coords: [43.6532, -79.3832] as [number, number], emoji: '🍁' },
    { name: 'Barcelona', country: 'Spain', coords: [41.3879, 2.1699] as [number, number], emoji: '🏰' },
    { name: 'Sydney', country: 'Australia', coords: [-33.8688, 151.2093] as [number, number], emoji: '⛵' },
    { name: 'Seoul', country: 'South Korea', coords: [37.5665, 126.978] as [number, number], emoji: '🏯' },
];

export const CitySearchModal: React.FC<CitySearchModalProps> = ({
    isOpen,
    onClose,
    onSelectCity,
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CityResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults([]);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&type=city`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.results || []);
                }
            } catch (err) {
                console.error('Failed to search cities:', err);
            } finally {
                setIsSearching(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [query]);

    if (!isOpen) return null;

    const handlePickPreset = (c: typeof POPULAR_WORLD_CITIES[0]) => {
        playChime('stamp');
        onSelectCity({
            name: `${c.name} Exploration`,
            city: c.name,
            coords: c.coords,
        });
        onClose();
    };

    const handlePickResult = (r: CityResult) => {
        playChime('stamp');
        const cityName = r.city || r.name;
        onSelectCity({
            name: `${cityName} Exploration`,
            city: cityName,
            coords: r.coords,
            bounds: r.boundingbox,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-paper-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-paper-100 border-3 border-paper-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-float relative flex flex-col space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-paper-300 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-400 text-paper-900 border-2 border-paper-900 flex items-center justify-center shadow-stamp shrink-0">
                            <AirplaneTakeoff size={22} weight="fill" />
                        </div>
                        <div>
                            <h3 className="font-serif font-black text-lg sm:text-xl text-paper-900 leading-tight">
                                Explore Any World City
                            </h3>
                            <p className="text-xs text-paper-800">
                                Travel anywhere on earth with hand-drawn cartography
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl hover:bg-paper-200 text-paper-700 transition"
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="relative flex items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search city, town, or capital (e.g. Barcelona, Seoul, Sydney)..."
                        className="w-full pl-10 pr-10 py-3 bg-paper-50 border-2 border-paper-900 rounded-2xl text-sm font-serif font-bold text-paper-900 placeholder:text-paper-700/60 focus:outline-none focus:ring-2 focus:ring-watercolor-brick"
                    />
                    <MagnifyingGlass
                        size={18}
                        weight="bold"
                        className="absolute left-3.5 text-paper-700 pointer-events-none"
                    />
                    {isSearching && (
                        <SpinnerGap
                            size={18}
                            className="absolute right-3.5 animate-spin text-watercolor-brick pointer-events-none"
                        />
                    )}
                </div>

                {/* Popular Presets */}
                {results.length === 0 && (
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-1.5 text-xs font-black uppercase text-paper-700 tracking-wider">
                            <Sparkle size={14} weight="fill" className="text-amber-600" />
                            <span>Popular Global Destinations</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {POPULAR_WORLD_CITIES.map((c) => (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => handlePickPreset(c)}
                                    className="p-2.5 rounded-xl bg-paper-50 hover:bg-amber-100 border-2 border-paper-400 hover:border-paper-900 text-left transition flex items-center gap-2 group cursor-pointer shadow-2xs"
                                >
                                    <span className="text-lg">{c.emoji}</span>
                                    <div className="min-w-0">
                                        <div className="font-bold text-xs text-paper-900 group-hover:text-amber-950 truncate">
                                            {c.name}
                                        </div>
                                        <div className="text-[10px] text-paper-600 truncate">
                                            {c.country}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Live Search Results */}
                {results.length > 0 && (
                    <div className="max-h-64 overflow-y-auto space-y-1.5 divide-y divide-paper-200 border-2 border-paper-900 rounded-2xl bg-paper-50 p-2">
                        {results.map((r) => (
                            <button
                                key={r.placeId}
                                type="button"
                                onClick={() => handlePickResult(r)}
                                className="w-full p-2.5 text-left hover:bg-paper-100 rounded-xl flex items-center justify-between gap-2 transition group cursor-pointer"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-watercolor-brick text-white flex items-center justify-center shrink-0">
                                        <MapPin size={15} weight="fill" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-black text-xs text-paper-900 truncate">
                                            {r.city || r.name}
                                        </div>
                                        <div className="text-[10px] text-paper-700 truncate">
                                            {r.displayName}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-paper-600 shrink-0 bg-paper-200 px-2 py-0.5 rounded-md group-hover:bg-watercolor-brick group-hover:text-white transition">
                                    Fly ✈
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

