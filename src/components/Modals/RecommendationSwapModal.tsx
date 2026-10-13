'use client';

import React from 'react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { ExpenseCategory, ItineraryItem } from '@/types/itinerary';
import { playChime } from '@/lib/audio';
import {
    X,
    ArrowsClockwise,
    Bed,
    ForkKnife,
    Ticket,
    Train,
    Coins,
    CheckCircle,
    ArrowUpRight,
    ArrowDownRight,
    Sparkle,
} from '@phosphor-icons/react';

interface RecommendationSwapModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemToSwap:
        | ItineraryItem
        | { id?: string; category: ExpenseCategory; name: string; estimatedCost: number; notes?: string }
        | null;
    dayNumber: number;
}

interface AlternativeOption {
    name: string;
    description: string;
    price: number;
    tag: string;
    coords?: [number, number];
}

// Curated alternatives dataset tailored to WanderSketch destinations
const CURATED_ALTERNATIVES: Record<string, Record<ExpenseCategory, AlternativeOption[]>> = {
    hong_kong: {
        lodging: [
            {
                name: 'The Peninsula Hong Kong (香港半島酒店)',
                description: 'Legendary Grande Dame of the Far East with colonial luxury on Salisbury Road',
                price: 320,
                tag: 'Colonial 5★',
            },
            {
                name: 'Mandarin Oriental Hong Kong (香港文華東方酒店)',
                description: 'Iconic flagship luxury hotel facing Victoria Harbour in the heart of Central',
                price: 280,
                tag: 'Harbour Luxury',
            },
            {
                name: 'Royal Park Hotel (帝都酒店)',
                description: 'Riverside hotel overlooking Sha Tin Central Park & Shing Mun River',
                price: 195,
                tag: 'Riverside Comfort',
            },
            {
                name: 'Hyatt Regency Hong Kong, Sha Tin (香港沙田凱悅酒店)',
                description: 'Tranquil resort-style accommodations with Tolo Harbour & mountain views',
                price: 175,
                tag: 'Scenic Resort',
            },
            {
                name: 'The Upper House (奕居)',
                description: 'Intimate contemporary design haven perched above Pacific Place, Admiralty',
                price: 360,
                tag: 'Design Luxury',
            },
        ],
        dining: [
            {
                name: 'Tim Ho Wan Dim Sum (添好運點心專門店)',
                description: 'World-renowned baked BBQ pork buns and steamed shrimp dumplings',
                price: 22,
                tag: 'Michelin Dim Sum',
            },
            {
                name: 'Sing Heung Yuen Open-air Dai Pai Dong (勝香園)',
                description: 'Historic central food stall famous for tomato beef noodles and crispy lemon buns',
                price: 12,
                tag: 'Dai Pai Dong',
            },
            {
                name: 'Kau Kee Beef Brisket (九記牛腩)',
                description: 'Legendary Gough Street braised beef brisket in clear spiced medicinal broth',
                price: 16,
                tag: 'Heritage Noodles',
            },
            {
                name: 'Tai Cheong Bakery (泰昌餅家)',
                description: 'Fresh-baked traditional warm cookie-crust egg tarts on Lyndhurst Terrace',
                price: 6,
                tag: 'Pastry / Bakery',
            },
            {
                name: 'Yat Lok Roast Goose (一樂燒鵝)',
                description: 'Crispy charcoal-roasted goose seasoned with five-spice and plum sauce',
                price: 28,
                tag: 'Roast Goose',
            },
        ],
        ticket: [
            {
                name: 'Peak Tram & Sky Terrace 428 (山頂纜車)',
                description: 'Historic funicular railway ascent to panoramic 360-degree Victoria Peak views',
                price: 25,
                tag: 'Peak Funicular',
            },
            {
                name: 'Star Ferry Harbour Tour (天星小輪海港遊)',
                description: 'Heritage double-decker ferry crossing with classic skyline vistas',
                price: 10,
                tag: 'Harbour Cruise',
            },
            {
                name: 'M+ Museum of Visual Culture (M+ 視覺文化博物館)',
                description: 'Asia’s premier global museum of contemporary visual culture at West Kowloon',
                price: 22,
                tag: 'Modern Art',
            },
            {
                name: 'Hong Kong Heritage Museum (香港文化博物館)',
                description: 'Sha Tin museum featuring Bruce Lee, Jin Yong, and Cantonese opera galleries',
                price: 15,
                tag: 'Cultural Heritage',
            },
            {
                name: 'Ngong Ping 360 Crystal Cable Car (昂坪360纜車)',
                description: 'Spectacular glass-floor cable car across Lantau hills to the Big Buddha',
                price: 34,
                tag: 'Scenic Cable Car',
            },
        ],
        transit: [
            {
                name: 'Tourist Octopus Card with HKD $50 Deposit (遊客八達通卡)',
                description: 'Tap-and-go contactless card for MTR, buses, Star Ferries, and trams',
                price: 15,
                tag: 'Octopus Transit',
            },
            {
                name: 'Airport Express Round-trip Ticket (機場快綫來回票)',
                description: 'High-speed 24-minute bullet train connecting Chek Lap Kok to Hong Kong Station',
                price: 26,
                tag: 'Airport Express',
            },
            {
                name: 'Hong Kong Tramways "Ding Ding" Day Ride (香港電車叮叮車)',
                description: 'Vintage double-decker streetcar traversing Hong Kong Island since 1904',
                price: 4,
                tag: 'Heritage Tram',
            },
            {
                name: 'Star Ferry Crossing Token (天星小輪渡輪)',
                description: 'Charming cross-harbour transit linking Tsim Sha Tsui and Central piers',
                price: 5,
                tag: 'Scenic Ferry',
            },
        ],
    },
};

