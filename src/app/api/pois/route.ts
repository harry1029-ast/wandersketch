import { NextRequest, NextResponse } from 'next/server';
import { isCommercialChain } from '@/lib/chainBrands';
import { findCityPackByCoords } from '@/data/cityPacks';

interface PoiCacheEntry {
    timestamp: number;
    data: any[];
}

// In-memory grid cell cache (1 hour expiry)
const poiCache = new Map<string, PoiCacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000;

function categorizePoi(tags: Record<string, string>, name: string = '', elType: string = ''): {
    category: 'history' | 'craft' | 'nature' | 'culture' | 'landmark';
    color: string;
    tag: string;
    emoji: string;
    tip: string;
    isChain: boolean;
    importanceScore: number;
    prominenceTier: 1 | 2 | 3;
} {
    const isChain = isCommercialChain(name) || (tags.brand ? isCommercialChain(tags.brand) : false);
    const lowerName = name.toLowerCase();

    // Base defaults
    let category: 'history' | 'craft' | 'nature' | 'culture' | 'landmark' = 'landmark';
    let color = '#d97706';
    let tag = 'ATTRACTION';
    let emoji = '✨';
    let tip = 'Notable district attraction';
    let categoryWeight = 10;

    // 1. Temples, Shrines & Places of Worship
    if (
        tags.amenity === 'place_of_worship' ||
        tags.historic === 'temple' ||
        tags.historic === 'monastery' ||
        tags.historic === 'shrine' ||
        tags.historic === 'church'
    ) {
        category = 'culture';
        color = '#c2410c'; // Vermilion sacred red
        if (
            lowerName.includes('church') ||
            lowerName.includes('cathedral') ||
            lowerName.includes('basilica') ||
            tags.religion === 'christian'
        ) {
            tag = 'CHURCH';
            emoji = '⛪';
            tip = 'Historic church & cathedral';
        } else if (tags.religion === 'muslim' || lowerName.includes('mosque')) {
            tag = 'MOSQUE';
            emoji = '🕌';
            tip = 'Historic mosque & place of worship';
        } else if (tags.religion === 'hindu') {
            tag = 'TEMPLE';
            emoji = '🛕';
            tip = 'Sacred Hindu temple';
        } else {
            tag = 'TEMPLE';
            emoji = '⛩️';
            tip = 'Historic temple & sacred shrine';
        }
        categoryWeight = 26;
    }
    // 2. Culture, Museums, Arts, Theatres & Heritage
    else if (
        tags.historic ||
        tags.tourism === 'museum' ||
        tags.tourism === 'gallery' ||
        tags.amenity === 'arts_centre' ||
        tags.amenity === 'theatre' ||
        tags.amenity === 'library' ||
        tags.amenity === 'townhall' ||
        tags.amenity === 'community_centre' ||
        tags.building === 'museum' ||
        tags.museum === 'yes'
    ) {
        category = 'history';
        color = '#b23b23';
        tag = tags.tourism === 'museum' || tags.building === 'museum' || tags.museum === 'yes' ? 'MUSEUM' : 'CULTURE';
        emoji = '🏛️';
        tip = tags.tourism === 'museum' || tags.building === 'museum' || tags.museum === 'yes' ? 'Museum & cultural heritage exhibition' : 'Cultural & heritage venue';
        categoryWeight = 28;
    }
    // 3. Panoramic Views & Natural Landmarks
    else if (tags.tourism === 'viewpoint') {
        category = 'nature';
        color = '#0284c7';
        tag = 'VIEW';
        emoji = '📷';
        tip = 'Panoramic viewpoint & scenic overlook';
        categoryWeight = 24;
    }
    // 4. Parks, Gardens & Reserves
    else if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'nature_reserve') {
        category = 'nature';
        color = '#3d7a42';
        tag = 'PARK';
        emoji = '🌿';
        tip = 'Tranquil greenery & public garden';
        categoryWeight = 22;
    }
    // 5. Waterfronts, Beaches, Marinas
    else if (tags.natural === 'beach' || tags.leisure === 'marina' || tags.waterway === 'dock') {
        category = 'nature';
        color = '#0891b2';
        tag = 'BEACH';
        emoji = '🌊';
        tip = 'Scenic beach & refreshing waterfront';
        categoryWeight = 20;
    }
    // 6. Theme Parks, Zoos, Aquariums
    else if (
        tags.tourism === 'zoo' ||
        tags.tourism === 'aquarium' ||
        tags.tourism === 'theme_park' ||
        tags.leisure === 'theme_park'
    ) {
        category = 'landmark';
        color = '#0284c7';
        tag = 'ATTRACTION';
        emoji = tags.tourism === 'aquarium' ? '🐬' : tags.tourism === 'zoo' ? '🦁' : '🎡';
        tip = 'Premier visitor attraction & theme park';
        categoryWeight = 28;
    }
    // 7. Public Squares, Plazas & Markets
    else if (tags.amenity === 'marketplace' || tags.place === 'square') {
        category = 'landmark';
        color = '#b45309';
        tag = tags.amenity === 'marketplace' ? 'MARKET' : 'PLAZA';
        emoji = tags.amenity === 'marketplace' ? '🛍️' : '🎪';
        tip = 'Bustling public square & local market';
        categoryWeight = 22;
    }
    // 8. Hotels & Accommodations
    else if (tags.tourism === 'hotel' || tags.tourism === 'hostel' || tags.tourism === 'guest_house') {
        category = 'landmark';
        color = '#6366f1';
        tag = 'HOTEL';
        emoji = '🏨';
        tip = 'Traveler accommodations & lodging';
        categoryWeight = 16;
    }
    // 9. Bakeries, Patisseries & Ice Cream
    else if (tags.shop === 'bakery' || tags.shop === 'pastry' || tags.amenity === 'ice_cream' || tags.craft === 'confectionery') {
        category = 'craft';
        color = '#d97706';
        tag = 'BAKERY';
        emoji = tags.amenity === 'ice_cream' ? '🍦' : '🥐';
        tip = 'Artisan bakery & freshly baked pastries';
        categoryWeight = 14;
    }
    // 10. Cafes & Coffee
    else if (tags.amenity === 'cafe' || tags.amenity === 'coffee_shop') {
        category = 'craft';
        color = '#d97d3e';
        tag = isChain ? 'COFFEE' : 'CAFE';
        emoji = '☕';
        tip = isChain ? 'Coffee & quick refreshments' : 'Artisan cafe & specialty coffee';
        categoryWeight = isChain ? 8 : 14;
    }
    // 11. Sit-Down Restaurants & Bistros
    else if (tags.amenity === 'restaurant' || tags.amenity === 'bistro' || tags.amenity === 'pub' || tags.amenity === 'bar') {
        category = 'craft';
        color = '#ea580c';
        tag = 'RESTAURANT';
        emoji = '🍽️';
        tip = 'Local restaurant & dining experience';
        categoryWeight = isChain ? 8 : 16;
    }
    // 12. Fast Food
    else if (tags.amenity === 'fast_food') {
        category = 'craft';
        color = '#e06d53';
        tag = isChain ? 'FAST FOOD' : 'DINING';
        emoji = '🍔';
        tip = isChain ? 'Quick bite & refreshments' : 'Local quick dining';
        categoryWeight = 6;
    }
    // 13. Transit Stations
    else if (tags.railway === 'station') {
        category = 'history';
        color = '#4f46e5';
        tag = 'TRANSIT';
        emoji = '🚇';
        tip = 'Transit & Metro Station';
        categoryWeight = 20;
    }
    // 14. Sports & Arenas
    else if (tags.leisure === 'sports_centre' || tags.leisure === 'stadium') {
        category = 'landmark';
        color = '#059669';
        tag = 'SPORTS';
        emoji = '🏟️';
        tip = 'Sports & recreation arena';
        categoryWeight = 18;
    }
    // 15. Shopping Malls & Department Stores
    else if (
        tags.shop === 'mall' ||
        tags.shop === 'department_store' ||
        tags.building === 'retail' ||
        tags.building === 'commercial' ||
        tags.landuse === 'commercial'
    ) {
        category = 'landmark';
        color = '#9333ea';
        tag = tags.shop === 'department_store' ? 'DEPT STORE' : 'MALL';
        emoji = '🛍️';
        tip = tags.shop === 'department_store' ? 'Department store & shopping destination' : 'Shopping mall & commercial plaza';
        categoryWeight = 36;
    }

    // --- Compute Importance Score (0 to 100) ---
    let score = categoryWeight;

    // A. Wikipedia & Wikidata (Strongest signal: up to +40 pts)
    if (tags.wikipedia || tags['wikipedia:en']) {
        score += 30;
    }
    if (tags.wikidata) {
        score += 12;
    }

    // B. Heritage / UNESCO / Historic (+15 pts)
    if (tags.heritage || tags.unesco || tags.historic === 'castle' || tags.historic === 'monument') {
        score += 15;
    }

    // C. Metadata Richness (Official website, hours, multilingual: up to +20 pts)
    if (tags.website || tags['contact:website']) {
        score += 8;
    }
    if (tags.opening_hours) {
        score += 5;
    }
    if ((tags['name:en'] && tags['name:zh']) || (tags['name:en'] && tags['name:ja']) || tags['alt_name']) {
        score += 5;
    }
    if (tags.description) {
        score += 4;
    }

    // D. Geometry Scale (Polygon area / relation vs single point node: +8 pts)
    if (elType === 'relation') {
        score += 8;
    } else if (elType === 'way') {
        score += 4;
    }

    // Penalty for commercial chains so authentic cultural & local places outrank them
    if (isChain) {
        score = Math.max(15, score - 15);
    }

    const importanceScore = Math.min(100, Math.max(10, score));

    // Determine Prominence Tier
    let prominenceTier: 1 | 2 | 3 = 3;
    if (importanceScore >= 68) {
        prominenceTier = 1;
    } else if (importanceScore >= 42) {
        prominenceTier = 2;
    } else {
        prominenceTier = 3;
    }

    // Primary Anchor Destinations: Museums, Malls, and Theme Attractions are key journey landmarks, never Tier 3
    if (tag === 'MALL' || tag === 'DEPT STORE' || tag === 'MUSEUM' || tag === 'ATTRACTION' || tag === 'PARK') {
        if (prominenceTier > 2) {
            prominenceTier = 2;
        }
    }

    return {
        category,
        color,
        tag,
        emoji,
        tip,
        isChain,
        importanceScore,
        prominenceTier,
    };
}

