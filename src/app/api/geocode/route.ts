import { NextRequest, NextResponse } from 'next/server';

// In-memory cache to prevent redundant external geocoding requests
const geocodeCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchPhotonForward(query: string, viewbox?: string | null, searchType?: string | null) {
    try {
        let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10`;
        if (viewbox) {
            const parts = viewbox.split(',').map(parseFloat);
            if (parts.length === 4 && !parts.some(isNaN)) {
                const [minLng, maxLat, maxLng, minLat] = parts;
                const centerLat = (minLat + maxLat) / 2;
                const centerLng = (minLng + maxLng) / 2;
                url += `&lat=${centerLat}&lon=${centerLng}`;
            }
        }
        if (searchType === 'city') {
            url += '&osm_tag=place:city&osm_tag=place:town';
        }

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'WanderSketch-App/1.0 (wandersketch@local.dev)',
            },
            signal: AbortSignal.timeout(3500),
        });

        if (!res.ok) return null;
        const data = await res.json();
        if (!Array.isArray(data.features)) return null;

        return data.features.map((f: any) => {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [0, 0];
            const lon = coords[0];
            const lat = coords[1];
            const name = props.name || props.street || query;
            const city = props.city || props.district || props.county || props.state || '';
            const country = props.country || '';
            const displayName = [name, props.district, city, country].filter(Boolean).join(', ');
            const isCity = props.osm_key === 'place' && ['city', 'town', 'village'].includes(props.osm_value);

            return {
                placeId: props.osm_id || Math.floor(Math.random() * 1000000),
                name,
                displayName,
                category: props.osm_value || props.osm_key || 'landmark',
                coords: [parseFloat(lat), parseFloat(lon)] as [number, number],
                city,
                country,
                isCity,
                boundingbox: props.extent
                    ? [
                          [parseFloat(props.extent[1]), parseFloat(props.extent[0])],
                          [parseFloat(props.extent[3]), parseFloat(props.extent[2])],
                      ]
                    : undefined,
            };
        });
    } catch {
        return null;
    }
}

async function fetchPhotonReverse(lat: string, lng: string) {
    try {
        const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'WanderSketch-App/1.0 (wandersketch@local.dev)',
            },
            signal: AbortSignal.timeout(3500),
        });

        if (!res.ok) return null;
        const data = await res.json();
        const f = data.features?.[0];
        if (!f) return null;
        const props = f.properties || {};
        const district = props.district || props.suburb || props.locality || props.name || 'Local District';
        const city = props.city || props.town || props.state || props.country || 'Current City';
        const country = props.country || '';
        const displayName = [district, city, country].filter(Boolean).join(', ');

        return {
            placeId: props.osm_id || Math.floor(Math.random() * 1000000),
            name: district,
            city,
            country,
            district,
            displayName,
            coords: [parseFloat(lat), parseFloat(lng)] as [number, number],
        };
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const viewbox = searchParams.get('viewbox'); // Optional: 'minLng,maxLat,maxLng,minLat'
    const searchType = searchParams.get('type'); // 'city' | 'spot' | undefined
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng') || searchParams.get('lon');
    const isReverse = searchParams.get('reverse') === 'true' || searchParams.get('reverse') === '1' || (!query && !!lat && !!lng);

    // ==========================================
    // 1. Reverse Geocoding (Coordinates -> District / City)
    // ==========================================
    if (isReverse && lat && lng) {
        const cacheKey = `rev:${lat}:${lng}`;
        const cached = geocodeCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return NextResponse.json({ result: cached.data, cached: true });
        }

        // Try Nominatim first
        const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
        try {
            const res = await fetch(reverseUrl, {
                headers: {
                    'User-Agent': 'WanderSketch-App/1.0 (wandersketch@local.dev)',
                    'Accept-Language': 'en',
                },
                signal: AbortSignal.timeout(3000),
            });

            if (res.ok) {
                const data = await res.json();
                const address = data.address || {};
                const district =
                    address.suburb ||
                    address.neighbourhood ||
                    address.quarter ||
                    address.city_district ||
                    address.borough ||
                    address.town ||
                    address.village ||
                    address.city ||
                    'Local District';

                const city =
                    address.city ||
                    address.town ||
                    address.municipality ||
                    address.state ||
                    address.region ||
                    address.country ||
                    'Current City';

                const country = address.country || '';
                const displayName = data.display_name || `${district}, ${city}`;

                const boundingbox = data.boundingbox
                    ? [
                          [parseFloat(data.boundingbox[0]), parseFloat(data.boundingbox[2])],
                          [parseFloat(data.boundingbox[1]), parseFloat(data.boundingbox[3])],
                      ]
                    : undefined;

                const result = {
                    placeId: data.place_id,
                    name: district,
                    city,
                    country,
                    district,
                    displayName,
                    coords: [parseFloat(data.lat), parseFloat(data.lon)] as [number, number],
                    boundingbox,
                };

                geocodeCache.set(cacheKey, { timestamp: Date.now(), data: result });
                return NextResponse.json({ result });
            }
        } catch {
            // Nominatim failed, try Photon fallback
        }

        // Photon Reverse Fallback
        const photonResult = await fetchPhotonReverse(lat, lng);
        if (photonResult) {
            geocodeCache.set(cacheKey, { timestamp: Date.now(), data: photonResult });
            return NextResponse.json({ result: photonResult, provider: 'photon' });
        }

        return NextResponse.json({ error: 'Reverse geocode unavailable' }, { status: 200 });
    }

    // ==========================================
    // 2. Forward Geocoding (Text Search -> POIs / Cities)
    // ==========================================
    if (!query || query.trim().length < 2) {
        return NextResponse.json({ results: [] });
    }

    const trimmedQuery = query.trim();
    const cacheKey = `fwd:${trimmedQuery.toLowerCase()}:${viewbox || ''}:${searchType || ''}`;
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json({ results: cached.data, cached: true });
    }

    // Build Nominatim Search URL
    let nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        trimmedQuery
    )}&addressdetails=1&limit=10`;

    if (searchType === 'city') {
        nominatimUrl += '&featuretype=settlement';
    } else if (viewbox) {
        nominatimUrl += `&viewbox=${viewbox}&bounded=0`;
    }

    try {
        const res = await fetch(nominatimUrl, {
            headers: {
                'User-Agent': 'WanderSketch-App/1.0 (wandersketch@local.dev)',
                'Accept-Language': 'en',
            },
            signal: AbortSignal.timeout(3000),
        });

        if (res.ok) {
            const data = await res.json();
            const formattedResults = data.map((item: any) => {
                const address = item.address || {};
                const city = address.city || address.town || address.village || address.municipality || address.state || '';
                const country = address.country || '';
                const isCity =
                    item.type === 'city' ||
                    item.type === 'administrative' ||
                    item.class === 'boundary' ||
                    item.type === 'town';

                return {
                    placeId: item.place_id,
                    name: item.name || item.display_name.split(',')[0],
                    displayName: item.display_name,
                    category: item.type || item.class || 'landmark',
                    coords: [parseFloat(item.lat), parseFloat(item.lon)] as [number, number],
                    city,
                    country,
                    isCity,
                    boundingbox: item.boundingbox
                        ? [
                              [parseFloat(item.boundingbox[0]), parseFloat(item.boundingbox[2])],
                              [parseFloat(item.boundingbox[1]), parseFloat(item.boundingbox[3])],
                          ]
                        : undefined,
                };
            });

            geocodeCache.set(cacheKey, { timestamp: Date.now(), data: formattedResults });
            return NextResponse.json({ results: formattedResults });
        }
    } catch {
        // Nominatim timed out or errored (e.g. rate limit), gracefully attempt Photon fallback
    }

    // Photon Fallback (Resilient open-source geocoder without 1 req/s rate limits)
    const photonResults = await fetchPhotonForward(trimmedQuery, viewbox, searchType);
    if (photonResults && photonResults.length > 0) {
        geocodeCache.set(cacheKey, { timestamp: Date.now(), data: photonResults });
        return NextResponse.json({ results: photonResults, provider: 'photon' });
    }

    return NextResponse.json({ results: [] });
}