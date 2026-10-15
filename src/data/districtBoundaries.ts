import rawBoundaries from './hongKongDistrictBoundaries.json';

export interface DistrictBoundary {
    id: string;
    key: string;
    name: string;
    rings: [number, number][][];
}

export const HONG_KONG_DISTRICT_BOUNDARIES: Record<string, DistrictBoundary> = rawBoundaries as unknown as Record<string, DistrictBoundary>;

// Map pack IDs (e.g. 'hong_kong_central', 'sha_tin_district') and synonyms to boundary keys
export const DISTRICT_KEY_MAP: Record<string, string> = {
    // Central & Western
    hong_kong_central: 'central',
    central: 'central',
    central_western: 'central',
    sheung_wan: 'central',

    // Eastern
    hong_kong_eastern: 'eastern',
    eastern: 'eastern',
    north_point: 'eastern',
    quarry_bay: 'eastern',

    // Southern
    hong_kong_southern: 'southern',
    southern: 'southern',
    stanley: 'southern',
    aberdeen: 'southern',

    // Wan Chai
    hong_kong_wan_chai: 'wanChai',
    wan_chai: 'wanChai',
    wanChai: 'wanChai',
    causeway_bay: 'wanChai',

    // Yau Tsim Mong
    hong_kong_tsim_sha_tsui: 'tsimShaTsui',
    tsim_sha_tsui: 'tsimShaTsui',
    tsimShaTsui: 'tsimShaTsui',
    tst: 'tsimShaTsui',
    mong_kok: 'tsimShaTsui',
    yau_tsim_mong: 'tsimShaTsui',

    // Sham Shui Po
    hong_kong_sham_shui_po: 'shamShuiPo',
    sham_shui_po: 'shamShuiPo',
    shamShuiPo: 'shamShuiPo',

    // Kowloon City
    hong_kong_kowloon_city: 'kowloonCity',
    kowloon_city: 'kowloonCity',
    kowloonCity: 'kowloonCity',
    kai_tak: 'kowloonCity',

    // Kwun Tong
    hong_kong_kwun_tong: 'kwunTong',
    kwun_tong: 'kwunTong',
    kwunTong: 'kwunTong',

    // Wong Tai Sin
    hong_kong_wong_tai_sin: 'wongTaiSin',
    wong_tai_sin: 'wongTaiSin',
    wongTaiSin: 'wongTaiSin',

    // Kwai Tsing
    hong_kong_kwai_tsing: 'kwaiTsing',
    kwai_tsing: 'kwaiTsing',
    kwaiTsing: 'kwaiTsing',
    tsing_yi: 'kwaiTsing',

    // Sai Kung
    hong_kong_sai_kung: 'saiKung',
    sai_kung: 'saiKung',
    saiKung: 'saiKung',
    tseung_kwan_o: 'saiKung',

    // Islands
    hong_kong_islands: 'islands',
    islands: 'islands',
    lantau: 'islands',

    // Tsuen Wan
    hong_kong_tsuen_wan: 'tsuenWan',
    tsuen_wan: 'tsuenWan',
    tsuenWan: 'tsuenWan',

    // Sha Tin
    sha_tin_district: 'shaTin',
    sha_tin: 'shaTin',
    shaTin: 'shaTin',
    dest_sha_tin_district: 'shaTin',
    hong_kong_shatin: 'shaTin',

    // Tuen Mun
    hong_kong_tuen_mun: 'tuenMun',
    tuen_mun: 'tuenMun',
    tuenMun: 'tuenMun',

    // Yuen Long
    hong_kong_yuen_long: 'yuenLong',
    yuen_long: 'yuenLong',
    yuenLong: 'yuenLong',

    // North
    hong_kong_north: 'north',
    north: 'north',
    sheung_shui: 'north',
    fanling: 'north',

    // Tai Po
    hong_kong_tai_po: 'taiPo',
    tai_po: 'taiPo',
    taiPo: 'taiPo',
};

export function getDistrictBoundaryKey(idOrName: string): string | undefined {
    if (!idOrName) return undefined;
    const direct = DISTRICT_KEY_MAP[idOrName];
    if (direct) return direct;
    const lower = idOrName.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [k, target] of Object.entries(DISTRICT_KEY_MAP)) {
        if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === lower) {
            return target;
        }
    }
    return undefined;
}

export function getDistrictBoundary(idOrName: string): DistrictBoundary | undefined {
    const key = getDistrictBoundaryKey(idOrName);
    if (!key) return undefined;
    return HONG_KONG_DISTRICT_BOUNDARIES[key];
}
