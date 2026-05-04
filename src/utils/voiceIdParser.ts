/**
 * ForageFlow — Voice ID Natural Language Parser
 *
 * Parses natural language descriptions of mushrooms into structured
 * IdentificationWizardAnswers. Extracts cap color, shape, gill type,
 * stem features, growth location, and nearby trees from free-text input.
 *
 * This reuses the existing identification scoring logic — no ML model needed.
 *
 * Requirements: 29.3, 29.4
 */

import type {
  IdentificationWizardAnswers,
  CapColor,
  CapShape,
  UndersideType,
  GrowthLocation,
  NearbyTree,
  StemFeature,
  BruisingReaction,
} from '@/types';
import { DEFAULT_WIZARD_ANSWERS } from '@/types';

/**
 * Keyword mappings for extracting structured features from natural language.
 */
const CAP_COLOR_KEYWORDS: Record<string, CapColor> = {
  white: 'White',
  brown: 'Brown',
  tan: 'Brown',
  yellow: 'Yellow',
  golden: 'Yellow',
  orange: 'Orange',
  red: 'Red',
  reddish: 'Red',
  gray: 'Gray',
  grey: 'Gray',
};

const CAP_SHAPE_KEYWORDS: Record<string, CapShape> = {
  convex: 'Convex',
  rounded: 'Convex',
  dome: 'Convex',
  flat: 'Flat',
  funnel: 'Funnel',
  vase: 'Funnel',
  trumpet: 'Funnel',
  conical: 'Conical',
  pointed: 'Conical',
  bell: 'Bell',
  irregular: 'Irregular',
  wavy: 'Irregular',
};

const UNDERSIDE_KEYWORDS: Record<string, UndersideType> = {
  gills: 'Gills',
  gill: 'Gills',
  pores: 'Pores',
  pore: 'Pores',
  spongy: 'Pores',
  teeth: 'Teeth',
  tooth: 'Teeth',
  spines: 'Teeth',
  smooth: 'Smooth',
};

const GROWTH_LOCATION_KEYWORDS: Record<string, GrowthLocation> = {
  soil: 'Soil',
  ground: 'Soil',
  dirt: 'Soil',
  'dead wood': 'Dead wood',
  log: 'Dead wood',
  stump: 'Dead wood',
  'fallen tree': 'Dead wood',
  'living tree': 'Living tree',
  trunk: 'Living tree',
  'leaf litter': 'Leaf litter',
  leaves: 'Leaf litter',
  moss: 'Moss',
  mossy: 'Moss',
};

const NEARBY_TREE_KEYWORDS: Record<string, NearbyTree> = {
  oak: 'Oak',
  hickory: 'Hickory',
  elm: 'Elm',
  maple: 'Maple',
  pine: 'Pine',
  poplar: 'Poplar',
  tulip: 'Poplar',
};

const STEM_FEATURE_KEYWORDS: Record<string, StemFeature> = {
  thick: 'Thick',
  thin: 'Thin',
  ring: 'Ring present',
  skirt: 'Ring present',
  volva: 'Volva present',
  cup: 'Volva present',
  hollow: 'Hollow',
  solid: 'Solid',
};

const BRUISING_KEYWORDS: Record<string, BruisingReaction> = {
  'bruises blue': 'Blue',
  'turns blue': 'Blue',
  'blue staining': 'Blue',
  'bruises brown': 'Brown',
  'turns brown': 'Brown',
  'bruises yellow': 'Yellow',
  'turns yellow': 'Yellow',
  'bruises red': 'Red',
  'turns red': 'Red',
  'bruises black': 'Black',
  'turns black': 'Black',
  'no bruising': 'None',
  "doesn't bruise": 'None',
};

/**
 * Parses a natural language description into structured wizard answers.
 *
 * @param transcript - The raw text from speech-to-text or user input
 * @returns Partial wizard answers extracted from the description
 */
export function parseVoiceDescription(
  transcript: string,
): Partial<IdentificationWizardAnswers> {
  const text = transcript.toLowerCase();
  const result: Partial<IdentificationWizardAnswers> = {};

  // Extract cap color
  for (const [keyword, value] of Object.entries(CAP_COLOR_KEYWORDS)) {
    if (text.includes(keyword)) {
      result.capColor = value;
      break;
    }
  }

  // Extract cap shape
  for (const [keyword, value] of Object.entries(CAP_SHAPE_KEYWORDS)) {
    if (text.includes(keyword)) {
      result.capShape = value;
      break;
    }
  }

  // Extract underside type
  for (const [keyword, value] of Object.entries(UNDERSIDE_KEYWORDS)) {
    if (text.includes(keyword)) {
      result.undersideType = value;
      break;
    }
  }

  // Extract growth location (check multi-word phrases first)
  const sortedGrowthKeywords = Object.entries(GROWTH_LOCATION_KEYWORDS).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [keyword, value] of sortedGrowthKeywords) {
    if (text.includes(keyword)) {
      result.growthLocation = value;
      break;
    }
  }

  // Extract nearby trees
  for (const [keyword, value] of Object.entries(NEARBY_TREE_KEYWORDS)) {
    if (text.includes(keyword)) {
      result.nearbyTree = value;
      break;
    }
  }

  // Extract stem features (can be multiple)
  const stemFeatures: StemFeature[] = [];
  for (const [keyword, value] of Object.entries(STEM_FEATURE_KEYWORDS)) {
    if (text.includes(keyword) && !stemFeatures.includes(value)) {
      stemFeatures.push(value);
    }
  }
  if (stemFeatures.length > 0) {
    result.stemFeatures = stemFeatures;
  }

  // Extract bruising reaction (check multi-word phrases first)
  const sortedBruisingKeywords = Object.entries(BRUISING_KEYWORDS).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [keyword, value] of sortedBruisingKeywords) {
    if (text.includes(keyword)) {
      result.bruisingReaction = value;
      break;
    }
  }

  return result;
}

/**
 * Merges parsed voice features into a complete wizard answers object.
 */
export function mergeWithDefaults(
  parsed: Partial<IdentificationWizardAnswers>,
): IdentificationWizardAnswers {
  return {
    ...DEFAULT_WIZARD_ANSWERS,
    ...parsed,
    stemFeatures: parsed.stemFeatures ?? DEFAULT_WIZARD_ANSWERS.stemFeatures,
  };
}
