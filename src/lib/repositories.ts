import { supabase } from '@/lib/supabaseClient';
import {
    Landmark,
    TravelPlan,
    ScenicZone,
    UserTravelProfile,
    ItineraryDay,
    ItineraryItem,
    TravelDiaryEntry,
    TripArchiveDossier,
    TripArchiveStatus,
    ExpenseCategory,
} from '@/types/itinerary';


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

export async function deletePlanFromDb(planId: string): Promise<boolean> {
    const { error } = await supabase.from('travel_plans').delete().eq('id', planId);
    if (error) {
        console.error('Failed to delete travel plan from Supabase:', error);
        return false;
    }
    return true;
}

export async function fetchAllCustomSpots(): Promise<Landmark[]> {
    const { data, error } = await supabase.from('custom_spots').select('*');
    if (error || !data) {
        console.warn('Failed to fetch custom spots:', error);
        return [];
    }

    return data.map((c: any) => ({
        id: c.id,
        destinationId: c.destination_id,
        name: c.name,
        category: (c.category || 'craft') as any,
        color: c.color || '#f4c568',
        coords: [
            c.lat !== undefined && c.lat !== null
                ? Number(c.lat)
                : (c.location?.coordinates ? Number(c.location.coordinates[1]) : 0),
            c.lng !== undefined && c.lng !== null
                ? Number(c.lng)
                : (c.location?.coordinates ? Number(c.location.coordinates[0]) : 0),
        ] as [number, number],
        svgSnippet: `
      <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
        <circle cx="50" cy="50" r="34" fill="${c.color || '#f4c568'}" stroke="#2b261b" stroke-width="3"/>
        <text x="50" y="58" font-size="22" text-anchor="middle">⭐</text>
      </svg>
    `,
        tag: c.tag || 'Personal Spot',
        desc: c.description || c.address || '',
        audioNote: c.audio_note || `You have arrived at ${c.name}.`,
        panoUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
        tips: 'Personal Spot saved by user',
        isCustom: true,
    }));
}

const VALID_DB_DEST_IDS = new Set([
    'toronto_distillery',
    'kyoto_higashiyama',
    'paris_marais',
]);

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
    // Only pass dest_id if it exists in DB destinations table, otherwise pass null to avoid foreign key violation
    const destId = VALID_DB_DEST_IDS.has(spot.destinationId) ? spot.destinationId : null;

    try {
        const { data, error } = await supabase.rpc('create_custom_spot', {
            spot_id: spot.id,
            dest_id: destId,
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
            // If foreign key constraint triggered, retry with null dest_id
            if (destId !== null && error.code === '23503') {
                const retry = await supabase.rpc('create_custom_spot', {
                    spot_id: spot.id,
                    dest_id: null,
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
                if (!retry.error) return retry.data;
            }
            console.warn('Could not persist custom spot to PostGIS (saved locally):', error.message || error);
            return null;
        }
        return data;
    } catch (err: any) {
        console.warn('Network error saving custom spot to database (saved locally):', err?.message || err);
        return null;
    }
}

export async function deleteCustomSpotFromDb(spotId: string): Promise<boolean> {
    try {
        const { error } = await supabase.from('custom_spots').delete().eq('id', spotId);
        if (error) {
            console.warn('Failed to delete custom spot from Supabase:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.warn('Error deleting custom spot from Supabase:', err);
        return false;
    }
}

export interface DynamicMapSpot {
    id: string;
    name: string;
    category: string;
    color: string;
    coords: [number, number];
    svgSnippet: string;
    tag: string;
    desc: string;
    audioNote: string;
    isCustom: boolean;
    importanceScore?: number;
    prominenceTier?: 1 | 2 | 3;
}

export async function reverseGeocodeCoords(lat: number, lng: number): Promise<{
    district: string;
    city: string;
    country: string;
    displayName: string;
    coords: [number, number];
    bounds?: [[number, number], [number, number]];
} | null> {
    try {
        const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}&reverse=1`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.result || null;
    } catch (err) {
        console.warn('Reverse geocode failed:', err);
        return null;
    }
}

export async function fetchAmbientPOIsInRadius(
    lat: number,
    lng: number,
    radius: number = 1200
): Promise<DynamicMapSpot[]> {
    try {
        const res = await fetch(`/api/pois?lat=${lat}&lng=${lng}&radius=${radius}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.pois || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            color: p.color,
            coords: p.coords,
            svgSnippet: p.svgSnippet,
            tag: p.tag,
            desc: p.desc,
            audioNote: p.audioNote,
            isCustom: false,
            importanceScore: p.importanceScore,
            prominenceTier: p.prominenceTier,
        }));
    } catch (err: any) {
        // Silently handle expected dev-server reloads or browser socket disconnects
        if (err?.name !== 'AbortError' && !err?.message?.includes('Failed to fetch')) {
            console.warn('Could not fetch ambient POIs:', err);
        }
        return [];
    }
}

