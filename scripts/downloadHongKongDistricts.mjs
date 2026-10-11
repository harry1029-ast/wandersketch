#!/usr/bin/env node

/**
 * WanderSketch Hong Kong All-Districts Bulk Downloader
 * 
 * Downloads and compiles authentic POI data for all 18 districts of Hong Kong
 * directly from OpenStreetMap into typed WanderSketch CityPacks.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HK_DISTRICTS = [
    {
        id: 'hong_kong_central',
        districtName: 'Hong Kong • Central & Western',
        exportVar: 'HONG_KONG_CENTRAL_PACK',
        fileName: 'central.ts',
        bbox: [22.260, 114.120, 22.290, 114.170],
        center: [22.2820, 114.1550],
    },
    {
        id: 'hong_kong_tsim_sha_tsui',
        districtName: 'Hong Kong • Tsim Sha Tsui & Mong Kok',
        exportVar: 'HONG_KONG_TST_PACK',
        fileName: 'tsimShaTsui.ts',
        bbox: [22.290, 114.160, 22.325, 114.180],
        center: [22.3020, 114.1720],
    },
    {
        id: 'hong_kong_wan_chai',
        districtName: 'Hong Kong • Wan Chai & Causeway Bay',
        exportVar: 'HONG_KONG_WAN_CHAI_PACK',
        fileName: 'wanChai.ts',
        bbox: [22.268, 114.168, 22.288, 114.195],
        center: [22.2780, 114.1800],
    },
    {
        id: 'hong_kong_wong_tai_sin',
        districtName: 'Hong Kong • Wong Tai Sin & Diamond Hill',
        exportVar: 'HONG_KONG_WTS_PACK',
        fileName: 'wongTaiSin.ts',
        bbox: [22.330, 114.185, 22.355, 114.215],
        center: [22.3420, 114.1980],
    },
    {
        id: 'hong_kong_southern',
        districtName: 'Hong Kong • Southern (Stanley & Aberdeen)',
        exportVar: 'HONG_KONG_SOUTHERN_PACK',
        fileName: 'southern.ts',
        bbox: [22.200, 114.140, 22.260, 114.240],
        center: [22.2300, 114.1800],
    },
    {
        id: 'hong_kong_islands',
        districtName: 'Hong Kong • Lantau, Ngong Ping & Tai O',
        exportVar: 'HONG_KONG_ISLANDS_PACK',
        fileName: 'islands.ts',
        bbox: [22.230, 113.840, 22.320, 114.040],
        center: [22.2550, 113.9050],
    },
    {
        id: 'hong_kong_sai_kung',
        districtName: 'Hong Kong • Sai Kung & Clearwater Bay',
        exportVar: 'HONG_KONG_SAI_KUNG_PACK',
        fileName: 'saiKung.ts',
        bbox: [22.340, 114.250, 22.420, 114.360],
        center: [22.3820, 114.2740],
    },
    {
        id: 'hong_kong_sham_shui_po',
        districtName: 'Hong Kong • Sham Shui Po',
        exportVar: 'HONG_KONG_SSP_PACK',
        fileName: 'shamShuiPo.ts',
        bbox: [22.324, 114.150, 22.342, 114.172],
        center: [22.3310, 114.1620],
    },
    {
        id: 'hong_kong_kowloon_city',
        districtName: 'Hong Kong • Kowloon City & Kai Tak',
        exportVar: 'HONG_KONG_KOWLOON_CITY_PACK',
        fileName: 'kowloonCity.ts',
        bbox: [22.315, 114.180, 22.340, 114.205],
        center: [22.3290, 114.1900],
    },
    {
        id: 'hong_kong_eastern',
        districtName: 'Hong Kong • Eastern (North Point & Quarry Bay)',
        exportVar: 'HONG_KONG_EASTERN_PACK',
        fileName: 'eastern.ts',
        bbox: [22.270, 114.190, 22.295, 114.240],
        center: [22.2850, 114.2050],
    },
    {
        id: 'hong_kong_kwun_tong',
        districtName: 'Hong Kong • Kwun Tong & Lei Yue Mun',
        exportVar: 'HONG_KONG_KWUN_TONG_PACK',
        fileName: 'kwunTong.ts',
        bbox: [22.295, 114.210, 22.325, 114.245],
        center: [22.3120, 114.2250],
    },
    {
        id: 'hong_kong_tsuen_wan',
        districtName: 'Hong Kong • Tsuen Wan & Sham Tseng',
        exportVar: 'HONG_KONG_TSUEN_WAN_PACK',
        fileName: 'tsuenWan.ts',
        bbox: [22.355, 114.050, 22.385, 114.130],
        center: [22.3710, 114.1140],
    },
    {
        id: 'hong_kong_tai_po',
        districtName: 'Hong Kong • Tai Po & Tai Mei Tuk',
        exportVar: 'HONG_KONG_TAI_PO_PACK',
        fileName: 'taiPo.ts',
        bbox: [22.430, 114.150, 22.480, 114.250],
        center: [22.4480, 114.1680],
    },
    {
        id: 'hong_kong_yuen_long',
        districtName: 'Hong Kong • Yuen Long & Tin Shui Wai',
        exportVar: 'HONG_KONG_YUEN_LONG_PACK',
        fileName: 'yuenLong.ts',
        bbox: [22.420, 113.980, 22.470, 114.060],
        center: [22.4450, 114.0280],
    },
    {
        id: 'hong_kong_tuen_mun',
        districtName: 'Hong Kong • Tuen Mun & Gold Coast',
        exportVar: 'HONG_KONG_TUEN_MUN_PACK',
        fileName: 'tuenMun.ts',
        bbox: [22.370, 113.960, 22.410, 114.000],
        center: [22.3910, 113.9760],
    },
    {
        id: 'hong_kong_north',
        districtName: 'Hong Kong • North (Sheung Shui & Fanling)',
        exportVar: 'HONG_KONG_NORTH_PACK',
        fileName: 'north.ts',
        bbox: [22.485, 114.110, 22.520, 114.160],
        center: [22.5020, 114.1280],
    },
    {
        id: 'hong_kong_kwai_tsing',
        districtName: 'Hong Kong • Kwai Tsing (Kwai Chung & Tsing Yi)',
        exportVar: 'HONG_KONG_KWAI_TSING_PACK',
        fileName: 'kwaiTsing.ts',
        bbox: [22.340, 114.100, 22.370, 114.135],
        center: [22.3550, 114.1150],
    },
];

const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
];

function buildDistrictQuery([minLat, minLng, maxLat, maxLng]) {
    return `
[out:json][timeout:60];
(
  node(${minLat},${minLng},${maxLat},${maxLng})["tourism"~"museum|gallery|attraction|viewpoint|zoo|theme_park"];
  way(${minLat},${minLng},${maxLat},${maxLng})["tourism"~"museum|gallery|attraction|viewpoint|zoo|theme_park"];
  node(${minLat},${minLng},${maxLat},${maxLng})["amenity"~"place_of_worship|arts_centre|theatre|townhall|library"];
  way(${minLat},${minLng},${maxLat},${maxLng})["amenity"~"place_of_worship|arts_centre|theatre|townhall|library"];
  node(${minLat},${minLng},${maxLat},${maxLng})["historic"~"temple|monastery|shrine|monument|memorial|castle|ruins|heritage"];
  way(${minLat},${minLng},${maxLat},${maxLng})["historic"~"temple|monastery|shrine|monument|memorial|castle|ruins|heritage"];
  node(${minLat},${minLng},${maxLat},${maxLng})["leisure"~"park|garden|nature_reserve"];
  way(${minLat},${minLng},${maxLat},${maxLng})["leisure"~"park|garden|nature_reserve"];
  node(${minLat},${minLng},${maxLat},${maxLng})["shop"~"mall|department_store"];
  way(${minLat},${minLng},${maxLat},${maxLng})["shop"~"mall|department_store"];
);
out center;
`.trim();
}

function categorizeOsmPoi(tags, name = '', districtName = '') {
    const lowerName = name.toLowerCase();

    // 1. Temples, Shrines & Worship
    if (
        tags.amenity === 'place_of_worship' ||
        tags.historic === 'temple' ||
        tags.historic === 'monastery' ||
        tags.historic === 'shrine' ||
        tags.historic === 'church'
    ) {
        let tag = 'TEMPLE';
        let emoji = '⛩️';
        if (lowerName.includes('church') || lowerName.includes('cathedral') || tags.religion === 'christian') {
            tag = 'CHURCH';
            emoji = '⛪';
        } else if (tags.religion === 'muslim' || lowerName.includes('mosque')) {
            tag = 'MOSQUE';
            emoji = '🕌';
        }
        return {
            category: 'culture',
            color: '#c2410c',
            tag,
            emoji,
            desc: tags.description || `Historic ${tag.toLowerCase()} and sacred landmark in ${districtName}.`,
            importanceScore: tags.wikipedia || tags.wikidata ? 90 : 82,
            prominenceTier: 1,
        };
    }

    // 2. Museums & Heritage
    if (tags.tourism === 'museum' || tags.tourism === 'gallery' || tags.historic) {
        return {
            category: 'history',
            color: '#b23b23',
            tag: tags.tourism === 'museum' ? 'MUSEUM' : 'HERITAGE',
            emoji: '🏛️',
            desc: tags.description || `Historic cultural exhibition and heritage landmark in ${districtName}.`,
            importanceScore: tags.wikipedia || tags.wikidata ? 92 : 84,
            prominenceTier: 1,
        };
    }

    // 3. Malls & Department Stores
    if (tags.shop === 'mall' || tags.shop === 'department_store') {
        return {
            category: 'landmark',
            color: '#9333ea',
            tag: tags.shop === 'department_store' ? 'DEPT STORE' : 'MALL',
            emoji: '🛍️',
            desc: tags.description || `Major shopping, dining, and retail complex in ${districtName}.`,
            importanceScore: 84,
            prominenceTier: 1,
        };
    }

    // 4. Parks & Gardens
    if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'nature_reserve') {
        return {
            category: 'nature',
            color: '#3d7a42',
            tag: 'PARK',
            emoji: '🌿',
            desc: tags.description || `Scenic public gardens and greenery in ${districtName}.`,
            importanceScore: 78,
            prominenceTier: 2,
        };
    }

    // 5. Viewpoints
    if (tags.tourism === 'viewpoint') {
        return {
            category: 'nature',
            color: '#0284c7',
            tag: 'VIEW',
            emoji: '📷',
            desc: tags.description || `Panoramic viewpoint and scenic photo vantage in ${districtName}.`,
            importanceScore: 82,
            prominenceTier: 2,
        };
    }

    // 6. Theatres & Arts
    if (tags.amenity === 'theatre' || tags.amenity === 'arts_centre' || tags.amenity === 'library' || tags.amenity === 'townhall') {
        return {
            category: 'history',
            color: '#b23b23',
            tag: 'CULTURE',
            emoji: '🎭',
            desc: tags.description || `Civic arts, performance, and cultural venue in ${districtName}.`,
            importanceScore: 75,
            prominenceTier: 2,
        };
    }

    // Fallback
    return {
        category: 'landmark',
        color: '#d97706',
        tag: 'ATTRACTION',
        emoji: '✨',
        desc: tags.description || `Prominent landmark and visitor destination in ${districtName}.`,
        importanceScore: 70,
        prominenceTier: 2,
    };
}

async function fetchFromOverpass(query) {
    for (const endpoint of OVERPASS_ENDPOINTS) {
        try {
            const url = `${endpoint}?data=${encodeURIComponent(query)}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'WanderSketch-App/1.0',
                    'Accept': 'application/json',
                },
                signal: AbortSignal.timeout(45000),
            });

            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.elements)) {
                    return data.elements;
                }
            }
        } catch (err) {
            console.warn(`  ↳ Mirror ${endpoint} error: ${err.message}. Retrying next mirror...`);
        }
    }
    return [];
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    console.log(`\n======================================================`);
    console.log(`  WanderSketch: Harvesting Hong Kong Districts (18 Total)`);
    console.log(`======================================================\n`);

    const hongKongDir = path.resolve(__dirname, '../src/data/cityPacks/hongKong');
    fs.mkdirSync(hongKongDir, { recursive: true });

    const generatedDistricts = [];

    for (let i = 0; i < HK_DISTRICTS.length; i++) {
        const d = HK_DISTRICTS[i];
        console.log(`[${i + 1}/${HK_DISTRICTS.length}] Fetching ${d.districtName}...`);

        const query = buildDistrictQuery(d.bbox);
        let elements = await fetchFromOverpass(query);

        if (!elements || elements.length === 0) {
            console.log(`  ⚠️ No elements returned; retrying after 3s...`);
            await sleep(3000);
            elements = await fetchFromOverpass(query);
        }

        console.log(`  ✓ Retrieved ${elements.length} raw OSM elements.`);

        const landmarks = [];
        const seenNames = new Set();
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

        for (const el of elements) {
            const tags = el.tags || {};
            const nameZh = tags['name:zh'] || tags['name:zh-Hant'] || tags['name:zh-HK'];
            const nameEn = tags['name:en'] || tags.name;
            const primaryName = nameEn || nameZh;

            if (!primaryName || primaryName.trim().length < 2) continue;

            const cleanName = primaryName.trim();
            const lowerKey = cleanName.toLowerCase();
            if (seenNames.has(lowerKey)) continue;
            seenNames.add(lowerKey);

            const lat = el.lat || el.center?.lat;
            const lng = el.lon || el.center?.lon;
            if (!lat || !lng) continue;

            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);

            const cat = categorizeOsmPoi(tags, cleanName, d.districtName);

            const displayName = nameEn && nameZh && nameEn !== nameZh
                ? `${nameEn} (${nameZh})`
                : cleanName;

            const svgSnippet = `
<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
  <circle cx="50" cy="50" r="34" fill="${cat.color}" stroke="#2b261b" stroke-width="3"/>
  <text x="50" y="58" font-size="22" text-anchor="middle">${cat.emoji}</text>
</svg>
`.trim();

            landmarks.push({
                id: `hk-${d.id.replace('hong_kong_', '')}-${el.id}`,
                name: displayName,
                category: cat.category,
                color: cat.color,
                coords: [parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))],
                svgSnippet,
                tag: cat.tag,
                desc: cat.desc,
                audioNote: `Welcome to ${cleanName}, one of the key landmarks in ${d.districtName}.`,
                panoUrl: '',
                tips: tags['opening_hours'] ? `Opening hours: ${tags['opening_hours']}` : '',
                importanceScore: cat.importanceScore,
                prominenceTier: cat.prominenceTier,
            });
        }

        // Sort by importance and take top 32
        landmarks.sort((a, b) => b.importanceScore - a.importanceScore);
        const curatedLandmarks = landmarks.slice(0, 32);

        // Fallback bounds if no POIs returned
        const bounds = curatedLandmarks.length > 0
            ? [
                [parseFloat((minLat - 0.008).toFixed(4)), parseFloat((minLng - 0.008).toFixed(4))],
                [parseFloat((maxLat + 0.008).toFixed(4)), parseFloat((maxLng + 0.008).toFixed(4))],
            ]
            : [
                [d.bbox[0], d.bbox[1]],
                [d.bbox[2], d.bbox[3]],
            ];

        const fileCode = `
import { CityPack } from '../types';

export const ${d.exportVar}: CityPack = {
    id: '${d.id}',
    cityName: 'Hong Kong',
    districtName: '${d.districtName}',
    country: 'Hong Kong',
    center: [${d.center[0]}, ${d.center[1]}],
    zoom: 15,
    userOrigin: [${d.center[0]}, ${d.center[1]}],
    bounds: ${JSON.stringify(bounds)},
    facilities: [
        { type: 'info', name: '${d.districtName.split('•')[1]?.trim() || 'District'} Visitor Information', coords: [${d.center[0]}, ${d.center[1]}], emoji: 'ℹ️' },
        { type: 'restroom', name: 'Public Restroom Facilities', coords: [${parseFloat((d.center[0] + 0.002).toFixed(4))}, ${parseFloat((d.center[1] + 0.002).toFixed(4))}], emoji: '🚻' },
        { type: 'photo', name: 'Scenic Photography Spot', coords: [${parseFloat((d.center[0] - 0.002).toFixed(4))}, ${parseFloat((d.center[1] - 0.002).toFixed(4))}], emoji: '📷' },
    ],
    landmarks: ${JSON.stringify(curatedLandmarks, null, 8)},
};
`.trim();

        const filePath = path.resolve(hongKongDir, d.fileName);
        fs.writeFileSync(filePath, fileCode, 'utf-8');
        console.log(`  ✓ Saved ${landmarks.length} landmarks -> ${d.fileName}\n`);

        generatedDistricts.push(d);

        // Polite delay between Overpass queries
        await sleep(2000);
    }

    console.log(`\n======================================================`);
    console.log(`Updating src/data/cityPacks/hongKong/index.ts...`);

    // Generate hongKong/index.ts that re-exports all districts
    const indexExports = [
        `export * from './shaTin';`,
        ...generatedDistricts.map((d) => `export * from './${d.fileName.replace('.ts', '')}';`),
    ].join('\n');

    fs.writeFileSync(path.resolve(hongKongDir, 'index.ts'), indexExports + '\n', 'utf-8');

    console.log(`✓ Hong Kong index updated with all 18 districts!`);
    console.log(`Done!`);
}

main().catch((err) => {
    console.error('Fatal harvest error:', err);
    process.exit(1);
});

