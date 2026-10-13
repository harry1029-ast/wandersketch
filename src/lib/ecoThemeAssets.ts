/**
 * Eco-Community Diorama Theme Assets
 * Inspired by the Magnific / Adobe Illustrator vector community map (cityeco.eps)
 * Features flat/isometric 2.5D illustrated props: red-roofed cottages, blue glass skyscrapers,
 * wind turbines, pine & deciduous trees, and solar arrays.
 */

import { Landmark } from '@/types/itinerary';

export const ECO_COTTAGE_SVG = `
<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-sm">
  <!-- Chimney -->
  <rect x="66" y="20" width="8" height="18" fill="#90a4ae" stroke="#263238" stroke-width="2" stroke-linejoin="round"/>
  <!-- Red Gabled Roof -->
  <polygon points="50,14 10,44 90,44" fill="#c62828" stroke="#263238" stroke-width="2.5" stroke-linejoin="round"/>
  <!-- Facade Base -->
  <rect x="20" y="44" width="60" height="42" fill="#ffffff" stroke="#263238" stroke-width="2.5"/>
  <!-- Front Door -->
  <rect x="42" y="58" width="16" height="28" fill="#8d6e63" stroke="#263238" stroke-width="2"/>
  <circle cx="54" cy="72" r="1.5" fill="#ffd54f"/>
  <!-- Cyan Windows -->
  <rect x="26" y="52" width="11" height="13" rx="2" fill="#4fc3f7" stroke="#263238" stroke-width="1.5"/>
  <line x1="31.5" y1="52" x2="31.5" y2="65" stroke="#ffffff" stroke-width="1"/>
  <line x1="26" y1="58.5" x2="37" y2="58.5" stroke="#ffffff" stroke-width="1"/>
  <rect x="63" y="52" width="11" height="13" rx="2" fill="#4fc3f7" stroke="#263238" stroke-width="1.5"/>
  <line x1="68.5" y1="52" x2="68.5" y2="65" stroke="#ffffff" stroke-width="1"/>
  <line x1="63" y1="58.5" x2="74" y2="58.5" stroke="#ffffff" stroke-width="1"/>
</svg>
`;

export const ECO_SKYSCRAPER_SVG = `
<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-sm">
  <!-- Spire Peak -->
  <polygon points="50,10 26,26 74,26" fill="#0277bd" stroke="#263238" stroke-width="2.5" stroke-linejoin="round"/>
  <!-- Tower Body -->
  <rect x="26" y="26" width="48" height="62" fill="#039be5" stroke="#263238" stroke-width="2.5"/>
  <!-- Horizontal Window Stripe Grids -->
  <line x1="33" y1="36" x2="67" y2="36" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="33" y1="46" x2="67" y2="46" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="33" y1="56" x2="67" y2="56" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="33" y1="66" x2="67" y2="66" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="33" y1="76" x2="67" y2="76" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Grand Entrance -->
  <rect x="42" y="76" width="16" height="12" fill="#01579b" stroke="#263238" stroke-width="1.5"/>
</svg>
`;

export const ECO_TREES_SVG = `
<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-sm">
  <!-- Pine Tree (Left) -->
  <rect x="33" y="66" width="6" height="16" fill="#5d4037" stroke="#263238" stroke-width="1.5"/>
  <polygon points="36,18 20,44 52,44" fill="#2e7d32" stroke="#263238" stroke-width="2" stroke-linejoin="round"/>
  <polygon points="36,36 16,66 56,66" fill="#388e3c" stroke="#263238" stroke-width="2" stroke-linejoin="round"/>
  <!-- Deciduous Round Tree (Right) -->
  <rect x="66" y="66" width="6" height="16" fill="#5d4037" stroke="#263238" stroke-width="1.5"/>
  <circle cx="69" cy="46" r="19" fill="#8bc34a" stroke="#263238" stroke-width="2.5"/>
  <circle cx="65" cy="42" r="14" fill="#9ccc65"/>
</svg>
`;

export const ECO_WIND_TURBINE_SVG = `
<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-sm">
  <!-- Pylon Mast -->
  <polygon points="48,88 52,88 51,36 49,36" fill="#eceff1" stroke="#263238" stroke-width="2"/>
  <circle cx="50" cy="36" r="4.5" fill="#cfd8dc" stroke="#263238" stroke-width="2"/>
  <!-- 3 Aerodynamic Rotor Blades -->
  <polygon points="50,36 47,8 53,8" fill="#ffffff" stroke="#263238" stroke-width="1.5" stroke-linejoin="round"/>
  <polygon points="50,36 75,50 72,55" fill="#ffffff" stroke="#263238" stroke-width="1.5" stroke-linejoin="round"/>
  <polygon points="50,36 25,50 28,55" fill="#ffffff" stroke="#263238" stroke-width="1.5" stroke-linejoin="round"/>
  <circle cx="50" cy="36" r="2.5" fill="#455a64"/>
</svg>
`;

