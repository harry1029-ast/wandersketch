import { NextRequest, NextResponse } from 'next/server';
import { ExpenseCategory, ItineraryDay, ItineraryItem } from '@/types/itinerary';

interface GeneratePayload {
    destination: string;
    startDate: string;
    endDate: string;
    partySize: number;
    totalBudget: number;
    preferences?: {
        lodgingTier?: string;
        diningTastes?: string[];
        walkingEndurance?: string;
        attractionTypes?: string[];
    };
}

// Preset geographic centers and curated thematic landmarks for primary WanderSketch destinations
interface CityPreset {
    center: [number, number];
    hotels: { name: string; notes: string }[];
    attractions: { name: string; category: ExpenseCategory }[];
    breakfastSpots: string[];
    lunchSpots: string[];
    dinnerSpots: string[];
    transitModes: string[];
}

const CITY_PRESETS: Record<string, CityPreset> = {
    toronto: {
        center: [43.6503, -79.3596],
        hotels: [
            { name: 'The Omni King Edward Historic Hotel', notes: 'Classic Victorian luxury near King St & St. Lawrence Market' },
            { name: 'Broadview Hotel Boutique East', notes: 'Restored 1891 heritage landmark with rooftop river views' },
            { name: 'Gladstone House Art Hotel', notes: 'Queen West creative hub with curated local artist murals' },
            { name: 'Fairmont Royal York', notes: 'Iconic railway hotel opposite Union Station' },
        ],
        attractions: [
            { name: 'Distillery District Historic Red Brick Walk', category: 'ticket' },
            { name: 'St. Lawrence Market Food & Craft Hall', category: 'ticket' },
            { name: 'Gooderham Flatiron Architectural Landmark', category: 'ticket' },
            { name: 'Royal Ontario Museum & Crystal Wings', category: 'ticket' },
            { name: 'Toronto Island Ferry & Sunset Skyline View', category: 'transit' },
            { name: 'Harbourfront WaveDecks Boardwalk', category: 'ticket' },
            { name: 'Graffiti Alley & Queen West Gallery Stroll', category: 'ticket' },
            { name: 'Bata Shoe Museum & Yorkville Walk', category: 'ticket' },
        ],
        breakfastSpots: [
            "Balzac's Parisian Style Roastery",
            'Morning Glory Art Cafe',
            'Dineen Coffee Co. Espresso Bar',
            'Broadview Cafe & Morning Pastry',
        ],
        lunchSpots: [
            'El Catrin Distileria Mexican Cantina',
            'St. Lawrence Peameal Bacon Sandwich Hall',
            'Pai Northern Thai Comfort Kitchen',
            'Khao San Road Noodle House',
        ],
        dinnerSpots: [
            'Cluny Bistro & French Boulangerie',
            'Canoe Regional Canadian Dining',
            'Gusto 101 Italian Trattoria',
            'Lee Restaurant Modern Asian Plates',
        ],
        transitModes: [
            'TTC 504 King Streetcar Day Pass',
            'Toronto Island Scenic Water Taxi',
            'Downtown Union Station Subway Transfer',
            'Spadina Historic Waterfront Tram',
        ],
    },
    kyoto: {
        center: [34.9949, 135.7850],
        hotels: [
            { name: 'The Celestine Kyoto Gion Ryokan', notes: 'Tranquil Japanese garden courtyard steps from Yasaka Shrine' },
            { name: 'Hoshinoya Kyoto Riverfront Retreat', notes: 'Wood-timbered traditional pavilions along the Oi River' },
            { name: 'Park Hyatt Higashiyama Heritage', notes: 'Sloped tile roofs overlooking Yasaka Pagoda' },
            { name: 'Sowaka Heritage Machiya Inn', notes: 'Refined 100-year-old traditional townhouse suite' },
        ],
        attractions: [
            { name: 'Kiyomizu-dera Wooden Stage & Otowa Waterfall', category: 'ticket' },
            { name: 'Sannenzaka & Ninenzaka Stone Lantern Steps', category: 'ticket' },
            { name: 'Yasaka Shrine & Gion Geisha District Walk', category: 'ticket' },
            { name: 'Fushimi Inari Vermilion Torii Path', category: 'ticket' },
            { name: 'Arashiyama Whispering Bamboo Forest', category: 'ticket' },
            { name: 'Kennin-ji Zen Gravel & Twin Dragon Garden', category: 'ticket' },
            { name: 'Nanzen-ji Aqueduct & Moss Sanctuary', category: 'ticket' },
            { name: 'Philosopher’s Path Canal Stone Trail', category: 'ticket' },
        ],
        breakfastSpots: [
            'Inoda Coffee Traditional Kyoto Morning Set',
            'Maeda Coffee Historic Salon',
            'Kishin Kyoto Seasonal Morning Congee',
            'Smart Coffee Fluffy French Toast Bar',
        ],
        lunchSpots: [
            'Nishiki Market Skewer & Dashi Crawl',
            'Omen Ginkakuji Handmade Udon Noodles',
            'Hisago Traditional Oyako-don Pot',
            'Gion Tanto Crispy Savory Okonomiyaki',
        ],
        dinnerSpots: [
            'Pontocho Alley Riverside Kamo Kaiseki',
            'Gion Duck Noodles & Broth Bar',
            'Monk Farm-to-Table Woodfire Omakase',
            'Gion Nanba Seasonal Kyoto Delicacies',
        ],
        transitModes: [
            'Kyoto City Subway & Keihan Line Pass',
            'Sagano Romantic Scenic Train Ticket',
            'Higashiyama Vintage Green Bus Line',
            'Randen Arashiyama Retro Tram Pass',
        ],
    },
    paris: {
        center: [48.8566, 2.3522],
        hotels: [
            { name: 'Pavillon de la Reine Marais Palace', notes: 'Historic 17th-century courtyard facing Place des Vosges' },
            { name: 'Hôtel des Grands Boulevards', notes: 'French Revolution era manor with secret rooftop bar' },
            { name: 'Le Marais Courtyard Artisan Hotel', notes: 'Boutique townhouse steps from Musée Carnavalet' },
            { name: 'Hôtel Fabric Oberkampf', notes: 'Converted textile mill with industrial chic decor' },
        ],
        attractions: [
            { name: 'Place des Vosges Arcaded Heritage Garden', category: 'ticket' },
            { name: 'Musée Carnavalet Paris History Mansion', category: 'ticket' },
            { name: 'Rue des Rosiers Cobblestone Stroll', category: 'ticket' },
            { name: 'Louvre Courtyard & Tuileries Garden Promenade', category: 'ticket' },
            { name: 'Musée d’Orsay Impressionist Clock Gallery', category: 'ticket' },
            { name: 'Sainte-Chapelle Stained Glass Marvel', category: 'ticket' },
            { name: 'Montmartre Artists Square & Sacré-Cœur', category: 'ticket' },
            { name: 'Seine Riverbank Bookseller (Bouquinistes) Walk', category: 'ticket' },
        ],
        breakfastSpots: [
            'Carette Place des Vosges Hot Chocolate & Brioche',
            'Du Pain et des Idées Snail Pastry Bakery',
            'Café de Flore Morning Espresso & Tartine',
            'Boot Café Miniature Cobblestone Roastery',
        ],
        lunchSpots: [
            "L'As du Fallafel Rue des Rosiers Pita",
            'Breizh Café Savory Buckwheat Galettes',
            'Bouillon Julien Belle Époque Brasserie',
            'Chez Alain Miam Miam Gourmet Sandwich',
        ],
        dinnerSpots: [
            'Chez Janou Provençal Bistro & Chocolate Mousse',
            "Le Relais de l'Entrecôte Secret Sauce Steak",
            'Septime Seasonal Natural Wine Dining',
            'Le Petit Marché Ginger Duck Breast Bar',
        ],
        transitModes: [
            'Paris Métro 1 & 11 Day Pass',
            'Batobus River Seine Water Shuttle Pass',
            'Montmartre Funicular Railway Ticket',
            'Velib Vintage Green Bicycle Rental',
        ],
    },
};

