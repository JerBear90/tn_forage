/**
 * ForageWise — Foraging Tips Data
 *
 * Static foraging tips for species detail pages and the mushroom calendar.
 * Per-species, per-season tips cover habitat, appearance, and what to look for.
 * Monthly tips describe general Tennessee foraging conditions and include
 * expert verification reminders.
 *
 * SAFETY: All tip text is validated against containsBannedPhrase() at the
 * bottom of this file. No tip may contain "safe to eat", "definitely edible",
 * "confirmed edible", or "AI verified".
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 8.1, 8.2, 8.3, 8.4
 */

import type { SeasonName, MonthIndex } from '@/utils/seasonHelpers';
import { containsBannedPhrase } from '@/utils/safetyLanguage';

/** Per-species, per-season foraging tips */
export interface SpeciesForagingTip {
  speciesId: string;
  season: SeasonName;
  tip: string;
}

/** Monthly general foraging tips for Tennessee */
export interface MonthlyForagingTip {
  month: MonthIndex;
  tip: string;
}

/**
 * Species-specific foraging tips organized by species and season.
 * Each tip covers habitat, appearance at the current growth stage,
 * and what to look for in the field. Uses "possible match" language
 * and reminders to verify with a qualified expert.
 */
export const speciesForagingTips: SpeciesForagingTip[] = [
  // --- Morel (Spring) ---
  {
    speciesId: 'sp-morel',
    season: 'Spring',
    tip: 'Morels are a possible match in Tennessee hardwood forests from late March through May. Look for honeycomb-patterned caps on the ground near tulip poplars, ash, and elm trees, especially in areas with recent disturbance or old orchards. Cut specimens lengthwise to confirm they are completely hollow inside — this distinguishes them from toxic false morels. Always verify your identification with a qualified expert before consuming.',
  },

  // --- Chanterelle (Summer, Fall) ---
  {
    speciesId: 'sp-chanterelle',
    season: 'Summer',
    tip: 'Chanterelles are a possible match on mossy, well-drained slopes in hardwood forests during summer rains. Look for golden-yellow, funnel-shaped caps with blunt, forked ridges (false gills) on the underside — not true blade-like gills. They grow singly from soil, often near oaks and beeches. Check for a fruity, apricot-like aroma. Always verify your identification with a qualified expert before consuming.',
  },
  {
    speciesId: 'sp-chanterelle',
    season: 'Fall',
    tip: 'Chanterelles may continue fruiting into early fall in Tennessee, especially after warm rains. Look for golden-yellow caps among leaf litter on forest slopes. Confirm blunt, forked ridges on the underside rather than true gills, and note the solid stem tapering downward. A possible match requires verification with a qualified expert before consuming.',
  },

  // --- Chicken of the Woods (Summer, Fall) ---
  {
    speciesId: 'sp-chicken-of-the-woods',
    season: 'Summer',
    tip: 'Chicken of the Woods is a possible match on dead or dying hardwood trees during summer. Look for bright orange and yellow shelf-like brackets growing in overlapping clusters on trunks and stumps, especially oaks. Young specimens are thick and moist with tiny pores on the underside — no gills. Avoid specimens on conifers. Always verify your identification with a qualified expert before consuming.',
  },
  {
    speciesId: 'sp-chicken-of-the-woods',
    season: 'Fall',
    tip: 'Chicken of the Woods may appear on hardwoods into early fall. Look for vibrant orange-yellow shelves on oak trunks and stumps. Younger brackets are tender with a suede-like upper surface and white pore underside. Older specimens become chalky and brittle. A possible match requires verification with a qualified expert before consuming.',
  },

  // --- Hen of the Woods / Maitake (Fall) ---
  {
    speciesId: 'sp-hen-of-the-woods',
    season: 'Fall',
    tip: 'Hen of the Woods is a possible match at the base of oak trees in fall. Look for a large rosette of overlapping, fan-shaped gray-brown caps with white pore undersides. Clusters can grow quite large and may return to the same tree each year. Best when young and tender. Always verify your identification with a qualified expert before consuming.',
  },

  // --- Lion\'s Mane (Summer, Fall) ---
  {
    speciesId: 'sp-lions-mane',
    season: 'Summer',
    tip: 'Lion\'s Mane is a possible match on dead or dying hardwood trees during summer. Look for a single, globular white mass of cascading spines hanging from wounds on oak or beech trunks, typically 1–3 meters up. Spines are soft and hang downward like icicles. Fresh specimens are bright white. Always verify your identification with a qualified expert before consuming.',
  },
  {
    speciesId: 'sp-lions-mane',
    season: 'Fall',
    tip: 'Lion\'s Mane continues fruiting into fall on hardwood trees. Look for the distinctive white, shaggy mass of cascading spines on oak, beech, or maple trunks. Specimens turning yellowish or brownish are aging. Best when still bright white and firm. A possible match requires verification with a qualified expert before consuming.',
  },

  // --- Black Trumpet (Summer, Fall) ---
  {
    speciesId: 'sp-black-trumpet',
    season: 'Summer',
    tip: 'Black Trumpets are a possible match in mossy hardwood forests during summer. These dark, funnel-shaped mushrooms grow among leaf litter near oaks and beeches and can be difficult to spot. Look for thin, wavy-edged caps that are dark gray to black, with a smooth underside and no true gills. They have a rich, fruity aroma. Always verify your identification with a qualified expert before consuming.',
  },
  {
    speciesId: 'sp-black-trumpet',
    season: 'Fall',
    tip: 'Black Trumpets may fruit into early fall in Tennessee after adequate rainfall. Search mossy areas and leaf litter in hardwood forests for clusters of dark, trumpet-shaped fruiting bodies. The smooth to slightly wrinkled outer surface and hollow stem are key features. A possible match requires verification with a qualified expert before consuming.',
  },

  // --- Oyster Mushroom (Fall, Winter, Spring) ---
  {
    speciesId: 'sp-oyster-mushroom',
    season: 'Fall',
    tip: 'Oyster Mushrooms are a possible match on dead hardwood logs and stumps in fall. Look for fan-shaped, overlapping shelf-like clusters ranging from white to gray to tan. Gills are white and run down a short, off-center stem. They have a mild, pleasant aroma. Distinguish from Angel Wings, which grow on conifers. Always verify your identification with a qualified expert before consuming.',
  },
  {
    speciesId: 'sp-oyster-mushroom',
    season: 'Winter',
    tip: 'Oyster Mushrooms are one of the few species that may fruit during mild Tennessee winters. Look for shelf-like clusters on dead beech, poplar, or oak logs after periods of rain followed by warmer days. Caps may be darker gray in cooler weather. A possible match requires verification with a qualified expert before consuming.',
  },
  {
    speciesId: 'sp-oyster-mushroom',
    season: 'Spring',
    tip: 'Oyster Mushrooms are a possible match on dead hardwood in spring as temperatures warm. Look for overlapping fan-shaped caps on logs and stumps, with white decurrent gills and a short lateral stem. Spring specimens are often pale and tender. Always verify your identification with a qualified expert before consuming.',
  },

  // --- Turkey Tail (Spring, Summer, Fall, Winter) ---
  {
    speciesId: 'sp-turkey-tail',
    season: 'Spring',
    tip: 'Turkey Tail is a possible match on dead hardwood logs year-round. In spring, look for thin, flexible, fan-shaped brackets with concentric color bands growing in overlapping rows. Confirm tiny white pores on the underside with a hand lens — no gills. Too tough to eat but commonly used for teas. Always verify your identification with a qualified expert.',
  },
  {
    speciesId: 'sp-turkey-tail',
    season: 'Summer',
    tip: 'Turkey Tail persists through summer on dead logs and stumps. Look for the distinctive concentric color zones on thin, leathery brackets. The white pore surface on the underside is a key feature distinguishing it from the smooth-bottomed False Turkey Tail. A possible match requires verification with a qualified expert.',
  },
  {
    speciesId: 'sp-turkey-tail',
    season: 'Fall',
    tip: 'Turkey Tail is commonly found on fallen hardwood in fall. Fresh specimens show vibrant concentric bands of brown, tan, gray, and cream. Check for tiny pores on the underside — not a smooth surface. A possible match requires verification with a qualified expert.',
  },
  {
    speciesId: 'sp-turkey-tail',
    season: 'Winter',
    tip: 'Turkey Tail can be found year-round, including winter, on dead hardwood. Winter specimens may appear faded but retain the concentric banding pattern. Confirm the pore surface underneath. A possible match requires verification with a qualified expert.',
  },

  // --- Reishi (Summer, Fall) ---
  {
    speciesId: 'sp-reishi',
    season: 'Summer',
    tip: 'Reishi is a possible match on dead or dying hemlock trees during summer. Look for kidney-shaped or fan-shaped brackets with a shiny, lacquered surface showing concentric zones of red, orange, and brown. A white growing edge indicates active growth. The pore surface bruises brown when pressed. Always verify your identification with a qualified expert.',
  },
  {
    speciesId: 'sp-reishi',
    season: 'Fall',
    tip: 'Reishi brackets persist into fall on hemlock and occasionally hardwood trees. Look for the distinctive lacquered appearance and concentric color zones. Older specimens lose the white growing edge. Too woody to eat directly but used for teas. A possible match requires verification with a qualified expert.',
  },

  // --- Chaga (Fall, Winter, Spring, Summer) ---
  {
    speciesId: 'sp-chaga',
    season: 'Fall',
    tip: 'Chaga is a possible match on birch trees in Tennessee\'s higher elevations during fall. Look for a dark, irregular, charcoal-like mass protruding from the trunk. The interior is orange-brown and cork-like when broken open. Not consumed directly but used for teas. Always verify your identification with a qualified expert.',
  },
  {
    speciesId: 'sp-chaga',
    season: 'Winter',
    tip: 'Chaga is easier to spot on birch trees in winter when leaves have fallen. Look for the distinctive black, cracked exterior on living birch trunks. The interior should show a rusty orange-brown color. A possible match requires verification with a qualified expert.',
  },

  // --- Dryad's Saddle (Spring, Summer) ---
  {
    speciesId: 'sp-dryads-saddle',
    season: 'Spring',
    tip: 'Dryad\'s Saddle is a possible match on dead or dying hardwoods in spring. Look for large, fan-shaped caps with a pattern of dark brown scales on a pale background, growing from trunks and stumps. The underside has large, angular pores. Young specimens with a cucumber-like aroma are most notable. Always verify your identification with a qualified expert before consuming.',
  },
  {
    speciesId: 'sp-dryads-saddle',
    season: 'Summer',
    tip: 'Dryad\'s Saddle may continue into early summer on hardwood trees. Look for the distinctive pheasant-back scale pattern on large bracket caps. Older specimens become tough and leathery. A possible match requires verification with a qualified expert before consuming.',
  },
];

