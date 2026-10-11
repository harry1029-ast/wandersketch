import { CityPack } from '../types';

export const TORONTO_PACK: CityPack = {
    id: 'toronto_distillery',
    cityName: 'Toronto',
    districtName: 'Toronto Distillery District & Waterfront',
    country: 'Canada',
    center: [43.6503, -79.3596],
    zoom: 15,
    userOrigin: [43.6515, -79.3620],
    bounds: [
        [43.6350, -79.4050],
        [43.6650, -79.3400],
    ],
    facilities: [
        { type: 'restroom', name: 'Restroom (South Red Brick Mill)', coords: [43.6498, -79.3588], emoji: '🚻' },
        { type: 'info', name: 'Visitor Center & Map Kiosk', coords: [43.6514, -79.3615], emoji: 'ℹ️' },
        { type: 'cafe', name: "Balzac's Parisian Style Cafe", coords: [43.6504, -79.3606], emoji: '☕' },
        { type: 'photo', name: 'Vintage Locomotive Photo Spot', coords: [43.6492, -79.3610], emoji: '📷' },
    ],
    landmarks: [
        {
            id: 'td-1',
            name: 'Gooderham Historic Windmill & Mill',
            category: 'history',
            color: '#c14937',
            coords: [43.6503, -79.3596],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#c14937" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🏛️</text>
        </svg>
      `,
            tag: 'HERITAGE',
            desc: 'Built in 1832, this site once housed the largest whiskey distillery in the British Empire. Victorian red-brick architecture is preserved intact.',
            audioNote: 'Welcome to the birthplace of the Distillery District. In the mid-19th century, millions of gallons were shipped across the Great Lakes from here.',
            panoUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
            tips: 'The best photo angle is from the cobblestone plaza south of the historic mill clock.',
            importanceScore: 92,
            prominenceTier: 1,
        },
        {
            id: 'td-cn',
            name: 'CN Tower & SkyPod',
            category: 'landmark',
            color: '#c14937',
            coords: [43.6426, -79.3871],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#c14937" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🗼</text>
        </svg>
      `,
            tag: 'ICONIC SPIRE',
            desc: 'Toronto’s 553m signature communications and observation spire, offering glass floor vistas across Lake Ontario and the skyline.',
            audioNote: 'Completed in 1976, the CN Tower was the world’s tallest free-standing structure for over three decades.',
            panoUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
            tips: 'Sunset reservations at the 360 Restaurant include complimentary elevator access to the main observation deck.',
            importanceScore: 96,
            prominenceTier: 1,
        },
        {
            id: 'td-slm',
            name: 'St. Lawrence Historic Market',
            category: 'craft',
            color: '#d97d3e',
            coords: [43.6487, -79.3715],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#d97d3e" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🥖</text>
        </svg>
      `,
            tag: 'MARKET',
            desc: 'Renowned culinary institution operating since 1803, packed with artisan cheesemongers, bakers, seafood stalls, and peameal bacon sandwiches.',
            audioNote: 'National Geographic once named St. Lawrence Market the #1 food market in the world.',
            panoUrl: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1200&q=80',
            tips: 'Try Carousel Bakery’s legendary world-famous peameal bacon sandwich on a warm kaiser roll.',
            importanceScore: 90,
            prominenceTier: 1,
        },
        {
            id: 'td-2',
            name: 'Soma Artisan Bean-to-Bar Workshop',
            category: 'craft',
            color: '#f4c568',
            coords: [43.6508, -79.3582],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🍫</text>
        </svg>
      `,
            tag: 'FLAVORS',
            desc: 'Renowned independent micro-batch chocolate roaster. You can observe mini stone mills refining cacao beans through glass partitions.',
            audioNote: 'Step inside Soma to breathe in fresh roasted cacao. Don’t miss their Maya Kiss spiced drinking chocolate.',
            panoUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
            tips: 'Sample the dark truffle flight and hazelnut gelato.',
            importanceScore: 82,
            prominenceTier: 2,
        },
        {
            id: 'td-3',
            name: 'LOVE Sculpture & Clock Plaza',
            category: 'landmark',
            color: '#e06d53',
            coords: [43.6512, -79.3601],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#e06d53" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">❤️</text>
        </svg>
      `,
            tag: 'PLAZA',
            desc: 'The social center of the district. The multi-ton steel LOVE installation holds thousands of brass locks clipped on by visitors worldwide.',
            audioNote: 'This steel sculpture was assembled from salvaged distillery equipment and is now a popular spot for photos and locks.',
            panoUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
            tips: 'Best lighting appears around twilight when warm Edison street lamps turn on.',
            importanceScore: 84,
            prominenceTier: 1,
        },
        {
            id: 'td-4',
            name: 'Sugar Beach Waterfront Promenade',
            category: 'nature',
            color: '#6f9d85',
            coords: [43.6438, -79.3664],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#6f9d85" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">⛱️</text>
        </svg>
      `,
            tag: 'PROMENADE',
            desc: 'An urban lakefront park with signature pink umbrellas and fine white sand, looking across Lake Ontario toward the Toronto Islands.',
            audioNote: 'Formerly a sugar refinery dock, this revitalized parcel offers open water views and afternoon shade.',
            panoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
            tips: 'Lake winds get crisp in the late afternoon; pack a light jacket.',
            importanceScore: 80,
            prominenceTier: 2,
        },
        {
            id: 'td-5',
            name: 'Young Centre & Glass Studios',
            category: 'culture',
            color: '#6f9d85',
            coords: [43.6501, -79.3570],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#6f9d85" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🎭</text>
        </svg>
      `,
            tag: 'THEATRE',
            desc: 'Converted from 19th-century tank houses, hosting live theater spaces alongside open glass-blowing and ceramics studios.',
            audioNote: 'Over 40 resident artists work here. Watch hot glass blown and annealed directly through studio viewing windows.',
            panoUrl: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80',
            tips: 'Public studio demonstrations are held every Tuesday afternoon.',
            importanceScore: 78,
            prominenceTier: 2,
        },
    ],
};