// Generic fallback alternatives
const GENERIC_ALTERNATIVES: Record<ExpenseCategory, AlternativeOption[]> = {
    lodging: [
        {
            name: 'Grand Heritage Palace & Spa',
            description: 'Refined historic palace hotel in the center of the historic quarter',
            price: 210,
            tag: 'Historic 5★',
        },
        {
            name: 'Boutique Courtyard Hotel & Suites',
            description: 'Artisan-designed boutique hotel close to transit and top landmarks',
            price: 145,
            tag: 'Comfort Boutique',
        },
        {
            name: 'Riverside Traveler Lodge',
            description: 'Charming scenic lodge overlooking the promenade with breakfast included',
            price: 110,
            tag: 'Scenic Value',
        },
        {
            name: 'Capsule & Design Studio Suites',
            description: 'Minimalist private pods with high-speed wifi and shared creative lounge',
            price: 75,
            tag: 'Budget Pod',
        },
    ],
    dining: [
        {
            name: 'Farm-to-Table Artisan Bistro',
            description: 'Seasonal regional organic produce and house sourdough with craft cider',
            price: 48,
            tag: 'Organic Bistro',
        },
        {
            name: 'Historic Street Market Stalls',
            description: 'Local heritage street-food delicacies and savory skewers',
            price: 18,
            tag: 'Local Street Food',
        },
        {
            name: 'Waterfront Terrace Grill & Wine Bar',
            description: 'Fresh local catch of the day paired with regional vineyard selections',
            price: 64,
            tag: 'Scenic Terrace',
        },
        {
            name: 'Artisan Morning Roastery & Bakery',
            description: 'Single-origin pour-overs, fresh cardamom buns, and breakfast toast',
            price: 15,
            tag: 'Morning Cafe',
        },
    ],
    ticket: [
        {
            name: 'Heritage City History & Architecture Walk',
            description: 'Guided tour covering 200 years of landmark architectural transformations',
            price: 24,
            tag: 'Cultural Tour',
        },
        {
            name: 'Contemporary Art & Design Gallery',
            description: 'Inspiring exhibitions featuring international and emerging local artists',
            price: 20,
            tag: 'Art Museum',
        },
        {
            name: 'Panoramic Skyline Observation Deck',
            description: 'Open-air observation platform with 360-degree city views at sunset',
            price: 28,
            tag: 'Observation Deck',
        },
    ],
    transit: [
        {
            name: 'Central Metro & Transit Unlimited Day Pass',
            description: 'All-day hop-on pass for subways, trams, and electric public buses',
            price: 12,
            tag: 'Day Pass',
        },
        {
            name: 'Electric Bicycle Fleet Day Rental',
            description: 'Cruise along protected bike boulevards and riverfront trails',
            price: 16,
            tag: 'E-Bike Rental',
        },
    ],
};

