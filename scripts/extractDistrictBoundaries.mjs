#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import parseOSM from 'osm-pbf-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PBF_FILE = path.resolve(__dirname, 'hong-kong-latest.osm.pbf');
const OUT_FILE = path.resolve(__dirname, '../src/data/hongKongDistrictBoundaries.json');

const DISTRICT_CONFIG = {
    2558879: { key: 'central', name: 'Central & Western' },
    2558880: { key: 'eastern', name: 'Eastern' },
    2558881: { key: 'southern', name: 'Southern' },
    2558883: { key: 'wanChai', name: 'Wan Chai' },
    2670978: { key: 'tsimShaTsui', name: 'Yau Tsim Mong' },
    2800200: { key: 'shamShuiPo', name: 'Sham Shui Po' },
    2800201: { key: 'kowloonCity', name: 'Kowloon City' },
    2800276: { key: 'kwunTong', name: 'Kwun Tong' },
    2800277: { key: 'wongTaiSin', name: 'Wong Tai Sin' },
    7351646: { key: 'kwaiTsing', name: 'Kwai Tsing' },
    8189562: { key: 'saiKung', name: 'Sai Kung' },
    8191142: { key: 'islands', name: 'Islands' },
    8368100: { key: 'tsuenWan', name: 'Tsuen Wan' },
    8477820: { key: 'shaTin', name: 'Sha Tin' },
    8480494: { key: 'tuenMun', name: 'Tuen Mun' },
    8480823: { key: 'yuenLong', name: 'Yuen Long' },
    9159733: { key: 'north', name: 'North' },
    9159737: { key: 'taiPo', name: 'Tai Po' },
};

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

// Simple Ramer-Douglas-Peucker simplification for performance
function getSqDist(p1, p2) {
    const dx = p1[0] - p2[0], dy = p1[1] - p2[1];
    return dx * dx + dy * dy;
}

function getSqSegDist(p, p1, p2) {
    let x = p1[0], y = p1[1], dx = p2[0] - x, dy = p2[1] - y;
    if (dx !== 0 || dy !== 0) {
        const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
            x = p2[0];
            y = p2[1];
        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }
    dx = p[0] - x;
    dy = p[1] - y;
    return dx * dx + dy * dy;
}

function simplifyDPStep(points, first, last, sqTolerance, simplified) {
    let maxSqDist = sqTolerance;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
        const sqDist = getSqSegDist(points[i], points[first], points[last]);
        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }
    if (maxSqDist > sqTolerance) {
        if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
        simplified.push(points[index]);
        if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
}

function simplifyPoints(points, tolerance = 0.0001) {
    if (points.length <= 4) return points;
    const sqTolerance = tolerance * tolerance;
    const last = points.length - 1;
    const simplified = [points[0]];
    simplifyDPStep(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last]);
    return simplified;
}

async function main() {
    console.log('Pass 1: Discovering boundary relation ways...');
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

    console.log(`Found ${boundaryWayIds.size} boundary ways.`);

    console.log('Pass 2: Indexing boundary nodes...');
    const boundaryNodeIds = new Set();
    const wayNodesMap = new Map();

    await new Promise((resolve) => {
        fs.createReadStream(PBF_FILE)
            .pipe(parseOSM())
            .on('data', (items) => {
                for (const it of items) {
                    if (it.type === 'way' && boundaryWayIds.has(it.id)) {
                        wayNodesMap.set(it.id, it.refs);
                        it.refs.forEach((n) => boundaryNodeIds.add(n));
                    }
                }
            })
            .on('end', resolve);
    });

    console.log(`Found ${boundaryNodeIds.size} boundary nodes.`);

    console.log('Pass 3: Reading node coordinates...');
    const nodeCoords = new Map();

    await new Promise((resolve) => {
        fs.createReadStream(PBF_FILE)
            .pipe(parseOSM())
            .on('data', (items) => {
                for (const it of items) {
                    if (it.type === 'node' && boundaryNodeIds.has(it.id)) {
                        // GeoJSON uses [lng, lat] while Leaflet latLng uses [lat, lng]
                        // We store [lat, lng] rounded to 5 decimal places (~1.1 meter accuracy)
                        nodeCoords.set(it.id, [
                            Math.round(it.lat * 100000) / 100000,
                            Math.round(it.lon * 100000) / 100000,
                        ]);
                    }
                }
            })
            .on('end', resolve);
    });

    console.log('Pass 4: Assembling and simplifying rings...');
    const geoJsonFeatures = [];
    const districtBoundaries = {};

    for (const [relId, config] of Object.entries(DISTRICT_CONFIG)) {
        const wayIds = relWaysMap.get(Number(relId)) || [];
        const rawWays = wayIds.map((wId) => wayNodesMap.get(wId)).filter(Boolean);
        const rings = assembleRings(rawWays);
        const coordRings = rings
            .map((ring) => ring.map((nId) => nodeCoords.get(nId)).filter(Boolean))
            .filter((r) => r.length >= 3)
            .map((r) => simplifyPoints(r, 0.00015)); // ~15m tolerance for ultra fast rendering

        districtBoundaries[config.key] = {
            id: relId,
            key: config.key,
            name: config.name,
            // rings as [ [ [lat, lng], ... ] ]
            rings: coordRings,
        };

        console.log(`  ✓ ${config.name} (${config.key}): ${coordRings.length} rings`);
    }

    fs.writeFileSync(OUT_FILE, JSON.stringify(districtBoundaries, null, 2));
    console.log(`\nSuccessfully exported to ${OUT_FILE}`);
}

main().catch(console.error);
