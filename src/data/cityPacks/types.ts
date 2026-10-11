import { Landmark, ScenicFacility } from '@/types/itinerary';

export interface CityPack {
    id: string;
    cityName: string;
    districtName: string;
    country: string;
    center: [number, number];
    zoom: number;
    bounds: [[number, number], [number, number]]; // [[minLat, minLng], [maxLat, maxLng]]
    userOrigin: [number, number];
    facilities: ScenicFacility[];
    landmarks: Landmark[];
}

