/**
 * ForageFlow — Guided Tour Seed Data
 *
 * Pre-authored guided tour content for select Tennessee trails.
 * Each tour provides narrated waypoints with ecological context,
 * species references, and foraging tips.
 *
 * SAFETY: No tour content may contain "safe to eat", "definitely edible",
 * "confirmed edible", or "AI verified". Each tour begins with a safety reminder.
 *
 * Requirements: 15.1–15.7
 */

import type { GuidedTour } from '@/types';

const SAFETY_REMINDER =
  'All identifications in this tour are possible matches only and require expert verification before any consumption. Never eat anything you have not confirmed with a qualified mycologist or experienced forager.';

export const tourSeed: GuidedTour[] = [
  // =========================================================================
  // Tour 1: Big Ridge State Park — Dark Hollow Trail
  // =========================================================================
  {
    id: 'tour-big-ridge-dark-hollow',
    trailId: 'trail-big-ridge-dark-hollow',
    title: 'Dark Hollow Foraging Walk',
    safetyReminder: SAFETY_REMINDER,
    waypoints: [
      {
        id: 'wp-dark-hollow-1',
        order: 1,
        coordinates: { lat: 36.3240, lng: -83.9990 },
        title: 'Trailhead — Reading the Forest Edge',
        description:
          'Before entering the forest, observe the transition zone between open field and canopy. Edge habitats support different fungal communities than deep forest. Look for Dryad\'s Saddle on dead hardwood stumps near the trail entrance — its scaly, fan-shaped cap and black-footed stem are distinctive in spring and early summer.',
        speciesRefs: ['sp-dryads-saddle'],
        plantRefs: [],
        ecologicalContext:
          'Forest edges receive more sunlight and wind, creating drier conditions that favor certain saprotrophic fungi. The transition from grassland to canopy creates a microclimate gradient over just a few meters.',
      },
      {
        id: 'wp-dark-hollow-2',
        order: 2,
        coordinates: { lat: 36.3255, lng: -83.9970 },
        title: 'Oak Grove — Mycorrhizal Partners',
        description:
          'This section of trail passes through a mature oak grove. Oaks form mycorrhizal partnerships with many prized mushroom species. In summer and fall, scan the ground within 10 meters of oak trunks for Chanterelles — their golden color and blunt, forking ridges (not true gills) distinguish them from toxic Jack O\'Lanterns, which grow in clusters from wood.',
        speciesRefs: ['sp-chanterelle', 'sp-jack-o-lantern'],
        plantRefs: [],
        ecologicalContext:
          'Mycorrhizal fungi form symbiotic networks with tree roots, exchanging soil nutrients for sugars produced by photosynthesis. A single oak may partner with dozens of fungal species simultaneously.',
      },
      {
        id: 'wp-dark-hollow-3',
        order: 3,
        coordinates: { lat: 36.3268, lng: -83.9950 },
        title: 'Hemlock Ravine — Reishi Habitat',
        description:
          'The trail descends into a cool, moist ravine dominated by Eastern Hemlock. Dead hemlock logs and stumps are prime habitat for Reishi (Ganoderma tsugae). Look for the distinctive kidney-shaped brackets with a lacquered, reddish-brown upper surface. Reishi is a perennial — the same fruiting body may persist for years, adding a new layer of growth each season.',
        speciesRefs: ['sp-reishi'],
        plantRefs: [],
        ecologicalContext:
          'Tennessee\'s hemlock populations have been severely impacted by the Hemlock Woolly Adelgid, an invasive insect. The resulting dead wood has created abundant substrate for wood-decomposing fungi, temporarily increasing Reishi abundance in affected areas.',
      },
      {
        id: 'wp-dark-hollow-4',
        order: 4,
        coordinates: { lat: 36.3275, lng: -83.9930 },
        title: 'Creek Crossing — Moisture and Decomposition',
        description:
          'Near the creek, moisture levels are consistently high. Fallen logs in contact with the ground here decompose rapidly, supporting Turkey Tail and other polypore species. Turkey Tail (Trametes versicolor) displays concentric color bands on thin, flexible brackets. It is one of the most common fungi worldwide and plays a critical role in nutrient cycling.',
        speciesRefs: ['sp-turkey-tail'],
        plantRefs: ['pl-ramps'],
        ecologicalContext:
          'Riparian zones (areas adjacent to streams) maintain higher humidity and more stable temperatures than surrounding forest. In spring, this area may support Ramps colonies in the rich, moist soil of the stream bank.',
      },
    ],
    lastUpdated: '2025-01-20',
  },

  // =========================================================================
  // Tour 2: Fall Creek Falls State Park — Gorge Overlook Trail
  // =========================================================================
  {
    id: 'tour-fall-creek-falls-gorge',
    trailId: 'trail-fall-creek-falls-gorge',
    title: 'Gorge Overlook Ecology Tour',
    safetyReminder: SAFETY_REMINDER,
    waypoints: [
      {
        id: 'wp-gorge-1',
        order: 1,
        coordinates: { lat: 35.6667, lng: -85.3517 },
        title: 'Plateau Forest — Upland Oaks and Hickories',
        description:
          'The trail begins on the Cumberland Plateau in a mixed oak-hickory forest. This dry, well-drained habitat is prime territory for Hen of the Woods (Maitake), which fruits at the base of mature oaks in fall. Look for large, overlapping gray-brown rosettes that can weigh several kilograms. The base of the same tree may produce year after year.',
        speciesRefs: ['sp-hen-of-the-woods'],
        plantRefs: [],
        ecologicalContext:
          'The Cumberland Plateau\'s sandstone cap creates well-drained, acidic soils that support oak-hickory forests. These forests have been relatively stable for thousands of years, allowing deep mycorrhizal networks to develop.',
      },
      {
        id: 'wp-gorge-2',
        order: 2,
        coordinates: { lat: 35.6660, lng: -85.3530 },
        title: 'Gorge Rim — Microclimate Transition',
        description:
          'As you approach the gorge rim, notice how the forest composition changes. Cooler air rising from the gorge creates a microclimate that supports species more typical of higher elevations. Chicken of the Woods may appear on dead oaks along the rim — its bright orange and yellow shelves are unmistakable, but always check the host tree species, as specimens on conifers may cause digestive issues.',
        speciesRefs: ['sp-chicken-of-the-woods'],
        plantRefs: [],
        ecologicalContext:
          'Gorge microclimates in the Cumberland Plateau can be 5–10°F cooler than the surrounding plateau surface. This temperature differential creates habitat diversity within a small geographic area.',
      },
      {
        id: 'wp-gorge-3',
        order: 3,
        coordinates: { lat: 35.6652, lng: -85.3545 },
        title: 'Overlook — Observing the Canopy Below',
        description:
          'From the overlook, you can observe the gorge canopy below. The moist, sheltered gorge floor supports different tree species (hemlock, magnolia, beech) and consequently different fungal communities than the plateau above. Lion\'s Mane often fruits on beech trees in these protected environments — look for white, cascading spines on wounded trunks.',
        speciesRefs: ['sp-lions-mane'],
        plantRefs: [],
        ecologicalContext:
          'The vertical relief of the gorge creates multiple ecological zones within a short horizontal distance. Species that would normally require traveling hundreds of miles north can be found in the cool, moist gorge bottoms.',
      },
    ],
    lastUpdated: '2025-01-25',
  },

  // =========================================================================
  // Tour 3: Frozen Head State Park — Bird Mountain Trail
  // =========================================================================
  {
    id: 'tour-frozen-head-bird-mountain',
    trailId: 'trail-frozen-head-bird-mountain',
    title: 'Bird Mountain Foraging Ecology Walk',
    safetyReminder: SAFETY_REMINDER,
    waypoints: [
      {
        id: 'wp-bird-mtn-1',
        order: 1,
        coordinates: { lat: 36.1200, lng: -84.4300 },
        title: 'Trailhead — Tulip Poplar Corridor',
        description:
          'The lower section of Bird Mountain Trail passes through a corridor of mature Tulip Poplars. In spring (late March through mid-May), this is prime Morel habitat. Morels associate strongly with Tulip Poplars in Tennessee, particularly on south-facing slopes where soil warms earliest. Look for the distinctive honeycomb-patterned cap and verify the interior is completely hollow.',
        speciesRefs: ['sp-morel'],
        plantRefs: [],
        ecologicalContext:
          'Tulip Poplars (Liriodendron tulipifera) are Tennessee\'s state tree and one of the tallest hardwoods in eastern North America. Their association with Morels is well-documented in the southern Appalachian region.',
      },
      {
        id: 'wp-bird-mtn-2',
        order: 2,
        coordinates: { lat: 36.1215, lng: -84.4285 },
        title: 'Mid-Slope — Mixed Hardwood Diversity',
        description:
          'As elevation increases, the forest transitions to a diverse mix of oaks, maples, and beech. This diversity supports a wide range of fungal species. In fall, look for Black Trumpet mushrooms in the leaf litter near beech and oak — they are dark gray to black, funnel-shaped, and notoriously difficult to spot against the forest floor.',
        speciesRefs: ['sp-black-trumpet'],
        plantRefs: ['pl-wild-ginger'],
        ecologicalContext:
          'Mid-slope positions in Appalachian forests often have the highest tree species diversity due to moderate moisture, good drainage, and nutrient accumulation from upslope. This translates directly to higher fungal diversity.',
      },
      {
        id: 'wp-bird-mtn-3',
        order: 3,
        coordinates: { lat: 36.1230, lng: -84.4270 },
        title: 'Ridge Top — Wind-Exposed Habitat',
        description:
          'The ridge top is drier and more wind-exposed than the slopes below. Chaga (Inonotus obliquus) can occasionally be found on stressed birch trees in these exposed positions. It appears as a dark, cracked, charcoal-like mass protruding from the trunk — not a typical mushroom shape. Note that Chaga is slow-growing and over-harvesting is a concern in many regions.',
        speciesRefs: ['sp-chaga'],
        plantRefs: [],
        ecologicalContext:
          'Ridge-top trees experience greater wind stress, temperature extremes, and drought. These stressors can weaken trees and make them more susceptible to fungal colonization, creating opportunities for parasitic species like Chaga.',
      },
    ],
    lastUpdated: '2025-01-28',
  },
];