// Generic coordinates for common world destinations
const WORLD_CITY_COORDINATES: Record<string, [number, number]> = {
    tokyo: [35.6762, 139.6503],
    newyork: [40.7128, -74.0060],
    london: [51.5074, -0.1278],
    barcelona: [41.3879, 2.1699],
    rome: [41.9028, 12.4964],
    seoul: [37.5665, 126.9780],
    sanfrancisco: [37.7749, -122.4194],
    vancouver: [49.2827, -123.1207],
    sydney: [-33.8688, 151.2093],
    amsterdam: [52.3676, 4.9041],
    florence: [43.7696, 11.2558],
    singapore: [1.3521, 103.8198],
    bangkok: [13.7563, 100.5018],
    taipei: [25.0330, 121.5654],
    berlin: [52.5200, 13.4050],
    prague: [50.0755, 14.4378],
    vienna: [48.2082, 16.3738],
};

function getCityCenter(destinationName: string): [number, number] {
    const normalized = destinationName.toLowerCase().replace(/[^a-z]/g, '');
    for (const [key, coords] of Object.entries(WORLD_CITY_COORDINATES)) {
        if (normalized.includes(key)) {
            return coords;
        }
    }
    // Default to Toronto distillery coordinates
    return [43.6503, -79.3596];
}

