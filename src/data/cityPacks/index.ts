import { CityPack } from './types';
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
} from './hongKong';
import { KYOTO_PACK } from './kyoto';
import { PARIS_PACK } from './paris';
import { TORONTO_PACK } from './toronto';

export * from './types';
export * from './hongKong';
export * from './kyoto';
export * from './paris';
export * from './toronto';

export const CITY_PACKS: Record<string, CityPack> = {
    // Hong Kong - Primary Default
    hong_kong: HONG_KONG_PACK,
    dest_hong_kong: HONG_KONG_PACK,

    // Hong Kong - All 18 Districts
    // 1. Sha Tin (Pre-curated with rich SVG & historical stops)
    sha_tin_district: HONG_KONG_SHA_TIN_PACK,
    dest_sha_tin_district: HONG_KONG_SHA_TIN_PACK,
    hong_kong_shatin: HONG_KONG_SHA_TIN_PACK,
    dest_hong_kong_shatin: HONG_KONG_SHA_TIN_PACK,
    sha_tin: HONG_KONG_SHA_TIN_PACK,

    // 2. Central & Western
    hong_kong_central: HONG_KONG_CENTRAL_PACK,
    central: HONG_KONG_CENTRAL_PACK,
    central_western: HONG_KONG_CENTRAL_PACK,
    sheung_wan: HONG_KONG_CENTRAL_PACK,

    // 3. Tsim Sha Tsui & Mong Kok (Yau Tsim Mong)
    hong_kong_tsim_sha_tsui: HONG_KONG_TST_PACK,
    tsim_sha_tsui: HONG_KONG_TST_PACK,
    tst: HONG_KONG_TST_PACK,
    mong_kok: HONG_KONG_TST_PACK,
    yau_tsim_mong: HONG_KONG_TST_PACK,
    jordan: HONG_KONG_TST_PACK,

    // 4. Wan Chai & Causeway Bay
    hong_kong_wan_chai: HONG_KONG_WAN_CHAI_PACK,
    wan_chai: HONG_KONG_WAN_CHAI_PACK,
    causeway_bay: HONG_KONG_WAN_CHAI_PACK,
    happy_valley: HONG_KONG_WAN_CHAI_PACK,

    // 5. Wong Tai Sin & Diamond Hill
    hong_kong_wong_tai_sin: HONG_KONG_WTS_PACK,
    wong_tai_sin: HONG_KONG_WTS_PACK,
    diamond_hill: HONG_KONG_WTS_PACK,

    // 6. Southern (Stanley & Aberdeen)
    hong_kong_southern: HONG_KONG_SOUTHERN_PACK,
    southern: HONG_KONG_SOUTHERN_PACK,
    stanley: HONG_KONG_SOUTHERN_PACK,
    aberdeen: HONG_KONG_SOUTHERN_PACK,
    repulse_bay: HONG_KONG_SOUTHERN_PACK,

    // 7. Islands (Lantau, Ngong Ping & Tai O)
    hong_kong_islands: HONG_KONG_ISLANDS_PACK,
    islands: HONG_KONG_ISLANDS_PACK,
    lantau: HONG_KONG_ISLANDS_PACK,
    ngong_ping: HONG_KONG_ISLANDS_PACK,
    tai_o: HONG_KONG_ISLANDS_PACK,
    tung_chung: HONG_KONG_ISLANDS_PACK,
    cheung_chau: HONG_KONG_ISLANDS_PACK,

    // 8. Sai Kung (including Tseung Kwan O, Hang Hau, Clear Water Bay)
    hong_kong_sai_kung: HONG_KONG_SAI_KUNG_PACK,
    sai_kung: HONG_KONG_SAI_KUNG_PACK,
    clearwater_bay: HONG_KONG_SAI_KUNG_PACK,
    clear_water_bay: HONG_KONG_SAI_KUNG_PACK,
    tseung_kwan_o: HONG_KONG_SAI_KUNG_PACK,
    hong_kong_tseung_kwan_o: HONG_KONG_SAI_KUNG_PACK,
    tko: HONG_KONG_SAI_KUNG_PACK,
    hang_hau: HONG_KONG_SAI_KUNG_PACK,
    po_lam: HONG_KONG_SAI_KUNG_PACK,
    tiu_keng_leng: HONG_KONG_SAI_KUNG_PACK,
    lohas_park: HONG_KONG_SAI_KUNG_PACK,

    // 9. Sham Shui Po
    hong_kong_sham_shui_po: HONG_KONG_SSP_PACK,
    sham_shui_po: HONG_KONG_SSP_PACK,
    cheung_sha_wan: HONG_KONG_SSP_PACK,

    // 10. Kowloon City & Kai Tak
    hong_kong_kowloon_city: HONG_KONG_KOWLOON_CITY_PACK,
    kowloon_city: HONG_KONG_KOWLOON_CITY_PACK,
    kai_tak: HONG_KONG_KOWLOON_CITY_PACK,
    hung_hom: HONG_KONG_KOWLOON_CITY_PACK,
    to_kwa_wan: HONG_KONG_KOWLOON_CITY_PACK,

    // 11. Eastern (North Point & Quarry Bay)
    hong_kong_eastern: HONG_KONG_EASTERN_PACK,
    eastern: HONG_KONG_EASTERN_PACK,
    north_point: HONG_KONG_EASTERN_PACK,
    quarry_bay: HONG_KONG_EASTERN_PACK,
    shau_kei_wan: HONG_KONG_EASTERN_PACK,
    chai_wan: HONG_KONG_EASTERN_PACK,

    // 12. Kwun Tong & Lei Yue Mun
    hong_kong_kwun_tong: HONG_KONG_KWUN_TONG_PACK,
    kwun_tong: HONG_KONG_KWUN_TONG_PACK,
    lei_yue_mun: HONG_KONG_KWUN_TONG_PACK,
    kowloon_bay: HONG_KONG_KWUN_TONG_PACK,

    // 13. Tsuen Wan & Sham Tseng
    hong_kong_tsuen_wan: HONG_KONG_TSUEN_WAN_PACK,
    tsuen_wan: HONG_KONG_TSUEN_WAN_PACK,
    sham_tseng: HONG_KONG_TSUEN_WAN_PACK,

    // 14. Tai Po & Tai Mei Tuk
    hong_kong_tai_po: HONG_KONG_TAI_PO_PACK,
    tai_po: HONG_KONG_TAI_PO_PACK,
    tai_mei_tuk: HONG_KONG_TAI_PO_PACK,

    // 15. Yuen Long & Tin Shui Wai
    hong_kong_yuen_long: HONG_KONG_YUEN_LONG_PACK,
    yuen_long: HONG_KONG_YUEN_LONG_PACK,
    tin_shui_wai: HONG_KONG_YUEN_LONG_PACK,

    // 16. Tuen Mun & Gold Coast
    hong_kong_tuen_mun: HONG_KONG_TUEN_MUN_PACK,
    tuen_mun: HONG_KONG_TUEN_MUN_PACK,
    gold_coast: HONG_KONG_TUEN_MUN_PACK,

    // 17. North (Sheung Shui & Fanling)
    hong_kong_north: HONG_KONG_NORTH_PACK,
    north_district: HONG_KONG_NORTH_PACK,
    sheung_shui: HONG_KONG_NORTH_PACK,
    fanling: HONG_KONG_NORTH_PACK,

    // 18. Kwai Tsing (Kwai Chung & Tsing Yi)
    hong_kong_kwai_tsing: HONG_KONG_KWAI_TSING_PACK,
    kwai_tsing: HONG_KONG_KWAI_TSING_PACK,
    kwai_chung: HONG_KONG_KWAI_TSING_PACK,
    tsing_yi: HONG_KONG_KWAI_TSING_PACK,


    // Kyoto
    kyoto_higashiyama: KYOTO_PACK,
    dest_kyoto: KYOTO_PACK,
    kyoto: KYOTO_PACK,
    higashiyama: KYOTO_PACK,

    // Paris
    paris_marais: PARIS_PACK,
    dest_paris: PARIS_PACK,
    paris: PARIS_PACK,
    marais: PARIS_PACK,

    // Toronto
    toronto_distillery: TORONTO_PACK,
    dest_toronto: TORONTO_PACK,
    toronto: TORONTO_PACK,
    distillery: TORONTO_PACK,
};

