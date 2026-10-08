<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# WanderSketch — Architectural Context & System Status

## 1. Project Overview & Aesthetic Intent
- **Product**: WanderSketch is an interactive, illustrated travel itinerary web application that transforms standard checklists into narrative hand-drawn journeys (手绘地图) and shareable travel artifacts.
- **Language**: English interface only.
- **Primary Views**:
  - `PlannerView`: Waypoint sequence curation, stop reordering, theme routing, and place discovery.
  - `PlansLibraryView`: Card gallery of saved itineraries with mini badge previews and 1-click modal launches.
  - `ScenicGuideView`: Interactive cartographic canvas featuring dynamic illustrated routes, simulated cruise narration, live outdoor GPS tracking, and an amenities drawer.

## 2. Complete Technology Stack
- **Framework**: Next.js 15 (App Router, Turbopack), React 19, TypeScript.
- **Styling**: Tailwind CSS v3.4 (DO NOT upgrade to Tailwind v4; rely on custom extended tokens in `tailwind.config.ts` such as `paper-50`..`paper-900`, `watercolor-brick`, `bg-rice-paper`, `shadow-stamp`, `shadow-float`).
- **Icons & Sounds**: `@phosphor-icons/react`, custom Web Audio API oscillator chimes (`src/lib/audio.ts`).
- **State Architecture**: Zustand (`src/store/useItineraryStore.ts`) with optimistic UI updates and live Supabase persistence.
- **Cartography & Dynamic Rendering**:
  - Leaflet (`v1.9.4`) with dynamic client boundaries (`ssr: false`).
  - Esri World Topo base map styled with a custom CSS sepia watercolor parchment shader (`.hand-drawn-tile-filter`).
  - Rough.js (`v4.6.6`): Procedural, wobbly hand-penciled lines, sand foundation underlays, and milestone pins overlaid across live Leaflet coordinates via custom SVG pane layers.
- **Routing Engine**: OSRM (Open Source Routing Machine) Foot Profile (`src/lib/routing.ts`), unwrapping real sidewalk geometries and distance/time metrics with client-side Haversine fallback.
- **Spatial Backend & Database**:
  - Hosted Supabase PostgreSQL instance with PostGIS (`extensions.geometry(Point, 4326)`).
  - PostGIS Spatial Queries & RPC: `get_landmarks_nearby`, `get_spots_in_envelope`, and `create_custom_spot`.

## 3. What Has Been Completed & Functioning (Phases 1 – 3)

### Core Shell & Visual Foundation (Phase 1)
- Structured full-stack Next.js tree with clear domain types (`Landmark`, `ScenicZone`, `ScenicFacility`, `TravelPlan` in `src/types/itinerary.ts`).
- Normalized store in `useItineraryStore.ts` tracking active plans, stage switches (`planner` | `plans` | `map`), and planner buffers.
- Self-contained miniature island modal (`ContainedIslandModal.tsx`) using Rough.js procedural geometry.

### Smart Navigation & Client-Side Guidance (Phase 2)
- Real pedestrian sidewalk routing via OSRM integrated into `LeafletBaseMap.tsx`.
- Timed walking cruise tour with automated pan-to steps, chime alerts, and Web Speech API docent commentary (`window.speechSynthesis`).
- Native W3C Geolocation tracker (`src/lib/useGeolocationTracker.ts` via `navigator.geolocation.watchPosition`):
  - Heading orientation (directional arrow marker ▲) and dynamic accuracy halo (`L.circle`).
  - 0.5-meter jitter guard to eliminate unnecessary React re-renders.
  - 35-meter Haversine proximity-triggered audio commentary with one-shot ref guards.
- Scrapbook Postcard Modal (`html-to-image`) rendering 2x retina travel cards with vintage airmail stamps.

### Spatial Backend & Persistence (Phase 3)
- **Supabase & PostGIS Infrastructure**:
  - Database tables: `destinations`, `landmarks`, `facilities`, `travel_plans`, and `custom_spots`.
  - GiST spatial indices configured for location fields.
  - Custom RPC `create_custom_spot` handling binary Point geometry transformations (`ST_SetSRID(ST_MakePoint(lng, lat), 4326)`).
