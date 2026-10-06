import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const viewbox = searchParams.get('viewbox'); // Optional: 'minLng,maxLat,maxLng,minLat'

    if (!query || query.trim().length < 2) {
        return NextResponse.json({ results: [] });
    }

    // Build Nominatim Search URL
    // bounded=1 + viewbox biases search strictly within the current scenic destination
    let nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        query
    )}&addressdetails=1&limit=5`;

    if (viewbox) {
        nominatimUrl += `&viewbox=${viewbox}&bounded=1`;
    }

    try {
        const res = await fetch(nominatimUrl, {
            headers: {
                'User-Agent': 'WanderSketch-App/1.0 (wandersketch@local.dev)',
                'Accept-Language': 'en',
            },
            next: { revalidate: 3600 }, // Cache identical queries for 1 hour
        });

        if (!res.ok) {
            throw new Error(`Nominatim request failed: ${res.statusText}`);
        }

        const data = await res.json();

        const formattedResults = data.map((item: any) => ({
            placeId: item.place_id,
            name: item.name || item.display_name.split(',')[0],
            displayName: item.display_name,
            category: item.type || item.class || 'landmark',
            coords: [parseFloat(item.lat), parseFloat(item.lon)] as [number, number],
        }));

        return NextResponse.json({ results: formattedResults });
    } catch (error) {
        console.error('Geocoding search failed:', error);
        return NextResponse.json({ results: [] }, { status: 500 });
    }
}