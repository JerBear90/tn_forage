import type { BlogArticle } from '@/types';

/**
 * Seed blog articles about Tennessee foraging.
 * Sources are from academic/government publications.
 */
export const seedBlogArticles: BlogArticle[] = [
  {
    id: 'tn-spring-edible-plants',
    title: 'Spring Edible Plants of Tennessee: A Seasonal Guide',
    author: 'ForageWise Editorial',
    publishedAt: '2025-03-15T10:00:00Z',
    summary: 'Discover the most common spring edible plants found across Tennessee, from ramps in the Smoky Mountains to chickweed in urban lawns. Learn where to look and how to identify them responsibly.',
    body: `# Spring Edible Plants of Tennessee

Tennessee's diverse ecosystems — from the Cumberland Plateau to the Mississippi River bottomlands — support a wide variety of spring edible plants. As temperatures rise in March and April, foragers can find an abundance of wild greens emerging across the state.

<img src="https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=700&q=75" alt="Wild ramps growing in a forest floor" style="width:100%;border-radius:12px;margin:16px 0" />

## Ramps (Allium tricoccum)

Ramps are among the most sought-after spring wild edibles in East Tennessee. Found in rich, moist deciduous forests at higher elevations, they emerge in late March through April. Their broad, smooth leaves and strong garlic-onion aroma make them relatively easy to identify.

**Important:** Ramps resemble lily-of-the-valley (Convallaria majalis), which is toxic. Always confirm the characteristic onion/garlic smell before harvesting. Sustainable harvesting means taking only one leaf per plant and never pulling the bulb.

## Chickweed (Stellaria media)

One of the earliest spring greens, chickweed appears in lawns, gardens, and disturbed areas statewide. Look for its small white star-shaped flowers and single line of hairs running along the stem. It has a mild, pleasant flavor similar to spinach.

<img src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=75" alt="Spring wildflowers in Tennessee woodland" style="width:100%;border-radius:12px;margin:16px 0" />

## Henbit (Lamium amplexicaule)

A member of the mint family, henbit is abundant in Tennessee yards and fields from February onward. Its square stems and purple tubular flowers are distinctive. The leaves and flowers are edible raw or cooked.

## Violets (Viola spp.)

Common blue violets carpet Tennessee woodlands and lawns in spring. Both leaves and flowers are edible and high in vitamin C. They make attractive additions to salads or can be used to make violet jelly.

## Responsible Foraging Practices

- Always obtain permission before foraging on private land
- Follow Tennessee state park regulations (collecting is generally prohibited)
- Never harvest more than 10% of a plant population
- Learn to identify toxic lookalikes before consuming any wild plant
- Consider taking a guided walk with a local mycological or botanical society`,
    coverImage: 'https://images.unsplash.com/photo-1462275646964-a0e3c11f18a6?w=800&q=80',
    tags: ['spring', 'edible plants', 'Tennessee', 'foraging basics'],
    sources: [
      {
        name: 'Native Plants of Tennessee',
        author: 'University of Tennessee Extension',
        url: 'https://extension.tennessee.edu',
      },
      {
        name: 'Tennessee Wildflowers',
        publication: 'Tennessee Department of Environment and Conservation',
        url: 'https://www.tn.gov/environment',
      },
    ],
    lastUpdated: '2025-03-15T10:00:00Z',
    readTimeMinutes: 5,
  },
  {
    id: 'tn-mushroom-foraging-safety',
    title: 'Mushroom Foraging in Tennessee: Identification and Safety',
    author: 'ForageWise Editorial',
    publishedAt: '2025-04-02T08:30:00Z',
    summary: 'Tennessee forests host hundreds of mushroom species. This guide covers the most recognizable edible species, their dangerous lookalikes, and essential safety practices for new foragers.',
    body: `# Mushroom Foraging in Tennessee

Tennessee's humid climate and diverse hardwood forests create ideal conditions for fungi. While the state hosts many edible species, it also harbors deadly lookalikes. Proper identification is critical.

<img src="https://images.unsplash.com/photo-1611843467160-25afb8df1074?w=700&q=75" alt="Wild morel mushrooms growing in forest" style="width:100%;border-radius:12px;margin:16px 0" />

## Morels (Morchella spp.)

Morels are Tennessee's most popular wild mushroom, fruiting from late March through May. They prefer areas around dead or dying elm, ash, tulip poplar, and apple trees. Their distinctive honeycomb-patterned cap is hollow when sliced lengthwise.

**Toxic lookalike:** False morels (Gyromitra spp.) have wrinkled, brain-like caps rather than true honeycomb pits. They contain gyromitrin, which can cause serious illness. Always slice specimens lengthwise — true morels are completely hollow inside.

## Chicken of the Woods (Laetiporus spp.)

This bright orange and yellow shelf fungus grows on dead or dying hardwoods from spring through fall. Its layered, fan-shaped brackets are hard to mistake when fresh. It should only be harvested from hardwoods — specimens on conifers or eucalyptus may cause reactions.

<img src="https://images.unsplash.com/photo-1563910431092-e4d4d456e3b1?w=700&q=75" alt="Orange shelf fungi growing on a tree trunk" style="width:100%;border-radius:12px;margin:16px 0" />

## Chanterelles (Cantharellus cibarius)

Golden chanterelles fruit in Tennessee from June through September in oak-hickory forests. They have false gills (blunt ridges rather than blade-like gills) and a fruity apricot-like aroma.

**Toxic lookalike:** Jack-o'-lantern mushrooms (Omphalotus olearius) grow in clusters on wood and have true blade-like gills. They cause severe gastrointestinal distress.

## Safety Rules for Mushroom Foraging

- Never eat a mushroom you cannot identify with 100% certainty
- Use multiple field guides and cross-reference characteristics
- Start with easily identifiable species that have few lookalikes
- Cook all wild mushrooms thoroughly before eating
- Save a specimen of anything you consume in case of adverse reaction
- Join the Tennessee Valley Mushroom Society or similar local group for guided forays
- When in doubt, throw it out

## Tennessee Poisonous Species to Know

Destroying angel (Amanita bisporigera) and death cap (Amanita phalloides) are both present in Tennessee. These all-white or greenish-capped mushrooms cause fatal liver failure. Learn to recognize Amanita features: free gills, a ring on the stem, a volva (cup) at the base, and white spore print.`,
    coverImage: 'https://images.unsplash.com/photo-1504198266287-1659872e6590?w=800&q=80',
    tags: ['mushrooms', 'safety', 'identification', 'Tennessee'],
    sources: [
      {
        name: 'Mushrooms of the Southeastern United States',
        author: 'Alan Bessette et al.',
        publication: 'Syracuse University Press',
      },
      {
        name: 'Poisonous Plants and Fungi in Tennessee',
        publication: 'Tennessee Poison Center, Vanderbilt University Medical Center',
        url: 'https://www.tnpoisoncenter.org',
      },
    ],
    lastUpdated: '2025-04-02T08:30:00Z',
    readTimeMinutes: 7,
  },
  {
    id: 'tn-foraging-regulations',
    title: 'Tennessee Foraging Laws: What You Need to Know',
    author: 'ForageWise Editorial',
    publishedAt: '2025-04-20T09:00:00Z',
    summary: 'Understanding Tennessee regulations around wild plant harvesting on public lands, state parks, national forests, and private property. Stay legal while enjoying wild foods.',
    body: `# Tennessee Foraging Laws and Regulations

Before heading out to forage in Tennessee, it is essential to understand the legal framework governing wild plant collection on different types of land.

<img src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&q=75" alt="Tennessee state park forest trail" style="width:100%;border-radius:12px;margin:16px 0" />

## Tennessee State Parks

Collecting plants, fungi, or any natural materials is generally prohibited in Tennessee State Parks without a special permit. This includes fallen fruits, nuts, and mushrooms. The Tennessee Department of Environment and Conservation enforces these rules to protect park ecosystems.

## Cherokee National Forest

The U.S. Forest Service allows limited personal-use collection of certain non-timber forest products in Cherokee National Forest. This typically includes:

- Berries and nuts for personal consumption
- Limited mushroom collection (usually up to one gallon per person per day)
- Ramps (with quantity limits that vary by ranger district)

Commercial harvesting requires a permit. Always check with the local ranger district for current regulations, as rules can change seasonally.

## Great Smoky Mountains National Park

All plant and fungus collection is strictly prohibited in Great Smoky Mountains National Park. This is federal land managed by the National Park Service, and violations can result in fines up to $5,000.

## Private Land

Foraging on private land requires explicit permission from the landowner. Tennessee trespass laws (T.C.A. § 39-14-405) apply. Even if land appears unoccupied or unused, always obtain written permission.

## Urban Foraging

Collecting from public rights-of-way, city parks, and other municipal land varies by jurisdiction. Many Tennessee cities do not have explicit ordinances about foraging, but it is best to check with local parks departments.

## Best Practices

- Always carry identification and be prepared to explain your activity
- Keep harvest quantities reasonable and clearly for personal use
- Document your permission if foraging on private land
- Stay on designated trails in protected areas
- Report any illegal commercial harvesting you observe`,
    coverImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    tags: ['regulations', 'Tennessee', 'legal', 'state parks'],
    sources: [
      {
        name: 'Tennessee State Parks Rules and Regulations',
        publication: 'Tennessee Department of Environment and Conservation',
        url: 'https://www.tn.gov/environment/program-areas/res-recreation-educational-services/state-parks.html',
      },
      {
        name: 'Non-Timber Forest Products Collection',
        publication: 'USDA Forest Service, Southern Region',
        url: 'https://www.fs.usda.gov/cherokee',
      },
      {
        name: 'Tennessee Code Annotated § 39-14-405',
        publication: 'Tennessee General Assembly',
        url: 'https://www.tn.gov/lawsandregs',
      },
    ],
    lastUpdated: '2025-04-20T09:00:00Z',
    readTimeMinutes: 6,
  },
  {
    id: 'tn-summer-berries-guide',
    title: 'Wild Berries of Tennessee: Summer Identification Guide',
    author: 'ForageWise Editorial',
    publishedAt: '2025-05-10T11:00:00Z',
    summary: 'From blackberries along fence rows to pawpaws in river bottoms, Tennessee offers abundant wild fruit through summer and early fall. Learn to identify common edible berries and their toxic lookalikes.',
    body: `# Wild Berries of Tennessee

Tennessee's long growing season and varied terrain produce an exceptional diversity of wild berries and fruits from June through October.

<img src="https://images.unsplash.com/photo-1501004318855-cdbd882e3534?w=700&q=75" alt="Wild blackberries ripening on the vine" style="width:100%;border-radius:12px;margin:16px 0" />

## Blackberries (Rubus spp.)

The most abundant wild fruit in Tennessee, blackberries grow along roadsides, fence rows, forest edges, and disturbed areas statewide. They ripen from late June through July. Their thorny canes and compound leaves with 3-5 leaflets are distinctive.

**Safety note:** While blackberries themselves have no toxic lookalikes, be cautious of sprayed roadsides and areas treated with herbicides.

## Wineberries (Rubus phoenicolasius)

An introduced species now common in East Tennessee, wineberries have distinctive red-bristled stems and translucent ruby-red fruit. They ripen in July and are considered invasive, so harvesting is encouraged.

## Pawpaws (Asimina triloba)

Tennessee's largest native fruit, pawpaws grow in river bottoms and moist forests across the state. The custard-like flesh ripens in September-October. Their large tropical-looking leaves and maroon flowers make identification straightforward.

## Muscadines (Vitis rotundifolia)

Native wild grapes found throughout Tennessee, muscadines ripen from August through October. They grow as high-climbing vines in forest canopies and edges. Their thick skin and musky flavor distinguish them from other wild grapes.

**Toxic lookalike:** Moonseed (Menispermum canadense) resembles wild grape but has a single crescent-shaped seed rather than multiple round seeds. Its berries are toxic.

## Persimmons (Diospyros virginiana)

American persimmons are common in Tennessee fields and forest edges. The orange fruits ripen after frost in October-November. Unripe persimmons are extremely astringent — wait until they are soft and wrinkled.

## Berries to Avoid

- **Pokeweed berries** (Phytolacca americana) — dark purple clusters, all parts toxic
- **Virginia creeper berries** — blue-black, often confused with wild grape
- **Bittersweet nightshade** (Solanum dulcamara) — red berries in clusters, toxic
- **Holly berries** (Ilex spp.) — bright red, cause vomiting

## Harvesting Tips

- Pick berries in the morning when they are cool and firm
- Bring shallow containers to prevent crushing
- Leave some fruit for wildlife — birds and mammals depend on these food sources
- Wash all berries thoroughly before consuming`,
    coverImage: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=800&q=80',
    tags: ['berries', 'summer', 'fruit', 'identification'],
    sources: [
      {
        name: 'Edible Wild Plants of Tennessee',
        author: 'University of Tennessee Agricultural Extension Service',
        url: 'https://extension.tennessee.edu',
      },
      {
        name: 'Native Fruits of the Southeastern United States',
        publication: 'USDA Natural Resources Conservation Service',
        url: 'https://plants.usda.gov',
      },
    ],
    lastUpdated: '2025-05-10T11:00:00Z',
    readTimeMinutes: 6,
  },
  {
    id: 'tn-medicinal-plants-caution',
    title: 'Medicinal Plants of the Tennessee Woodlands: History and Caution',
    author: 'ForageWise Editorial',
    publishedAt: '2025-05-28T14:00:00Z',
    summary: 'Tennessee has a rich tradition of folk medicine using native plants. This article explores the historical use of woodland medicinals while emphasizing the importance of expert guidance and modern safety considerations.',
    body: `# Medicinal Plants of the Tennessee Woodlands

The Appalachian region of Tennessee has one of the richest traditions of plant-based folk medicine in North America. While these plants have historical significance, modern foragers should approach medicinal use with extreme caution.

<img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=700&q=75" alt="Appalachian forest in Tennessee" style="width:100%;border-radius:12px;margin:16px 0" />

## Important Disclaimer

This article is for educational and historical purposes only. Wild plants should never be used as medicine without guidance from a qualified healthcare provider. Many medicinal plants have narrow dosage windows, drug interactions, or toxic properties at improper doses.

## Ginseng (Panax quinquefolius)

American ginseng has been harvested in Tennessee's Appalachian forests for centuries. It grows in rich, shaded cove forests and is now rare due to overharvesting. Tennessee requires a harvest license and restricts collection to September 1 through December 31.

**Conservation status:** Ginseng is listed under CITES Appendix II. Tennessee law requires reporting all harvested roots to TWRA.

## Goldenseal (Hydrastis canadensis)

Once abundant in Tennessee's rich woodlands, goldenseal has declined significantly due to habitat loss and overharvesting. It is now considered a species of concern. Its distinctive lobed leaves and red berry cluster make it identifiable, but it should not be harvested from wild populations.

## Black Cohosh (Actaea racemosa)

Found in rich mountain forests of East Tennessee, black cohosh produces tall spikes of white flowers in early summer. It has been used historically for various ailments but can cause liver damage in some individuals.

## Slippery Elm (Ulmus rubra)

The inner bark of slippery elm has been used traditionally as a soothing demulcent. These trees are common in Tennessee but are threatened by Dutch elm disease. Bark harvesting can kill trees and should be avoided.

## Witch Hazel (Hamamelis virginiana)

Native to Tennessee forests, witch hazel blooms in late fall with distinctive yellow ribbon-like petals. Its bark and leaves have astringent properties and are used in commercial skincare products.

## Ethical Considerations

- Many medicinal plants are threatened by overharvesting
- Commercial collection has decimated wild populations of ginseng and goldenseal
- Consider growing medicinal herbs rather than wild-harvesting
- Support conservation organizations working to protect native plant populations
- Never harvest rare or threatened species

## Resources for Learning More

The Great Smoky Mountains Association and the Tennessee Native Plant Society offer educational programs about native medicinal plants. These organizations emphasize conservation and sustainable practices over harvesting.`,
    coverImage: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&q=80',
    tags: ['medicinal plants', 'history', 'conservation', 'Appalachian'],
    sources: [
      {
        name: 'Medicinal Plants of the Southern Appalachians',
        author: 'Patricia Kyritsi Howell',
        publication: 'BotanoLogos Books',
      },
      {
        name: 'American Ginseng Harvest Regulations',
        publication: 'Tennessee Wildlife Resources Agency',
        url: 'https://www.tn.gov/twra',
      },
      {
        name: 'At-Risk Botanicals',
        publication: 'United Plant Savers',
        url: 'https://unitedplantsavers.org',
      },
    ],
    lastUpdated: '2025-05-28T14:00:00Z',
    readTimeMinutes: 7,
  },
];
