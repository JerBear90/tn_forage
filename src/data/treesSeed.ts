/**
 * ForageFlow — Tennessee Tree Seed Data
 *
 * Local seed data for tree species commonly found in Tennessee.
 * This data is loaded into IndexedDB on first run.
 *
 * Trees are used for habitat association — many mushroom species
 * have mycorrhizal relationships with specific tree species.
 */

import type { Tree } from '@/types';

export const treesSeed: Tree[] = [
  {
    id: 'tr-white-oak',
    commonName: 'White Oak',
    scientificName: 'Quercus alba',
    images: ['/images/species/tr-white-oak.jpg'],
    habitat: 'Found in well-drained upland forests, ridges, and slopes throughout Tennessee. One of the most common and important hardwoods in the eastern United States.',
    barkDescription: 'Light gray, scaly, with loose, flaky plates. Bark becomes more deeply furrowed with age.',
    leafDescription: 'Leaves are 12–22 cm long with 7–9 rounded lobes (no bristle tips). Bright green above, pale below. Turns reddish-brown to wine-red in fall.',
    shapeDescription: 'Broad, rounded crown with wide-spreading branches. Can grow 20–30 meters tall. Massive trunk in mature specimens.',
    associatedSpecies: [
      'Chicken of the Woods',
      'Hen of the Woods / Maitake',
      'Chanterelle',
      'Destroying Angel',
    ],
    region: 'Tennessee',
    lastUpdated: '2024-01-15',
  },
  {
    id: 'tr-tulip-poplar',
    commonName: 'Tulip Poplar',
    scientificName: 'Liriodendron tulipifera',
    images: ['/images/species/tr-tulip-poplar.jpg'],
    habitat: 'Found in rich, moist coves, bottomlands, and well-drained slopes. Tennessee\'s state tree. One of the tallest eastern hardwoods, often dominant in cove forests.',
    barkDescription: 'Young bark is smooth and greenish-gray. Mature bark is thick, deeply furrowed with interlacing ridges, gray-brown.',
    leafDescription: 'Leaves are distinctive — 10–15 cm long, with four lobes and a flat or notched tip (looks like a tulip silhouette). Bright green, turning golden-yellow in fall.',
    shapeDescription: 'Tall, straight trunk with a narrow, oval crown. Can grow 30–50 meters tall. Self-prunes lower branches, leaving a clean trunk.',
    associatedSpecies: [
      'Morel',
      'Chanterelle',
      'Oyster Mushroom',
    ],
    region: 'Tennessee',
    lastUpdated: '2024-01-15',
  },
  {
    id: 'tr-eastern-hemlock',
    commonName: 'Eastern Hemlock',
    scientificName: 'Tsuga canadensis',
    images: ['/images/species/tr-eastern-hemlock.jpg'],
    habitat: 'Found in cool, moist ravines, north-facing slopes, and along streams in the mountains of East Tennessee. Shade-tolerant evergreen. Threatened by the hemlock woolly adelgid.',
    barkDescription: 'Young bark is reddish-brown and scaly. Mature bark is thick, deeply furrowed, with broad, flat ridges. Dark brown to gray.',
    leafDescription: 'Needles are short (8–15 mm), flat, dark green above with two white stripes below. Attached by tiny stalks. Arranged in flat sprays.',
    shapeDescription: 'Graceful, pyramidal shape with drooping branch tips and a nodding leader (top). Can grow 20–30 meters tall. Dense, dark canopy.',
    associatedSpecies: [
      'Reishi',
      'Hemlock Varnish Shelf',
    ],
    region: 'Tennessee',
    lastUpdated: '2024-01-15',
  },
  {
    id: 'tr-shagbark-hickory',
    commonName: 'Shagbark Hickory',
    scientificName: 'Carya ovata',
    images: ['/images/species/tr-shagbark-hickory.jpg'],
    habitat: 'Found in upland forests, ridges, and well-drained slopes. Common throughout Tennessee. Often grows with oaks in mixed hardwood forests.',
    barkDescription: 'Highly distinctive — long, loose strips of gray bark that curve away from the trunk at both ends, giving a shaggy appearance. Unmistakable in mature trees.',
    leafDescription: 'Compound leaves with 5 leaflets (occasionally 7). Terminal three leaflets are larger. Leaflets are 10–20 cm long, finely toothed. Turns golden-yellow in fall.',
    shapeDescription: 'Tall, straight trunk with a narrow, oblong crown. Can grow 20–30 meters tall. Open crown in forest settings.',
    associatedSpecies: [
      'Chanterelle',
      'Hen of the Woods / Maitake',
      'Old Man of the Woods',
    ],
    region: 'Tennessee',
    lastUpdated: '2024-01-15',
  },
  {
    id: 'tr-american-beech',
    commonName: 'American Beech',
    scientificName: 'Fagus grandifolia',
    images: ['/images/species/tr-american-beech.jpg'],
    habitat: 'Found in rich, moist forests, coves, and bottomlands. Shade-tolerant and often dominant in mature forests. Common throughout Tennessee.',
    barkDescription: 'Smooth, light gray bark that remains smooth even on mature trees. One of the easiest trees to identify by bark alone.',
    leafDescription: 'Leaves are 6–12 cm long, elliptical, with coarse, pointed teeth. Dark green and papery. Marcescent — dead leaves often persist through winter, rustling in the wind.',
    shapeDescription: 'Broad, rounded crown with low-spreading branches. Can grow 20–25 meters tall. Dense shade beneath canopy.',
    associatedSpecies: [
      'Chanterelle',
      'Lion\'s Mane',
      'Hen of the Woods / Maitake',
      'Destroying Angel',
    ],
    region: 'Tennessee',
    lastUpdated: '2024-01-15',
  },
  {
    id: 'tr-red-maple',
    commonName: 'Red Maple',
    scientificName: 'Acer rubrum',
    images: ['/images/species/tr-red-maple.jpg'],
    habitat: 'Found in a wide variety of habitats — swamps, bottomlands, upland forests, and disturbed areas. One of the most adaptable and widespread trees in eastern North America.',
    barkDescription: 'Young bark is smooth and light gray. Mature bark develops scaly, irregular plates that are dark gray. Less deeply furrowed than sugar maple.',
    leafDescription: 'Leaves have 3–5 lobes with serrated (toothed) margins and V-shaped sinuses. 6–10 cm long. Red petioles (leaf stalks). Brilliant red, orange, or yellow fall color.',
    shapeDescription: 'Variable — rounded to oval crown. Can grow 18–27 meters tall. Often has multiple leaders. Red flowers, seeds, and fall color give it its name.',
    associatedSpecies: [
      'Lion\'s Mane',
      'Turkey Tail',
      'Oyster Mushroom',
    ],
    region: 'Tennessee',
    lastUpdated: '2024-01-15',
  },
];
