import { ScenicZone, TravelPlan } from '@/types/itinerary';

export const MASTER_ZONES: Record<string, ScenicZone> = {
    toronto_distillery: {
        id: 'toronto_distillery',
        name: 'Toronto Distillery District & Waterfront',
        city: 'Toronto',
        center: [43.6503, -79.3596],
        zoom: 16,
        userOrigin: [43.6515, -79.3620],
        bounds: [
            [43.6420, -79.3720],
            [43.6570, -79.3490],
        ],
        facilities: [
            { type: 'restroom', name: 'Restroom (South Red Brick Mill)', coords: [43.6498, -79.3588], emoji: '🚻' },
            { type: 'info', name: 'Visitor Center & Map Kiosk', coords: [43.6514, -79.3615], emoji: 'ℹ️' },
            { type: 'cafe', name: "Balzac's Parisian Style Cafe", coords: [43.6504, -79.3606], emoji: '☕' },
            { type: 'photo', name: 'Vintage Locomotive Photo Spot', coords: [43.6492, -79.3610], emoji: '📷' },
        ],
        landmarksPool: [
            {
                id: 'td-1',
                name: 'Gooderham Historic Windmill & Mill',
                category: 'history',
                color: '#c14937',
                coords: [43.6503, -79.3596],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <rect x="20" y="35" width="60" height="50" rx="4" fill="#a73a2d" stroke="#2b261b" stroke-width="3"/>
            <polygon points="15,35 50,10 85,35" fill="#423b2c" stroke="#2b261b" stroke-width="3"/>
            <rect x="40" y="55" width="20" height="30" fill="#f3ebd6" stroke="#2b261b" stroke-width="2"/>
            <line x1="30" y1="45" x2="42" y2="45" stroke="#f3ebd6" stroke-width="3"/>
            <line x1="58" y1="45" x2="70" y2="45" stroke="#f3ebd6" stroke-width="3"/>
            <circle cx="50" cy="24" r="5" fill="#f4c568"/>
          </svg>
        `,
                tag: 'Heritage',
                desc: 'Built in 1832, this site once housed the largest whiskey distillery in the world. Victorian red-brick architecture is preserved intact.',
                audioNote: 'Welcome to the birthplace of the Distillery District. In the mid-19th century, millions of gallons were shipped across the Great Lakes from here.',
                panoUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
                tips: 'The best photo angle is from the stone steps south of the historic brass clock.',
            },
            {
                id: 'td-2',
                name: 'Soma Artisan Bean-to-Bar Workshop',
                category: 'craft',
                color: '#f4c568',
                coords: [43.6508, -79.3582],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <rect x="22" y="30" width="56" height="55" rx="6" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
            <polygon points="18,30 50,12 82,30" fill="#e06d53" stroke="#2b261b" stroke-width="3"/>
            <circle cx="50" cy="52" r="14" fill="#423b2c" stroke="#2b261b" stroke-width="2"/>
            <text x="50" y="58" font-size="14" text-anchor="middle" fill="#f7f2e4">🍫</text>
          </svg>
        `,
                tag: 'Flavors',
                desc: 'Renowned independent micro-batch chocolate roaster. You can observe mini stone mills refining cacao beans through glass partitions.',
                audioNote: 'Step inside Soma to breathe in fresh roasted cacao. Don’t miss their Maya Kiss spiced drinking chocolate.',
                panoUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
                tips: 'Sample the dark truffle flight and hazelnut gelato.',
            },
            {
                id: 'td-3',
                name: 'LOVE Sculpture & Clock Plaza',
                category: 'landmark',
                color: '#e06d53',
                coords: [43.6512, -79.3601],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <rect x="35" y="45" width="30" height="40" fill="#8bb8cf" stroke="#2b261b" stroke-width="3"/>
            <path d="M 50,30 C 40,15 20,25 35,45 C 50,60 50,60 50,60 C 50,60 50,60 65,45 C 80,25 60,15 50,30 Z" fill="#e06d53" stroke="#2b261b" stroke-width="2"/>
          </svg>
        `,
                tag: 'Plaza Landmark',
                desc: 'The social center of the district. The multi-ton steel LOVE installation holds thousands of locks clipped on by visitors worldwide.',
                audioNote: 'This steel sculpture was assembled from salvaged distillery equipment and is now a popular spot for photos and locks.',
                panoUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
                tips: 'Best lighting appears around twilight when warm Edison street lamps turn on.',
            },
            {
                id: 'td-4',
                name: 'Sugar Beach Waterfront Promenade',
                category: 'nature',
                color: '#6f9d85',
                coords: [43.6438, -79.3664],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="35" fill="#8bb8cf" stroke="#2b261b" stroke-width="3"/>
            <path d="M 30,55 Q 50,45 70,55" stroke="#f7f2e4" stroke-width="4" fill="none"/>
            <text x="50" y="45" font-size="20" text-anchor="middle">⛱️</text>
          </svg>
        `,
                tag: 'Lakefront Walk',
                desc: 'An urban park with signature pink umbrellas and fine white sand, looking across Lake Ontario toward the Toronto Islands.',
                audioNote: 'Formerly a sugar refinery dock, this revitalized parcel offers open water views and afternoon shade.',
                panoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
                tips: 'Lake winds get crisp in the late afternoon; pack a light jacket.',
            },
            {
                id: 'td-5',
                name: 'Young Centre & Glass Studios',
                category: 'culture',
                color: '#6f9d85',
                coords: [43.6501, -79.3570],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <rect x="25" y="35" width="50" height="50" fill="#6f9d85" stroke="#2b261b" stroke-width="3"/>
            <polygon points="20,35 50,15 80,35" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
            <text x="50" y="65" font-size="18" text-anchor="middle">🎭</text>
          </svg>
        `,
                tag: 'Artisan Row',
                desc: 'Converted from 19th-century tank houses, hosting live theater spaces alongside open glass-blowing and ceramics studios.',
                audioNote: 'Over 40 resident artists work here. Watch hot glass blown and annealed directly through studio viewing windows.',
                panoUrl: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80',
                tips: 'Public studio demonstrations are held every Tuesday afternoon.',
            },
        ],
    },
    kyoto_higashiyama: {
        id: 'kyoto_higashiyama',
        name: 'Kyoto Higashiyama Historic District',
        city: 'Kyoto',
        center: [34.9965, 135.7810],
        zoom: 16,
        userOrigin: [34.9985, 135.7760],
        bounds: [
            [34.9910, 135.7720],
            [35.0020, 135.7890],
        ],
        facilities: [
            { type: 'restroom', name: 'Public Restroom (Kiyomizu Approach)', coords: [34.9958, 135.7828], emoji: '🚻' },
            { type: 'info', name: 'Higashiyama Tourist Office', coords: [34.9995, 135.7765], emoji: 'ℹ️' },
            { type: 'cafe', name: 'Traditional Wagashi Teahouse', coords: [35.0010, 135.7780], emoji: '🍵' },
            { type: 'photo', name: 'Sannenzaka Stone Stairs Point', coords: [34.9968, 135.7818], emoji: '📷' },
        ],
        landmarksPool: [
            {
                id: 'ky-1',
                name: 'Yasaka Pagoda (Hokan-ji)',
                category: 'history',
                color: '#c14937',
                coords: [34.9985, 135.7788],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <polygon points="30,80 50,15 70,80" fill="#423b2c" stroke="#2b261b" stroke-width="3"/>
            <polygon points="20,40 50,25 80,40" fill="#c14937" stroke="#2b261b" stroke-width="2"/>
            <polygon points="15,60 50,45 85,60" fill="#c14937" stroke="#2b261b" stroke-width="2"/>
            <line x1="50" y1="15" x2="50" y2="5" stroke="#f4c568" stroke-width="4"/>
          </svg>
        `,
                tag: 'Ancient Tower',
                desc: 'A five-story wooden pagoda rising from narrow cobblestone alleys, defining the classic Higashiyama skyline.',
                audioNote: 'Yasaka Pagoda dates back hundreds of years. The street view at dawn or dusk remains one of Kyoto’s most iconic sights.',
                panoUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
                tips: 'Arrive before 7:30 AM to catch the quiet stone street in soft morning light.',
            },
            {
                id: 'ky-2',
                name: 'Ninenzaka & Sannenzaka Lanes',
                category: 'craft',
                color: '#f4c568',
                coords: [34.9972, 135.7812],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <rect x="25" y="40" width="50" height="45" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
            <polygon points="15,40 50,20 85,40" fill="#423b2c" stroke="#2b261b" stroke-width="3"/>
            <text x="50" y="65" font-size="20" text-anchor="middle">🏮</text>
          </svg>
        `,
                tag: 'Machiya Street',
                desc: 'Traditional wooden machiya houses lining stone-paved slopes, stocked with Kiyomizu ceramics and spiced dango.',
                audioNote: 'Take your time walking down Sannenzaka. Legend says walking calmly along these steps ensures a safe journey.',
                panoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
                tips: 'Notice the historic machiya building featuring tatami-mat rooms and noren curtains.',
            },
            {
                id: 'ky-3',
                name: 'Kiyomizu-dera Wooden Stage',
                category: 'history',
                color: '#c14937',
                coords: [34.9949, 135.7850],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <rect x="20" y="40" width="60" height="45" fill="#c14937" stroke="#2b261b" stroke-width="3"/>
            <polygon points="10,40 50,15 90,40" fill="#2b261b" stroke="#2b261b" stroke-width="3"/>
            <line x1="28" y1="55" x2="28" y2="85" stroke="#f7f2e4" stroke-width="3"/>
            <line x1="42" y1="55" x2="42" y2="85" stroke="#f7f2e4" stroke-width="3"/>
            <line x1="58" y1="55" x2="58" y2="85" stroke="#f7f2e4" stroke-width="3"/>
            <line x1="72" y1="55" x2="72" y2="85" stroke="#f7f2e4" stroke-width="3"/>
          </svg>
        `,
                tag: 'Temple Stage',
                desc: 'Founded in 778 AD, this hall cantilevers out from the cliff without a single nail, offering panoramic city views.',
                audioNote: 'Kiyomizu-dera was built entirely with interlocking wooden joinery. The stage looks directly over cherry and maple groves.',
                panoUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
                tips: 'Drink from one of the three Otowa waterfall streams, representing health, success, or love.',
            },
        ],
    },
    paris_marais: {
        id: 'paris_marais',
        name: 'Paris Le Marais Historic Mansions',
        city: 'Paris',
        center: [48.8575, 2.3610],
        zoom: 16,
        userOrigin: [48.8540, 2.3580],
        bounds: [
            [48.8510, 2.3500],
            [48.8640, 2.3720],
        ],
        facilities: [
            { type: 'restroom', name: 'Public Restroom (Saint-Paul Metro)', coords: [48.8550, 2.3600], emoji: '🚻' },
            { type: 'info', name: 'Le Marais Information Kiosk', coords: [48.8580, 2.3560], emoji: 'ℹ️' },
            { type: 'cafe', name: 'Carette Salon & Hot Chocolate Bar', coords: [48.8556, 2.3650], emoji: '☕' },
            { type: 'photo', name: 'Hôtel de Soubise Courtyard', coords: [48.8605, 2.3585], emoji: '📷' },
        ],
        landmarksPool: [
            {
                id: 'pa-1',
                name: 'Place des Vosges Royal Arcades',
                category: 'history',
                color: '#c14937',
                coords: [48.8554, 2.3655],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <rect x="20" y="35" width="60" height="50" fill="#c14937" stroke="#2b261b" stroke-width="3"/>
            <polygon points="15,35 50,15 85,35" fill="#423b2c" stroke="#2b261b" stroke-width="3"/>
            <path d="M 35,85 A 15,15 0 0,1 65,85" stroke="#f7f2e4" stroke-width="4" fill="none"/>
          </svg>
        `,
                tag: 'Royal Square',
                desc: 'The oldest planned square in Paris, framed by red brick facades with stone dressings and shaded vaulted arcades.',
                audioNote: 'Inaugurated in 1612, Place des Vosges maintained strict architectural symmetry across 36 royal townhouses.',
                panoUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
                tips: "Victor Hugo's residence sits in the corner at No. 6, open as a public museum.",
            },
            {
                id: 'pa-2',
                name: 'Musée Picasso (Hôtel Salé)',
                category: 'culture',
                color: '#6f9d85',
                coords: [48.8598, 2.3623],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <rect x="25" y="35" width="50" height="50" fill="#6f9d85" stroke="#2b261b" stroke-width="3"/>
            <polygon points="20,35 50,15 80,35" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
            <text x="50" y="65" font-size="20" text-anchor="middle">🎨</text>
          </svg>
        `,
                tag: 'Fine Arts',
                desc: 'A grand 17th-century aristocratic mansion exhibiting over 5,000 paintings, sculptures, and ceramic works by Picasso.',
                audioNote: 'Beyond Picasso’s own stages, the gallery holds his personal collection of Cézanne, Matisse, and tribal artifacts.',
                panoUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80',
                tips: 'Visit the courtyard garden to see custom bronze furniture designed by Diego Giacometti.',
            },
            {
                id: 'pa-3',
                name: 'Rue des Rosiers Food Alley',
                category: 'craft',
                color: '#f4c568',
                coords: [48.8573, 2.3592],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="32" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
            <text x="50" y="58" font-size="22" text-anchor="middle">🧆</text>
          </svg>
        `,
                tag: 'Street Food',
                desc: 'The historic heart of the Jewish quarter, packed with bakeries, bookshops, and falafel vendors.',
                audioNote: 'Crispy herb falafel stuffed in warm pita with roasted eggplant and tahini makes for an ideal walking lunch.',
                panoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
                tips: 'Sunday afternoons have the liveliest pedestrian atmosphere.',
            },
        ],
    },
};

export const INITIAL_PLANS: TravelPlan[] = [
    {
        id: 'plan_toronto_autumn',
        title: 'Toronto Lakefront & Distillery Autumn Walk',
        zoneKey: 'toronto_distillery',
        createdAt: '2026-10-03',
        tag: 'Historic Waterfront',
        estimatedDistance: '2.4 km',
        estimatedDuration: '2.5 hrs',
        activeRouteKey: 'classic',
        spotIds: ['td-1', 'td-2', 'td-3', 'td-4', 'td-5'],
        themeRoutes: {
            classic: ['td-1', 'td-2', 'td-3', 'td-4', 'td-5'],
            culture: ['td-2', 'td-3', 'td-5'],
            rain: ['td-1', 'td-2'],
        },
    },
    {
        id: 'plan_kyoto_zen',
        title: 'Kyoto Higashiyama Temple & Machiya Stroll',
        zoneKey: 'kyoto_higashiyama',
        createdAt: '2026-09-28',
        tag: 'Zen Heritage',
        estimatedDistance: '1.8 km',
        estimatedDuration: '2.2 hrs',
        activeRouteKey: 'classic',
        spotIds: ['ky-1', 'ky-2', 'ky-3'],
        themeRoutes: {
            classic: ['ky-1', 'ky-2', 'ky-3'],
            culture: ['ky-2', 'ky-3'],
            rain: ['ky-1', 'ky-3'],
        },
    },
    {
        id: 'plan_paris_boho',
        title: 'Paris Le Marais Mansions & Patisserie Stroll',
        zoneKey: 'paris_marais',
        createdAt: '2026-09-15',
        tag: 'Art & Salons',
        estimatedDistance: '2.1 km',
        estimatedDuration: '2.0 hrs',
        activeRouteKey: 'classic',
        spotIds: ['pa-1', 'pa-2', 'pa-3'],
        themeRoutes: {
            classic: ['pa-1', 'pa-2', 'pa-3'],
            culture: ['pa-2', 'pa-3'],
            rain: ['pa-1', 'pa-3'],
        },
    },
];