function calculateDateRange(startDateStr: string, endDateStr: string): string[] {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    const validStart = isNaN(start.getTime()) ? new Date() : start;
    const validEnd = isNaN(end.getTime()) ? validStart : end;

    const diffMs = validEnd.getTime() - validStart.getTime();
    let numDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    numDays = Math.max(1, Math.min(14, numDays)); // Clamp between 1 and 14 days

    const dates: string[] = [];
    for (let i = 0; i < numDays; i++) {
        const cur = new Date(validStart);
        cur.setDate(cur.getDate() + i);
        dates.push(cur.toISOString().split('T')[0]);
    }
    return dates;
}

/**
 * Resilient procedural fallback generator that produces rich, realistic,
 * day-by-day itinerary structures balanced to the exact budget and trip parameters.
 */
function generateFallbackItinerary(payload: GeneratePayload): { days: ItineraryDay[]; planId: string } {
    const { destination, startDate, endDate, totalBudget, preferences } = payload;
    const dates = calculateDateRange(startDate, endDate);
    const numDays = dates.length;
    const planId = `plan_gen_${Date.now()}`;

    const destLower = destination.toLowerCase();
    let matchedPresetKey: 'toronto' | 'kyoto' | 'paris' | null = null;
    if (destLower.includes('toronto')) matchedPresetKey = 'toronto';
    else if (destLower.includes('kyoto')) matchedPresetKey = 'kyoto';
    else if (destLower.includes('paris')) matchedPresetKey = 'paris';

    const cityCenter = matchedPresetKey
        ? CITY_PRESETS[matchedPresetKey].center
        : getCityCenter(destination);

    const preset = matchedPresetKey ? CITY_PRESETS[matchedPresetKey] : null;

    // Daily budget allocation proportions:
    // Lodging: ~38%, Breakfast: ~7%, Morning Attraction: ~10%, Lunch: ~12%,
    // Afternoon Attraction: ~10%, Transit: ~7%, Dinner: ~16%
    const dailyBudget = Math.round(totalBudget / numDays);

    const lodgingTier = preferences?.lodgingTier || 'comfort';
    let lodgingRatio = 0.38;
    if (lodgingTier === 'luxury') lodgingRatio = 0.46;
    if (lodgingTier === 'budget') lodgingRatio = 0.28;

    const remainingDaily = dailyBudget * (1 - lodgingRatio);
    const costBreakfast = Math.max(5, Math.round(remainingDaily * 0.12));
    const costMorningAttraction = Math.max(10, Math.round(remainingDaily * 0.20));
    const costLunch = Math.max(12, Math.round(remainingDaily * 0.22));
    const costAfternoonAttraction = Math.max(10, Math.round(remainingDaily * 0.18));
    const costTransit = Math.max(5, Math.round(remainingDaily * 0.10));
    const costLodging = Math.max(30, Math.round(dailyBudget * lodgingRatio));
    // Dinner absorbs the balance to ensure exact daily summation
    const costDinner = Math.max(
        15,
        dailyBudget - (costLodging + costBreakfast + costMorningAttraction + costLunch + costAfternoonAttraction + costTransit)
    );

    const days: ItineraryDay[] = dates.map((calendarDate, dayIdx) => {
        const dayNumber = dayIdx + 1;
        const dayId = `day_${dayNumber}_${planId}`;

        // Perturb coordinates slightly around center for realistic map scattering
        const offsetLat = (Math.sin(dayNumber * 2.3) * 0.008);
        const offsetLng = (Math.cos(dayNumber * 1.7) * 0.008);
        const dayCenter: [number, number] = [
            Number((cityCenter[0] + offsetLat).toFixed(5)),
            Number((cityCenter[1] + offsetLng).toFixed(5)),
        ];

        // Hotel selection
        const hotelName = preset
            ? preset.hotels[dayIdx % preset.hotels.length].name
            : `${destination} ${lodgingTier === 'luxury' ? 'Grand Palace & Spa' : lodgingTier === 'budget' ? 'Traveler Inn & Suites' : 'Boutique Courtyard Hotel'}`;
        const hotelNotes = preset
            ? preset.hotels[dayIdx % preset.hotels.length].notes
            : `Comfortable ${lodgingTier} lodging close to public transport and historic sights.`;

        // Dining spots
        const bFastName = preset
            ? preset.breakfastSpots[dayIdx % preset.breakfastSpots.length]
            : `${destination} Morning Artisan Bakery & Espresso`;
        const lunchName = preset
            ? preset.lunchSpots[dayIdx % preset.lunchSpots.length]
            : `${destination} Local Heritage Kitchen & Bistro`;
        const dinnerName = preset
            ? preset.dinnerSpots[dayIdx % preset.dinnerSpots.length]
            : `${destination} Lantern Terrace & Grill`;

        // Attractions
        const attr1Name = preset
            ? preset.attractions[(dayIdx * 2) % preset.attractions.length].name
            : `${destination} Landmark Old Town & Heritage Plaza (Stop 1)`;
        const attr2Name = preset
            ? preset.attractions[(dayIdx * 2 + 1) % preset.attractions.length].name
            : `${destination} Cultural Museum & Scenic Gardens (Stop 2)`;

        // Transit mode
        const transitName = preset
            ? preset.transitModes[dayIdx % preset.transitModes.length]
            : `${destination} Central Metro & Scenic Tram Day Pass`;

        // Line items for the day:
        // 0: Lodging, 1: Breakfast, 2: Morning Attraction, 3: Lunch, 4: Afternoon Attraction, 5: Transit, 6: Dinner
        const items: ItineraryItem[] = [
            {
                id: `item_${dayNumber}_0_${planId}`,
                dayId,
                planId,
                name: `Stay at ${hotelName}`,
                category: 'lodging',
                estimatedCost: costLodging,
                actualCost: 0,
                location: [Number((dayCenter[0] + 0.002).toFixed(5)), Number((dayCenter[1] - 0.002).toFixed(5))],
                orderIndex: 0,
            },
            {
                id: `item_${dayNumber}_1_${planId}`,
                dayId,
                planId,
                name: bFastName,
                category: 'dining',
                estimatedCost: costBreakfast,
                actualCost: 0,
                location: [Number((dayCenter[0] + 0.001).toFixed(5)), Number((dayCenter[1] + 0.001).toFixed(5))],
                orderIndex: 1,
            },
            {
                id: `item_${dayNumber}_2_${planId}`,
                dayId,
                planId,
                name: attr1Name,
                category: 'ticket',
                estimatedCost: costMorningAttraction,
                actualCost: 0,
                location: [Number((dayCenter[0] + 0.003).toFixed(5)), Number((dayCenter[1] + 0.002).toFixed(5))],
                orderIndex: 2,
            },
            {
                id: `item_${dayNumber}_3_${planId}`,
                dayId,
                planId,
                name: lunchName,
                category: 'dining',
                estimatedCost: costLunch,
                actualCost: 0,
                location: [Number((dayCenter[0] - 0.001).toFixed(5)), Number((dayCenter[1] + 0.003).toFixed(5))],
                orderIndex: 3,
            },
            {
                id: `item_${dayNumber}_4_${planId}`,
                dayId,
                planId,
                name: attr2Name,
                category: 'ticket',
                estimatedCost: costAfternoonAttraction,
                actualCost: 0,
                location: [Number((dayCenter[0] - 0.002).toFixed(5)), Number((dayCenter[1] - 0.001).toFixed(5))],
                orderIndex: 4,
            },
            {
                id: `item_${dayNumber}_5_${planId}`,
                dayId,
                planId,
                name: transitName,
                category: 'transit',
                estimatedCost: costTransit,
                actualCost: 0,
                location: [Number((dayCenter[0]).toFixed(5)), Number((dayCenter[1]).toFixed(5))],
                orderIndex: 5,
            },
            {
                id: `item_${dayNumber}_6_${planId}`,
                dayId,
                planId,
                name: dinnerName,
                category: 'dining',
                estimatedCost: costDinner,
                actualCost: 0,
                location: [Number((dayCenter[0] - 0.003).toFixed(5)), Number((dayCenter[1] + 0.001).toFixed(5))],
                orderIndex: 6,
            },
        ];

        const daySubtotal = items.reduce((sum, it) => sum + it.estimatedCost, 0);

        return {
            id: dayId,
            planId,
            dayNumber,
            calendarDate,
            hotelInfo: {
                name: hotelName,
                coords: [Number((dayCenter[0] + 0.002).toFixed(5)), Number((dayCenter[1] - 0.002).toFixed(5))],
                notes: hotelNotes,
                price: costLodging,
            },
            subtotalEstimated: daySubtotal,
            subtotalActual: 0,
            items,
            createdAt: new Date().toISOString(),
        };
    });

    return { days, planId };
}