export async function fetchSpotsInEnvelope(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number
): Promise<DynamicMapSpot[]> {
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const fetchDbSpots = async (): Promise<DynamicMapSpot[]> => {
        try {
            const { data, error } = await supabase.rpc('get_spots_in_envelope', {
                min_lat: minLat,
                min_lng: minLng,
                max_lat: maxLat,
                max_lng: maxLng,
            });
            // Strictly filter out custom/personal spots from ambient discovery queries.
            // Personal spots are only rendered from the user's active personal spots pool.
            return data
                .filter((item: any) => !item.is_custom && item.tag !== 'Personal Spot' && !(typeof item.id === 'string' && (item.id.startsWith('custom-') || item.id.startsWith('test-spot-'))))
                .map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    color: item.color,
                    coords: [item.lat, item.lng] as [number, number],
                    svgSnippet: item.svg_snippet,
                    tag: item.tag,
                    desc: item.description,
                    audioNote: item.audio_note,
                    isCustom: false,
                }));
        } catch {
            return [];
        }
    };

    const dLat = ((maxLat - minLat) * 111000) / 2;
    const dLng = ((maxLng - minLng) * 111000 * Math.cos((centerLat * Math.PI) / 180)) / 2;
    const dynamicRadius = Math.min(Math.max(Math.round(Math.sqrt(dLat * dLat + dLng * dLng)), 600), 1200);

    const [dbResult, ambientPois] = await Promise.all([
        fetchDbSpots(),
        fetchAmbientPOIsInRadius(centerLat, centerLng, dynamicRadius),
    ]);

    // Database custom spots take priority, then ambient POIs fill in
    const seenNames = new Set(dbResult.map((s: DynamicMapSpot) => s.name.toLowerCase()));
    const seenIds = new Set(dbResult.map((s: DynamicMapSpot) => s.id));
    const merged: DynamicMapSpot[] = [...dbResult];

    for (const poi of ambientPois) {
        if (!seenIds.has(poi.id) && !seenNames.has(poi.name.toLowerCase())) {
            seenIds.add(poi.id);
            seenNames.add(poi.name.toLowerCase());
            merged.push(poi);
        }
    }

    return merged;
}

// -----------------------------------------------------------------------------
// Trip Archive Integration Repository CRUD Methods
// -----------------------------------------------------------------------------

function parsePointLocation(loc: any): [number, number] | undefined {
    if (!loc) return undefined;
    if (Array.isArray(loc) && loc.length === 2) {
        return [loc[0], loc[1]];
    }
    // GeoJSON format: { type: 'Point', coordinates: [lng, lat] }
    if (typeof loc === 'object' && loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
        return [loc.coordinates[1], loc.coordinates[0]];
    }
    // WKT format: "POINT(lng lat)" or "POINT(lng, lat)"
    if (typeof loc === 'string') {
        const match = loc.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
        if (match) {
            const lng = parseFloat(match[1]);
            const lat = parseFloat(match[2]);
            return [lat, lng];
        }
    }
    return undefined;
}

export async function fetchUserProfile(userId: string): Promise<UserTravelProfile | null> {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error || !data) {
        if (error) console.error('Error fetching user profile:', error);
        return null;
    }

    return {
        id: data.id,
        lodgingTier: data.lodging_tier || undefined,
        diningTastes: data.dining_tastes || [],
        walkingEndurance: data.walking_endurance || undefined,
        attractionTypes: data.attraction_types || [],
        createdAt: data.created_at,
    };
}

export async function upsertUserProfile(profile: UserTravelProfile): Promise<boolean> {
    const { error } = await supabase.from('user_profiles').upsert({
        id: profile.id,
        lodging_tier: profile.lodgingTier,
        dining_tastes: profile.diningTastes,
        walking_endurance: profile.walkingEndurance,
        attraction_types: profile.attractionTypes,
    });

    if (error) {
        console.error('Failed to upsert user profile:', error);
        return false;
    }
    return true;
}

