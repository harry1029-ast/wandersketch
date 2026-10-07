import type L from 'leaflet';

export interface BoundingCircle {
    center: [number, number]; // [lat, lng]
    radiusMeters: number;      // radius in meters with breathing margin applied
    maxDistFromCenterMeters: number; // raw maximum distance to any waypoint
}

export interface PixelCircleResult {
    containerCenter: { x: number; y: number };
    layerCenter: { x: number; y: number };
    radiusPx: number;
}

/**
 * Calculates great-circle Haversine distance between two [lat, lng] points in meters.
 */
export function haversineMeters(
    [lat1, lon1]: [number, number],
    [lat2, lon2]: [number, number]
): number {
    const R = 6371000; // Earth radius in meters
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

/**
 * Calculates the geographic centroid and bounding circle encompassing
 * all active itinerary stops with an organic breathing margin (default 35%).
 */
export function calculateItineraryBoundingCircle(
    coords: [number, number][],
    fallbackCenter?: [number, number],
    marginFactor: number = 1.35,
    minRadiusMeters: number = 220
): BoundingCircle {
    if (!coords || coords.length === 0) {
        const center = fallbackCenter || [43.6503, -79.3596];
        return {
            center,
            radiusMeters: minRadiusMeters,
            maxDistFromCenterMeters: 0,
        };
    }

    if (coords.length === 1) {
        return {
            center: coords[0],
            radiusMeters: minRadiusMeters,
            maxDistFromCenterMeters: 0,
        };
    }

    // Arithmetic geographic centroid
    let sumLat = 0;
    let sumLng = 0;
    for (const [lat, lng] of coords) {
        sumLat += lat;
        sumLng += lng;
    }
    const center: [number, number] = [sumLat / coords.length, sumLng / coords.length];

    // Find the furthest stop from the centroid
    let maxDist = 0;
    for (const pt of coords) {
        const d = haversineMeters(center, pt);
        if (d > maxDist) maxDist = d;
    }

    // Adaptive breathing margin: comfortable +28% for compact clusters, +15% for wider journeys
    const effectiveMargin = maxDist > 500 ? 1.15 : maxDist > 250 ? 1.22 : marginFactor;
    const radiusMeters = Math.max(minRadiusMeters, maxDist * effectiveMargin);

    return {
        center,
        radiusMeters,
        maxDistFromCenterMeters: maxDist,
    };
}

/**
 * Calculates the geographic [lat, lng] coordinate on the circle perimeter
 * at a given bearing (in degrees, 0 = North, 90 = East, etc.).
 */
export function getCirclePerimeterCoords(
    [lat, lng]: [number, number],
    distanceMeters: number,
    bearingDeg: number = 40
): [number, number] {
    const R = 6371000;
    const delta = distanceMeters / R;
    const theta = (bearingDeg * Math.PI) / 180;
    const phi1 = (lat * Math.PI) / 180;
    const lambda1 = (lng * Math.PI) / 180;

    const phi2 = Math.asin(
        Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta)
    );
    const lambda2 =
        lambda1 +
        Math.atan2(
            Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
            Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2)
        );

    return [(phi2 * 180) / Math.PI, (lambda2 * 180) / Math.PI];
}

/**
 * Converts a geographic BoundingCircle into screen container pixels
 * and Leaflet layer coordinates.
 */
export function getPixelCircle(
    map: L.Map,
    centerLatLng: [number, number],
    radiusMeters: number
): PixelCircleResult {
    const centerLeaflet = [centerLatLng[0], centerLatLng[1]] as [number, number];
    // Sample a point on the perimeter eastward to calculate on-screen radius in pixels
    const edgeCoords = getCirclePerimeterCoords(centerLeaflet, radiusMeters, 90);

    const containerCenterPt = map.latLngToContainerPoint(centerLeaflet);
    const containerEdgePt = map.latLngToContainerPoint(edgeCoords);

    const layerCenterPt = map.latLngToLayerPoint(centerLeaflet);

    const dx = containerEdgePt.x - containerCenterPt.x;
    const dy = containerEdgePt.y - containerCenterPt.y;
    const radiusPx = Math.max(12, Math.round(Math.sqrt(dx * dx + dy * dy)));

    return {
        containerCenter: { x: containerCenterPt.x, y: containerCenterPt.y },
        layerCenter: { x: layerCenterPt.x, y: layerCenterPt.y },
        radiusPx,
    };
}