/**
 * Monthly foraging tips for Tennessee. One entry per month (0–11).
 * Each tip describes general foraging conditions and includes a
 * reminder to verify identification with a qualified expert.
 */
export const monthlyForagingTips: MonthlyForagingTip[] = [
  {
    month: 0,
    tip: 'January in Tennessee brings cold temperatures and dormant forests. Most mushroom activity is minimal, though Oyster Mushrooms and Turkey Tail may persist on dead hardwood logs after mild spells. Focus on scouting locations and learning identification features for the coming spring season. Always verify any find with a qualified expert before consuming.',
  },
  {
    month: 1,
    tip: 'February remains cold across Tennessee, but late-month warm spells can trigger early fungal activity. Watch for Oyster Mushrooms on fallen hardwood after rain. This is a good time to study field guides and prepare for the spring morel season ahead. Always verify any find with a qualified expert before consuming.',
  },
  {
    month: 2,
    tip: 'March marks the beginning of spring foraging in Tennessee. Warming soil temperatures and spring rains create conditions for early morels, especially in Middle and West Tennessee. Check south-facing slopes near tulip poplars, ash, and elm trees. Dryad\'s Saddle may also begin appearing. Always verify any find with a qualified expert before consuming.',
  },
  {
    month: 3,
    tip: 'April is peak morel season across Tennessee. Soil temperatures reaching 50–60°F after spring rains trigger fruiting in hardwood forests. Search near tulip poplars, ash, elms, and old orchards. Watch for false morels — always cut specimens lengthwise to confirm they are completely hollow. Always verify any find with a qualified expert before consuming.',
  },
  {
    month: 4,
    tip: 'May brings the tail end of morel season and the start of warmer-weather species in Tennessee. Oyster Mushrooms fruit on dead hardwood, and Dryad\'s Saddle appears on stumps and trunks. Increasing humidity and temperatures set the stage for summer chanterelles. Always verify any find with a qualified expert before consuming.',
  },
  {
    month: 5,
    tip: 'June marks the transition to summer foraging in Tennessee. Warm temperatures and afternoon thunderstorms create ideal conditions for chanterelles on mossy hardwood slopes. Chicken of the Woods begins appearing on oak trunks. Black Trumpets may emerge in shaded, mossy areas. Always verify any find with a qualified expert before consuming.',
  },
  {
    month: 6,
    tip: 'July is prime summer foraging season in Tennessee. Consistent heat and humidity support chanterelles, Chicken of the Woods, Lion\'s Mane, and Black Trumpets across hardwood forests. Search after rain events for the best fruiting. Be aware of toxic lookalikes such as Jack O\'Lantern mushrooms. Always verify any find with a qualified expert before consuming.',
  },
  {
    month: 7,
    tip: 'August continues strong summer foraging in Tennessee with warm, humid conditions. Chanterelles and Chicken of the Woods remain active. Lion\'s Mane appears on wounded hardwood trunks. Late-summer rains can trigger additional flushes. Stay hydrated and watch for venomous snakes on the forest floor. Always verify any find with a qualified expert before consuming.',
  },
  {
    month: 8,
    tip: 'September brings the transition to fall foraging in Tennessee. Cooling nights and continued rainfall create excellent conditions for Hen of the Woods at the base of oaks, along with chanterelles, Chicken of the Woods, and Honey Mushrooms. The diversity of species increases as summer and fall seasons overlap. Always verify any find with a qualified expert before consuming.',
  },
  {
    month: 9,
    tip: 'October is peak fall foraging season in Tennessee. Cooler temperatures and autumn rains support Hen of the Woods, Lion\'s Mane, Oyster Mushrooms, and many other species. Leaf litter makes forest-floor species harder to spot — look carefully. Fall colors help locate preferred tree species like oaks and beeches. Always verify any find with a qualified expert before consuming.',
  },
  {
    month: 10,
    tip: 'November brings late fall foraging opportunities in Tennessee as temperatures drop. Oyster Mushrooms and Turkey Tail remain active on dead hardwood. Hen of the Woods may still be found at oak bases. Late-season rains can produce final flushes before winter dormancy. Always verify any find with a qualified expert before consuming.',
  },
  {
    month: 11,
    tip: 'December in Tennessee is generally quiet for mushroom foraging, though mild periods can support Oyster Mushrooms and Turkey Tail on dead logs. Chaga is easier to spot on bare birch trees at higher elevations. Use this time to review your finds from the year and plan for the next season. Always verify any find with a qualified expert before consuming.',
  },
];

// ---------------------------------------------------------------------------
// Build-time validation: ensure no tip text contains banned safety phrases
// ---------------------------------------------------------------------------
const allTips = [
  ...speciesForagingTips.map((t) => t.tip),
  ...monthlyForagingTips.map((t) => t.tip),
];

for (const tip of allTips) {
  const banned = containsBannedPhrase(tip);
  if (banned) {
    throw new Error(
      `Foraging tip contains banned phrase "${banned}": "${tip.slice(0, 80)}…"`,
    );
  }
}
