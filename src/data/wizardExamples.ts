/**
 * ForageWise — ID Wizard Visual Examples
 *
 * Provides descriptive text and example image paths for each wizard step
 * to help users understand what each identification feature looks like.
 */

export interface WizardExample {
  description: string;
  /** Optional image path from public/images */
  image?: string;
}

/** Descriptions for underside types to help users identify what they're looking at */
export const UNDERSIDE_EXAMPLES: Record<string, WizardExample> = {
  Gills: {
    description: 'Thin blade-like structures radiating from the stem, like pages of a book',
    image: '/images/species/sp-chanterelle.jpg',
  },
  Pores: {
    description: 'Tiny holes or tubes on the underside, like a sponge',
    image: '/images/species/sp-chicken-of-the-woods.jpg',
  },
  Teeth: {
    description: 'Hanging spines or tooth-like projections pointing downward',
    image: '/images/species/sp-lions-mane.jpg',
  },
  Smooth: {
    description: 'Flat, smooth underside with no visible structures',
    image: '/images/species/sp-reishi.jpg',
  },
  Unknown: {
    description: "Not sure? That's okay — select this and we'll still try to match",
  },
};

/** Descriptions for growth locations */
export const GROWTH_EXAMPLES: Record<string, WizardExample> = {
  Soil: {
    description: 'Growing directly from the ground, forest floor, or grass',
    image: '/images/species/sp-morel.jpg',
  },
  'Dead wood': {
    description: 'On fallen logs, stumps, or dead branches',
    image: '/images/species/sp-turkey-tail.jpg',
  },
  'Living tree': {
    description: 'Growing on the trunk or branches of a living tree',
    image: '/images/species/sp-chicken-of-the-woods.jpg',
  },
  'Leaf litter': {
    description: 'Among fallen leaves on the forest floor',
    image: '/images/species/sp-honey-mushroom.jpg',
  },
  Moss: {
    description: 'Growing in or near moss patches, often in damp areas',
  },
  Unknown: {
    description: "Can't tell? No problem — skip this one",
  },
};

/** Descriptions for nearby trees */
export const NEARBY_TREE_EXAMPLES: Record<string, WizardExample> = {
  Oak: {
    description: 'Lobed leaves, acorns on the ground — many mushrooms associate with oaks',
    image: '/images/trees/tree-white-oak.jpg',
  },
  Hickory: {
    description: 'Compound leaves with 5–7 leaflets, shaggy or tight bark, nuts on the ground',
    image: '/images/trees/tree-shagbark-hickory.jpg',
  },
  Elm: {
    description: 'Asymmetrical toothed leaves, vase-shaped canopy, rough bark',
    image: '/images/trees/tree-american-elm.jpg',
  },
  Maple: {
    description: 'Opposite branching, palmate leaves with pointed lobes, winged seeds',
    image: '/images/trees/tree-sugar-maple.jpg',
  },
  Pine: {
    description: 'Needles in bundles, cones on the ground, evergreen',
    image: '/images/trees/tree-eastern-white-pine.jpg',
  },
  Poplar: {
    description: 'Tall straight trunk, large tulip-shaped leaves, fast-growing',
    image: '/images/trees/tree-tulip-poplar.jpg',
  },
  Unknown: {
    description: "Not sure what tree is nearby? That's okay — skip this one",
  },
};

/** Descriptions for cap shapes */
export const CAP_SHAPE_EXAMPLES: Record<string, WizardExample> = {
  Convex: {
    description: 'Rounded dome shape, like an upside-down bowl',
    image: '/images/species/sp-fly-agaric.jpg',
  },
  Flat: {
    description: 'Level or nearly flat across the top',
    image: '/images/species/sp-turkey-tail.jpg',
  },
  Funnel: {
    description: 'Depressed in the center, like a shallow funnel or vase',
    image: '/images/species/sp-chanterelle.jpg',
  },
  Conical: {
    description: 'Pointed or cone-shaped, taller than wide',
    image: '/images/species/sp-morel.jpg',
  },
  Bell: {
    description: 'Bell-shaped, wider at the bottom edge',
    image: '/images/species/sp-honey-mushroom.jpg',
  },
  Irregular: {
    description: 'No regular shape — wavy, lobed, or brain-like',
    image: '/images/species/sp-hen-of-the-woods.jpg',
  },
  Unknown: {
    description: "Hard to tell? Select this and we'll work with other features",
  },
};

/** Descriptions for stem features */
export const STEM_EXAMPLES: Record<string, WizardExample> = {
  Thick: {
    description: 'Stem is thick and sturdy, wider than a pencil',
    image: '/images/species/sp-king-bolete.jpg',
  },
  Thin: {
    description: 'Stem is thin and delicate, pencil-width or less',
    image: '/images/species/sp-honey-mushroom.jpg',
  },
  'Ring present': {
    description: 'A skirt-like ring (annulus) around the stem — common in Amanitas',
    image: '/images/species/sp-fly-agaric.jpg',
  },
  'Volva present': {
    description: 'A cup or sack at the base of the stem — important safety feature',
    image: '/images/species/sp-death-cap.jpg',
  },
  Hollow: {
    description: 'Stem is hollow when cut lengthwise',
    image: '/images/species/sp-morel.jpg',
  },
  Solid: {
    description: 'Stem is solid/filled when cut lengthwise',
    image: '/images/species/sp-king-bolete.jpg',
  },
  Unknown: {
    description: "Can't check the stem? That's fine",
  },
};

/** Descriptions for bruising reactions */
export const BRUISING_EXAMPLES: Record<string, WizardExample> = {
  None: {
    description: 'No color change when cut or bruised',
  },
  Blue: {
    description: 'Turns blue when cut — common in boletes',
    image: '/images/species/sp-two-colored-bolete.jpg',
  },
  Brown: {
    description: 'Turns brown when damaged — like a bruised apple',
  },
  Yellow: {
    description: 'Turns yellow when scratched or cut',
  },
  Red: {
    description: 'Turns red or reddish when damaged',
  },
  Black: {
    description: 'Turns black when cut or with age',
    image: '/images/species/sp-black-staining-polypore.jpg',
  },
  Unknown: {
    description: "Haven't tested? You can skip this",
  },
};
