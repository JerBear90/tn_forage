/**
 * ForageWise — Fruiting Triggers Seed Data
 *
 * Species-specific environmental conditions that trigger fruiting.
 * Used by the fruiting forecast system to predict when species are
 * likely to fruit based on current weather data.
 *
 * Data derived from mycological research on fruiting body formation
 * conditions for common Tennessee species.
 *
 * Requirements: 25.1–25.8
 */

import type { FruitingTrigger } from '@/types';

export interface FruitingTriggerEntry {
  speciesId: string;
  commonName: string;
  triggers: FruitingTrigger;
  seasonWindow: string[];
  notes?: string;
}

export const fruitingTriggersSeed: FruitingTriggerEntry[] = [
  {
    speciesId: 'sp-morel',
    commonName: 'Morel',
    triggers: {
      minRainfallInches: 1.0,
      rainfallWindowDays: 7,
      minTempF: 50,
      minHumidity: 60,
      minSoilTempF: 50,
    },
    seasonWindow: ['Spring'],
    notes: 'Soil temperature is the primary trigger. Fruits when soil reaches 50–55°F after spring rains.',
  },
  {
    speciesId: 'sp-chanterelle',
    commonName: 'Chanterelle',
    triggers: {
      minRainfallInches: 2.0,
      rainfallWindowDays: 5,
      minTempF: 70,
      minHumidity: 70,
      minSoilTempF: 60,
    },
    seasonWindow: ['Summer', 'Fall'],
    notes: 'Requires sustained summer heat and heavy rain. Typically 2–3 weeks after significant rainfall.',
  },
  {
    speciesId: 'sp-chicken-of-the-woods',
    commonName: 'Chicken of the Woods',
    triggers: {
      minRainfallInches: 1.5,
      rainfallWindowDays: 7,
      minTempF: 65,
      minHumidity: 65,
    },
    seasonWindow: ['Summer', 'Fall'],
    notes: 'Fruits on dead or dying hardwoods after warm rains. Can appear rapidly (within days of rain).',
  },
  {
    speciesId: 'sp-hen-of-the-woods',
    commonName: 'Hen of the Woods / Maitake',
    triggers: {
      minRainfallInches: 2.0,
      rainfallWindowDays: 7,
      minTempF: 55,
      minHumidity: 65,
      minSoilTempF: 55,
    },
    seasonWindow: ['Fall'],
    notes: 'Fruits at the base of oaks in fall. Triggered by cooling temperatures and autumn rains.',
  },
  {
    speciesId: 'sp-lions-mane',
    commonName: "Lion's Mane",
    triggers: {
      minRainfallInches: 1.5,
      rainfallWindowDays: 7,
      minTempF: 55,
      minHumidity: 70,
    },
    seasonWindow: ['Fall'],
    notes: 'Prefers cool, humid conditions on wounded hardwoods. Often fruits after first cool rains of autumn.',
  },
  {
    speciesId: 'sp-oyster-mushroom',
    commonName: 'Oyster Mushroom',
    triggers: {
      minRainfallInches: 1.0,
      rainfallWindowDays: 5,
      minTempF: 45,
      minHumidity: 60,
    },
    seasonWindow: ['Spring', 'Fall', 'Winter'],
    notes: 'One of the most cold-tolerant species. Can fruit in winter after rain when temps are above freezing.',
  },
  {
    speciesId: 'sp-black-trumpet',
    commonName: 'Black Trumpet',
    triggers: {
      minRainfallInches: 2.5,
      rainfallWindowDays: 5,
      minTempF: 70,
      minHumidity: 75,
    },
    seasonWindow: ['Summer', 'Fall'],
    notes: 'Requires very wet conditions. Fruits in mossy, shaded areas near oaks and beeches after heavy summer rain.',
  },
  {
    speciesId: 'sp-honey-mushroom',
    commonName: 'Honey Mushroom',
    triggers: {
      minRainfallInches: 2.0,
      rainfallWindowDays: 7,
      minTempF: 55,
      minHumidity: 65,
    },
    seasonWindow: ['Fall'],
    notes: 'Fruits in large clusters on dead wood in fall. Triggered by cooling temps and autumn moisture.',
  },
  {
    speciesId: 'sp-reishi',
    commonName: 'Reishi',
    triggers: {
      minRainfallInches: 1.5,
      rainfallWindowDays: 10,
      minTempF: 65,
      minHumidity: 70,
    },
    seasonWindow: ['Summer', 'Fall'],
    notes: 'Perennial fruiting body that adds growth layers in warm, humid conditions on hemlock logs.',
  },
  {
    speciesId: 'sp-puffball-giant',
    commonName: 'Giant Puffball',
    triggers: {
      minRainfallInches: 2.0,
      rainfallWindowDays: 7,
      minTempF: 60,
      minHumidity: 65,
    },
    seasonWindow: ['Summer', 'Fall'],
    notes: 'Fruits in open meadows and forest edges after sustained rain. Can grow very rapidly.',
  },
  {
    speciesId: 'sp-indigo-milk-cap',
    commonName: 'Indigo Milk Cap',
    triggers: {
      minRainfallInches: 2.0,
      rainfallWindowDays: 5,
      minTempF: 70,
      minHumidity: 70,
      minSoilTempF: 60,
    },
    seasonWindow: ['Summer', 'Fall'],
    notes: 'Mycorrhizal with oaks and pines. Fruits after heavy summer rains in well-drained acidic soils.',
  },
  {
    speciesId: 'sp-shaggy-mane',
    commonName: 'Shaggy Mane',
    triggers: {
      minRainfallInches: 1.5,
      rainfallWindowDays: 5,
      minTempF: 55,
      minHumidity: 60,
    },
    seasonWindow: ['Fall'],
    notes: 'Fruits in disturbed ground (lawns, paths, gravel) after fall rains. Deliquesces rapidly after maturity.',
  },
  {
    speciesId: 'sp-bear-head-tooth',
    commonName: "Bear's Head Tooth",
    triggers: {
      minRainfallInches: 1.5,
      rainfallWindowDays: 7,
      minTempF: 55,
      minHumidity: 70,
    },
    seasonWindow: ['Fall'],
    notes: 'Similar conditions to Lion\'s Mane. Fruits on dead hardwood in cool, humid fall weather.',
  },
  {
    speciesId: 'sp-dryads-saddle',
    commonName: "Dryad's Saddle / Pheasant Back",
    triggers: {
      minRainfallInches: 1.0,
      rainfallWindowDays: 7,
      minTempF: 50,
      minHumidity: 55,
    },
    seasonWindow: ['Spring', 'Summer'],
    notes: 'One of the earliest spring fungi. Fruits on dead hardwood as temperatures warm in spring.',
  },
  {
    speciesId: 'sp-two-colored-bolete',
    commonName: 'Two-Colored Bolete',
    triggers: {
      minRainfallInches: 2.0,
      rainfallWindowDays: 5,
      minTempF: 70,
      minHumidity: 70,
      minSoilTempF: 60,
    },
    seasonWindow: ['Summer', 'Fall'],
    notes: 'Mycorrhizal with oaks. Fruits in summer heat after heavy rain events.',
  },
];
