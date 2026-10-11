import { CityPack } from '../types';

export const KYOTO_PACK: CityPack = {
    id: 'kyoto_higashiyama',
    cityName: 'Kyoto',
    districtName: 'Kyoto Higashiyama & Gion',
    country: 'Japan',
    center: [34.9985, 135.7820],
    zoom: 15,
    userOrigin: [35.0035, 135.7760],
    bounds: [
        [34.9850, 135.7600],
        [35.0150, 135.7950],
    ],
    facilities: [
        { type: 'restroom', name: 'Restroom (Yasaka Shrine South)', coords: [35.0028, 135.7785], emoji: '🚻' },
        { type: 'info', name: 'Higashiyama Tourist Center', coords: [35.0040, 135.7770], emoji: 'ℹ️' },
        { type: 'cafe', name: 'Tsujiri Matcha Salon & Teahouse', coords: [35.0036, 135.7750], emoji: '🍵' },
        { type: 'photo', name: 'Yasaka Pagoda Dawn Viewpoint', coords: [34.9980, 135.7790], emoji: '📷' },
    ],
    landmarks: [
        {
            id: 'ky-3',
            name: 'Kiyomizu-dera Temple (清水寺)',
            category: 'history',
            color: '#c14937',
            coords: [34.9948, 135.7850],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#c14937" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">⛩️</text>
        </svg>
      `,
            tag: 'TEMPLE',
            desc: 'UNESCO World Heritage hillside temple founded in 778 AD, famous for its massive wooden veranda built without a single nail.',
            audioNote: 'Kiyomizu-dera was built using interlocking Japanese joinery, commanding views over cherry blossoms and maples.',
            panoUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
            tips: 'Drink from the sacred Otowa Spring streams representing health, longevity, and love.',
            importanceScore: 95,
            prominenceTier: 1,
        },
        {
            id: 'ky-1',
            name: 'Hokan-ji Temple & Yasaka Pagoda (法観寺 八坂の塔)',
            category: 'landmark',
            color: '#d97d3e',
            coords: [34.9985, 135.7792],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#d97d3e" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🏯</text>
        </svg>
      `,
            tag: 'PAGODA',
            desc: 'Kyoto’s most quintessential symbol: a 46-meter five-story wooden pagoda rising majestically above narrow cobblestone lanes.',
            audioNote: 'Yasaka Pagoda dates back to the 6th century. The view up the stone slope at dawn remains one of Japan’s most evocative sights.',
            panoUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
            tips: 'Arrive before 8:00 AM for tranquil photography without crowds.',
            importanceScore: 92,
            prominenceTier: 1,
        },
        {
            id: 'ky-2',
            name: 'Ninenzaka & Sannenzaka Slopes (産寧坂・二年坂)',
            category: 'craft',
            color: '#f4c568',
            coords: [34.9972, 135.7812],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🏮</text>
        </svg>
      `,
            tag: 'STREET',
            desc: 'Stone-paved pedestrian slopes lined with traditional preserved machiya wooden townhouses, teahouses, and craft pottery shops.',
            audioNote: 'Ninenzaka and Sannenzaka date to the Edo era and have served pilgrims heading to Kiyomizu-dera for over a millennium.',
            panoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
            tips: 'Sample freshly grilled yatsuhashi cinnamon treats and roasted senbei crackers along the ascent.',
            importanceScore: 90,
            prominenceTier: 1,
        },
        {
            id: 'ky-yasaka-jinja',
            name: 'Yasaka Shrine (八坂神社)',
            category: 'culture',
            color: '#c2410c',
            coords: [35.0037, 135.7785],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#c2410c" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">⛩️</text>
        </svg>
      `,
            tag: 'SHRINE',
            desc: 'Vibrant Shinto shrine anchoring the eastern end of Shijo-dori, host of the world-famous Gion Matsuri festival in July.',
            audioNote: 'Yasaka Shrine’s central dance pavilion is hung with hundreds of lanterns sponsored by local Gion merchants and geisha houses.',
            panoUrl: '',
            tips: 'Magical atmosphere when illuminated by warm lantern light after sunset.',
            importanceScore: 91,
            prominenceTier: 1,
        },
        {
            id: 'ky-kodaiji',
            name: 'Kodai-ji Zen Temple (高台寺)',
            category: 'history',
            color: '#3d7a42',
            coords: [35.0002, 135.7816],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#3d7a42" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🌿</text>
        </svg>
      `,
            tag: 'GARDEN',
            desc: 'Zen temple established in 1606 by Nene in memory of warlord Toyotomi Hideyoshi, boasting rock gardens and illuminated bamboo groves.',
            audioNote: 'Kodai-ji is celebrated for its weeping cherry blossoms and evening light-up shows across the mirror pond.',
            panoUrl: '',
            tips: 'Follow the stone path through the towering bamboo grove behind the main hall.',
            importanceScore: 84,
            prominenceTier: 1,
        },
        {
            id: 'ky-gion-hanami',
            name: 'Hanami-koji Street (花見小路通)',
            category: 'landmark',
            color: '#d97d3e',
            coords: [35.0025, 135.7745],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#d97d3e" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">👘</text>
        </svg>
      `,
            tag: 'GEISHA DISTRICT',
            desc: 'The historic spine of Kyoto’s Gion entertainment quarter, lined with exclusive ochaya teahouses and slatted wooden facades.',
            audioNote: 'In the evening, geiko and maiko hurry down Hanami-koji in silk kimonos between appointments.',
            panoUrl: '',
            tips: 'Please be respectful of working maiko and do not block their path or use flash photography.',
            importanceScore: 88,
            prominenceTier: 1,
        },
        {
            id: 'ky-shirakawa',
            name: 'Shirakawa Canal & Tatsumi Bridge (白川巽橋)',
            category: 'nature',
            color: '#0284c7',
            coords: [35.0055, 135.7748],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#0284c7" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🌸</text>
        </svg>
      `,
            tag: 'CANAL',
            desc: 'Picturesque stone canal bordered by weeping willow trees, preserved timber houses, and the small vermilion Tatsumi Shrine.',
            audioNote: 'Shirakawa Canal is widely regarded as one of Kyoto’s most poetic corners, especially during cherry blossom season.',
            panoUrl: '',
            tips: 'Several quiet kaiseki teahouses feature tables overlooking the flowing water.',
            importanceScore: 85,
            prominenceTier: 1,
        },
        {
            id: 'ky-kenninji',
            name: 'Kennin-ji Zen Temple (建仁寺)',
            category: 'culture',
            color: '#3d7a42',
            coords: [34.9998, 135.7735],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#3d7a42" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🧘</text>
        </svg>
      `,
            tag: 'TEMPLE',
            desc: 'The oldest Zen temple in Kyoto, founded in 1202 by Eisai who introduced green tea culture to Japan. Famous for twin dragon ceiling murals.',
            audioNote: 'Gaze up at the ceiling of the Hodo hall to behold the dramatic ink painting of twin dragons swirling in clouds.',
            panoUrl: '',
            tips: 'The sand and moss Circle-Triangle-Square garden embodies Zen metaphysics.',
            importanceScore: 82,
            prominenceTier: 2,
        },
        {
            id: 'ky-chionin',
            name: 'Chion-in Grand Temple Gate (知恩院 三門)',
            category: 'history',
            color: '#b23b23',
            coords: [35.0058, 135.7820],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#b23b23" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">⛩️</text>
        </svg>
      `,
            tag: 'TEMPLE',
            desc: 'Head temple of Jodo Pure Land Buddhism featuring the colossal 24-meter Sanmon gate, the largest surviving wooden gate in Japan.',
            audioNote: 'Chion-in’s enormous temple bell weighs over 70 tons and requires seventeen monks to ring on New Year’s Eve.',
            panoUrl: '',
            tips: 'Walk the nightingale corridor where wooden floorboards squeak like songbirds to warn of intruders.',
            importanceScore: 83,
            prominenceTier: 2,
        },
        {
            id: 'ky-maruyama',
            name: 'Maruyama Park (円山公園)',
            category: 'nature',
            color: '#3d7a42',
            coords: [35.0035, 135.7810],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#3d7a42" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🌳</text>
        </svg>
      `,
            tag: 'PARK',
            desc: 'Kyoto’s oldest public park adjacent to Yasaka Shrine, famous for its historic weeping cherry tree (Gion Shidare-zakura).',
            audioNote: 'In spring, Maruyama Park turns into the premier hanami cherry blossom festival destination in the city.',
            panoUrl: '',
            tips: 'Quiet walking paths wind past gourd-shaped ponds with swimming koi.',
            importanceScore: 78,
            prominenceTier: 2,
        },
    ],
};

