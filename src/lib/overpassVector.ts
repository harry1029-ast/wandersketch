export interface VectorFeature {
    id: string | number;
    type: 'building' | 'park' | 'water';
    coordinates: [number, number][]; // [lat, lng][] polygon ring
}

// In-memory cache keyed by spatial signature
const vectorCache = new Map<string, VectorFeature[]>();

// Curated seed polygons for Hong Kong Sha Tin Central (used as instant fallback if Overpass is unreachable)
const SEED_DISTRICT_VECTORS: Record<string, VectorFeature[]> = {
    sha_tin_district: [
        // Sha Tin Central Park
        {
            id: 'seed-park-1',
            type: 'park',
            coordinates: [
                [22.3804, 114.1895],
                [22.3815, 114.1905],
                [22.3808, 114.1915],
                [22.3798, 114.1902],
                [22.3804, 114.1895],
            ],
        },
        // Shing Mun River Channel
        {
            id: 'seed-water-1',
            type: 'water',
            coordinates: [
                [22.3845, 114.1930],
                [22.3830, 114.1945],
                [22.3770, 114.1910],
                [22.3780, 114.1895],
                [22.3845, 114.1930],
            ],
        },
    ],
};

function getSeedFallbackForCoords(lat: number, lng: number): VectorFeature[] {
    // Check if within Sha Tin
    if (Math.abs(lat - 22.38) < 0.05 && Math.abs(lng - 114.19) < 0.05) {
        return SEED_DISTRICT_VECTORS.sha_tin_district;
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
