import { NextRequest, NextResponse } from 'next/server';

export interface VectorFeature {
    id: string | number;
    type: 'building' | 'park' | 'water';
    coordinates: [number, number][]; // [lat, lng][] ring
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius');

    if (!latStr || !lngStr) {
        return NextResponse.json({ error: 'Missing lat or lng parameter' }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const rawRadius = radiusStr ? parseFloat(radiusStr) : 300;

    if (isNaN(lat) || isNaN(lng) || isNaN(rawRadius)) {
        return NextResponse.json({ error: 'Invalid numeric parameters' }, { status: 400 });
    }

    // Clamp radius between 100m and 750m for performance and polite API usage
    const radius = Math.min(Math.max(rawRadius, 100), 750);

    // Overpass QL query: extract building, park, green, and water polygons with geometries
    const overpassQuery = `
[out:json][timeout:15];
(
  way["building"](around:${radius},${lat},${lng});
  way["leisure"="park"](around:${radius},${lat},${lng});
  way["landuse"="grass"](around:${radius},${lat},${lng});
  way["natural"="water"](around:${radius},${lat},${lng});
  way["waterway"](around:${radius},${lat},${lng});
);
out geom(160);
`.trim();

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'WanderSketch-App/1.0 (wandersketch@local.dev)',
            },
            body: `data=${encodeURIComponent(overpassQuery)}`,
            signal: AbortSignal.timeout(10000), // 10 second timeout guard
        });

        if (!response.ok) {
            console.warn(`Overpass API responded with HTTP ${response.status}: ${response.statusText}`);
            return NextResponse.json({ features: [], fallback: true });
        }

        const data = await response.json();
        const features: VectorFeature[] = [];

        if (Array.isArray(data.elements)) {
            for (const el of data.elements) {
                if (el.type === 'way' && Array.isArray(el.geometry) && el.geometry.length >= 3) {
                    const coords: [number, number][] = el.geometry.map((pt: any) => [pt.lat, pt.lon]);
                    const tags = el.tags || {};

                    let type: 'building' | 'park' | 'water' = 'building';
                    if (tags.natural === 'water' || tags.waterway) {
                        type = 'water';
                    } else if (tags.leisure === 'park' || tags.landuse === 'grass') {
                        type = 'park';
                    } else if (tags.building) {
                        type = 'building';
                    }

                    features.push({
                        id: el.id,
                        type,
                        coordinates: coords,
                    });
                }
            }
        }

        return NextResponse.json(
            { features, count: features.length },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
                },
            }
        );
    } catch (err) {
        console.warn('Overpass fetch failed or timed out:', err);
        return NextResponse.json({ features: [], fallback: true });
    }
}