export const RecommendationSwapModal: React.FC<RecommendationSwapModalProps> = ({
    isOpen,
    onClose,
    itemToSwap,
    dayNumber,
}) => {
    const { plannerBuffer, swapItineraryItem, updateDayHotel } = useItineraryStore();

    if (!isOpen || !itemToSwap) return null;

    const category = itemToSwap.category || 'ticket';
    const currentPrice = itemToSwap.estimatedCost || 0;
    const currentName = itemToSwap.name || '';

    // Target Hong Kong curated alternatives dataset
    const cityAlternatives = CURATED_ALTERNATIVES['hong_kong']?.[category] || GENERIC_ALTERNATIVES[category] || [];

    // Filter out the option if it matches current item name closely
    const alternatives = cityAlternatives.filter(
        (alt) => !currentName.toLowerCase().includes(alt.name.toLowerCase().slice(0, 10))
    );

    const handleSwapOption = (option: AlternativeOption) => {
        playChime('stamp');

        if (category === 'lodging') {
            updateDayHotel(dayNumber, {
                name: option.name,
                price: option.price,
                notes: option.description,
            });
        } else if (itemToSwap.id) {
            swapItineraryItem(dayNumber, itemToSwap.id, {
                name: option.name,
                estimatedCost: option.price,
                category: category,
            });
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-paper-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-paper-100 border-3 border-paper-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-float relative flex flex-col max-h-[90vh] overflow-y-auto">

                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-paper-300">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-400 text-paper-900 flex items-center justify-center shadow-stamp -rotate-2 border-2 border-paper-900">
                            <ArrowsClockwise size={22} weight="bold" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-paper-700 font-mono">
                                Alternative Recommendations
                            </span>
                            <h3 className="font-serif font-black text-lg sm:text-xl text-paper-900 leading-tight">
                                Swap {category === 'lodging' ? 'Hotel' : category === 'dining' ? 'Dining Spot' : 'Activity'}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            playChime('tap');
                            onClose();
                        }}
                        className="p-1.5 rounded-xl text-paper-700 hover:text-paper-900 hover:bg-paper-200 transition"
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* Current Selection Banner */}
                <div className="my-4 p-3 bg-paper-50 border-2 border-paper-700 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                    <div>
                        <span className="text-[10px] font-black uppercase text-paper-700 block">Current Itinerary Stop</span>
                        <h4 className="font-serif font-black text-sm text-paper-900">{currentName}</h4>
                    </div>
                    <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-paper-700 uppercase block">Current Est.</span>
                        <span className="text-sm font-black text-paper-900 font-mono">${currentPrice}</span>
                    </div>
                </div>

                {/* Alternatives List */}
                <div className="space-y-3">
                    <h5 className="text-xs font-black uppercase tracking-wider text-paper-900 flex items-center gap-1.5">
                        <Sparkle size={14} weight="fill" className="text-watercolor-brick" />
                        <span>Curated Alternatives for Day {dayNumber}</span>
                    </h5>

                    {alternatives.map((opt, idx) => {
                        const priceDiff = opt.price - currentPrice;
                        return (
                            <div
                                key={idx}
                                className="p-3.5 bg-paper-50 border-2 border-paper-900 rounded-2xl shadow-sm hover:border-watercolor-brick hover:shadow-card transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-paper-200 text-paper-900 uppercase font-mono">
                                            {opt.tag}
                                        </span>
                                        <h5 className="font-serif font-extrabold text-sm text-paper-900">
                                            {opt.name}
                                        </h5>
                                    </div>
                                    <p className="text-xs text-paper-800 line-clamp-2 leading-relaxed">
                                        {opt.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-paper-200">
                                    <div className="text-left sm:text-right">
                                        <span className="text-sm font-black text-paper-900 font-mono">${opt.price}</span>
                                        {priceDiff > 0 ? (
                                            <span className="text-[11px] font-bold text-rose-700 ml-1.5 sm:ml-0 sm:block flex items-center gap-0.5">
                                                <ArrowUpRight size={12} weight="bold" /> +${priceDiff}
                                            </span>
                                        ) : priceDiff < 0 ? (
                                            <span className="text-[11px] font-bold text-emerald-700 ml-1.5 sm:ml-0 sm:block flex items-center gap-0.5">
                                                <ArrowDownRight size={12} weight="bold" /> -${Math.abs(priceDiff)}
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-bold text-paper-700 ml-1.5 sm:ml-0 sm:block">
                                                Same cost
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleSwapOption(opt)}
                                        className="px-3.5 py-1.5 bg-watercolor-brick hover:bg-red-700 text-white font-black text-xs rounded-xl border border-paper-900 shadow-stamp transition active:scale-95 flex items-center gap-1 cursor-pointer"
                                    >
                                        <CheckCircle size={14} weight="bold" />
                                        <span>Swap In</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Cancel */}
                <div className="mt-5 pt-3 border-t-2 border-paper-300 flex justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            playChime('tap');
                            onClose();
                        }}
                        className="px-4 py-2 bg-paper-200 hover:bg-paper-300 text-paper-900 font-bold text-xs rounded-xl border border-paper-900 transition"
                    >
                        Keep Current Selection
                    </button>
                </div>

            </div>
        </div>
    );
};

