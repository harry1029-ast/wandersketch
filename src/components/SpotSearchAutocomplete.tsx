'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass, SpinnerGap, MapPin, Plus } from '@phosphor-icons/react';
import { ScenicZone } from '@/types/itinerary';

interface SearchResult {
    placeId: number;
    name: string;
    displayName: string;
    category: string;
    coords: [number, number];
}

interface SpotSearchAutocompleteProps {
    currentZone?: ScenicZone;
    onSelectSpot: (name: string, coords: [number, number], address: string) => Promise<void>;
}

export const SpotSearchAutocomplete: React.FC<SpotSearchAutocompleteProps> = ({
    currentZone,
    onSelectSpot,
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // Debounced geocoding search
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                let viewboxParam = '';
                if (currentZone && currentZone.bounds) {
                    const [sw, ne] = currentZone.bounds;
                    // Nominatim viewbox format: left,top,right,bottom -> minLng, maxLat, maxLng, minLat
                    viewboxParam = `&viewbox=${sw[1]},${ne[0]},${ne[1]},${sw[0]}`;
                }

                const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}${viewboxParam}`);
                const data = await res.json();
                setResults(data.results || []);
                setIsOpen(true);
            } catch (err) {
                console.error('Error fetching geocoded places:', err);
            } finally {
                setIsSearching(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [query, currentZone]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = async (item: SearchResult) => {
        setIsOpen(false);
        setQuery('');
        await onSelectSpot(item.name, item.coords, item.displayName);
    };

    return (
        <div ref={dropdownRef} className="relative w-full">
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search real places in ${currentZone?.city || 'the area'}...`}
                    className="w-full pl-9 pr-9 py-2 bg-paper-50 border-2 border-paper-900 rounded-xl text-xs font-serif text-paper-900 placeholder:text-paper-700/60 focus:outline-none focus:ring-2 focus:ring-watercolor-brick"
                />
                <MagnifyingGlass
                    size={16}
                    weight="bold"
                    className="absolute left-3 text-paper-700 pointer-events-none"
                />
                {isSearching && (
                    <SpinnerGap
                        size={16}
                        className="absolute right-3 animate-spin text-watercolor-brick pointer-events-none"
                    />
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-paper-50 border-2 border-paper-900 rounded-2xl shadow-float z-50 overflow-hidden divide-y divide-paper-200">
                    {results.map((item) => (
                        <button
                            key={item.placeId}
                            type="button"
                            onClick={() => handleSelect(item)}
                            className="w-full px-3.5 py-2.5 text-left hover:bg-paper-100 flex items-start justify-between gap-2 transition group"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={13} weight="fill" className="text-watercolor-brick shrink-0" />
                                    <span className="font-bold text-xs text-paper-900 truncate font-serif">
                                        {item.name}
                                    </span>
                                </div>
                                <p className="text-[10px] text-paper-700 truncate mt-0.5 pl-4">
                                    {item.displayName}
                                </p>
                            </div>
                            <span className="shrink-0 p-1 rounded-lg bg-paper-200 group-hover:bg-watercolor-brick group-hover:text-white text-paper-900 border border-paper-900 transition text-[10px] flex items-center gap-0.5">
                                <Plus size={12} weight="bold" />
                                <span>Add</span>
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {isOpen && results.length === 0 && !isSearching && query.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-paper-50 border-2 border-paper-900 rounded-2xl p-3 shadow-float z-50 text-center text-xs text-paper-700 font-serif">
                    No matching places found nearby.
                </div>
            )}
        </div>
    );
};