export async function fetchItineraryDaysWithItems(planId: string): Promise<ItineraryDay[]> {
    const [daysResult, itemsResult] = await Promise.all([
        supabase
            .from('itinerary_days')
            .select('*')
            .eq('plan_id', planId)
            .order('day_number', { ascending: true }),
        supabase
            .from('itinerary_items')
            .select('*')
            .eq('plan_id', planId)
            .order('order_index', { ascending: true }),
    ]);

    if (daysResult.error) {
        console.error('Error fetching itinerary days:', daysResult.error);
        return [];
    }
    if (itemsResult.error) {
        console.error('Error fetching itinerary items:', itemsResult.error);
    }

    const items = itemsResult.data || [];
    const itemsByDay = new Map<string, ItineraryItem[]>();

    for (const item of items) {
        const mappedItem: ItineraryItem = {
            id: item.id,
            dayId: item.day_id,
            planId: item.plan_id,
            name: item.name,
            category: item.category as ExpenseCategory,
            estimatedCost: Number(item.estimated_cost || 0),
            actualCost: Number(item.actual_cost || 0),
            location: parsePointLocation(item.location),
            orderIndex: item.order_index ?? 0,
        };

        const existing = itemsByDay.get(item.day_id) || [];
        existing.push(mappedItem);
        itemsByDay.set(item.day_id, existing);
    }

    return (daysResult.data || []).map((day: any) => ({
        id: day.id,
        planId: day.plan_id,
        dayNumber: day.day_number,
        calendarDate: day.calendar_date || undefined,
        hotelInfo: day.hotel_info || {},
        subtotalEstimated: Number(day.subtotal_estimated || 0),
        subtotalActual: Number(day.subtotal_actual || 0),
        items: itemsByDay.get(day.id) || [],
        createdAt: day.created_at,
    }));
}

export async function saveItineraryItem(item: ItineraryItem): Promise<boolean> {
    const pointLocation = item.location && item.location.length === 2
        ? `POINT(${item.location[1]} ${item.location[0]})`
        : null;

    const { error } = await supabase.from('itinerary_items').upsert({
        id: item.id,
        day_id: item.dayId,
        plan_id: item.planId,
        name: item.name,
        category: item.category,
        estimated_cost: item.estimatedCost,
        actual_cost: item.actualCost,
        location: pointLocation,
        order_index: item.orderIndex,
    });

    if (error) {
        console.error('Failed to save itinerary item to Supabase:', error);
        return false;
    }
    return true;
}

export async function fetchTravelDiaries(planId: string): Promise<TravelDiaryEntry[]> {
    const { data, error } = await supabase
        .from('travel_diaries')
        .select('*')
        .eq('plan_id', planId)
        .order('entry_date', { ascending: true });

    if (error || !data) {
        if (error) console.error('Error fetching travel diaries:', error);
        return [];
    }

    return data.map((d: any) => ({
        id: d.id,
        planId: d.plan_id,
        entryDate: d.entry_date,
        content: d.content || '',
        imageUrls: d.image_urls || [],
        createdAt: d.created_at,
    }));
}

export async function saveTravelDiary(entry: TravelDiaryEntry): Promise<boolean> {
    const { error } = await supabase.from('travel_diaries').upsert({
        id: entry.id,
        plan_id: entry.planId,
        entry_date: entry.entryDate,
        content: entry.content,
        image_urls: entry.imageUrls,
    });

    if (error) {
        console.error('Failed to save travel diary entry:', error);
        return false;
    }
    return true;
}

export async function fetchTripArchive(planId: string): Promise<TripArchiveDossier | null> {
    const { data, error } = await supabase
        .from('trip_archives')
        .select('*')
        .eq('plan_id', planId)
        .maybeSingle();

    if (error || !data) {
        if (error) console.error('Error fetching trip archive:', error);
        return null;
    }

    return {
        id: data.id,
        planId: data.plan_id,
        status: data.status as TripArchiveStatus,
        totalEstimated: Number(data.total_estimated || 0),
        totalActual: Number(data.total_actual || 0),
        pdfUrl: data.pdf_url || undefined,
        snapshotUrl: data.snapshot_url || undefined,
        finalizedAt: data.finalized_at || undefined,
    };
}

export async function updateTripArchiveStatus(
    planId: string,
    status: TripArchiveStatus,
    totals?: { estimated: number; actual: number }
): Promise<boolean> {
    const updatePayload: Record<string, any> = {
        status,
    };

    if (totals) {
        updatePayload.total_estimated = totals.estimated;
        updatePayload.total_actual = totals.actual;
    }

    if (status === 'completed') {
        updatePayload.finalized_at = new Date().toISOString();
    }

    const { data: existing, error: selectError } = await supabase
        .from('trip_archives')
        .select('id')
        .eq('plan_id', planId)
        .maybeSingle();

    if (selectError) {
        console.error('Error checking existing trip archive:', selectError);
        return false;
    }

    if (existing) {
        const { error: updateError } = await supabase
            .from('trip_archives')
            .update(updatePayload)
            .eq('plan_id', planId);

        if (updateError) {
            console.error('Failed to update trip archive status:', updateError);
            return false;
        }
        return true;
    } else {
        const { error: insertError } = await supabase
            .from('trip_archives')
            .insert({
                id: `archive_${planId}`,
                plan_id: planId,
                total_estimated: totals?.estimated ?? 0,
                total_actual: totals?.actual ?? 0,
                ...updatePayload,
            });

        if (insertError) {
            console.error('Failed to insert trip archive:', insertError);
            return false;
        }
        return true;
    }
}