/**
 * Call external LLM (Gemini or OpenAI) with structured prompt if API key exists.
 */
async function callExternalLLM(payload: GeneratePayload): Promise<ItineraryDay[] | null> {
    const dates = calculateDateRange(payload.startDate, payload.endDate);
    const numDays = dates.length;
    const planId = `plan_gen_${Date.now()}`;
    const destination = payload.destination;
    const budget = payload.totalBudget;

    const systemPrompt = `You are a professional travel curator and budget planner for WanderSketch.
Create a structured multi-day itinerary for ${numDays} days in "${destination}" with total budget $${budget}.
Calendar dates are: ${dates.join(', ')}.
Preferences: ${JSON.stringify(payload.preferences || {})}.

Return ONLY valid JSON matching this structure:
{
  "days": [
    {
      "dayNumber": 1,
      "calendarDate": "${dates[0]}",
      "hotelInfo": {
        "name": "Hotel Name",
        "coords": [lat, lng],
        "notes": "Hotel description",
        "price": 120
      },
      "items": [
        {
          "name": "Overnight Stay",
          "category": "lodging",
          "estimatedCost": 120,
          "location": [lat, lng],
          "orderIndex": 0
        },
        {
          "name": "Breakfast spot",
          "category": "dining",
          "estimatedCost": 15,
          "location": [lat, lng],
          "orderIndex": 1
        },
        {
          "name": "Morning attraction",
          "category": "ticket",
          "estimatedCost": 25,
          "location": [lat, lng],
          "orderIndex": 2
        },
        {
          "name": "Lunch spot",
          "category": "dining",
          "estimatedCost": 20,
          "location": [lat, lng],
          "orderIndex": 3
        },
        {
          "name": "Afternoon attraction",
          "category": "ticket",
          "estimatedCost": 25,
          "location": [lat, lng],
          "orderIndex": 4
        },
        {
          "name": "Local transit or metro",
          "category": "transit",
          "estimatedCost": 10,
          "location": [lat, lng],
          "orderIndex": 5
        },
        {
          "name": "Dinner spot",
          "category": "dining",
          "estimatedCost": 35,
          "location": [lat, lng],
          "orderIndex": 6
        }
      ]
    }
  ]
}

Ensure all line items have realistic costs that sum up approximately to the total budget ($${budget}).
Every day MUST include at least 2 attractions ('ticket'), 3 meals ('dining'), 1 transit ('transit'), and 1 lodging ('lodging').`;

    // Try Gemini API first if configured
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: { response_mime_type: 'application/json' },
                }),
                signal: AbortSignal.timeout(12000),
            });
            if (res.ok) {
                const data = await res.json();
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (rawText) {
                    const parsed = JSON.parse(rawText);
                    if (Array.isArray(parsed?.days) && parsed.days.length > 0) {
                        return normalizeGeneratedDays(parsed.days, planId, dates);
                    }
                }
            }
        } catch (err) {
            console.warn('Gemini API generation failed, falling back:', err);
        }
    }

    // Try OpenAI API if configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
        try {
            const url = 'https://api.openai.com/v1/chat/completions';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${openaiApiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    response_format: { type: 'json_object' },
                    messages: [
                        { role: 'system', content: 'You are an expert travel planner outputting JSON.' },
                        { role: 'user', content: systemPrompt },
                    ],
                }),
                signal: AbortSignal.timeout(12000),
            });
            if (res.ok) {
                const data = await res.json();
                const rawContent = data?.choices?.[0]?.message?.content;
                if (rawContent) {
                    const parsed = JSON.parse(rawContent);
                    if (Array.isArray(parsed?.days) && parsed.days.length > 0) {
                        return normalizeGeneratedDays(parsed.days, planId, dates);
                    }
                }
            }
        } catch (err) {
            console.warn('OpenAI API generation failed, falling back:', err);
        }
    }

    return null;
}

