import { supabase } from '@/lib/supabaseClient';
import { Landmark, TravelPlan, ScenicZone } from '@/types/itinerary';

export async function fetchDestinations(): Promise<ScenicZone[]> {
    const { data, error } = await supabase.from('destinations').select('*');
    if (error || !data) {
        console.error('Error fetching destinations:', error);
        return [];
    }

    return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        city: d.city,
        center: [d.center_lat, d.center_lng],
        zoom: d.zoom,
        userOrigin: [d.user_origin_lat, d.user_origin_lng],
        bounds: [
            [d.bounds_sw_lat, d.bounds_sw_lng],
            [d.bounds_ne_lat, d.bounds_ne_lng],
        ],
        facilities: [],
        landmarksPool: [],
    }));
}

export async function fetchNearbyLandmarks(
    lat: number,
    lng: number,
    radiusMeters: number = 2000
): Promise<Landmark[]> {
    const { data, error } = await supabase.rpc('get_landmarks_nearby', {
        lat,
        lng,
        radius_meters: radiusMeters,
    });

    if (error || !data) {
        console.error('Error querying nearby landmarks:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        color: item.color,
        coords: [item.lat, item.lng],
        svgSnippet: item.svg_snippet,
        tag: item.tag,
        desc: item.description,
        audioNote: item.audio_note,
        panoUrl: item.pano_url || '',
        tips: item.tips || '',
    }));
}

export async function fetchAllPlans(): Promise<TravelPlan[]> {
    const { data, error } = await supabase.from('travel_plans').select('*');
    if (error || !data) {
        console.error('Error fetching travel plans:', error);
        return [];
    }

    return data.map((p: any) => ({
        id: p.id,
        title: p.title,
        zoneKey: p.destination_id,
        createdAt: p.created_at,
        tag: p.tag,
        estimatedDistance: p.estimated_distance || '2.0 km',
        estimatedDuration: p.estimated_duration || '1.5 hrs',
        activeRouteKey: p.active_route_key,
        spotIds: p.spot_ids,
        themeRoutes: p.theme_routes,
    }));
}

export async function saveCustomSpotToDb(spot: {
    id: string;
    destinationId: string;
    name: string;
    category: string;
    color: string;
    coords: [number, number];
    address?: string;
    tag?: string;
    description?: string;
    audioNote?: string;
}) {
    const { data, error } = await supabase.rpc('create_custom_spot', {
        spot_id: spot.id,
        dest_id: spot.destinationId,
        spot_name: spot.name,
        spot_category: spot.category,
        spot_color: spot.color,
        lat: spot.coords[0],
        lng: spot.coords[1],
        spot_address: spot.address || '',
        spot_tag: spot.tag || 'Personal Spot',
        spot_description: spot.description || '',
        spot_audio_note: spot.audioNote || `Arrived at ${spot.name}`,
    });

    if (error) {
        console.error('Failed to persist custom spot to PostGIS:', error);
        return null;
    }
    return data;
}