// Pre-seeded authentic district landmarks for high-traffic zones to ensure instant display even during global Overpass downtime
const SHA_TIN_ANCHORS = [
    {
        id: 'seed_st_newtown',
        name: 'New Town Plaza (新城市廣場)',
        category: 'landmark' as const,
        color: '#9333ea',
        coords: [22.3812, 114.1890] as [number, number],
        tag: 'MALL',
        emoji: '🛍️',
        desc: 'One of Hong Kong’s premier shopping and dining mega-complexes, seamlessly connected to Sha Tin MTR station.',
        tip: 'Shopping mall & commercial plaza',
        importanceScore: 90,
        prominenceTier: 1 as const,
    },
    {
        id: 'seed_st_hilton',
        name: 'Hilton Plaza (希爾頓中心)',
        category: 'landmark' as const,
        color: '#9333ea',
        coords: [22.3803, 114.1882] as [number, number],
        tag: 'MALL',
        emoji: '🛍️',
        desc: 'Popular shopping mall in central Sha Tin featuring diverse retail boutiques, services, and local eateries.',
        tip: 'Shopping mall & commercial plaza',
        importanceScore: 82,
        prominenceTier: 1 as const,
    },
    {
        id: 'seed_st_chanway',
        name: 'Chanway Shopping Centre (偉華商場)',
        category: 'landmark' as const,
        color: '#9333ea',
        coords: [22.3814, 114.1878] as [number, number],
        tag: 'MALL',
        emoji: '🛍️',
        desc: 'Convenient shopping arcade adjacent to Sha Tin Station, housing casual dining and daily amenities.',
        tip: 'Shopping mall & commercial plaza',
        importanceScore: 78,
        prominenceTier: 2 as const,
    },
    {
        id: 'seed_st_yata',
        name: 'Yata Department Store (一田百貨)',
        category: 'landmark' as const,
        color: '#9333ea',
        coords: [22.3798, 114.1888] as [number, number],
        tag: 'DEPT STORE',
        emoji: '🛍️',
        desc: 'Flagship Japanese-style modern department store and gourmet supermarket located at New Town Plaza Phase 3.',
        tip: 'Department store & shopping destination',
        importanceScore: 84,
        prominenceTier: 1 as const,
    },
    {
        id: 'seed_st_heritage',
        name: 'Hong Kong Heritage Museum (香港文化博物館)',
        category: 'history' as const,
        color: '#b23b23',
        coords: [22.3768, 114.1861] as [number, number],
        tag: 'MUSEUM',
        emoji: '🏛️',
        desc: 'Comprehensive museum presenting the history, art, and vibrant popular culture of Hong Kong.',
        tip: 'Museum & cultural heritage exhibition',
        importanceScore: 92,
        prominenceTier: 1 as const,
    },
    {
        id: 'seed_st_snoopy',
        name: "Snoopy's World (史諾比開心世界)",
        category: 'landmark' as const,
        color: '#0284c7',
        coords: [22.3822, 114.1901] as [number, number],
        tag: 'ATTRACTION',
        emoji: '🎡',
        desc: 'Whimsical outdoor theme park featuring life-sized Peanuts characters, Snoopy house, and riverboat rides.',
        tip: 'Premier visitor attraction & theme park',
        importanceScore: 80,
        prominenceTier: 1 as const,
    },
    {
        id: 'seed_st_park',
        name: 'Sha Tin Park (沙田公園)',
        category: 'nature' as const,
        color: '#3d7a42',
        coords: [22.3800, 114.1915] as [number, number],
        tag: 'PARK',
        emoji: '🌿',
        desc: 'Scenic riverside public park with Chinese classical gardens, lotus ponds, arched bridges, and manicured lawns.',
        tip: 'Tranquil greenery & public garden',
        importanceScore: 78,
        prominenceTier: 2 as const,
    },
    {
        id: 'seed_st_station',
        name: 'Sha Tin Station (沙田站)',
        category: 'history' as const,
        color: '#4f46e5',
        coords: [22.3827, 114.1872] as [number, number],
        tag: 'TRANSIT',
        emoji: '🚇',
        desc: 'Major East Rail Line transport hub directly connecting downtown Kowloon, Shenzhen border, and New Town Plaza.',
        tip: 'Transit & Metro Station',
        importanceScore: 75,
        prominenceTier: 2 as const,
    },
    {
        id: 'seed_st_chekung',
        name: 'Che Kung Temple (車公廟)',
        category: 'culture' as const,
        color: '#c2410c',
        coords: [22.3732, 114.1828] as [number, number],
        tag: 'TEMPLE',
        emoji: '⛩️',
        desc: 'Historic Taoist temple dedicated to Song dynasty general Che Kung, featuring spinning brass pinwheels.',
        tip: 'Historic temple & sacred shrine',
        importanceScore: 82,
        prominenceTier: 1 as const,
    },
    {
        id: 'seed_st_library',
        name: 'Sha Tin Public Library (沙田公共圖書館)',
        category: 'history' as const,
        color: '#b23b23',
        coords: [22.3815, 114.1911] as [number, number],
        tag: 'CULTURE',
        emoji: '📚',
        desc: 'Major regional library and civic arts complex situated next to Sha Tin Town Hall and Sha Tin Park.',
        tip: 'Cultural & heritage venue',
        importanceScore: 70,
        prominenceTier: 2 as const,
    },
    {
        id: 'seed_st_taofongshan',
        name: 'Tao Fong Shan Christian Centre (道風山基督教叢林)',
        category: 'culture' as const,
        color: '#c2410c',
        coords: [22.3865, 114.1845] as [number, number],
        tag: 'CHURCH',
        emoji: '⛪',
        desc: 'Historic Christian retreat founded in 1930 featuring Chinese traditional pagoda and temple architecture.',
        tip: 'Historic temple & sacred shrine',
        importanceScore: 75,
        prominenceTier: 2 as const,
    },
];

