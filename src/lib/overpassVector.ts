export interface VectorFeature {
    id: string | number;
    type: 'building' | 'park' | 'water';
    coordinates: [number, number][]; // [lat, lng][] polygon ring
}

// In-memory cache keyed by spatial signature
const vectorCache = new Map<string, VectorFeature[]>();

// Curated seed polygons for default scenic districts (used as instant fallback if Overpass is unreachable)
const SEED_DISTRICT_VECTORS: Record<string, VectorFeature[]> = {
    toronto_distillery: [
        // Historic brick stone warehouse buildings
        {
            id: 'seed-b-1',
            type: 'building',
            coordinates: [
                [43.6508, -79.3601],
                [43.6514, -79.3598],
                [43.6512, -79.3589],
                [43.6506, -79.3592],
                [43.6508, -79.3601],
            ],
        },
        {
            id: 'seed-b-2',
            type: 'building',
            coordinates: [
                [43.6502, -79.3585],
                [43.6507, -79.3583],
                [43.6505, -79.3574],
                [43.6500, -79.3576],
                [43.6502, -79.3585],
            ],
        },
        {
            id: 'seed-b-3',
            type: 'building',
            coordinates: [
                [43.6496, -79.3604],
                [43.6501, -79.3602],
                [43.6499, -79.3593],
                [43.6494, -79.3595],
                [43.6496, -79.3604],
            ],
        },
        {
            id: 'seed-b-4',
            type: 'building',
            coordinates: [
                [43.6516, -79.3584],
                [43.6521, -79.3582],
                [43.6519, -79.3573],
                [43.6514, -79.3575],
                [43.6516, -79.3584],
            ],
        },
        // Trinity Street courtyard greenspace
        {
            id: 'seed-p-1',
            type: 'park',
            coordinates: [
                [43.6505, -79.3610],
                [43.6510, -79.3608],
                [43.6508, -79.3600],
                [43.6503, -79.3602],
                [43.6505, -79.3610],
            ],
        },
        // Lake Ontario harbor slip water basin
        {
            id: 'seed-w-1',
            type: 'water',
            coordinates: [
                [43.6488, -79.3608],
                [43.6492, -79.3580],
                [43.6486, -79.3578],
                [43.6482, -79.3606],
                [43.6488, -79.3608],
            ],
        },
    ],
    kyoto_higashiyama: [
        // Traditional wooden machiya & temple halls
        {
            id: 'seed-kb-1',
            type: 'building',
            coordinates: [
                [34.9958, 135.7842],
                [34.9963, 135.7840],
                [34.9961, 135.7832],
                [34.9956, 135.7834],
                [34.9958, 135.7842],
            ],
        },
        {
            id: 'seed-kb-2',
            type: 'building',
            coordinates: [
                [34.9945, 135.7855],
                [34.9950, 135.7853],
                [34.9948, 135.7845],
                [34.9943, 135.7847],
                [34.9945, 135.7855],
            ],
        },
        // Maruyama Bamboo Grove & Temple Gardens
        {
            id: 'seed-kp-1',
            type: 'park',
            coordinates: [
                [34.9966, 135.7850],
                [34.9972, 135.7846],
                [34.9968, 135.7838],
                [34.9962, 135.7842],
                [34.9966, 135.7850],
            ],
        },
        // Shirakawa stream
        {
            id: 'seed-kw-1',
            type: 'water',
            coordinates: [
                [34.9940, 135.7830],
                [34.9948, 135.7834],
                [34.9946, 135.7838],
                [34.9938, 135.7834],
                [34.9940, 135.7830],
            ],
        },
    ],
    paris_marais: [
        // Parisian Haussmannian quadrangles & hôtels particuliers
        {
            id: 'seed-pb-1',
            type: 'building',
            coordinates: [
                [48.8578, 2.3615],
                [48.8584, 2.3618],
                [48.8582, 2.3628],
                [48.8576, 2.3625],
                [48.8578, 2.3615],
            ],
        },
        {
            id: 'seed-pb-2',
            type: 'building',
            coordinates: [
                [48.8568, 2.3630],
                [48.8574, 2.3633],
                [48.8572, 2.3643],
                [48.8566, 2.3640],
                [48.8568, 2.3630],
            ],
        },
        // Place des Vosges garden square
        {
            id: 'seed-pp-1',
            type: 'park',
            coordinates: [
                [48.8550, 2.3648],
                [48.8560, 2.3653],
                [48.8556, 2.3667],
                [48.8546, 2.3662],
                [48.8550, 2.3648],
            ],
        },
        // Seine river bend
        {
            id: 'seed-pw-1',
            type: 'water',
            coordinates: [
                [48.8530, 2.3590],
                [48.8538, 2.3625],
                [48.8532, 2.3630],
                [48.8524, 2.3595],
                [48.8530, 2.3590],
            ],
        },
    ],
};

function getSeedFallbackForCoords(lat: number, lng: number): VectorFeature[] {
    // Check closest destination zone
    if (Math.abs(lat - 43.65) < 0.05 && Math.abs(lng - -79.36) < 0.05) {
        return SEED_DISTRICT_VECTORS.toronto_distillery;
    }
    if (Math.abs(lat - 34.99) < 0.05 && Math.abs(lng - 135.78) < 0.05) {
        return SEED_DISTRICT_VECTORS.kyoto_higashiyama;
    }
    if (Math.abs(lat - 48.85) < 0.05 && Math.abs(lng - 2.36) < 0.05) {
        return SEED_DISTRICT_VECTORS.paris_marais;
    }
    return [];
}

/**
 * Fetches OpenStreetMap building, park, and water polygons for the given
 * centroid and radius. Uses in-memory caching to prevent duplicate network hits.
 */
export async function fetchDistrictVectors(
    lat: number,
    lng: number,
    radiusMeters: number
): Promise<VectorFeature[]> {
    const roundedRadius = Math.round(radiusMeters);
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},${roundedRadius}`;

    if (vectorCache.has(cacheKey)) {
        return vectorCache.get(cacheKey)!;
    }

    try {
        const url = `/api/overpass?lat=${lat}&lng=${lng}&radius=${roundedRadius}`;
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`Failed to fetch district vectors: HTTP ${res.status}`);
        }

        const data = await res.json();
        let features: VectorFeature[] = data.features || [];

        // If Overpass returned empty (rate-limited, timed out, or sparse area), use seed fallback
        if (features.length === 0) {
            features = getSeedFallbackForCoords(lat, lng);
        }

        vectorCache.set(cacheKey, features);
        return features;
    } catch (err) {
        console.warn('Overpass vector fetch encountered error, using seed fallback:', err);
        const fallback = getSeedFallbackForCoords(lat, lng);
        vectorCache.set(cacheKey, fallback);
        return fallback;
    }
}

