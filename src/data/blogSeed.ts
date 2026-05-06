/**
 * ForageWise — Blog Seed Data
 *
 * Initial curated articles for the Blog Feed covering foraging topics
 * relevant to Tennessee: poisonous mushrooms, tree-mushroom associations,
 * seasonal foraging guides, and plant identification tips.
 *
 * All content is paraphrased from academic and authoritative sources.
 * Each article includes proper attribution via ArticleSource entries.
 *
 * SAFETY: All article text is validated against containsBannedPhrase() at
 * the bottom of this file. No article may contain "safe to eat",
 * "definitely edible", "confirmed edible", or "AI verified".
 *
 * Requirements: 2.1, 2.2, 2.4, 2.6, 2.7, 2.8
 */

import type { BlogArticle } from '@/types';
import { containsBannedPhrase } from '@/utils/safetyLanguage';

export const blogSeed: BlogArticle[] = [
  // =========================================================================
  // Article 1: Common Poisonous Mushrooms in Tennessee
  // =========================================================================
  {
    id: 'blog-poisonous-mushrooms-tn',
    title: 'Common Poisonous Mushrooms in Tennessee: What Every Forager Should Know',
    author: 'ForageWise Editorial',
    publishedAt: '2025-01-15T09:00:00Z',
    summary:
      'An overview of the most frequently encountered toxic mushroom species in Tennessee forests, including identification features and the dangers they pose.',
    body: `## Why Knowing Toxic Species Matters

Tennessee's diverse hardwood forests support hundreds of mushroom species, and a meaningful number of those are toxic. Misidentification is the leading cause of mushroom poisoning incidents across the southeastern United States. Before foraging any wild mushroom, learning to recognize the most dangerous species in your area is essential.

**Always verify any wild mushroom identification with a qualified expert before consuming.**

## Amanita phalloides — The Death Cap

The Death Cap (*Amanita phalloides*) is responsible for the majority of fatal mushroom poisonings worldwide. While not historically native to Tennessee, it has been documented in association with imported ornamental trees in urban and suburban areas across the southeastern U.S. It features a greenish-yellow to olive cap, white gills, a skirt-like ring on the stem, and a cup-shaped volva at the base. Symptoms of poisoning may not appear for 6–12 hours after ingestion, by which time significant liver damage can occur.

Content derived from cited sources and paraphrased for educational use.

## Amanita bisporigera — The Destroying Angel

The Destroying Angel (*Amanita bisporigera*) is an all-white Amanita species found throughout Tennessee's hardwood forests from summer through fall. Its entirely white appearance — cap, gills, stem, ring, and volva — can cause it to be confused with edible species like meadow mushrooms or puffballs in their button stage. Like the Death Cap, it contains amatoxins that cause delayed-onset liver failure. Digging up the base of any white mushroom to check for a volva is a critical identification step.

Content derived from cited sources and paraphrased for educational use.

## Galerina marginata — The Deadly Galerina

The Deadly Galerina (*Galerina marginata*) is a small, brown, wood-rotting mushroom found on decaying logs and stumps across Tennessee. It contains the same amatoxins as the Death Cap and Destroying Angel. Its modest appearance and growth on wood can lead to confusion with desirable species like Honey Mushrooms (*Armillaria mellea*). Key distinguishing features include a rusty-brown spore print and a thin, fragile ring on the stem.

Content derived from cited sources and paraphrased for educational use.

## Jack O'Lantern — Omphalotus olearius

The Jack O'Lantern (*Omphalotus olearius*) is a bright orange mushroom that grows in dense clusters at the base of hardwood trees and stumps. It is one of the most common causes of non-fatal mushroom poisoning in Tennessee because foragers mistake it for Chanterelles. Unlike Chanterelles, Jack O'Lanterns have true, sharp-edged gills (not blunt ridges), grow in tight clusters from wood, and their gills may exhibit faint bioluminescence in complete darkness.

Content derived from cited sources and paraphrased for educational use.

## Key Takeaways

- Never rely on a single identification feature. Cross-reference cap, gills, stem, spore print, habitat, and season.
- When in doubt, leave it. No wild mushroom meal is worth the risk of poisoning.
- Carry a field guide and consult a qualified mycologist or experienced forager for verification.
- If poisoning is suspected, seek emergency medical attention immediately and bring a sample of the mushroom if possible.`,
    tags: ['safety', 'poisonous-mushrooms', 'identification', 'tennessee'],
    sources: [
      {
        name: 'North American Mycological Association — Mushroom Poisoning Syndromes',
        author: 'NAMA Toxicology Committee',
        publication: 'North American Mycological Association',
        url: 'https://namyco.org/mushroom_poisoning_syndromes.php',
      },
      {
        name: 'Mushrooms of the Southeastern United States',
        author: 'Alan E. Bessette, William C. Roody, Arleen R. Bessette, Dail L. Dunaway',
        publication: 'Syracuse University Press',
        url: 'https://press.syr.edu/supressbooks/isbn-13/9780815631125/',
      },
      {
        name: 'Amatoxin Poisoning — Clinical Features and Treatment',
        publication: 'Centers for Disease Control and Prevention',
        url: 'https://www.cdc.gov/mmwr/volumes/72/wr/mm7236a1.htm',
      },
    ],
    lastUpdated: '2025-01-15T09:00:00Z',
  },

  // =========================================================================
  // Article 2: Tree-Mushroom Associations in Tennessee
  // =========================================================================
  {
    id: 'blog-tree-mushroom-associations',
    title: 'Tree-Mushroom Associations: How Tennessee Trees Guide Your Foraging',
    author: 'ForageWise Editorial',
    publishedAt: '2025-01-22T09:00:00Z',
    summary:
      'Understanding mycorrhizal and saprotrophic relationships between Tennessee trees and mushrooms can dramatically improve your ability to locate target species.',
    body: `## The Hidden Network Beneath the Forest Floor

Most forest mushrooms do not grow randomly. They form specific ecological relationships with trees — either mycorrhizal partnerships where both organisms benefit, or saprotrophic relationships where fungi decompose dead wood. Learning which trees associate with which mushrooms is one of the most practical skills a forager can develop.

**Always verify any wild mushroom identification with a qualified expert before consuming.**

## Oaks and Their Fungal Partners

Oaks (*Quercus* spp.) are the most important mycorrhizal partners for foragers in Tennessee. The state's abundant White Oaks, Red Oaks, and Chestnut Oaks support a wide range of prized species. Hen of the Woods (*Grifola frondosa*) fruits reliably at the base of mature oaks each fall. Chanterelles (*Cantharellus cibarius*) form mycorrhizal bonds with oak roots and fruit on well-drained slopes during summer rains. Chicken of the Woods (*Laetiporus sulphureus*) is a saprotroph that commonly colonizes dead or dying oak trunks and stumps.

Content derived from cited sources and paraphrased for educational use.

## Tulip Poplars and Morels

The Tulip Poplar (*Liriodendron tulipifera*), Tennessee's state tree, is strongly associated with Morel mushrooms (*Morchella* spp.) during spring. Experienced foragers in Tennessee often begin their morel searches by locating stands of mature tulip poplars, particularly on south-facing slopes where soil warms earliest. Morels also associate with ash, elm, and old apple trees, but the tulip poplar connection is especially reliable in the Tennessee landscape.

Content derived from cited sources and paraphrased for educational use.

## Beeches, Maples, and Lion's Mane

American Beech (*Fagus grandifolia*) and Sugar Maple (*Acer saccharum*) are common hosts for Lion's Mane (*Hericium erinaceus*), which fruits from wounds and dead sections on living or recently fallen trunks. These trees are widespread in Tennessee's mesic hardwood forests, particularly in the Cumberland Plateau and Great Smoky Mountains regions. Look for the distinctive white, cascading-spine fruiting bodies 1–3 meters up on trunks from late summer through fall.

Content derived from cited sources and paraphrased for educational use.

## Hemlocks and Reishi

Eastern Hemlock (*Tsuga canadensis*), found in Tennessee's higher-elevation ravines and stream corridors, is the primary host for Reishi (*Ganoderma tsugae*). The distinctive lacquered, kidney-shaped brackets appear on dead hemlock logs and stumps. Note that Tennessee's hemlock populations have been significantly impacted by the Hemlock Woolly Adelgid, which has created abundant dead wood substrate for saprotrophic fungi.

Content derived from cited sources and paraphrased for educational use.

## Practical Tips for Tree-Based Foraging

- Learn to identify 5–6 key tree species by bark and leaf before focusing on mushrooms.
- Map the locations of mature oaks, tulip poplars, and beeches in your favorite parks.
- Return to productive trees across seasons — many mycorrhizal species fruit in the same location year after year.
- Dead and dying trees are just as important as living ones for saprotrophic species.`,
    tags: ['tree-associations', 'mycorrhizal', 'identification', 'tennessee', 'ecology'],
    sources: [
      {
        name: 'Mycorrhizal Symbiosis (3rd Edition)',
        author: 'Sally E. Smith, David J. Read',
        publication: 'Academic Press',
        url: 'https://www.elsevier.com/books/mycorrhizal-symbiosis/smith/978-0-12-370526-6',
      },
      {
        name: 'Trees of Tennessee',
        publication: 'University of Tennessee Extension',
        url: 'https://extension.tennessee.edu/publications/Documents/PB1561.pdf',
      },
      {
        name: 'Mushrooms of the Southeastern United States',
        author: 'Alan E. Bessette, William C. Roody, Arleen R. Bessette, Dail L. Dunaway',
        publication: 'Syracuse University Press',
        url: 'https://press.syr.edu/supressbooks/isbn-13/9780815631125/',
      },
    ],
    lastUpdated: '2025-01-22T09:00:00Z',
  },

  // =========================================================================
  // Article 3: Seasonal Foraging Guide — Spring in Tennessee
  // =========================================================================
  {
    id: 'blog-spring-foraging-guide',
    title: 'Spring Foraging in Tennessee: A Seasonal Guide',
    author: 'ForageWise Editorial',
    publishedAt: '2025-02-05T09:00:00Z',
    summary:
      'A guide to spring foraging in Tennessee covering morels, ramps, and other early-season species, with tips on timing, habitat, and responsible harvesting.',
    body: `## Spring Awakens the Forest Floor

Spring is the most anticipated foraging season in Tennessee. As soil temperatures climb past 50°F and spring rains saturate the forest floor, a succession of prized species begins to emerge. The window is relatively short — roughly late March through mid-May — making timing and preparation essential.

**Always verify any wild mushroom or plant identification with a qualified expert before consuming.**

## Morels: Tennessee's Spring Prize

Morels (*Morchella* spp.) are the defining species of Tennessee spring foraging. They typically begin appearing in West and Middle Tennessee in late March, with East Tennessee following 2–3 weeks later as elevation delays soil warming. Key habitat indicators include south-facing slopes, recently disturbed ground, and proximity to tulip poplars, ash, elm, and old apple trees.

The honeycomb-patterned cap and completely hollow interior (when sliced lengthwise) are the primary identification features. False morels (*Gyromitra* spp.) have wrinkled or brain-like caps and are not hollow inside — they contain cottony or chambered tissue. False morels contain gyromitrin, a compound that can cause serious illness.

Content derived from cited sources and paraphrased for educational use.

## Ramps: The Wild Leek

Ramps (*Allium tricoccum*) are among the first wild plants to emerge in Tennessee's rich, moist hardwood forests in early spring. They are recognized by their broad, smooth, lily-of-the-valley-like leaves and strong garlic-onion aroma. Ramps grow in dense colonies in cove forests and along stream banks, particularly in East Tennessee's mountain regions.

Responsible harvesting is critical — ramp populations can be depleted by over-collection. The general guideline is to harvest no more than 10–15% of a colony, and to take only one leaf per plant rather than uprooting the bulb. Some Tennessee state parks prohibit ramp collection entirely; always check park regulations before harvesting.

Content derived from cited sources and paraphrased for educational use.

## Other Spring Species to Watch For

- **Dryad's Saddle** (*Cerioporus squamosus*): Large, scaly-capped brackets on dead hardwood, often among the first spring fungi to appear.
- **Oyster Mushrooms** (*Pleurotus ostreatus*): Continue from winter into spring on dead hardwood logs, especially after rain.
- **Redbud flowers**: The pink-purple flowers of the Eastern Redbud tree are a traditional spring forage in the region.
- **Violets** (*Viola* spp.): Common in lawns and forest edges; both leaves and flowers have a long history of culinary use.

## Spring Foraging Safety Reminders

- Poison Hemlock (*Conium maculatum*) emerges in spring and can resemble wild carrot or parsley. It is extremely toxic. Learn to identify its purple-blotched stems and musty odor.
- Ticks become active in spring. Wear long sleeves, use repellent, and check thoroughly after each outing.
- Spring weather in Tennessee is unpredictable. Carry rain gear and be prepared for rapid temperature changes.
- Always forage with a buddy or share your location with someone who knows your plans.`,
    tags: ['seasonal-guide', 'spring', 'morels', 'ramps', 'tennessee'],
    sources: [
      {
        name: 'Morels of the Mid-South',
        author: 'Michael Kuo',
        publication: 'MushroomExpert.Com',
        url: 'https://www.mushroomexpert.com/morchella.html',
      },
      {
        name: 'Ramps: The Wild Leek — Sustainable Harvesting Guidelines',
        publication: 'Appalachian Sustainable Development',
        url: 'https://asd.org/',
      },
      {
        name: 'Tennessee Wildflowers and Foraging Calendar',
        publication: 'Tennessee Department of Environment and Conservation',
        url: 'https://www.tn.gov/environment.html',
      },
    ],
    lastUpdated: '2025-02-05T09:00:00Z',
  },

  // =========================================================================
  // Article 4: Plant Identification Tips for Tennessee Foragers
  // =========================================================================
  {
    id: 'blog-plant-identification-tips',
    title: 'Plant Identification Tips for Tennessee Foragers',
    author: 'ForageWise Editorial',
    publishedAt: '2025-02-12T09:00:00Z',
    summary:
      'Practical tips for identifying wild plants in Tennessee, including key features to observe, common look-alike dangers, and resources for building your skills.',
    body: `## Building Plant Identification Skills

Identifying wild plants accurately requires patience, practice, and a systematic approach. Unlike mushrooms, plants offer a wider range of observable features — leaves, stems, flowers, fruits, roots, and growth habit — which can be both an advantage and a source of confusion. This guide covers practical techniques for improving your plant identification in Tennessee's diverse habitats.

**Always verify any wild plant identification with a qualified expert before consuming.**

## Start with Leaf Characteristics

Leaves are often the most accessible and informative feature for plant identification. Key characteristics to observe include:

- **Arrangement**: Are leaves alternate (staggered along the stem), opposite (paired at each node), or whorled (three or more at each node)?
- **Shape**: Is the leaf simple (one blade) or compound (divided into leaflets)? What is the overall outline — ovate, lanceolate, palmate, pinnate?
- **Margins**: Are the leaf edges smooth (entire), toothed (serrate), or lobed?
- **Texture and surface**: Is the leaf smooth, hairy, waxy, or rough?

These four characteristics alone can narrow your identification significantly before you even consider flowers or fruit.

Content derived from cited sources and paraphrased for educational use.

## Dangerous Look-Alikes in Tennessee

Several toxic plants in Tennessee closely resemble species with a history of culinary or medicinal use. Learning these dangerous pairs is a priority:

- **Poison Hemlock** (*Conium maculatum*) vs. Wild Carrot (*Daucus carota*): Both have white, umbrella-shaped flower clusters and finely divided leaves. Poison Hemlock has smooth, purple-blotched stems and a musty odor, while Wild Carrot has hairy stems and a carrot-like scent.
- **Pokeweed** (*Phytolacca americana*): Young pokeweed shoots have a long history of traditional preparation, but the plant becomes increasingly toxic as it matures. Berries, roots, and mature stems contain phytolaccatoxin. This is not a species for beginners.
- **Virginia Creeper** (*Parthenocissus quinquefolia*) vs. Poison Ivy (*Toxicodendron radicans*): Virginia Creeper has five leaflets; Poison Ivy has three. The classic rule "leaves of three, let it be" remains valuable, but learning both species thoroughly prevents unnecessary avoidance of harmless plants.

Content derived from cited sources and paraphrased for educational use.

## Practical Field Techniques

1. **Photograph systematically**: Capture the whole plant, a close-up of the leaf (top and bottom), the stem, any flowers or fruit, and the habitat context. These photos are invaluable for later verification.
2. **Use multiple references**: Cross-check your identification against at least two independent field guides or authoritative sources. No single guide covers every variation.
3. **Note the habitat**: Many plants are habitat-specific. A species found in a dry cedar glade is unlikely to be the same as one in a moist cove forest, even if they look similar.
4. **Learn plant families first**: Recognizing plant families (e.g., the carrot family Apiaceae, the mint family Lamiaceae) gives you a framework that speeds up identification of individual species.
5. **Smell carefully**: Many plants have distinctive aromas. Crush a small piece of leaf between your fingers (after confirming it is not a contact-irritant species) and note the scent.

## Recommended Resources

- *Newcomb's Wildflower Guide* by Lawrence Newcomb — a key-based approach well-suited to the southeastern U.S.
- *Botany in a Day* by Thomas J. Elpel — an excellent introduction to plant family recognition.
- University of Tennessee Herbarium online database — regional specimen records and distribution maps.
- Local foraging groups and mycological societies often include plant-focused members who can provide in-person mentorship.`,
    tags: ['plant-identification', 'safety', 'tennessee', 'field-skills', 'look-alikes'],
    sources: [
      {
        name: 'Newcomb\'s Wildflower Guide',
        author: 'Lawrence Newcomb',
        publication: 'Little, Brown and Company',
        url: 'https://www.hachettebookgroup.com/titles/lawrence-newcomb/newcombs-wildflower-guide/9780316604420/',
      },
      {
        name: 'Botany in a Day: The Patterns Method of Plant Identification',
        author: 'Thomas J. Elpel',
        publication: 'HOPS Press',
        url: 'https://www.wildflowers-and-weeds.com/Plant_Identification/botany_in_a_day.htm',
      },
      {
        name: 'Poisonous Plants of the Southeastern United States',
        publication: 'North Carolina State University Extension',
        url: 'https://plants.ces.ncsu.edu/plants/category/poisonous-to-humans/',
      },
      {
        name: 'University of Tennessee Herbarium',
        publication: 'University of Tennessee, Knoxville',
        url: 'https://herbarium.utk.edu/',
      },
    ],
    lastUpdated: '2025-02-12T09:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Build-time validation: ensure no article text contains banned safety phrases
// ---------------------------------------------------------------------------
const allArticleText = blogSeed.flatMap((article) => [
  article.title,
  article.summary,
  article.body,
  ...article.sources.map((s) => s.name),
]);

for (const text of allArticleText) {
  const banned = containsBannedPhrase(text);
  if (banned) {
    throw new Error(
      `Blog article contains banned phrase "${banned}": "${text.slice(0, 80)}…"`,
    );
  }
}
