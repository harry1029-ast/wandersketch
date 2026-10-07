export type ScenicZoneKey = 'toronto_distillery' | 'kyoto_higashiyama' | 'paris_marais';
export type RouteTheme = 'classic' | 'culture' | 'rain';
export type AppStage = 'planner' | 'plans' | 'map';

export interface Landmark {
    id: string;
    name: string;
    category: 'history' | 'craft' | 'nature' | 'culture' | 'landmark';
    color: string;
    coords: [number, number]; // [lat, lng]
    svgSnippet: string;       // 2.5D building illustration
    tag: string;
    desc: string;
    audioNote: string;
    panoUrl: string;
    tips: string;
}

export interface ScenicFacility {
    type: 'restroom' | 'info' | 'cafe' | 'photo';
    name: string;
    coords: [number, number];
    emoji: string;
}

export interface ScenicZone {
    id: ScenicZoneKey;
    name: string;
    city: string;
    center: [number, number];
    zoom: number;
    userOrigin: [number, number];
    bounds: [[number, number], [number, number]];
    facilities: ScenicFacility[];
    landmarksPool: Landmark[];
    illustratedMapUrl?: string;
    illustratedMapBounds?: [[number, number], [number, number]];
}

export interface TravelPlan {
    id: string;
    title: string;
    zoneKey: ScenicZoneKey;
    createdAt: string;
    tag: string;
    estimatedDistance: string;
    estimatedDuration: string;
    activeRouteKey: RouteTheme;
    spotIds: string[];
    themeRoutes: Record<RouteTheme, string[]>;
}