- **Zustand ➔ Supabase Repository Bridge (`src/lib/repositories.ts`)**:
  - Hydrates live destinations, travel plans, and custom spots on application boot via `initializeFromDatabase()`.
  - Saves new itineraries created in the planner directly into PostgreSQL.
  - Plan CRUD operations: Real-time title editing (synced via `PATCH`/`UPDATE`) and permanent deletion (via HTTP 204 `DELETE`).
- **Real-Time Place Search & Geocoding**:
  - Server-side route handler `/api/geocode` proxying OpenStreetMap Nominatim with district boundary bias (`&viewbox=`).
  - Frontend autocomplete dropdown (`SpotSearchAutocomplete.tsx`) in `PlannerView.tsx`.
  - Adding a spot pins genuine geographic coordinates, recalculates OSRM walking paths, and saves the custom spot into PostGIS.
- **Dynamic Viewport Bounding Queries (`ST_MakeEnvelope`)**:
  - Leaflet `moveend` emits visible coordinates (`minLat`, `minLng`, `maxLat`, `maxLng`) through `onBoundsChange`.
  - Debounced RPC calls to `get_spots_in_envelope` retrieve all landmarks and user spots inside the current view.
  - Distinct badge rendering: Planned stops are numbered (`1, 2, 3..`) and connected by OSRM dashed walking trails, while ambient discovered spots display a gold sparkle badge (`✨`) without pulling the route line.
  - Saved custom spots hydrate from the database across page refreshes into each zone's `landmarksPool`.

## 4. Key Directory & Code Map
```text
src/
├── app/
│   ├── api/geocode/route.ts       # Nominatim proxy endpoint
│   ├── globals.css                # Rice-paper backgrounds & parchment filters
│   └── page.tsx                   # View router & DB hydration trigger
├── components/
│   ├── Header.tsx                 # Navigation bar & quick stage actions
│   ├── PlannerView.tsx            # Sequence reordering & Nominatim search
│   ├── PlansLibraryView.tsx       # Itinerary cards, rename, & delete triggers
│   ├── SpotSearchAutocomplete.tsx # Place search input component
│   ├── Modals/                    # Postcard, Island, & Landmark detail cards
│   └── ScenicGuideView/
│       ├── index.tsx              # Bounds coordination, GPS, & drawer layout
│       ├── GuideDrawer.tsx        # Amenities, theme routes, & cruise controls
│       └── LeafletBaseMap.tsx     # Leaflet canvas, Rough.js paths, & pin markers
├── lib/
│   ├── audio.ts                   # Tone synthesis & narrator speech
│   ├── mockData.ts                # Default seed zones (Toronto, Kyoto, Paris)
│   ├── repositories.ts            # Supabase database & PostGIS RPC methods
│   ├── routing.ts                 # OSRM pedestrian route calculations
│   ├── supabaseClient.ts          # Public Supabase client instance
│   └── useGeolocationTracker.ts   # Device GPS hook with 35m proximity audio
└── store/
    └── useItineraryStore.ts       # Centralized state management & DB synchronization
```

## 5. Phase 4.1: Dynamic Inpainting & Illustrated Island View

### Feature Concept
Transform the itinerary display into a multi-tiered illustrated journey:
1. **Dynamic Inpainting Bounding Mask (Macro View)**:
   - Calculate the geographic centroid and bounding circle / convex hull encompassing all active itinerary stops (with ~35% breathing margin).
   - In `LeafletBaseMap.tsx`, render this bounding zone as an SVG clip-path mask.
   - **Inside the circle**: High-saturation, warm illustrated watercolor layer with an organic Rough.js hand-drawn ring along the boundary.
   - **Outside the circle**: Standard muted sepia parchment base map.
   - Display a floating trigger badge on the perimeter: *"✨ Enter Island View"*.