/**
 * Normalizes and sanitizes external LLM output to strictly match ItineraryDay and ItineraryItem domain types.
 */
function normalizeGeneratedDays(rawDays: any[], planId: string, dates: string[]): ItineraryDay[] {
    return rawDays.map((d, idx) => {
        const dayNumber = Number(d.dayNumber) || (idx + 1);
        const dayId = `day_${dayNumber}_${planId}`;
        const calendarDate = dates[idx] || d.calendarDate || new Date().toISOString().split('T')[0];

        const rawItems = Array.isArray(d.items) ? d.items : [];
        const items: ItineraryItem[] = rawItems.map((it: any, iIdx: number) => ({
            id: `item_${dayNumber}_${iIdx}_${planId}`,
            dayId,
            planId,
            name: String(it.name || `Activity ${iIdx + 1}`),
            category: (['lodging', 'dining', 'ticket', 'transit'].includes(it.category)
                ? it.category
                : 'ticket') as ExpenseCategory,
            estimatedCost: Number(it.estimatedCost) || 0,
            actualCost: 0,
            location: Array.isArray(it.location) && it.location.length === 2
                ? [Number(it.location[0]), Number(it.location[1])]
                : undefined,
            orderIndex: iIdx,
        }));

        const subtotalEstimated = items.reduce((sum, item) => sum + item.estimatedCost, 0);

        return {
            id: dayId,
            planId,
            dayNumber,
            calendarDate,
            hotelInfo: {
                name: d.hotelInfo?.name || 'Local Boutique Accommodation',
                coords: Array.isArray(d.hotelInfo?.coords) && d.hotelInfo.coords.length === 2
                    ? [Number(d.hotelInfo.coords[0]), Number(d.hotelInfo.coords[1])]
                    : undefined,
                notes: d.hotelInfo?.notes || '',
                price: Number(d.hotelInfo?.price) || 0,
            },
            subtotalEstimated,
            subtotalActual: 0,
            items,
            createdAt: new Date().toISOString(),
        };
    });
}