/**
 * Resolves a CityPack by identifier, slug, or city/district name
 */
export function getCityPack(identifier: string): CityPack | null {
    if (!identifier) return null;
    const clean = identifier.toLowerCase().trim();

    // 1. Direct key match
    if (CITY_PACKS[clean]) {
        return CITY_PACKS[clean];
    }

    // 2. Normalized slug match
    const slug = clean.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (CITY_PACKS[slug]) {
        return CITY_PACKS[slug];
    }

    // 3. Name or substring match
    for (const pack of Object.values(CITY_PACKS)) {
        const cityName = pack.cityName.toLowerCase();
        const districtName = pack.districtName.toLowerCase();
        const packId = pack.id.toLowerCase();

        if (
            clean === cityName ||
            clean === districtName ||
            clean.includes(cityName) ||
            cityName.includes(clean) ||
            clean.includes(packId) ||
            packId.includes(clean)
        ) {
            return pack;
        }
    }

    return null;
}

/**
 * Finds a CityPack whose geographic bounds contain the given coordinate, or nearest within ~12km
 */
export function findCityPackByCoords(lat: number, lng: number): CityPack | null {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        return null;
    }

    const uniquePacks = Array.from(new Set(Object.values(CITY_PACKS)));

    let closestPack: CityPack | null = null;
    let closestDist = Infinity;

    for (const pack of uniquePacks) {
        if (pack.bounds) {
            const [[minLat, minLng], [maxLat, maxLng]] = pack.bounds;
            if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
                return pack;
            }
        }

        // Distance check from center
        const dLat = (lat - pack.center[0]) * 111000;
        const dLng = (lng - pack.center[1]) * 111000 * Math.cos((lat * Math.PI) / 180);
        const distMeters = Math.sqrt(dLat * dLat + dLng * dLng);
        if (distMeters < closestDist) {
            closestDist = distMeters;
            closestPack = pack;
        }
    }

    if (closestDist <= 12000) {
        return closestPack;
    }

    return null;
}

