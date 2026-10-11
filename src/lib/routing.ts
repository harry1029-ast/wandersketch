export interface RouteResult {
    coordinates: [number, number][]; // [lat, lng] points along real sidewalks
    distanceKm: number;
    durationMinutes: number;
}

/**
 * Calculates real walking path across a sequence of waypoints using OSRM Foot Profile.
 * Falls back to straight-line interpolation if offline or rate-limited.
 */
export async function fetchPedestrianRoute(
    stops: [number, number][]
): Promise<RouteResult> {
    if (stops.length < 2) {
        return { coordinates: stops, distanceKm: 0, durationMinutes: 0 };
    }

    // Check if stops are far apart (intercity / cross-country jump > 40km)
    let totalMeters = 0;
    let hasIntercityJump = false;
    for (let i = 0; i < stops.length - 1; i++) {
        const d = haversineDistance(stops[i], stops[i + 1]);
        totalMeters += d;
        if (d > 40000) {
            hasIntercityJump = true;
        }
    }

    if (hasIntercityJump || totalMeters > 60000) {
        // Intercity connection: straight line connection without requesting massive walking geometries
        const distanceKm = Number((totalMeters / 1000).toFixed(1));
        const durationMinutes = Math.round((distanceKm / 75) * 60 + 20); // Est transit/high-speed rail
        return {
            coordinates: stops,
            distanceKm,
            durationMinutes,
        };
    }

    // OSRM expects coordinates in lng,lat order
    const coordString = stops.map(([lat, lng]) => `${lng},${lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/foot/${coordString}?overview=full&geometries=geojson`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`OSRM request failed: ${res.statusText}`);
        const data = await res.json();

        if (data.code === 'Ok' && data.routes?.[0]) {
            const route = data.routes[0];
            // Convert OSRM [lng, lat] back to Leaflet [lat, lng]
            const coordinates: [number, number][] = route.geometry.coordinates.map(
                ([lng, lat]: [number, number]) => [lat, lng]
            );
            const distanceKm = Number((route.distance / 1000).toFixed(1));
            const durationMinutes = Math.round(route.duration / 60);

            return {
                coordinates,
                distanceKm,
                durationMinutes,
            };
        }
    } catch {
        // Network fallback: calculate Haversine approximation
    }

    // Fallback calculation
    let fallbackMeters = 0;
    for (let i = 0; i < stops.length - 1; i++) {
        fallbackMeters += haversineDistance(stops[i], stops[i + 1]);
    }
    const fallbackKm = Number((fallbackMeters / 1000).toFixed(1));
    const fallbackMins = Math.round((fallbackKm / 4.5) * 60); // Average 4.5 km/h walk

    return {
        coordinates: stops,
        distanceKm: fallbackKm,
        durationMinutes: fallbackMins,
    };
}

function haversineDistance(
    [lat1, lon1]: [number, number],
    [lat2, lon2]: [number, number]
): number {
    const R = 6371e3; // meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}