export const ECO_SOLAR_GRID_SVG = `
<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-sm">
  <!-- Solar Panel Surface (Angled Isometric) -->
  <polygon points="18,68 32,24 82,24 68,68" fill="#1565c0" stroke="#263238" stroke-width="2.5" stroke-linejoin="round"/>
  <!-- Photovoltaic Grid Lines -->
  <line x1="35" y1="46" x2="75" y2="46" stroke="#90caf9" stroke-width="1.5"/>
  <line x1="33" y1="24" x2="23" y2="68" stroke="#90caf9" stroke-width="1.5"/>
  <line x1="50" y1="24" x2="42" y2="68" stroke="#90caf9" stroke-width="1.5"/>
  <line x1="67" y1="24" x2="60" y2="68" stroke="#90caf9" stroke-width="1.5"/>
  <!-- Metal Stand Struts -->
  <line x1="42" y1="68" x2="42" y2="86" stroke="#37474f" stroke-width="3" stroke-linecap="round"/>
  <line x1="58" y1="68" x2="58" y2="86" stroke="#37474f" stroke-width="3" stroke-linecap="round"/>
  <line x1="32" y1="86" x2="68" y2="86" stroke="#263238" stroke-width="2.5" stroke-linecap="round"/>
</svg>
`;

export const ECO_FACTORY_SVG = `
<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-sm">
  <!-- Smokestacks -->
  <rect x="25" y="16" width="7" height="30" fill="#37474f" stroke="#263238" stroke-width="1.5"/>
  <rect x="37" y="20" width="7" height="26" fill="#37474f" stroke="#263238" stroke-width="1.5"/>
  <!-- Factory Complex Body -->
  <rect x="18" y="44" width="64" height="42" fill="#455a64" stroke="#263238" stroke-width="2.5"/>
  <!-- Serrated Roof Sheds -->
  <polygon points="18,44 28,34 28,44 38,34 38,44 48,34 48,44" fill="#00838f" stroke="#263238" stroke-width="1.5"/>
  <!-- Industrial Window Band -->
  <rect x="24" y="52" width="52" height="10" fill="#80deea" stroke="#263238" stroke-width="1.5"/>
  <rect x="52" y="68" width="16" height="18" fill="#263238"/>
</svg>
`;

export const ECO_MOUNTAIN_SVG = `
<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-sm">
  <!-- Back Mountain -->
  <polygon points="68,28 42,76 94,76" fill="#455a64" stroke="#263238" stroke-width="2"/>
  <polygon points="68,28 58,46 78,46" fill="#ffffff"/>
  <!-- Front Peak -->
  <polygon points="38,18 10,78 66,78" fill="#37474f" stroke="#263238" stroke-width="2.5"/>
  <polygon points="38,18 26,42 40,40 50,42" fill="#ffffff" stroke="#263238" stroke-width="1.5"/>
</svg>
`;

/**
 * Returns the appropriate illustrated vector sticker based on milestone index and landmark metadata
 */
export function getEcoStickerSvg(stopIndex: number, lm?: Landmark): string {
  const category = (lm?.category || '').toLowerCase();
  const tag = (lm?.tag || '').toLowerCase();
  const name = (lm?.name || '').toLowerCase();

  // 1. Origin / Lodging / First Stop -> Red-Roofed Cottage
  if (stopIndex === 1 || tag.includes('lodging') || tag.includes('hotel') || category === 'lodging') {
    return ECO_COTTAGE_SVG;
  }

  // 2. Nature / Park / Gardens -> Pine & Deciduous Grove
  if (
    category === 'nature' ||
    tag.includes('park') ||
    tag.includes('garden') ||
    name.includes('park') ||
    name.includes('garden')
  ) {
    return ECO_TREES_SVG;
  }

  // 3. Clean Energy / Lookout / Spire -> Wind Turbine
  if (
    tag.includes('energy') ||
    tag.includes('spire') ||
    tag.includes('tower') ||
    name.includes('spire') ||
    name.includes('tower')
  ) {
    return ECO_WIND_TURBINE_SVG;
  }

  // 4. Commercial / Skyscraper / Shopping -> Blue Glass High-Rise
  if (
    category === 'landmark' ||
    tag.includes('mall') ||
    tag.includes('plaza') ||
    name.includes('center') ||
    name.includes('plaza')
  ) {
    return ECO_SKYSCRAPER_SVG;
  }

  // 5. Tech / Science / Heritage -> Solar Array or Mountain
  if (tag.includes('heritage') || tag.includes('history')) {
    return ECO_SOLAR_GRID_SVG;
  }

  // Cycle alternates for a rich diorama look
  const cycle = [ECO_COTTAGE_SVG, ECO_SKYSCRAPER_SVG, ECO_TREES_SVG, ECO_WIND_TURBINE_SVG, ECO_SOLAR_GRID_SVG];
  return cycle[(stopIndex - 1) % cycle.length];
}

