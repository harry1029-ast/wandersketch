import { CityPack } from '../types';

export const PARIS_PACK: CityPack = {
    id: 'paris_marais',
    cityName: 'Paris',
    districtName: 'Paris Le Marais & Latin Quarter',
    country: 'France',
    center: [48.8575, 2.3610],
    zoom: 15,
    userOrigin: [48.8540, 2.3580],
    bounds: [
        [48.8450, 2.3400],
        [48.8700, 2.3800],
    ],
    facilities: [
        { type: 'restroom', name: 'Public Restroom (Saint-Paul Metro)', coords: [48.8550, 2.3600], emoji: '🚻' },
        { type: 'info', name: 'Le Marais Information Kiosk', coords: [48.8580, 2.3560], emoji: 'ℹ️' },
        { type: 'cafe', name: 'Carette Salon & Hot Chocolate Bar', coords: [48.8556, 2.3650], emoji: '☕' },
        { type: 'photo', name: 'Hôtel de Soubise Courtyard', coords: [48.8605, 2.3585], emoji: '📷' },
    ],
    landmarks: [
        {
            id: 'pa-1',
            name: 'Place des Vosges (Place Royale)',
            category: 'history',
            color: '#c14937',
            coords: [48.8554, 2.3655],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#c14937" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🏛️</text>
        </svg>
      `,
            tag: 'ROYAL SQUARE',
            desc: 'The oldest planned square in Paris, framed by red brick facades with stone dressings, vaulted stone arcades, and lime trees.',
            audioNote: 'Inaugurated in 1612 for the engagement of Louis XIII, Place des Vosges set the golden standard for European royal plazas.',
            panoUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
            tips: 'Explore corner No. 6, where Victor Hugo wrote much of Les Misérables.',
            importanceScore: 94,
            prominenceTier: 1,
        },
        {
            id: 'pa-2',
            name: 'Musée Picasso (Hôtel Salé)',
            category: 'culture',
            color: '#6f9d85',
            coords: [48.8598, 2.3622],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#6f9d85" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🎨</text>
        </svg>
      `,
            tag: 'MUSEUM',
            desc: 'Grand 17th-century aristocratic mansion housing over 5,000 works by Pablo Picasso alongside pieces from his personal collection.',
            audioNote: 'The Hôtel Salé was nicknamed after its original owner, a royal salt tax collector. Its monumental stone staircase is an architectural jewel.',
            panoUrl: 'https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=1200&q=80',
            tips: 'Visit the cafe terrace on the upper courtyard for a peaceful view.',
            importanceScore: 90,
            prominenceTier: 1,
        },
        {
            id: 'pa-pompidou',
            name: 'Centre Pompidou (Musée National d’Art Moderne)',
            category: 'culture',
            color: '#0284c7',
            coords: [48.8606, 2.3522],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#0284c7" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🏛️</text>
        </svg>
      `,
            tag: 'MUSEUM',
            desc: 'Renzo Piano and Richard Rogers’ radical high-tech inside-out architecture holding Europe’s largest modern art collection.',
            audioNote: 'Mechanical plumbing, escalators, and structural beams were turned outside the facade in primary industrial colors.',
            panoUrl: '',
            tips: 'Ride the exterior glass caterpillar escalator for sweeping panoramas of Paris and the Eiffel Tower.',
            importanceScore: 95,
            prominenceTier: 1,
        },
        {
            id: 'pa-3',
            name: 'Marché des Enfants Rouges',
            category: 'craft',
            color: '#f4c568',
            coords: [48.8629, 2.3630],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#f4c568" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🥐</text>
        </svg>
      `,
            tag: 'MARKET',
            desc: 'Established in 1615, Paris’s oldest covered food market packed with bustling stands cooking Moroccan couscous, Japanese bento, and French crepes.',
            audioNote: 'Named after the red uniforms worn by children at a nearby historic orphanage, this market is beloved by foodies worldwide.',
            panoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
            tips: 'Expect a lively wait at the Moroccan tagine counter; it is well worth the queue.',
            importanceScore: 88,
            prominenceTier: 1,
        },
        {
            id: 'pa-rosiers',
            name: 'Rue des Rosiers (Pletzl Jewish Quarter)',
            category: 'craft',
            color: '#d97d3e',
            coords: [48.8572, 2.3595],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#d97d3e" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🥙</text>
        </svg>
      `,
            tag: 'CULINARY',
            desc: 'Historic cobblestone artery renowned for traditional Jewish bakeries, bookshops, and world-famous falafel pit-stops.',
            audioNote: 'Rue des Rosiers is the spiritual heart of the Parisian Jewish community, vibrant seven days a week.',
            panoUrl: '',
            tips: 'Grab a pita sandwich from L’As du Fallafel to eat on the bench at nearby Jardin des Rosiers.',
            importanceScore: 86,
            prominenceTier: 1,
        },
        {
            id: 'pa-notredame',
            name: 'Cathédrale Notre-Dame de Paris',
            category: 'culture',
            color: '#c2410c',
            coords: [48.8530, 2.3499],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#c2410c" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">⛪</text>
        </svg>
      `,
            tag: 'CATHEDRAL',
            desc: 'Masterpiece of French Gothic architecture on Île de la Cité with flying buttresses, gargoyles, and radiant stained glass rose windows.',
            audioNote: 'Notre-Dame stands at Kilometer Zero, the geographic center of France and heart of Paris.',
            panoUrl: '',
            tips: 'Cross the Pont Saint-Louis for artisanal ice cream at Berthillon on the neighboring island.',
            importanceScore: 98,
            prominenceTier: 1,
        },
        {
            id: 'pa-hotel-de-ville',
            name: 'Hôtel de Ville (Paris City Hall)',
            category: 'landmark',
            color: '#4f46e5',
            coords: [48.8566, 2.3522],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#4f46e5" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🏛️</text>
        </svg>
      `,
            tag: 'CIVIC',
            desc: 'Monumental Neo-Renaissance palace serving as the headquarters of the Paris municipality since 1357, fronting a vast open esplanade.',
            audioNote: 'The facade is adorned with 338 statues of eminent Parisian historical figures, scientists, and writers.',
            panoUrl: '',
            tips: 'Hosts free public exhibitions in its grand salon halls throughout the year.',
            importanceScore: 85,
            prominenceTier: 2,
        },
        {
            id: 'pa-carnavalet',
            name: 'Musée Carnavalet (History of Paris)',
            category: 'history',
            color: '#b23b23',
            coords: [48.8572, 2.3629],
            svgSnippet: `
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
          <circle cx="50" cy="50" r="34" fill="#b23b23" stroke="#2b261b" stroke-width="3"/>
          <text x="50" y="58" font-size="22" text-anchor="middle">🏛️</text>
        </svg>
      `,
            tag: 'MUSEUM',
            desc: 'The museum of the history of Paris, occupying two Renaissance mansions with ornate manicured boxwood courtyards.',
            audioNote: 'Carnavalet houses artifacts ranging from prehistoric dugouts to French Revolution memorabilia and Marcel Proust’s cork-lined bedroom.',
            panoUrl: '',
            tips: 'Permanent collections are completely free to enter.',
            importanceScore: 84,
            prominenceTier: 2,
        },
    ],
};