2. **Detached Detailed "Island View" (Micro View)**:
   - Clicking the trigger transitions the user into an expanded, self-contained illustrated parcel canvas (upgraded `ContainedIslandModal.tsx`).
   - Adapts procedural moat contours, garden groves, 2.5D building roofs, and interactive sticker waypoints based on the itinerary shape (linear, clustered, triangular).

### Target Implementation Files
- `src/lib/geoMask.ts`: Centroid, radius, and SVG mask path math.
- `src/components/ScenicGuideView/LeafletBaseMap.tsx`: SVG pane with clip-path mask and Rough.js border ring.
- `src/components/ScenicGuideView/index.tsx`: Floating action badge trigger.
- `src/components/Modals/ContainedIslandModal.tsx`: Enhanced procedural island canvas.

## 6. Phase 4.2: Overpass Vector Inpainting Engine

### Architecture
- **Route**: `src/app/api/overpass/route.ts`
  - Fetches OpenStreetMap polygons around the itinerary bounding circle.
  - Queries `building`, `leisure=park`, `landuse=grass`, and `natural=water` / `waterway`.
  - Normalizes geometry into GeoJSON-like multi-polygons.
- **Client Cache & Parser**: `src/lib/overpassVector.ts`
  - Caches fetched district vector geometries in memory.
  - Converts geographic coordinate rings `[lat, lng][]` into container pixels via `map.latLngToContainerPoint()`.
- **Procedural Sketch Styler**: `src/components/ScenicGuideView/LeafletBaseMap.tsx`
  - Inside the dynamic inpainting circle SVG mask:
    - Water features: `#6bbcd6` fill with `watercolor` stipples.
    - Parks/Gardens: `#7fa87f` stipple fill with organic tree cluster loops.
    - Buildings & Roofs: `#c14937` and `#d97d3e` with `#2b261b` Rough.js ink borders.


# WanderSketch Redesign & Trip Archive — Architecture & Roadmap

## 1. Project Background & System Stack
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v3 (do NOT upgrade to v4, keep existing paper/watercolor tokens)
- **State**: Zustand (`src/store/useItineraryStore.ts`)
- **Cartography & Rendering**: Leaflet, Rough.js, OpenStreetMap Nominatim (`/api/geocode`), OSRM Foot Profile
- **Spatial Backend**: Supabase PostgreSQL + PostGIS (`GEOMETRY(Point, 4326)`)
- **Integration Direction**: Merging "Trip Archive" lifecycle capabilities (AI itinerary planning, daily budget engine, travel journals, and PDF dossiers) into WanderSketch's illustrated hand-drawn map engine.

## 2. Global Integration Roadmap
- **Phase 1: Data Architecture & Storage Expansion (CURRENT - Steps 2 & 3 in progress)**
  - Schema migration complete: `user_profiles`, `itinerary_days`, `itinerary_items`, `travel_diaries`, `trip_archives`, and `trip-assets` storage bucket.
  - Active tasks: TypeScript domain type expansion and repository CRUD helpers.
- **Phase 2: Pre-Trip Planning & Budget Calculation Engine**
  - Intake form with budget ceilings, LLM structured itinerary generation, and real-time ledger recalculation.
- **Phase 3: On-Trip Dual Modes, Daily Footprints & Live Ledger**
  - Toggle between Planning and On-Trip modes, date-filtered Rough.js footprints, and live expense logging.
- **Phase 4: Travel Diary & PDF Archive Dossier Compilation**
  - Date-indexed multimedia journals, client-side photo compression, and multi-page illustrated PDF export.
- **Phase 5: Testing, Hardening & Offline Resilience**
  - Budget engine unit tests, schema fallbacks, and local offline caching.

## 3. Active Milestone: Phase 1 — Steps 2 & 3
- Update `src/types/itinerary.ts` with new domain interfaces (`ExpenseCategory`, `TripArchiveStatus`, `UserTravelProfile`, `ItineraryItem`, `ItineraryDay`, `TravelDiaryEntry`, `TripArchiveDossier`).
- Update `src/lib/repositories.ts` with query and mutation methods for user profiles, itinerary days/items, diaries, and archives.
- Ensure `npx tsc --noEmit` completes with 0 errors.