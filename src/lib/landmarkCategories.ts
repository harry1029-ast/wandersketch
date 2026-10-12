import { Landmark } from '@/types/itinerary';

export type DiscoveryCategory =
    | 'all'
    | 'restaurant'
    | 'cafe'
    | 'hotel'
    | 'attraction'
    | 'shopping'
    | 'culture'
    | 'nature';

export interface DiscoveryCategoryConfig {
    id: DiscoveryCategory;
    label: string;
    emoji: string;
    activeBg: string;
    activeText: string;
    borderColor: string;
}

export const DISCOVERY_CATEGORIES: DiscoveryCategoryConfig[] = [
    { id: 'all', label: 'Highlights', emoji: '✨', activeBg: 'bg-paper-900', activeText: 'text-amber-100', borderColor: 'border-paper-900' },
    { id: 'restaurant', label: 'Restaurants', emoji: '🍽️', activeBg: 'bg-red-700', activeText: 'text-white', borderColor: 'border-red-900' },
    { id: 'cafe', label: 'Cafes', emoji: '☕', activeBg: 'bg-amber-700', activeText: 'text-white', borderColor: 'border-amber-900' },
    { id: 'hotel', label: 'Hotels', emoji: '🏨', activeBg: 'bg-indigo-700', activeText: 'text-white', borderColor: 'border-indigo-900' },
    { id: 'attraction', label: 'Things to Do', emoji: '🎡', activeBg: 'bg-sky-700', activeText: 'text-white', borderColor: 'border-sky-900' },
    { id: 'shopping', label: 'Shopping', emoji: '🛍️', activeBg: 'bg-purple-700', activeText: 'text-white', borderColor: 'border-purple-900' },
    { id: 'culture', label: 'Culture & Heritage', emoji: '🏛️', activeBg: 'bg-amber-900', activeText: 'text-white', borderColor: 'border-amber-950' },
    { id: 'nature', label: 'Parks & Nature', emoji: '🌿', activeBg: 'bg-emerald-700', activeText: 'text-white', borderColor: 'border-emerald-900' },
];

/**
 * Resolves which Discovery Category a landmark belongs to.
 */
export function getLandmarkCategoryGroup(lm: Landmark): DiscoveryCategory {
    const tag = (lm.tag || '').toUpperCase();
    const cat = (lm.category || '').toLowerCase();
    const name = (lm.name || '').toLowerCase();

    // 1. Dining & Restaurants
    if (
        tag === 'RESTAURANT' ||
        tag === 'DINING' ||
        tag === 'BISTRO' ||
        tag === 'FAST FOOD' ||
        name.includes('restaurant') ||
        name.includes('bistro') ||
        name.includes('kitchen') ||
        name.includes('dining') ||
        name.includes('noodle') ||
        name.includes('sushi') ||
        name.includes('bbq') ||
        name.includes('hotpot') ||
        name.includes('酒家') ||
        name.includes('餐廳') ||
        name.includes('飯店') ||
        name.includes('茶餐廳')
    ) {
        return 'restaurant';
    }

    // 2. Cafes & Bakeries
    if (
        tag === 'CAFE' ||
        tag === 'COFFEE' ||
        tag === 'BAKERY' ||
        tag === 'PASTRY' ||
        tag === 'ICE CREAM' ||
        name.includes('cafe') ||
        name.includes('coffee') ||
        name.includes('starbucks') ||
        name.includes('bakery') ||
        name.includes('patisserie') ||
        name.includes('bread') ||
        name.includes('cake') ||
        name.includes('tea') ||
        name.includes('咖啡') ||
        name.includes('餅店')
    ) {
        return 'cafe';
    }

    // 3. Hotels & Accommodations
    if (
        tag === 'HOTEL' ||
        tag === 'LODGING' ||
        name.includes('hotel') ||
        name.includes('inn') ||
        name.includes('hostel') ||
        name.includes('resort') ||
        name.includes('ryokan') ||
        name.includes('酒店') ||
        name.includes('旅館')
    ) {
        return 'hotel';
    }

    // 4. Shopping & Malls
    if (
        tag === 'MALL' ||
        tag === 'DEPT STORE' ||
        tag === 'MARKET' ||
        tag === 'PLAZA' ||
        name.includes('mall') ||
        name.includes('plaza') ||
        name.includes('centre') ||
        name.includes('center') ||
        name.includes('market') ||
        name.includes('square') ||
        name.includes('arcade') ||
        name.includes('商場') ||
        name.includes('廣場') ||
        name.includes('中心') ||
        name.includes('市集') ||
        name.includes('街市')
    ) {
        return 'shopping';
    }

    // 5. Culture, Museums & Sacred Heritage
    if (
        tag === 'MUSEUM' ||
        tag === 'HERITAGE' ||
        tag === 'TEMPLE' ||
        tag === 'CHURCH' ||
        tag === 'MOSQUE' ||
        tag === 'SHRINE' ||
        tag === 'CULTURE' ||
        cat === 'history' ||
        cat === 'culture' ||
        name.includes('museum') ||
        name.includes('heritage') ||
        name.includes('temple') ||
        name.includes('monastery') ||
        name.includes('church') ||
        name.includes('cathedral') ||
        name.includes('gallery') ||
        name.includes('theatre') ||
        name.includes('theater') ||
        name.includes('hall') ||
        name.includes('博物館') ||
        name.includes('文物') ||
        name.includes('廟') ||
        name.includes('寺') ||
        name.includes('堂') ||
        name.includes('館')
    ) {
        return 'culture';
    }

    // 6. Parks, Nature & Viewpoints
    if (
        tag === 'PARK' ||
        tag === 'GARDEN' ||
        tag === 'VIEW' ||
        tag === 'BEACH' ||
        cat === 'nature' ||
        name.includes('park') ||
        name.includes('garden') ||
        name.includes('peak') ||
        name.includes('hill') ||
        name.includes('beach') ||
        name.includes('trail') ||
        name.includes('view') ||
        name.includes('waterfront') ||
        name.includes('promenade') ||
        name.includes('公園') ||
        name.includes('花園') ||
        name.includes('海灘') ||
        name.includes('泳灘') ||
        name.includes('海濱')
    ) {
        return 'nature';
    }

    // 7. Things to Do & Attractions
    return 'attraction';
}

