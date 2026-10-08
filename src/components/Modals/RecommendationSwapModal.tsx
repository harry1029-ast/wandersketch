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
    toronto: {
        lodging: [
            {
                name: 'The Omni King Edward Historic Hotel',
                description: 'Classic Victorian luxury near King St & St. Lawrence Market',
                price: 180,
                tag: 'Heritage Luxury',
            },
            {
                name: 'Broadview Hotel Boutique East',
                description: 'Restored 1891 heritage landmark with rooftop river views',
                price: 150,
                tag: 'Boutique Rooftop',
            },
            {
                name: 'Gladstone House Art Hotel',
                description: 'Queen West creative hub with curated local artist murals',
                price: 135,
                tag: 'Creative / Arts',
            },
            {
                name: 'The Anndore House Yorkville',
                description: 'Intimate boutique hotel with in-room vinyl turntables',
                price: 145,
                tag: 'Boutique Vibe',
            },
            {
                name: 'Fairmont Royal York',
                description: 'Historic grand railway hotel facing Union Station',
                price: 215,
                tag: '5★ Historic Landmark',
            },
        ],
        dining: [
            {
                name: "Balzac's Parisian Style Roastery",
                description: 'Distillery 19th-century pump house serving artisanal espresso & croissants',
                price: 18,
                tag: 'Morning Cafe',
            },
            {
                name: 'El Catrin Distileria Mexican Cantina',
                description: 'Vibrant outdoor patio with Canada’s largest mezcal collection & street tacos',
                price: 45,
                tag: 'Mexican / Patio',
            },
            {
                name: 'Pai Northern Thai Comfort Kitchen',
                description: 'Chef Nuit Regular’s famous khao soi curry noodles & street-style platters',
                price: 36,
                tag: 'Thai Comfort',
            },
            {
                name: 'Cluny French Bistro & Boulangerie',
                description: 'Neo-bistro with fresh daily baguettes, steak frites, and lavender butter',
                price: 68,
                tag: 'French Neo-Bistro',
            },
            {
                name: 'St. Lawrence Market Peameal Sandwich Hall',
                description: 'Legendary Carousel Bakery peameal bacon on warm country roll',
                price: 15,
                tag: 'Market Classic',
            },
            {
                name: 'Canoe Regional Canadian Dining',
                description: '54th floor sky-high views featuring wild game and Ontario terroir',
                price: 110,
                tag: 'Skyline Fine Dining',
            },
        ],
        ticket: [
            {
                name: 'Distillery District Historic Red Brick Walk',
                description: 'Guided architectural tour through Victorian whiskey distillation history',
                price: 25,
                tag: 'Architecture Tour',
            },
            {
                name: 'Royal Ontario Museum & Crystal Wings',
                description: 'Daniel Libeskind crystal gallery with world art and cultural treasures',
                price: 32,
                tag: 'Art & Culture',
            },
            {
                name: 'Toronto Island Scenic Sunset Ferry Tour',
                description: 'Cruise over Lake Ontario for iconic skyline reflections at dusk',
                price: 20,
                tag: 'Scenic Skyline',
            },
            {
                name: 'Bata Shoe Museum & Yorkville Gallery Stroll',
                description: 'Unique global footwear history and fashion design exhibition',
                price: 18,
                tag: 'Specialty Museum',
            },
        ],
        transit: [
            {
                name: 'TTC Historic 504 King Streetcar Pass',
                description: 'All-day unlimited streetcar pass linking the east and west downtown corridors',
                price: 14,
                tag: 'Streetcar Pass',
            },
            {
                name: 'Water Taxi Harbourfront Shuttle',
                description: 'Vintage wooden boat crossing between Toronto waterfront and the Islands',
                price: 18,
                tag: 'Scenic Boat',
            },
            {
                name: 'Bike Share Toronto 24h Cruiser Pass',
                description: 'Pedal along the Lakefront Martin Goodman paved trail network',
                price: 12,
                tag: 'Bicycle Pass',
            },
        ],
    },
    kyoto: {
        lodging: [
            {
                name: 'The Celestine Kyoto Gion Ryokan',
                description: 'Tranquil Japanese garden courtyard steps from Yasaka Shrine',
                price: 195,
                tag: 'Modern Ryokan',
            },
            {
                name: 'Hoshinoya Kyoto Riverfront Pavilion',
                description: 'Wood-timbered traditional pavilions along the romantic Oi River',
                price: 280,
                tag: 'Luxury Retreat',
            },
            {
                name: 'Sowaka Heritage Machiya Townhouse',
                description: '100-year-old preserved Japanese townhouse with cedar soaking tub',
                price: 165,
                tag: 'Historic Machiya',
            },
            {
                name: 'Kyoto Granbell Hotel Gion',
                description: 'Sleek contemporary design fusing Edo aesthetic with modern comfort',
                price: 125,
                tag: 'Design Boutique',
            },
        ],
        dining: [
            {
                name: 'Inoda Coffee Traditional Salon Morning Set',
                description: '1940 landmark retro salon serving velvety drip brew and fluffy omelets',
                price: 18,
                tag: 'Heritage Morning',
            },
            {
                name: 'Nishiki Market Skewer & Dashi Crawl',
                description: '400-year-old food lane with baby octopus, tamagoyaki, and matcha mochi',
                price: 26,
                tag: 'Street Market',
            },
            {
                name: 'Gion Duck Noodles & Broth Bar',
                description: 'Steaming duck dashi ramen served in an atmospheric paper-lantern alley',
                price: 28,
                tag: 'Craft Ramen',
            },
            {
                name: 'Omen Ginkakuji Handmade Udon',
                description: 'Chilled or hot artisanal noodles with sesame broth and mountain vegetables',
                price: 22,
                tag: 'Traditional Udon',
            },
            {
                name: 'Pontocho Alley Riverfront Kaiseki',
                description: 'Multi-course seasonal Kyoto feast overlooking the Kamogawa River',
                price: 95,
                tag: 'Kaiseki Dining',
            },
        ],
        ticket: [
            {
                name: 'Kiyomizu-dera Wooden Stage & Otowa Waterfall',
                description: 'Centuries-old cliffside temple with sweeping panoramas of Kyoto basin',
                price: 22,
                tag: 'World Heritage',
            },
            {
                name: 'Sannenzaka Stone Lantern & Tea Ceremony',
                description: 'Traditional tatami tea preparation ceremony in a private garden pavilion',
                price: 35,
                tag: 'Cultural Workshop',
            },
            {
                name: 'Arashiyama Whispering Bamboo Sanctuary Walk',
                description: 'Early-morning walking pass through towering emerald bamboo stalks',
                price: 15,
                tag: 'Nature Walk',
            },
        ],
        transit: [
            {
                name: 'Kyoto City Bus & Subway Combo Day Pass',
                description: 'Hop-on hop-off pass covering all central temples and scenic districts',
                price: 12,
                tag: 'City Transit',
            },
            {
                name: 'Sagano Romantic Scenic Train Ticket',
                description: 'Open-air vintage diesel locomotive tracing the Hozugawa River gorge',
                price: 18,
                tag: 'Scenic Railway',
            },
        ],
    },
    paris: {
        lodging: [
            {
                name: 'Pavillon de la Reine Marais Palace',
                description: '17th-century aristocratic courtyard facing historic Place des Vosges',
                price: 245,
                tag: 'Palace Heritage',
            },
            {
                name: 'Hôtel des Grands Boulevards',
                description: 'French Revolution era manor with canopy beds and secret rooftop',
                price: 190,
                tag: 'Romantic Boutique',
            },
            {
                name: 'Le Marais Courtyard Artisan Hotel',
                description: 'Charming stone-walled townhouse steps from Musée Picasso',
                price: 155,
                tag: 'Artisan Boutique',
            },
            {
                name: 'Hôtel Fabric Oberkampf',
                description: 'Vibrant converted textile mill with industrial high ceilings',
                price: 135,
                tag: 'Industrial Chic',
            },
        ],
        dining: [
            {
                name: 'Carette Place des Vosges Tearoom',
                description: 'Silky whipped-cream hot chocolate & toasted brioche under stone arches',
                price: 22,
                tag: 'Historic Tearoom',
            },
            {
                name: "L'As du Fallafel Rue des Rosiers",
                description: 'Legendary pita packed with crispy chickpea falafel, roasted eggplant & tahini',
                price: 16,
                tag: 'Street Food Icon',
            },
            {
                name: 'Chez Janou Provençal Bistro',
                description: 'Lively corner bistro famous for ratatouille and bottomless chocolate mousse',
                price: 52,
                tag: 'Bistro Terrace',
            },
            {
                name: 'Breizh Café Savory Buckwheat Galettes',
                description: 'Organic Brittany buckwheat galettes paired with artisanal farmhouse cider',
                price: 28,
                tag: 'Artisan Galette',
            },
            {
                name: 'Septime Seasonal Natural Wine Dining',
                description: 'Creative Michelin-starred neo-bistro tasting featuring small French growers',
                price: 90,
                tag: 'Michelin Star',
            },
        ],
        ticket: [
            {
                name: 'Musée Carnavalet Paris History Mansion',
                description: 'Renaissance courtyard mansion exhibiting centuries of Parisian artifacts',
                price: 20,
                tag: 'Historic Mansion',
            },
            {
                name: 'Sainte-Chapelle Radiant Stained Glass',
                description: '13th-century Gothic royal chapel with 1,113 luminous stained-glass panels',
                price: 24,
                tag: 'Gothic Marvel',
            },
            {
                name: 'Musée de l’Orangerie Water Lilies',
                description: 'Custom curved oval rooms showcasing Monet’s serene water lily murals',
                price: 22,
                tag: 'Impressionist Art',
            },
        ],
        transit: [
            {
                name: 'Paris Métro & RER Zone 1-2 Pass',
                description: 'Unlimited 1-day pass for underground rail and scenic surface buses',
                price: 12,
                tag: 'Métro Pass',
            },
            {
                name: 'Batobus Seine River Water Shuttle Pass',
                description: 'Hop-on river ferry stopping at Eiffel Tower, Louvre, and Notre-Dame',
                price: 19,
                tag: 'River Shuttle',
            },
        ],
    },
};

// Generic fallback alternatives if outside Toronto, Kyoto, or Paris
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

    // Determine target city dataset
    const zoneKey = (plannerBuffer.zoneKey || '').toLowerCase();
    let cityKey: 'toronto' | 'kyoto' | 'paris' | null = null;
    if (zoneKey.includes('toronto')) cityKey = 'toronto';
    else if (zoneKey.includes('kyoto')) cityKey = 'kyoto';
    else if (zoneKey.includes('paris')) cityKey = 'paris';

    const cityAlternatives = cityKey
        ? CURATED_ALTERNATIVES[cityKey]?.[category] || []
        : GENERIC_ALTERNATIVES[category] || [];

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

