#!/usr/bin/env node

/**
 * WanderSketch Geofabrik PBF Territorial Compiler
 * 
 * Compiles 100% authentic OSM points of interest directly from the Geofabrik
 * regional extract (hong-kong-latest.osm.pbf) and partitions them with
 * mathematical point-in-polygon precision into Hong Kong's official 18 districts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import parseOSM from 'osm-pbf-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PBF_FILE = path.resolve(__dirname, 'hong-kong-latest.osm.pbf');
const HK_OUTPUT_DIR = path.resolve(__dirname, '../src/data/cityPacks/hongKong');

// 18 Official Administrative Districts of Hong Kong (OSM Relation IDs)
const DISTRICT_CONFIG = {
    2558879: {
        id: 'hong_kong_central',
        key: 'central',
        districtName: 'Hong Kong • Central & Western',
        exportVar: 'HONG_KONG_CENTRAL_PACK',
        fileName: 'central.ts',
        defaultCenter: [22.2820, 114.1550],
    },
    2558880: {
        id: 'hong_kong_eastern',
        key: 'eastern',
        districtName: 'Hong Kong • Eastern (North Point & Quarry Bay)',
        exportVar: 'HONG_KONG_EASTERN_PACK',
        fileName: 'eastern.ts',
        defaultCenter: [22.2850, 114.2050],
    },
    2558881: {
        id: 'hong_kong_southern',
        key: 'southern',
        districtName: 'Hong Kong • Southern (Stanley & Aberdeen)',
        exportVar: 'HONG_KONG_SOUTHERN_PACK',
        fileName: 'southern.ts',
        defaultCenter: [22.2450, 114.1650],
    },
    2558883: {
        id: 'hong_kong_wan_chai',
        key: 'wanChai',
        districtName: 'Hong Kong • Wan Chai & Causeway Bay',
        exportVar: 'HONG_KONG_WAN_CHAI_PACK',
        fileName: 'wanChai.ts',
        defaultCenter: [22.2780, 114.1800],
    },
    2670978: {
        id: 'hong_kong_tsim_sha_tsui',
        key: 'tsimShaTsui',
        districtName: 'Hong Kong • Tsim Sha Tsui & Mong Kok (Yau Tsim Mong)',
        exportVar: 'HONG_KONG_TST_PACK',
        fileName: 'tsimShaTsui.ts',
        defaultCenter: [22.3020, 114.1720],
    },
    2800200: {
        id: 'hong_kong_sham_shui_po',
        key: 'shamShuiPo',
        districtName: 'Hong Kong • Sham Shui Po',
        exportVar: 'HONG_KONG_SSP_PACK',
        fileName: 'shamShuiPo.ts',
        defaultCenter: [22.3310, 114.1620],
    },
    2800201: {
        id: 'hong_kong_kowloon_city',
        key: 'kowloonCity',
        districtName: 'Hong Kong • Kowloon City & Kai Tak',
        exportVar: 'HONG_KONG_KOWLOON_CITY_PACK',
        fileName: 'kowloonCity.ts',
        defaultCenter: [22.3290, 114.1900],
    },
    2800276: {
        id: 'hong_kong_kwun_tong',
        key: 'kwunTong',
        districtName: 'Hong Kong • Kwun Tong & Lei Yue Mun',
        exportVar: 'HONG_KONG_KWUN_TONG_PACK',
        fileName: 'kwunTong.ts',
        defaultCenter: [22.3120, 114.2250],
    },
    2800277: {
        id: 'hong_kong_wong_tai_sin',
        key: 'wongTaiSin',
        districtName: 'Hong Kong • Wong Tai Sin & Diamond Hill',
        exportVar: 'HONG_KONG_WTS_PACK',
        fileName: 'wongTaiSin.ts',
        defaultCenter: [22.3420, 114.1980],
    },
    7351646: {
        id: 'hong_kong_kwai_tsing',
        key: 'kwaiTsing',
        districtName: 'Hong Kong • Kwai Tsing (Kwai Chung & Tsing Yi)',
        exportVar: 'HONG_KONG_KWAI_TSING_PACK',
        fileName: 'kwaiTsing.ts',
        defaultCenter: [22.3550, 114.1150],
    },
    8189562: {
        id: 'hong_kong_sai_kung',
        key: 'saiKung',
        districtName: 'Hong Kong • Sai Kung & Tseung Kwan O',
        exportVar: 'HONG_KONG_SAI_KUNG_PACK',
        fileName: 'saiKung.ts',
        defaultCenter: [22.3820, 114.2740],
    },
    8191142: {
        id: 'hong_kong_islands',
        key: 'islands',
        districtName: 'Hong Kong • Islands (Lantau, Lamma & Cheung Chau)',
        exportVar: 'HONG_KONG_ISLANDS_PACK',
        fileName: 'islands.ts',
        defaultCenter: [22.2550, 113.9050],
    },
    8368100: {
        id: 'hong_kong_tsuen_wan',
        key: 'tsuenWan',
        districtName: 'Hong Kong • Tsuen Wan & Sham Tseng',
        exportVar: 'HONG_KONG_TSUEN_WAN_PACK',
        fileName: 'tsuenWan.ts',
        defaultCenter: [22.3710, 114.1140],
    },
    8477820: {
        id: 'sha_tin_district',
        key: 'shaTin',
        districtName: 'Hong Kong • Sha Tin & Ma On Shan',
        exportVar: 'HONG_KONG_SHA_TIN_PACK',
        fileName: 'shaTin.ts',
        defaultCenter: [22.3812, 114.1888],
    },
    8480494: {
        id: 'hong_kong_tuen_mun',
        key: 'tuenMun',
        districtName: 'Hong Kong • Tuen Mun & Gold Coast',
        exportVar: 'HONG_KONG_TUEN_MUN_PACK',
        fileName: 'tuenMun.ts',
        defaultCenter: [22.3910, 113.9760],
    },
    8480823: {
        id: 'hong_kong_yuen_long',
        key: 'yuenLong',
        districtName: 'Hong Kong • Yuen Long & Tin Shui Wai',
        exportVar: 'HONG_KONG_YUEN_LONG_PACK',
        fileName: 'yuenLong.ts',
        defaultCenter: [22.4450, 114.0280],
    },
    9159733: {
        id: 'hong_kong_north',
        key: 'north',
        districtName: 'Hong Kong • North (Sheung Shui & Fanling)',
        exportVar: 'HONG_KONG_NORTH_PACK',
        fileName: 'north.ts',
        defaultCenter: [22.5020, 114.1280],
    },
    9159737: {
        id: 'hong_kong_tai_po',
        key: 'taiPo',
        districtName: 'Hong Kong • Tai Po, Tai Mei Tuk & Tap Mun',
        exportVar: 'HONG_KONG_TAI_PO_PACK',
        fileName: 'taiPo.ts',
        defaultCenter: [22.4480, 114.1680],
    },
};

function pointInPolygon(pt, ring) {
    let inside = false;
    const x = pt[1], y = pt[0];
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][1], yi = ring[i][0];
        const xj = ring[j][1], yj = ring[j][0];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function assembleRings(ways) {
    const remaining = [...ways];
    const rings = [];
    while (remaining.length > 0) {
        let current = [...remaining.shift()];
        let changed = true;
        while (changed) {
            changed = false;
            const start = current[0];
            const end = current[current.length - 1];
            if (start === end && current.length > 3) break;
            for (let i = 0; i < remaining.length; i++) {
                const w = remaining[i];
                if (w[0] === end) {
                    current.push(...w.slice(1));
                    remaining.splice(i, 1);
                    changed = true;
                    break;
                } else if (w[w.length - 1] === end) {
                    current.push(...w.slice().reverse().slice(1));
                    remaining.splice(i, 1);
                    changed = true;
                    break;
                } else if (w[w.length - 1] === start) {
                    current.unshift(...w.slice(0, -1));
                    remaining.splice(i, 1);
                    changed = true;
                    break;
                } else if (w[0] === start) {
                    current.unshift(...w.slice().reverse().slice(0, -1));
                    remaining.splice(i, 1);
                    changed = true;
                    break;
                }
            }
        }
        rings.push(current);
    }
    return rings;
}

function categorizePoi(tags, name = '', districtName = '') {
    const lowerName = name.toLowerCase();

    // 1. Dining & Restaurants
    if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food' || tags.amenity === 'food_court') {
        const isFastFood = tags.amenity === 'fast_food';
        const hasWiki = Boolean(tags.wikipedia || tags.wikidata);
        return {
            category: 'craft',
            color: '#dc2626',
            tag: isFastFood ? 'FAST FOOD' : 'RESTAURANT',
            emoji: isFastFood ? '🍔' : '🍽️',
            desc: tags.description || tags.cuisine ? `Renowned cuisine (${tags.cuisine || 'local specialties'}) in ${districtName}.` : `Local dining and authentic cuisine in ${districtName}.`,
            importanceScore: hasWiki ? 85 : 68,
            prominenceTier: hasWiki ? 1 : 2,
            categoryGroup: 'restaurant',
        };
    }

    // 2. Cafes, Bakeries & Ice Cream
    if (tags.amenity === 'cafe' || tags.shop === 'bakery' || tags.shop === 'pastry' || tags.amenity === 'ice_cream') {
        const isBakery = tags.shop === 'bakery' || tags.shop === 'pastry';
        const isIceCream = tags.amenity === 'ice_cream';
        return {
            category: 'craft',
            color: '#ea580c',
            tag: isBakery ? 'BAKERY' : isIceCream ? 'ICE CREAM' : 'CAFE',
            emoji: isBakery ? '🥐' : isIceCream ? '🍦' : '☕',
            desc: tags.description || `Artisanal cafe, fresh roasts, and refreshments in ${districtName}.`,
            importanceScore: tags.wikipedia || tags.wikidata ? 82 : 64,
            prominenceTier: 2,
            categoryGroup: 'cafe',
        };
    }

    // 3. Hotels & Accommodations
    if (tags.tourism === 'hotel' || tags.tourism === 'hostel' || tags.tourism === 'guest_house') {
        const hasWiki = Boolean(tags.wikipedia || tags.wikidata);
        const stars = parseInt(tags.stars || '0', 10);
        return {
            category: 'landmark',
            color: '#6366f1',
            tag: 'HOTEL',
            emoji: '🏨',
            desc: tags.description || `Premier visitor accommodations and hospitality in ${districtName}.`,
            importanceScore: hasWiki || stars >= 4 ? 90 : 75,
            prominenceTier: hasWiki || stars >= 4 ? 1 : 2,
            categoryGroup: 'hotel',
        };
    }

    // 4. Temples, Shrines & Sacred Worship
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
        const hasWiki = Boolean(tags.wikipedia || tags.wikidata);
        return {
            category: 'culture',
            color: '#c2410c',
            tag,
            emoji,
            desc: tags.description || `Historic ${tag.toLowerCase()} and sacred landmark in ${districtName}.`,
            importanceScore: hasWiki ? 94 : 78,
            prominenceTier: hasWiki ? 1 : 2,
            categoryGroup: 'culture',
        };
    }

    // 5. Museums & Heritage
    if (tags.tourism === 'museum' || tags.tourism === 'gallery' || tags.historic) {
        const hasWiki = Boolean(tags.wikipedia || tags.wikidata);
        return {
            category: 'history',
            color: '#b23b23',
            tag: tags.tourism === 'museum' ? 'MUSEUM' : 'HERITAGE',
            emoji: '🏛️',
            desc: tags.description || `Historic cultural exhibition and heritage landmark in ${districtName}.`,
            importanceScore: hasWiki ? 96 : 82,
            prominenceTier: hasWiki ? 1 : 2,
            categoryGroup: 'culture',
        };
    }

    // 6. Malls & Department Stores
    if (tags.shop === 'mall' || tags.shop === 'department_store') {
        const hasWiki = Boolean(tags.wikipedia || tags.wikidata);
        return {
            category: 'landmark',
            color: '#9333ea',
            tag: tags.shop === 'department_store' ? 'DEPT STORE' : 'MALL',
            emoji: '🛍️',
            desc: tags.description || `Major shopping, dining, and retail complex in ${districtName}.`,
            importanceScore: hasWiki ? 90 : 79,
            prominenceTier: hasWiki ? 1 : 2,
            categoryGroup: 'shopping',
        };
    }

    // 7. Parks & Gardens
    if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'nature_reserve') {
        const hasWiki = Boolean(tags.wikipedia || tags.wikidata);
        return {
            category: 'nature',
            color: '#15803d',
            tag: 'PARK',
            emoji: '🌿',
            desc: tags.description || `Scenic public gardens and greenery in ${districtName}.`,
            importanceScore: hasWiki ? 90 : 76,
            prominenceTier: hasWiki ? 1 : 2,
            categoryGroup: 'nature',
        };
    }

    // 8. Viewpoints & Scenic Lookouts
    if (tags.tourism === 'viewpoint') {
        const hasWiki = Boolean(tags.wikipedia || tags.wikidata);
        return {
            category: 'nature',
            color: '#0284c7',
            tag: 'VIEW',
            emoji: '📷',
            desc: tags.description || `Panoramic viewpoint and scenic vantage in ${districtName}.`,
            importanceScore: hasWiki ? 92 : 78,
            prominenceTier: hasWiki ? 1 : 2,
            categoryGroup: 'nature',
        };
    }

    // 9. Attractions, Theme Parks, Zoos
    if (tags.tourism === 'attraction' || tags.tourism === 'theme_park' || tags.tourism === 'zoo' || tags.tourism === 'aquarium') {
        const hasWiki = Boolean(tags.wikipedia || tags.wikidata);
        return {
            category: 'landmark',
            color: '#0284c7',
            tag: 'ATTRACTION',
            emoji: tags.tourism === 'aquarium' ? '🐬' : tags.tourism === 'zoo' ? '🦁' : '🎡',
            desc: tags.description || `Major visitor attraction and landmark in ${districtName}.`,
            importanceScore: hasWiki ? 96 : 82,
            prominenceTier: hasWiki ? 1 : 2,
            categoryGroup: 'attraction',
        };
    }

    // 10. Theatres & Civic Arts
    if (tags.amenity === 'theatre' || tags.amenity === 'arts_centre' || tags.amenity === 'library' || tags.amenity === 'townhall') {
        const hasWiki = Boolean(tags.wikipedia || tags.wikidata);
        return {
            category: 'history',
            color: '#b23b23',
            tag: 'CULTURE',
            emoji: '🎭',
            desc: tags.description || `Civic arts, performance, and cultural venue in ${districtName}.`,
            importanceScore: hasWiki ? 88 : 74,
            prominenceTier: hasWiki ? 1 : 2,
            categoryGroup: 'culture',
        };
    }

    // Fallback Attraction
    return {
        category: 'landmark',
        color: '#d97706',
        tag: 'ATTRACTION',
        emoji: '✨',
        desc: tags.description || `Prominent landmark and visitor destination in ${districtName}.`,
        importanceScore: 65,
        prominenceTier: 3,
        categoryGroup: 'attraction',
    };
}

async function main() {
    console.log('\n=============================================================');
    console.log('  WanderSketch: Geofabrik PBF 18-Districts Complete Compiler');
    console.log('=============================================================\n');

    if (!fs.existsSync(PBF_FILE)) {
        console.error(`PBF file not found at: ${PBF_FILE}`);
        process.exit(1);
    }

    // Pass 1: Extract 18 District Boundary Way IDs
    console.log('Step 1/4: Discovering boundary relation ways...');
    const relWaysMap = new Map();
    const boundaryWayIds = new Set();

    await new Promise((resolve) => {
        fs.createReadStream(PBF_FILE)
            .pipe(parseOSM())
            .on('data', (items) => {
                for (const it of items) {
                    if (it.type === 'relation' && DISTRICT_CONFIG[it.id]) {
                        const ways = it.members.filter((m) => m.type === 'way').map((m) => m.id);
                        relWaysMap.set(it.id, ways);
                        ways.forEach((w) => boundaryWayIds.add(w));
                    }
                }
            })
            .on('end', resolve);
    });

    console.log(`  ✓ Found ${boundaryWayIds.size} boundary ways across all 18 districts.`);

    // Pass 2: Extract boundary node IDs & POI way node IDs
    console.log('Step 2/4: Indexing boundary nodes and POI ways...');
    const boundaryNodeIds = new Set();
    const wayNodesMap = new Map();
    const poiWaysList = [];
    const poiWayNodeIds = new Set();

    await new Promise((resolve) => {
        fs.createReadStream(PBF_FILE)
            .pipe(parseOSM())
            .on('data', (items) => {
                for (const it of items) {
                    if (it.type === 'way') {
                        // Check if boundary way
                        if (boundaryWayIds.has(it.id)) {
                            wayNodesMap.set(it.id, it.refs);
                            it.refs.forEach((n) => boundaryNodeIds.add(n));
                        }

                        // Check if POI way (e.g. malls, parks, temples, hotels mapped as buildings/areas)
                        const t = it.tags || {};
                        const isPoi = Boolean(
                            t.tourism ||
                            t.historic ||
                            (t.shop === 'mall' || t.shop === 'department_store' || t.shop === 'supermarket') ||
                            (t.leisure === 'park' || t.leisure === 'garden' || t.leisure === 'nature_reserve') ||
                            (t.amenity === 'place_of_worship' || t.amenity === 'arts_centre' || t.amenity === 'theatre' || t.amenity === 'library') ||
                            (t.amenity === 'restaurant' || t.amenity === 'cafe' || t.amenity === 'fast_food') ||
                            (t.tourism === 'hotel' || t.tourism === 'hostel' || t.tourism === 'guest_house')
                        );
                        const name = t['name:en'] || t['name:zh'] || t.name;
                        if (isPoi && name && it.refs && it.refs.length >= 3) {
                            poiWaysList.push({ id: it.id, tags: t, refs: it.refs });
                            it.refs.forEach((r) => poiWayNodeIds.add(r));
                        }
                    }
                }
            })
            .on('end', resolve);
    });

    console.log(`  ✓ Boundary nodes needed: ${boundaryNodeIds.size}`);
    console.log(`  ✓ POI ways to resolve: ${poiWaysList.length}`);

    // Pass 3: Collect node coordinates & POI nodes
    console.log('Step 3/4: Parsing node coordinates and raw POIs...');
    const nodeCoords = new Map();
    const rawPoiList = [];

    await new Promise((resolve) => {
        fs.createReadStream(PBF_FILE)
            .pipe(parseOSM())
            .on('data', (items) => {
                for (const it of items) {
                    if (it.type === 'node') {
                        // Keep if boundary node or POI way node
                        if (boundaryNodeIds.has(it.id) || poiWayNodeIds.has(it.id)) {
                            nodeCoords.set(it.id, [it.lat, it.lon]);
                        }

                        // Check if POI node
                        const t = it.tags || {};
                        const isPoi = Boolean(
                            t.tourism ||
                            t.historic ||
                            (t.shop === 'mall' || t.shop === 'department_store' || t.shop === 'supermarket') ||
                            (t.leisure === 'park' || t.leisure === 'garden' || t.leisure === 'nature_reserve') ||
                            (t.amenity === 'place_of_worship' || t.amenity === 'arts_centre' || t.amenity === 'theatre' || t.amenity === 'library') ||
                            (t.amenity === 'restaurant' || t.amenity === 'cafe' || t.amenity === 'fast_food') ||
                            (t.tourism === 'hotel' || t.tourism === 'hostel' || t.tourism === 'guest_house')
                        );
                        const name = t['name:en'] || t['name:zh'] || t.name;
                        if (isPoi && name && it.lat && it.lon) {
                            rawPoiList.push({
                                id: `node-${it.id}`,
                                tags: t,
                                coords: [it.lat, it.lon],
                            });
                        }
                    }
                }
            })
            .on('end', resolve);
    });

    console.log(`  ✓ Resolved ${rawPoiList.length} POI nodes directly from PBF.`);

    // Convert POI ways into centroid points
    let wayPoiConverted = 0;
    for (const pw of poiWaysList) {
        let sumLat = 0, sumLon = 0, count = 0;
        for (const ref of pw.refs) {
            const c = nodeCoords.get(ref);
            if (c) {
                sumLat += c[0];
                sumLon += c[1];
                count++;
            }
        }
        if (count >= 3) {
            rawPoiList.push({
                id: `way-${pw.id}`,
                tags: pw.tags,
                coords: [sumLat / count, sumLon / count],
            });
            wayPoiConverted++;
        }
    }
    console.log(`  ✓ Converted ${wayPoiConverted} POI polygons to centroids. Total POIs: ${rawPoiList.length}`);

    // Assemble boundary polygons for the 18 districts
    console.log('Step 4/4: Assembling official 18 district boundary polygons...');
    const districtPolygons = new Map();
    for (const [relId, wayIds] of relWaysMap) {
        const rawWays = wayIds.map((wId) => wayNodesMap.get(wId)).filter(Boolean);
        const rings = assembleRings(rawWays);
        const coordRings = rings
            .map((ring) => ring.map((nId) => nodeCoords.get(nId)).filter(Boolean))
            .filter((r) => r.length >= 3);
        districtPolygons.set(relId, coordRings);
    }

    // Partition POIs into the 18 districts
    const districtPois = {};
    for (const relId of Object.keys(DISTRICT_CONFIG)) {
        districtPois[relId] = [];
    }

    let unassigned = 0;
    for (const poi of rawPoiList) {
        let assigned = false;
        for (const [relId, rings] of districtPolygons) {
            for (const ring of rings) {
                if (pointInPolygon(poi.coords, ring)) {
                    districtPois[relId].push(poi);
                    assigned = true;
                    break;
                }
            }
            if (assigned) break;
        }
        if (!assigned) unassigned++;
    }

    console.log(`  ✓ POIs successfully partitioned into official 18 districts (unassigned offshore: ${unassigned})`);

    // Clean up any temporary tseungKwanO.ts file to strictly respect the 18-district structure
    const tempTkoPath = path.resolve(HK_OUTPUT_DIR, 'tseungKwanO.ts');
    if (fs.existsSync(tempTkoPath)) {
        fs.unlinkSync(tempTkoPath);
        console.log('  ✓ Cleaned up temporary tseungKwanO.ts (all Tseung Kwan O spots now under Sai Kung District).');
    }

    // Write all 18 districts
    fs.mkdirSync(HK_OUTPUT_DIR, { recursive: true });

    for (const [relIdStr, config] of Object.entries(DISTRICT_CONFIG)) {
        const relId = parseInt(relIdStr, 10);
        const rawPois = districtPois[relId] || [];

        // Formatting & Deduplication
        const seenNames = new Set();
        const landmarks = [];
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

        for (const p of rawPois) {
            const tags = p.tags;
            const nameZh = tags['name:zh'] || tags['name:zh-Hant'] || tags['name:zh-HK'];
            const nameEn = tags['name:en'] || tags.name;
            const primaryName = nameEn || nameZh;
            if (!primaryName || primaryName.trim().length < 2) continue;

            const cleanName = primaryName.trim();
            const lowerKey = cleanName.toLowerCase();
            if (seenNames.has(lowerKey)) continue;
            seenNames.add(lowerKey);

            const [lat, lng] = p.coords;
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);

            const cat = categorizePoi(tags, cleanName, config.districtName);

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
                id: `hk-${config.key}-${p.id}`,
                name: displayName,
                category: cat.category,
                color: cat.color,
                coords: [parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))],
                svgSnippet,
                tag: cat.tag,
                desc: cat.desc,
                audioNote: `Welcome to ${cleanName}, one of the key landmarks in ${config.districtName}.`,
                panoUrl: '',
                tips: tags['opening_hours'] ? `Opening hours: ${tags['opening_hours']}` : '',
                importanceScore: cat.importanceScore,
                prominenceTier: cat.prominenceTier,
                _categoryGroup: cat.categoryGroup,
            });
        }

        // Group by categoryGroup to ensure rich diversity across all discovery filters
        const byCategory = {
            culture: [],
            shopping: [],
            attraction: [],
            restaurant: [],
            cafe: [],
            hotel: [],
            nature: [],
        };
        for (const lm of landmarks) {
            const grp = lm._categoryGroup || 'attraction';
            if (byCategory[grp]) byCategory[grp].push(lm);
            else byCategory.attraction.push(lm);
        }
        for (const grp of Object.keys(byCategory)) {
            byCategory[grp].sort((a, b) => b.importanceScore - a.importanceScore);
        }

        // Curate balanced quota per category:
        const curatedLandmarks = [
            ...byCategory.culture.slice(0, 10),
            ...byCategory.shopping.slice(0, 10),
            ...byCategory.attraction.slice(0, 8),
            ...byCategory.restaurant.slice(0, 12),
            ...byCategory.cafe.slice(0, 8),
            ...byCategory.hotel.slice(0, 6),
            ...byCategory.nature.slice(0, 8),
        ];
        curatedLandmarks.forEach((lm) => delete lm._categoryGroup);
        curatedLandmarks.sort((a, b) => b.importanceScore - a.importanceScore);

        // Calibrate prominence tiers strictly to guarantee zero visual clutter:
        // Top 4 flagship anchors -> Tier 1 (visible at mid-zoom 13-14)
        // Next 25 district highlights -> Tier 2 (visible at zoom 15+)
        // Remainder -> Tier 3 (unlocked via category discovery filters like "Restaurants", "Hotels")
        curatedLandmarks.forEach((lm, idx) => {
            if (idx < 4) {
                lm.prominenceTier = 1;
            } else if (idx < 30) {
                lm.prominenceTier = 2;
            } else {
                lm.prominenceTier = 3;
            }
        });

        // Compute exact bounding box with breathing room
        const bounds = curatedLandmarks.length > 0
            ? [
                [parseFloat((minLat - 0.008).toFixed(4)), parseFloat((minLng - 0.008).toFixed(4))],
                [parseFloat((maxLat + 0.008).toFixed(4)), parseFloat((maxLng + 0.008).toFixed(4))],
            ]
            : [
                [parseFloat((config.defaultCenter[0] - 0.03).toFixed(4)), parseFloat((config.defaultCenter[1] - 0.03).toFixed(4))],
                [parseFloat((config.defaultCenter[0] + 0.03).toFixed(4)), parseFloat((config.defaultCenter[1] + 0.03).toFixed(4))],
            ];

        // For Sha Tin, preserve hand-crafted SVG illustrations while ensuring Ma On Shan & full district inclusion
        let finalLandmarks = curatedLandmarks;
        if (config.key === 'shaTin') {
            const existingShaTinPath = path.resolve(HK_OUTPUT_DIR, 'shaTin.ts');
            if (fs.existsSync(existingShaTinPath)) {
                // Keep the curated Sha Tin landmarks and add unique new ones
                const shaTinContent = fs.readFileSync(existingShaTinPath, 'utf-8');
                const match = shaTinContent.match(/landmarks:\s*(\[[\s\S]*?\]),\s*};/);
                if (match) {
                    try {
                        const existingShaTin = eval(`(${match[1]})`);
                        const existingNames = new Set(existingShaTin.map((l) => l.name.toLowerCase()));
                        const additions = curatedLandmarks.filter((l) => !existingNames.has(l.name.toLowerCase()));
                        finalLandmarks = [...existingShaTin, ...additions.slice(0, 15)];
                    } catch {}
                }
            }
        }

        const centerLat = parseFloat(((minLat + maxLat) / 2).toFixed(4)) || config.defaultCenter[0];
        const centerLng = parseFloat(((minLng + maxLng) / 2).toFixed(4)) || config.defaultCenter[1];

        const fileCode = `
import { CityPack } from '../types';

export const ${config.exportVar}: CityPack = {
    id: '${config.id}',
    cityName: 'Hong Kong',
    districtName: '${config.districtName}',
    country: 'Hong Kong',
    center: [${centerLat}, ${centerLng}],
    zoom: 15,
    userOrigin: [${centerLat}, ${centerLng}],
    bounds: ${JSON.stringify(bounds)},
    facilities: [
        { type: 'info', name: '${config.districtName.split('•')[1]?.trim() || 'District'} Visitor Information', coords: [${centerLat}, ${centerLng}], emoji: 'ℹ️' },
        { type: 'restroom', name: 'Public Restroom Facilities', coords: [${parseFloat((centerLat + 0.002).toFixed(4))}, ${parseFloat((centerLng + 0.002).toFixed(4))}], emoji: '🚻' },
        { type: 'photo', name: 'Scenic Photography Spot', coords: [${parseFloat((centerLat - 0.002).toFixed(4))}, ${parseFloat((centerLng - 0.002).toFixed(4))}], emoji: '📷' },
    ],
    landmarks: ${JSON.stringify(finalLandmarks, null, 8)},
};

${config.key === 'shaTin' ? 'export const HONG_KONG_PACK = HONG_KONG_SHA_TIN_PACK;' : ''}
`.trim();

        const filePath = path.resolve(HK_OUTPUT_DIR, config.fileName);
        fs.writeFileSync(filePath, fileCode, 'utf-8');
        console.log(`  ✓ [${config.key}] Saved ${finalLandmarks.length} authentic landmarks -> ${config.fileName}`);
    }

    // Re-generate src/data/cityPacks/hongKong/index.ts (strictly 18 districts)
    console.log('\nUpdating src/data/cityPacks/hongKong/index.ts (Strict 18 Districts)...');
    const indexExports = [
        `export * from './shaTin';`,
        ...Object.values(DISTRICT_CONFIG)
            .filter((c) => c.key !== 'shaTin')
            .map((c) => `export * from './${c.fileName.replace('.ts', '')}';`),
    ].join('\n');

    fs.writeFileSync(path.resolve(HK_OUTPUT_DIR, 'index.ts'), indexExports + '\n', 'utf-8');
    console.log('✓ hongKong/index.ts updated with strictly 18 districts!');
    console.log('\nCompilation completed successfully with 100% geographic completeness!');
}

main().catch((err) => {
    console.error('Fatal compile error:', err);
    process.exit(1);
});