const OVERPASS_MIRRORS = [
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
];

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng') || searchParams.get('lon');
    const radiusStr = searchParams.get('radius');

    if (!latStr || !lngStr) {
        return NextResponse.json({ error: 'Missing lat or lng parameter' }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const rawRadius = radiusStr ? parseFloat(radiusStr) : 1000;

    if (isNaN(lat) || isNaN(lng) || isNaN(rawRadius)) {
        return NextResponse.json({ error: 'Invalid numeric parameters' }, { status: 400 });
    }

    const radius = Math.min(Math.max(rawRadius, 300), 1200);

    // Coarse grid cache key
    const cellLat = (Math.round(lat * 50) / 50).toFixed(2);
    const cellLng = (Math.round(lng * 50) / 50).toFixed(2);
    const cacheKey = `${cellLat}_${cellLng}`;

    const cached = poiCache.get(cacheKey);
    if (cached && Array.isArray(cached.data) && cached.data.length > 0 && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json({ pois: cached.data, cached: true });
    }

    const gatheredPois: any[] = [];
    const seenNames = new Set<string>();

    const addPoi = (item: any) => {
        if (!item || !item.name) return;
        const lower = item.name.toLowerCase().trim();
        if (seenNames.has(lower)) return;
        seenNames.add(lower);
        gatheredPois.push(item);
    };

    // 1. Instant City Pack Inpainting (Zero-latency hit for pre-curated city packs)
    const matchedPack = findCityPackByCoords(lat, lng);
    if (matchedPack && matchedPack.landmarks.length > 0) {
        for (const lm of matchedPack.landmarks) {
            addPoi({
                id: lm.id,
                name: lm.name,
                category: lm.category,
                color: lm.color,
                coords: lm.coords,
                svgSnippet: lm.svgSnippet,
                tag: lm.tag,
                desc: lm.desc,
                audioNote: lm.audioNote,
                tips: lm.tips,
                isCustom: false,
                importanceScore: lm.importanceScore ?? 80,
                prominenceTier: lm.prominenceTier ?? 1,
            });
        }
    }

    // Instant return if we have full district anchors (avoids 10s latency & avoids external rate limits)
    if (gatheredPois.length >= 8) {
        gatheredPois.sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0));
        poiCache.set(cacheKey, { timestamp: Date.now(), data: gatheredPois });
        return NextResponse.json({ pois: gatheredPois });
    }

    // 2. Fast Overpass Probe (Only if external Overpass server is responsive in <1.5s)
    const overpassQuery = `
[out:json][timeout:3];
(
  node(around:${radius},${lat},${lng})["name"];
  way(around:${radius},${lat},${lng})["name"];
)->.all;
(
  .all["tourism"="museum"];
  .all["shop"="mall"];
  .all["shop"="department_store"];
  .all["leisure"="park"];
  .all["amenity"="place_of_worship"];
);
out center 40;
`.trim();

    for (const mirrorUrl of OVERPASS_MIRRORS) {
        try {
            const response = await fetch(mirrorUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'WanderSketch-App/1.0 (wandersketch@local.dev)',
                },
                body: `data=${encodeURIComponent(overpassQuery)}`,
                signal: AbortSignal.timeout(1500),
            });

            if (!response.ok) continue;

            const data = await response.json();
            if (Array.isArray(data.elements) && data.elements.length > 0) {
                for (const el of data.elements) {
                    const tags = el.tags || {};
                    const primaryName = tags['name:en'] || tags.name || tags['name:zh'] || tags['name:ja'];
                    if (!primaryName || primaryName.trim().length < 2) continue;

                    let ptLat: number | null = null;
                    let ptLon: number | null = null;
                    if (typeof el.lat === 'number' && typeof el.lon === 'number') {
                        ptLat = el.lat;
                        ptLon = el.lon;
                    } else if (el.center && typeof el.center.lat === 'number' && typeof el.center.lon === 'number') {
                        ptLat = el.center.lat;
                        ptLon = el.center.lon;
                    }
                    if (ptLat === null || ptLon === null) continue;

                    const secondName = tags.name && tags.name !== primaryName ? ` (${tags.name})` : '';
                    const fullName = `${primaryName}${secondName}`;
                    const meta = categorizePoi(tags, fullName, el.type);

                    const svgSnippet = `
<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
  <circle cx="50" cy="50" r="34" fill="${meta.color}" stroke="#2b261b" stroke-width="3"/>
  <text x="50" y="58" font-size="22" text-anchor="middle">${meta.emoji}</text>
</svg>
`.trim();

                    addPoi({
                        id: `osm_${el.type}_${el.id}`,
                        name: fullName,
                        category: meta.category,
                        color: meta.color,
                        coords: [ptLat, ptLon] as [number, number],
                        svgSnippet,
                        tag: meta.tag,
                        desc: tags.description || tags['addr:street'] || meta.tip,
                        audioNote: `You have arrived at ${fullName}. ${meta.tip}`,
                        tips: meta.tip,
                        isCustom: false,
                        importanceScore: meta.importanceScore,
                        prominenceTier: meta.prominenceTier,
                    });
                }
                break;
            }
        } catch {
            // Overpass mirror failed, proceed to fallback
        }
    }

    // 3. Gentle Single Nominatim Viewbox Search (Only if Overpass yielded < 5 spots)
    if (gatheredPois.length < 5) {
        try {
            const delta = 0.012;
            const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;
            const nomUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=attraction&viewbox=${viewbox}&bounded=1&limit=12&addressdetails=1`;
            const res = await fetch(nomUrl, {
                headers: { 'User-Agent': 'WanderSketch-App/1.0 (wandersketch@local.dev)' },
                signal: AbortSignal.timeout(2000),
            });
            if (res.ok) {
                const nomData = await res.json();
                if (Array.isArray(nomData)) {
                    for (const item of nomData) {
                        const rawName = item.name || (item.display_name ? item.display_name.split(',')[0] : '');
                        if (!rawName || rawName.trim().length < 2) continue;

                        const itemType = (item.type || '').toLowerCase();
                        const itemClass = (item.class || '').toLowerCase();
                        const meta = categorizePoi({
                            tourism: itemClass === 'tourism' ? itemType : '',
                            shop: itemClass === 'shop' || itemType.includes('mall') ? 'mall' : '',
                            leisure: itemClass === 'leisure' ? itemType : '',
                            amenity: itemClass === 'amenity' ? itemType : '',
                            building: itemClass === 'building' ? itemType : '',
                        }, rawName);

                        const svgSnippet = `
<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
  <circle cx="50" cy="50" r="34" fill="${meta.color}" stroke="#2b261b" stroke-width="3"/>
  <text x="50" y="58" font-size="22" text-anchor="middle">${meta.emoji}</text>
</svg>
`.trim();

                        addPoi({
                            id: `nom_${item.place_id}`,
                            name: rawName,
                            category: meta.category,
                            color: meta.color,
                            coords: [parseFloat(item.lat), parseFloat(item.lon)] as [number, number],
                            svgSnippet,
                            tag: meta.tag,
                            desc: item.display_name,
                            audioNote: `You have arrived at ${rawName}.`,
                            tips: meta.tip,
                            isCustom: false,
                            importanceScore: meta.importanceScore,
                            prominenceTier: meta.prominenceTier,
                        });
                    }
                }
            }
        } catch {
            // Nominatim fallback completed or timed out
        }
    }

    // 4. Sort and return gathered POIs
    if (gatheredPois.length > 0) {
        gatheredPois.sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0));
        poiCache.set(cacheKey, { timestamp: Date.now(), data: gatheredPois });
        return NextResponse.json({ pois: gatheredPois });
    }

    return NextResponse.json({ pois: [] });
}