function computeBudgetSummary(days: ItineraryDay[]) {
    const byCategory: Record<ExpenseCategory, { estimated: number; actual: number }> = {
        lodging: { estimated: 0, actual: 0 },
        dining: { estimated: 0, actual: 0 },
        ticket: { estimated: 0, actual: 0 },
        transit: { estimated: 0, actual: 0 },
    };

    days.forEach((day) => {
        (day.items || []).forEach((item) => {
            const cat = item.category in byCategory ? item.category : 'ticket';
            byCategory[cat].estimated += (item.estimatedCost || 0);
            byCategory[cat].actual += (item.actualCost || 0);
        });
    });

    const estimatedTotal = Object.values(byCategory).reduce((acc, c) => acc + c.estimated, 0);
    const actualTotal = Object.values(byCategory).reduce((acc, c) => acc + c.actual, 0);

    return {
        estimatedTotal,
        actualTotal,
        byCategory,
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as GeneratePayload;

        if (!body.destination || body.destination.trim().length === 0) {
            return NextResponse.json(
                { error: 'Destination is required' },
                { status: 400 }
            );
        }

        const partySize = Math.max(1, Number(body.partySize) || 1);
        const totalBudget = Math.max(50, Number(body.totalBudget) || 1000);
        const startDate = body.startDate || new Date().toISOString().split('T')[0];
        const endDate = body.endDate || startDate;

        const payload: GeneratePayload = {
            destination: body.destination.trim(),
            startDate,
            endDate,
            partySize,
            totalBudget,
            preferences: body.preferences,
        };

        // Attempt external LLM first if configured
        let days = await callExternalLLM(payload);
        let planId = `plan_gen_${Date.now()}`;

        // Fallback to high-fidelity procedural generation if LLM is unavailable or fails
        if (!days || days.length === 0) {
            const fallbackResult = generateFallbackItinerary(payload);
            days = fallbackResult.days;
            planId = fallbackResult.planId;
        }

        const budgetSummary = computeBudgetSummary(days);

        return NextResponse.json({
            success: true,
            planId,
            destination: payload.destination,
            totalBudget: payload.totalBudget,
            days,
            budgetSummary,
        });
    } catch (error: any) {
        console.error('Error generating itinerary:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to generate itinerary' },
            { status: 500 }
        );
    }
}

