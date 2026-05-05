/**
 * ForageWise — AI Identification Photo Slot Configurations
 *
 * Defines the category-specific photo slots for mushroom, plant, and tree
 * identification. Each category has 5 slots with descriptive labels,
 * placeholder images, and alt text guiding the user on what to photograph.
 */

export type AIIdentificationCategory = 'mushroom' | 'plant' | 'tree';

export interface PhotoSlotConfig {
  key: string;
  label: string;
  description: string;
  placeholderAlt: string;
  placeholderSrc: string;
}

export const MUSHROOM_SLOTS: PhotoSlotConfig[] = [
  { key: 'top', label: 'Top', description: 'Cap surface from above', placeholderAlt: 'Example: photograph the mushroom cap from directly above', placeholderSrc: '/images/placeholders/mushroom-top.svg' },
  { key: 'underside', label: 'Underside', description: 'Gills, pores, or teeth', placeholderAlt: 'Example: photograph the underside showing gill or pore structure', placeholderSrc: '/images/placeholders/mushroom-underside.svg' },
  { key: 'stem', label: 'Stem', description: 'Full stem with base', placeholderAlt: 'Example: photograph the full stem including the base', placeholderSrc: '/images/placeholders/mushroom-stem.svg' },
  { key: 'surroundings', label: 'Surroundings', description: 'Habitat context', placeholderAlt: 'Example: photograph the surrounding habitat and substrate', placeholderSrc: '/images/placeholders/mushroom-surroundings.svg' },
  { key: 'cross-section', label: 'Cross-section', description: 'Cut in half', placeholderAlt: 'Example: photograph a cross-section cut showing internal structure', placeholderSrc: '/images/placeholders/mushroom-cross-section.svg' },
];

export const PLANT_SLOTS: PhotoSlotConfig[] = [
  { key: 'whole-plant', label: 'Whole Plant', description: 'Full plant view', placeholderAlt: 'Example: photograph the entire plant showing overall shape', placeholderSrc: '/images/placeholders/plant-whole.svg' },
  { key: 'leaf-top', label: 'Leaf (Top)', description: 'Upper leaf surface', placeholderAlt: 'Example: photograph the full leaf from above showing vein pattern', placeholderSrc: '/images/placeholders/plant-leaf-top.svg' },
  { key: 'leaf-underside', label: 'Leaf (Underside)', description: 'Lower leaf surface', placeholderAlt: 'Example: photograph the leaf underside showing texture and color', placeholderSrc: '/images/placeholders/plant-leaf-underside.svg' },
  { key: 'flower-fruit', label: 'Flower/Fruit', description: 'Reproductive parts', placeholderAlt: 'Example: photograph any flowers, fruits, or seeds present', placeholderSrc: '/images/placeholders/plant-flower.svg' },
  { key: 'surroundings', label: 'Surroundings', description: 'Habitat context', placeholderAlt: 'Example: photograph the surrounding habitat and growing conditions', placeholderSrc: '/images/placeholders/plant-surroundings.svg' },
];

export const TREE_SLOTS: PhotoSlotConfig[] = [
  { key: 'whole-tree', label: 'Whole Tree', description: 'Full tree silhouette', placeholderAlt: 'Example: photograph the entire tree showing overall shape and canopy', placeholderSrc: '/images/placeholders/tree-whole.svg' },
  { key: 'bark', label: 'Bark Close-up', description: 'Bark texture at eye level', placeholderAlt: 'Example: photograph the bark texture at eye level', placeholderSrc: '/images/placeholders/tree-bark.svg' },
  { key: 'leaf', label: 'Leaf Close-up', description: 'Single leaf detail', placeholderAlt: 'Example: photograph a single leaf showing shape and venation', placeholderSrc: '/images/placeholders/tree-leaf.svg' },
  { key: 'fruit-seed', label: 'Fruit/Seed/Cone', description: 'Reproductive structures', placeholderAlt: 'Example: photograph any fruits, seeds, or cones present', placeholderSrc: '/images/placeholders/tree-fruit.svg' },
  { key: 'surroundings', label: 'Surroundings', description: 'Habitat context', placeholderAlt: 'Example: photograph the surrounding environment and nearby trees', placeholderSrc: '/images/placeholders/tree-surroundings.svg' },
];

/** Returns the slot configuration for the given category */
export function getSlotsForCategory(category: AIIdentificationCategory): PhotoSlotConfig[] {
  switch (category) {
    case 'mushroom':
      return MUSHROOM_SLOTS;
    case 'plant':
      return PLANT_SLOTS;
    case 'tree':
      return TREE_SLOTS;
  }
}
