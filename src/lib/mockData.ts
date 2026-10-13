import { ScenicZone, TravelPlan } from '@/types/itinerary';
import {
    HONG_KONG_PACK,
    HONG_KONG_SHA_TIN_PACK,
    HONG_KONG_CENTRAL_PACK,
    HONG_KONG_TST_PACK,
    HONG_KONG_WAN_CHAI_PACK,
    HONG_KONG_WTS_PACK,
    HONG_KONG_SOUTHERN_PACK,
    HONG_KONG_ISLANDS_PACK,
    HONG_KONG_SAI_KUNG_PACK,
    HONG_KONG_SSP_PACK,
    HONG_KONG_KOWLOON_CITY_PACK,
    HONG_KONG_EASTERN_PACK,
    HONG_KONG_KWUN_TONG_PACK,
    HONG_KONG_TSUEN_WAN_PACK,
    HONG_KONG_TAI_PO_PACK,
    HONG_KONG_YUEN_LONG_PACK,
    HONG_KONG_TUEN_MUN_PACK,
    HONG_KONG_NORTH_PACK,
    HONG_KONG_KWAI_TSING_PACK,
    CityPack,
} from '@/data/cityPacks';

function packToZone(pack: CityPack): ScenicZone {
    return {
        id: pack.id,
        name: pack.districtName,
        city: pack.cityName,
        center: pack.center,
        zoom: pack.zoom,
        userOrigin: pack.userOrigin,
        bounds: pack.bounds,
        facilities: pack.facilities,
        landmarksPool: pack.landmarks,
    };
}

const ALL_PACKS: CityPack[] = [
    HONG_KONG_SHA_TIN_PACK,
    HONG_KONG_CENTRAL_PACK,
    HONG_KONG_TST_PACK,
    HONG_KONG_WAN_CHAI_PACK,
    HONG_KONG_WTS_PACK,
    HONG_KONG_SOUTHERN_PACK,
    HONG_KONG_ISLANDS_PACK,
    HONG_KONG_SAI_KUNG_PACK,
    HONG_KONG_SSP_PACK,
    HONG_KONG_KOWLOON_CITY_PACK,
    HONG_KONG_EASTERN_PACK,
    HONG_KONG_KWUN_TONG_PACK,
    HONG_KONG_TSUEN_WAN_PACK,
    HONG_KONG_TAI_PO_PACK,
    HONG_KONG_YUEN_LONG_PACK,
    HONG_KONG_TUEN_MUN_PACK,
    HONG_KONG_NORTH_PACK,
    HONG_KONG_KWAI_TSING_PACK,
];

export const MASTER_ZONES: Record<string, ScenicZone> = {};

for (const pack of ALL_PACKS) {
    const zone = packToZone(pack);
    MASTER_ZONES[pack.id] = zone;
    MASTER_ZONES[`dest_${pack.id}`] = zone;
}

// Convenient district aliases
MASTER_ZONES.hong_kong = packToZone(HONG_KONG_PACK);
MASTER_ZONES.dest_hong_kong = packToZone(HONG_KONG_PACK);
MASTER_ZONES.sha_tin_district = packToZone(HONG_KONG_SHA_TIN_PACK);
MASTER_ZONES.central = packToZone(HONG_KONG_CENTRAL_PACK);
MASTER_ZONES.tsim_sha_tsui = packToZone(HONG_KONG_TST_PACK);
MASTER_ZONES.sai_kung = packToZone(HONG_KONG_SAI_KUNG_PACK);
MASTER_ZONES.wan_chai = packToZone(HONG_KONG_WAN_CHAI_PACK);

export const INITIAL_PLANS: TravelPlan[] = [
    {
        id: 'plan_hongkong_shatin',
        title: 'Hong Kong Sha Tin Heritage & River Walk',
        zoneKey: 'sha_tin_district',
        createdAt: '2026-10-10',
        tag: 'Heritage & Riverside',
        estimatedDistance: '2.8 km',
        estimatedDuration: '2.5 hrs',
        activeRouteKey: 'classic',
        spotIds: ['st-newtown', 'st-lucky-plaza', 'st-heritage-museum', 'st-chekung', 'st-shatin-park'],
        themeRoutes: {
            classic: ['st-newtown', 'st-lucky-plaza', 'st-heritage-museum', 'st-chekung', 'st-shatin-park'],
            culture: ['st-heritage-museum', 'st-chekung', 'st-shatin-park'],
            rain: ['st-newtown', 'st-lucky-plaza', 'st-chanway'],
        },
    },
    {
        id: 'plan_hongkong_central',
        title: 'Hong Kong Central & Victoria Peak Heritage Walk',
        zoneKey: 'hong_kong_central',
        createdAt: '2026-10-08',
        tag: 'Colonial & Skyline',
        estimatedDistance: '3.1 km',
        estimatedDuration: '3.0 hrs',
        activeRouteKey: 'classic',
        spotIds: [
            'hk-central-node-579168324',
            'hk-central-node-1036265063',
            'hk-central-node-1906399327',
            'hk-central-node-4837283334',
        ],
        themeRoutes: {
            classic: [
                'hk-central-node-579168324',
                'hk-central-node-1036265063',
                'hk-central-node-1906399327',
                'hk-central-node-4837283334',
            ],
            culture: ['hk-central-node-579168324', 'hk-central-node-1036265063'],
            rain: ['hk-central-node-579168324', 'hk-central-node-4837283334'],
        },
    },
    {
        id: 'plan_hongkong_tst',
        title: 'Kowloon TST Cultural Museums & Harbour Walk',
        zoneKey: 'hong_kong_tsim_sha_tsui',
        createdAt: '2026-10-05',
        tag: 'Museums & Harbour',
        estimatedDistance: '2.5 km',
        estimatedDuration: '2.5 hrs',
        activeRouteKey: 'classic',
        spotIds: [
            'hk-tsimShaTsui-node-857941650',
            'hk-tsimShaTsui-way-56752303',
            'hk-tsimShaTsui-way-99148524',
            'hk-tsimShaTsui-way-99150699',
        ],
        themeRoutes: {
            classic: [
                'hk-tsimShaTsui-node-857941650',
                'hk-tsimShaTsui-way-56752303',
                'hk-tsimShaTsui-way-99148524',
                'hk-tsimShaTsui-way-99150699',
            ],
            culture: ['hk-tsimShaTsui-way-56752303', 'hk-tsimShaTsui-way-99148524'],
            rain: ['hk-tsimShaTsui-way-56752303', 'hk-tsimShaTsui-way-99150699'],
        },
    },
    {
        id: 'plan_hongkong_saikung',
        title: 'Sai Kung Coastal Heritage & Waterfront Promenade',
        zoneKey: 'hong_kong_sai_kung',
        createdAt: '2026-10-01',
        tag: 'Coastal & Geopark',
        estimatedDistance: '3.6 km',
        estimatedDuration: '3.2 hrs',
        activeRouteKey: 'classic',
        spotIds: [
            'hk-saiKung-node-3890530477',
            'hk-saiKung-node-5156980414',
            'hk-saiKung-way-101122639',
            'hk-saiKung-way-103001770',
        ],
        themeRoutes: {
            classic: [
                'hk-saiKung-node-3890530477',
                'hk-saiKung-node-5156980414',
                'hk-saiKung-way-101122639',
                'hk-saiKung-way-103001770',
            ],
            culture: ['hk-saiKung-way-101122639', 'hk-saiKung-way-103001770'],
            rain: ['hk-saiKung-way-103001770'],
        },
    },
];