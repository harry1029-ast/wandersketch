#!/usr/bin/env node

/**
 * WanderSketch City Pack Bulk Extractor
 * 
 * Downloads or converts OpenStreetMap data into WanderSketch CityPack bundles in bulk,
 * eliminating runtime discovery delays and Overpass rate-limiting.
 * 
 * Usage Examples:
 * 
 * 1. Direct Overpass Download by Bounding Box:
 *    node scripts/extractCityPack.mjs --city="Hong Kong" --district="Central" --bbox="22.27,114.14,22.29,114.17"
 * 
 * 2. Ingest from an Overpass Turbo Exported GeoJSON / JSON file:
 *    node scripts/extractCityPack.mjs --file="./my_osm_export.json" --city="Kyoto" --district="Arashiyama"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CLI arguments
const args = process.argv.slice(2);
function getArg(key, fallback = null) {
    const match = args.find((a) => a.startsWith(`--${key}=`));
    if (match) return match.split('=')[1].replace(/^["']|["']$/g, '');
    const idx = args.indexOf(`--${key}`);
    if (idx !== -1 && args[idx + 1]) return args[idx + 1].replace(/^["']|["']$/g, '');
    return fallback;
}

const cityName = getArg('city', 'Hong Kong');
const districtName = getArg('district', 'Central');
const country = getArg('country', cityName === 'Hong Kong' ? 'Hong Kong' : 'Unknown');
const bboxStr = getArg('bbox', null); // "minLat,minLng,maxLat,maxLng"
const inputFile = getArg('file', null);
const outputSlug = getArg('id', `${cityName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${districtName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`);

// Overpass mirrors
const OVERPASS_ENDPOINTS = [
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
];

function buildOverpassQuery(minLat, minLng, maxLat, maxLng) {
    return `
[out:json][timeout:90][maxsize:1073741824];
(
  nwr["tourism"~"museum|gallery|attraction|viewpoint|zoo|theme_park"](${minLat},${minLng},${maxLat},${maxLng});
  nwr["amenity"~"place_of_worship|arts_centre|theatre|townhall|library"](${minLat},${minLng},${maxLat},${maxLng});
  nwr["historic"~"temple|monastery|shrine|monument|memorial|castle|ruins|heritage"](${minLat},${minLng},${maxLat},${maxLng});
  nwr["leisure"~"park|garden|nature_reserve"](${minLat},${minLng},${maxLat},${maxLng});
  nwr["shop"~"mall|department_store"](${minLat},${minLng},${maxLat},${maxLng});
);
out center tags;
`.trim();
}

function categorizeOsmPoi(tags, name = '') {
    const lowerName = name.toLowerCase();

    // 1. Temples, Shrines, Mosques & Sacred Sites
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
            importanceScore: tags.wikipedia || tags.wikidata ? 90 : 80,
            prominenceTier: 1,
        };
    }

    // 2. Museums, Art Galleries & Heritage Sites
    if (tags.tourism === 'museum' || tags.tourism === 'gallery' || tags.historic) {
        return {
            category: 'history',
            color: '#b23b23',
            tag: tags.tourism === 'museum' ? 'MUSEUM' : 'HERITAGE',
            emoji: '🏛️',
            desc: tags.description || `Historic cultural exhibition and heritage landmark in ${districtName}.`,
            importanceScore: tags.wikipedia || tags.wikidata ? 92 : 82,
            prominenceTier: 1,
        };
    }

    // 3. Malls & Major Department Stores
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

    // 4. Parks, Gardens & Nature
    if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'nature_reserve') {
        return {
            category: 'nature',
            color: '#3d7a42',
            tag: 'PARK',
            emoji: '🌿',
            desc: tags.description || `Scenic public gardens and green space in ${districtName}.`,
            importanceScore: 78,
            prominenceTier: 2,
        };
    }

    // 5. Scenic Viewpoints & Overlooks
    if (tags.tourism === 'viewpoint') {
        return {
            category: 'nature',
            color: '#0284c7',
            tag: 'VIEW',
            emoji: '📷',
            desc: tags.description || `Panoramic viewpoint and scenic photo vantage in ${districtName}.`,
            importanceScore: 80,
            prominenceTier: 2,
        };
    }

    // 6. Theatres & Civic Arts
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

    // Fallback Attraction
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
            console.log(`Connecting to Overpass (${endpoint})...`);
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'WanderSketch-BulkExtractor/1.0',
                },
                body: `data=${encodeURIComponent(query)}`,
                signal: AbortSignal.timeout(60000),
            });

            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.elements)) {
                    return data.elements;
                }
            }
        } catch (err) {
            console.warn(`Mirror ${endpoint} timed out or failed:`, err.message);
        }
    }
    throw new Error('All Overpass mirrors failed or timed out.');
}

async function run() {
    console.log(`\n========================================`);
    console.log(`  WanderSketch City Pack Bulk Extractor `);
    console.log(`  Target: ${cityName} (${districtName})`);
    console.log(`========================================\n`);

    let rawElements = [];

    if (inputFile) {
        console.log(`Reading local file: ${inputFile}`);
        const content = fs.readFileSync(path.resolve(inputFile), 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed.elements) {
            rawElements = parsed.elements;
        } else if (parsed.features) {
            // GeoJSON format
            rawElements = parsed.features.map((f) => ({
                id: f.id || Math.floor(Math.random() * 1000000),
                lat: f.geometry?.coordinates?.[1] || 0,
                lon: f.geometry?.coordinates?.[0] || 0,
                tags: f.properties || {},
            }));
        }
    } else if (bboxStr) {
        const parts = bboxStr.split(',').map(parseFloat);
        if (parts.length !== 4 || parts.some(isNaN)) {
            console.error('Invalid --bbox format. Expected: minLat,minLng,maxLat,maxLng');
            process.exit(1);
        }
        const [minLat, minLng, maxLat, maxLng] = parts;
        const query = buildOverpassQuery(minLat, minLng, maxLat, maxLng);
        rawElements = await fetchFromOverpass(query);
    } else {
        console.log('No --bbox or --file specified. Please specify either:');
        console.log('  --bbox="minLat,minLng,maxLat,maxLng"');
        console.log('  --file="./exported_overpass.json"');
        process.exit(1);
    }

    console.log(`Raw OSM elements retrieved: ${rawElements.length}`);

    // Process & Rank POIs
    const landmarks = [];
    const seenNames = new Set();
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

    for (const el of rawElements) {
        const tags = el.tags || {};
        const name = tags['name:en'] || tags.name || tags['name:zh'] || tags['name:ja'];
        if (!name || name.trim().length < 2) continue;

        const cleanName = name.trim();
        const lowerName = cleanName.toLowerCase();
        if (seenNames.has(lowerName)) continue;
        seenNames.add(lowerName);

        const lat = el.lat || el.center?.lat;
        const lng = el.lon || el.center?.lon;
        if (!lat || !lng) continue;

        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);

        const categorized = categorizeOsmPoi(tags, cleanName);

        const svgSnippet = `
<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md">
  <circle cx="50" cy="50" r="34" fill="${categorized.color}" stroke="#2b261b" stroke-width="3"/>
  <text x="50" y="58" font-size="22" text-anchor="middle">${categorized.emoji}</text>
</svg>
`.trim();

        landmarks.push({
            id: `osm-${el.id}`,
            name: tags['name:zh'] && tags['name:en'] && tags['name:en'] !== tags['name:zh']
                ? `${tags['name:en']} (${tags['name:zh']})`
                : cleanName,
            category: categorized.category,
            color: categorized.color,
            coords: [parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))],
            svgSnippet,
            tag: categorized.tag,
            desc: categorized.desc,
            audioNote: `Welcome to ${cleanName}, one of the celebrated landmarks of ${districtName}.`,
            panoUrl: '',
            tips: tags['opening_hours'] ? `Opening hours: ${tags['opening_hours']}` : '',
            importanceScore: categorized.importanceScore,
            prominenceTier: categorized.prominenceTier,
        });
    }

    // Sort by importance descending
    landmarks.sort((a, b) => b.importanceScore - a.importanceScore);

    console.log(`Processed curated landmarks: ${landmarks.length}`);

    const centerLat = landmarks.length > 0 ? (minLat + maxLat) / 2 : 0;
    const centerLng = landmarks.length > 0 ? (minLng + maxLng) / 2 : 0;

    const packCode = `
import { CityPack } from '../types';

export const ${outputSlug.toUpperCase()}_PACK: CityPack = {
    id: '${outputSlug}',
    cityName: '${cityName}',
    districtName: '${districtName}',
    country: '${country}',
    center: [${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}],
    zoom: 15,
    userOrigin: [${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}],
    bounds: [
        [${(minLat - 0.01).toFixed(4)}, ${(minLng - 0.01).toFixed(4)}],
        [${(maxLat + 0.01).toFixed(4)}, ${(maxLng + 0.01).toFixed(4)}],
    ],
    facilities: [
        { type: 'info', name: '${districtName} Visitor Center', coords: [${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}], emoji: 'ℹ️' },
        { type: 'restroom', name: 'Public Restroom (${districtName})', coords: [${(centerLat + 0.002).toFixed(4)}, ${(centerLng + 0.002).toFixed(4)}], emoji: '🚻' },
        { type: 'photo', name: '${districtName} Scenic Lookout', coords: [${(centerLat - 0.002).toFixed(4)}, ${(centerLng - 0.002).toFixed(4)}], emoji: '📷' },
    ],
    landmarks: ${JSON.stringify(landmarks, null, 8)},
};
`.trim();

    const cityFolder = cityName.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const districtFile = districtName.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const outDir = path.resolve(__dirname, `../src/data/cityPacks/${cityFolder}`);
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.resolve(outDir, `${districtFile}.ts`);

    fs.writeFileSync(outPath, packCode, 'utf-8');
    console.log(`\n🎉 Success! Generated City Pack file at:\n   ${outPath}`);
    console.log(`\nRegistered ${landmarks.length} landmarks with 0ms in-memory latency.`);
}

run().catch((err) => {
    console.error('Extraction error:', err);
    process.exit(1);
});

