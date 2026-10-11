import { ScenicZone, TravelPlan } from '@/types/itinerary';
import { HONG_KONG_PACK, KYOTO_PACK, PARIS_PACK, TORONTO_PACK } from '@/data/cityPacks';

export const MASTER_ZONES: Record<string, ScenicZone> = {
    toronto_distillery: {
        id: TORONTO_PACK.id,
        name: TORONTO_PACK.districtName,
        city: TORONTO_PACK.cityName,
        center: TORONTO_PACK.center,
        zoom: TORONTO_PACK.zoom,
        userOrigin: TORONTO_PACK.userOrigin,
        bounds: TORONTO_PACK.bounds,
        facilities: TORONTO_PACK.facilities,
        landmarksPool: TORONTO_PACK.landmarks,
    },
    kyoto_higashiyama: {
        id: KYOTO_PACK.id,
        name: KYOTO_PACK.districtName,
        city: KYOTO_PACK.cityName,
        center: KYOTO_PACK.center,
        zoom: KYOTO_PACK.zoom,
        userOrigin: KYOTO_PACK.userOrigin,
        bounds: KYOTO_PACK.bounds,
        illustratedMapUrl: '/maps/kyoto_scenic_illustrated_v4.jpg',
        illustratedMapBounds: [
            [34.989504, 135.771790],
            [35.003003, 135.791016],
        ],
        facilities: KYOTO_PACK.facilities,
        landmarksPool: KYOTO_PACK.landmarks,
    },
    paris_marais: {
        id: PARIS_PACK.id,
        name: PARIS_PACK.districtName,
        city: PARIS_PACK.cityName,
        center: PARIS_PACK.center,
        zoom: PARIS_PACK.zoom,
        userOrigin: PARIS_PACK.userOrigin,
        bounds: PARIS_PACK.bounds,
        facilities: PARIS_PACK.facilities,
        landmarksPool: PARIS_PACK.landmarks,
    },
    new_york_manhattan: {
        id: 'new_york_manhattan',
        name: 'New York • Midtown & Central Park Promenade',
        city: 'New York',
        center: [40.7580, -73.9855],
        zoom: 15,
        userOrigin: [40.7589, -73.9851],
        bounds: [
            [40.7420, -74.0050],
            [40.7850, -73.9600],
        ],
        facilities: [
            { type: 'restroom', name: 'Bryant Park Public Restroom', coords: [40.7536, -73.9832], emoji: '🚻' },
            { type: 'info', name: 'Grand Central Kiosk', coords: [40.7527, -73.9772], emoji: 'ℹ️' },
            { type: 'cafe', name: 'Blue Bottle Cafe', coords: [40.7585, -73.9782], emoji: '☕' },
            { type: 'photo', name: 'Top of the Rock Lookout', coords: [40.7590, -73.9794], emoji: '📷' },
        ],
        landmarksPool: [
            {
                id: 'ny-1',
                name: 'Empire State Building Spire',
                category: 'landmark',
                color: '#c14937',
                coords: [40.7484, -73.9857],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <line x1="50" y1="95" x2="50" y2="10" stroke="#2b261b" stroke-width="4"/>
            <rect x="35" y="40" width="30" height="55" fill="#c14937" stroke="#2b261b" stroke-width="2"/>
            <rect x="42" y="20" width="16" height="20" fill="#f4c568" stroke="#2b261b" stroke-width="1.5"/>
          </svg>
        `,
                tag: 'Art Deco',
                desc: 'The iconic 102-story Art Deco skyscraper soaring above Midtown Manhattan since 1931.',
                audioNote: 'A marvel of Depression-era construction, built in just 410 days.',
                panoUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1200&q=80',
                tips: 'The 86th floor open-air deck provides 360-degree views across six states on clear days.',
            },
            {
                id: 'ny-2',
                name: 'Times Square & Broadway Plaza',
                category: 'culture',
                color: '#f4c568',
                coords: [40.7580, -73.9855],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <rect x="20" y="30" width="60" height="50" rx="6" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
            <text x="50" y="62" font-size="24" text-anchor="middle">🎭</text>
          </svg>
        `,
                tag: 'Broadway',
                desc: 'The crossroads of the world, illuminated by neon facades, street performers, and Broadway marquee theaters.',
                audioNote: 'Stand on the red TKTS glass staircase to take in the electrifying energy of Broadway.',
                panoUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=1200&q=80',
                tips: 'Late evenings after theater curtains drop feature fewer crowds and vibrant light displays.',
            },
            {
                id: 'ny-3',
                name: 'Grand Central Whispering Gallery',
                category: 'history',
                color: '#d97d3e',
                coords: [40.7527, -73.9772],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="34" fill="#d97d3e" stroke="#2b261b" stroke-width="3"/>
            <text x="50" y="58" font-size="20" text-anchor="middle">🏛️</text>
          </svg>
        `,
                tag: 'Transit Hall',
                desc: 'Historic Beaux-Arts terminal with a celestial ceiling mural and Guastavino acoustic acoustic archways.',
                audioNote: 'Whisper into one diagonal arch and someone across the hall can hear you clearly.',
                panoUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80',
                tips: 'Check out the historic four-faced brass clock atop the central information booth.',
            },
            {
                id: 'ny-4',
                name: 'Central Park Bethesda Terrace',
                category: 'nature',
                color: '#6f9d85',
                coords: [40.7738, -73.9708],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="34" fill="#6f9d85" stroke="#2b261b" stroke-width="3"/>
            <text x="50" y="58" font-size="22" text-anchor="middle">🌳</text>
          </svg>
        `,
                tag: 'Urban Oasis',
                desc: 'Frederick Law Olmsted’s neoclassical architectural heart of Central Park overlooking the lake and rowboats.',
                audioNote: 'The Angel of the Waters fountain commemorates the 1842 opening of the Croton water system.',
                panoUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80',
                tips: 'Acoustics beneath the tiled arcade often host wonderful chamber musicians.',
            },
        ],
    },
    london_westminster: {
        id: 'london_westminster',
        name: 'London • Westminster & South Bank Walk',
        city: 'London',
        center: [51.5007, -0.1246],
        zoom: 15,
        userOrigin: [51.5033, -0.1195],
        bounds: [
            [51.4900, -0.1450],
            [51.5150, -0.1000],
        ],
        facilities: [
            { type: 'restroom', name: 'Westminster Pier Facilities', coords: [51.5018, -0.1232], emoji: '🚻' },
            { type: 'info', name: 'South Bank Information Centre', coords: [51.5055, -0.1165], emoji: 'ℹ️' },
            { type: 'cafe', name: 'Gail’s Bakery South Bank', coords: [51.5042, -0.1172], emoji: '☕' },
            { type: 'photo', name: 'Westminster Bridge Vantage', coords: [51.5010, -0.1215], emoji: '📷' },
        ],
        landmarksPool: [
            {
                id: 'lon-1',
                name: 'Big Ben & Elizabeth Tower',
                category: 'landmark',
                color: '#c14937',
                coords: [51.5007, -0.1246],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <line x1="50" y1="95" x2="50" y2="15" stroke="#2b261b" stroke-width="4"/>
            <rect x="38" y="30" width="24" height="65" fill="#f4c568" stroke="#2b261b" stroke-width="2"/>
            <circle cx="50" cy="42" r="8" fill="#ffffff" stroke="#2b261b" stroke-width="2"/>
            <polygon points="36,30 64,30 50,12" fill="#c14937" stroke="#2b261b" stroke-width="2"/>
          </svg>
        `,
                tag: 'Gothic Icon',
                desc: 'The Great Bell of the Great Clock of Westminster, housed in the 96m neo-Gothic Elizabeth Tower.',
                audioNote: 'Listen to the famous Westminster Quarters chime echoing across the Thames.',
                panoUrl: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=1200&q=80',
                tips: 'Cross Westminster Bridge for the classic postcard frame overlooking Parliament.',
            },
            {
                id: 'lon-2',
                name: 'Westminster Abbey & Poets’ Corner',
                category: 'history',
                color: '#d97d3e',
                coords: [51.4994, -0.1273],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <rect x="25" y="35" width="50" height="50" fill="#d97d3e" stroke="#2b261b" stroke-width="3"/>
            <polygon points="20,35 50,15 80,35" fill="#423b2c" stroke="#2b261b" stroke-width="3"/>
            <text x="50" y="65" font-size="20" text-anchor="middle">👑</text>
          </svg>
        `,
                tag: 'Royal Heritage',
                desc: 'Coronation site of British monarchs since 1066 and resting place of kings, queens, and celebrated writers.',
                audioNote: 'Kings and queens have been crowned on the ancient Coronation Chair for nearly a thousand years.',
                panoUrl: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80',
                tips: 'Poets’ Corner holds memorial plaques for Shakespeare, Chaucer, and Dickens.',
            },
            {
                id: 'lon-3',
                name: 'London Eye & South Bank Promenade',
                category: 'culture',
                color: '#6f9d85',
                coords: [51.5033, -0.1195],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="32" fill="none" stroke="#2b261b" stroke-width="4"/>
            <circle cx="50" cy="50" r="5" fill="#c14937"/>
            <line x1="50" y1="50" x2="50" y2="92" stroke="#2b261b" stroke-width="3"/>
          </svg>
        `,
                tag: 'Riverside Walk',
                desc: 'Europe’s tallest cantilevered observation wheel situated along the cultural South Bank riverside promenade.',
                audioNote: 'Take an easy stroll past street book markets, buskers, and open-air food trucks.',
                panoUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
                tips: 'A 30-minute rotation in a glass capsule reveals the city from St Paul’s to Windsor Castle.',
            },
        ],
    },
    tokyo_shinjuku: {
        id: 'tokyo_shinjuku',
        name: 'Tokyo • Shinjuku Gyoen & Omoide Yokocho',
        city: 'Tokyo',
        center: [35.6885, 139.7046],
        zoom: 15,
        userOrigin: [35.6905, 139.6995],
        bounds: [
            [35.6750, 139.6850],
            [35.7050, 139.7250],
        ],
        facilities: [
            { type: 'restroom', name: 'Shinjuku Gyoen Restroom', coords: [35.6852, 139.7101], emoji: '🚻' },
            { type: 'info', name: 'JR Shinjuku Tourist Info', coords: [35.6896, 139.7005], emoji: 'ℹ️' },
            { type: 'cafe', name: 'Traditional Tea Pavilion', coords: [35.6865, 139.7125], emoji: '🍵' },
            { type: 'photo', name: 'Tokyo Met Sky Observation', coords: [35.6896, 139.6921], emoji: '📷' },
        ],
        landmarksPool: [
            {
                id: 'tyo-1',
                name: 'Shinjuku Gyoen National Garden',
                category: 'nature',
                color: '#6f9d85',
                coords: [35.6852, 139.7101],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="34" fill="#6f9d85" stroke="#2b261b" stroke-width="3"/>
            <text x="50" y="58" font-size="22" text-anchor="middle">🌸</text>
          </svg>
        `,
                tag: 'Imperial Garden',
                desc: 'A 144-acre former imperial garden blending traditional Japanese landscaping, French formal, and English landscape gardens.',
                audioNote: 'A sanctuary of cherry blossoms, tranquil koi ponds, and tea houses tucked amidst Tokyo’s busiest district.',
                panoUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
                tips: 'Enjoy a bowl of ceremonial matcha at the Rakuutei tea house.',
            },
            {
                id: 'tyo-2',
                name: 'Omoide Yokocho (Memory Lane)',
                category: 'craft',
                color: '#f4c568',
                coords: [35.6932, 139.6998],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <rect x="22" y="32" width="56" height="50" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
            <polygon points="18,32 50,14 82,32" fill="#c14937" stroke="#2b261b" stroke-width="3"/>
            <text x="50" y="62" font-size="20" text-anchor="middle">🍢</text>
          </svg>
        `,
                tag: 'Showa Alley',
                desc: 'Atmospheric post-war alleyways lined with tiny yakitori stalls, red paper lanterns, and charcoal grills.',
                audioNote: 'Smoke and the aroma of skewered chicken and cold beer evoke the Tokyo of the 1950s.',
                panoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
                tips: 'Each stall seats only 5 to 8 patrons; come early in the evening.',
            },
            {
                id: 'tyo-3',
                name: 'Tokyo Metropolitan Government Observatories',
                category: 'landmark',
                color: '#c14937',
                coords: [35.6896, 139.6921],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <rect x="28" y="30" width="20" height="60" fill="#c14937" stroke="#2b261b" stroke-width="2"/>
            <rect x="52" y="30" width="20" height="60" fill="#c14937" stroke="#2b261b" stroke-width="2"/>
            <polygon points="26,30 74,30 50,15" fill="#f4c568" stroke="#2b261b" stroke-width="2"/>
          </svg>
        `,
                tag: 'Twin Towers',
                desc: 'Kenzo Tange’s post-modern twin towers providing free panoramic views from 202 meters above the ground.',
                audioNote: 'On clear mornings, you can gaze past the sea of skyscrapers to Mount Fuji on the western horizon.',
                panoUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80',
                tips: 'The South Tower observation deck has free public entry until late evening.',
            },
        ],
    },
    rome_centro: {
        id: 'rome_centro',
        name: 'Rome • Colosseum & Roman Forum Walk',
        city: 'Rome',
        center: [41.8902, 12.4922],
        zoom: 15,
        userOrigin: [41.8925, 12.4853],
        bounds: [
            [41.8800, 12.4700],
            [41.9100, 12.5100],
        ],
        facilities: [
            { type: 'restroom', name: 'Colosseo Station Restrooms', coords: [41.8915, 12.4915], emoji: '🚻' },
            { type: 'info', name: 'Piazza Venezia Welcome Desk', coords: [41.8958, 12.4825], emoji: 'ℹ️' },
            { type: 'cafe', name: 'Bar Illy Cavour', coords: [41.8932, 12.4905], emoji: '☕' },
            { type: 'photo', name: 'Capitoline Hill Panoramic Balcony', coords: [41.8930, 12.4835], emoji: '📷' },
        ],
        landmarksPool: [
            {
                id: 'rom-1',
                name: 'Colosseum Amphitheatre',
                category: 'history',
                color: '#c14937',
                coords: [41.8902, 12.4922],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <ellipse cx="50" cy="55" rx="38" ry="25" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
            <ellipse cx="50" cy="55" rx="24" ry="14" fill="#c14937" stroke="#2b261b" stroke-width="2"/>
            <line x1="20" y1="40" x2="20" y2="55" stroke="#2b261b" stroke-width="2"/>
            <line x1="80" y1="40" x2="80" y2="55" stroke="#2b261b" stroke-width="2"/>
          </svg>
        `,
                tag: 'Ancient Wonder',
                desc: 'The greatest amphitheater of the Roman Empire, inaugurated in 80 AD by Emperor Titus for gladiatorial games.',
                audioNote: 'Constructed of travertine limestone and volcanic rock, holding upwards of 50,000 spectators.',
                panoUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
                tips: 'Morning light striking the outer northern arches creates dramatic shadow lines.',
            },
            {
                id: 'rom-2',
                name: 'Trevi Fountain (Fontana di Trevi)',
                category: 'landmark',
                color: '#6f9d85',
                coords: [41.9009, 12.4833],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <rect x="20" y="35" width="60" height="48" fill="#8bb8cf" stroke="#2b261b" stroke-width="3"/>
            <circle cx="50" cy="25" r="10" fill="#f4c568" stroke="#2b261b" stroke-width="2"/>
            <text x="50" y="65" font-size="20" text-anchor="middle">🪙</text>
          </svg>
        `,
                tag: 'Baroque Masterpiece',
                desc: 'Nicola Salvi’s monumental Baroque fountain depicting Oceanus taming sea horses in a travertine pool.',
                audioNote: 'Legend holds that throwing a coin with your right hand over your left shoulder guarantees a return to Rome.',
                panoUrl: 'https://images.unsplash.com/photo-1525874684015-58379d421a52?auto=format&fit=crop&w=1200&q=80',
                tips: 'Visit after 11 PM when the floodlit cascade glows against the Palazzo Poli facade.',
            },
            {
                id: 'rom-3',
                name: 'Pantheon & Piazza della Rotonda',
                category: 'history',
                color: '#d97d3e',
                coords: [41.8986, 12.4769],
                svgSnippet: `
          <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="34" fill="#d97d3e" stroke="#2b261b" stroke-width="3"/>
            <polygon points="20,40 50,18 80,40" fill="#423b2c" stroke="#2b261b" stroke-width="2"/>
            <circle cx="50" cy="30" r="5" fill="#f4c568"/>
          </svg>
        `,
                tag: 'Rotunda',
                desc: 'Hadrian’s 2,000-year-old temple boasting the world’s largest unreinforced concrete dome and central open oculus.',
                audioNote: 'Rain falls directly through the 9m open oculus in the ceiling onto marble drainage holes in the floor.',
                panoUrl: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=1200&q=80',
                tips: 'Midday sunlight streams an ethereal beam through the oculus onto the tomb of Renaissance master Raphael.',
            },
        ],
    },
    sha_tin_district: {
        id: HONG_KONG_PACK.id,
        name: HONG_KONG_PACK.districtName,
        city: HONG_KONG_PACK.cityName,
        center: HONG_KONG_PACK.center,
        zoom: HONG_KONG_PACK.zoom,
        userOrigin: HONG_KONG_PACK.userOrigin,
        bounds: HONG_KONG_PACK.bounds,
        facilities: HONG_KONG_PACK.facilities,
        landmarksPool: HONG_KONG_PACK.landmarks,
    },
};
MASTER_ZONES.dest_sha_tin_district = {
    ...MASTER_ZONES.sha_tin_district,
    id: 'dest_sha_tin_district',
};
MASTER_ZONES.dest_kyoto = {
    ...MASTER_ZONES.kyoto_higashiyama,
    id: 'dest_kyoto',
};
MASTER_ZONES.dest_paris = {
    ...MASTER_ZONES.paris_marais,
    id: 'dest_paris',
};
MASTER_ZONES.dest_toronto = {
    ...MASTER_ZONES.toronto_distillery,
    id: 'dest_toronto',
};
MASTER_ZONES.hong_kong = {
    ...MASTER_ZONES.sha_tin_district,
    id: 'hong_kong',
};
MASTER_ZONES.dest_hong_kong = {
    ...MASTER_ZONES.sha_tin_district,
    id: 'dest_hong_kong',
};

export const INITIAL_PLANS: TravelPlan[] = [
    {
        id: 'plan_hongkong_shatin',
        title: 'Hong Kong Sha Tin Heritage & River Walk',
        zoneKey: 'sha_tin_district',
        createdAt: '2026-10-10',
        tag: 'Heritage & Riverside',
        estimatedDistance: '2.8 km',
        estimatedDuration: '2.5 hrs',
        activeRouteKey: 'classic',
        spotIds: ['st-newtown', 'st-hilton', 'st-heritage', 'st-chekung', 'st-park'],
        themeRoutes: {
            classic: ['st-newtown', 'st-hilton', 'st-heritage', 'st-chekung', 'st-park'],
            culture: ['st-heritage', 'st-chekung', 'st-park'],
            rain: ['st-newtown', 'st-hilton', 'st-chanway'],
        },
    },
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