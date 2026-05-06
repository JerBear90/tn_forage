/**
 * ForageWise — iNaturalist Integration Service
 *
 * Fetches species observation data from iNaturalist's public API.
 * No API key required for read-only access.
 *
 * Provides:
 * - Observation counts per species in Tennessee
 * - Monthly seasonality histograms
 * - Community photos (CC-licensed)
 *
 * API docs: https://api.inaturalist.org/v1/docs
 * Tennessee place_id: 30 (US state level)
 */

const BASE_URL = 'https://api.inaturalist.org/v1';
const TENNESSEE_PLACE_ID = 30; // iNaturalist place ID for Tennessee
const CACHE_KEY_PREFIX = 'fw_inat_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface INatSpeciesInfo {
  taxonId: number;
  observationCount: number;
  photoUrl: string | null;
  communityPhotos: string[];
  wikiSummary: string | null;
}

export interface INatSeasonality {
  month: number; // 1-12
  count: number;
}

export interface INatObservation {
  id: number;
  photoUrl: string | null;
  observedOn: string;
  placeName: string | null;
  userName: string;
  quality: string;
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

function getCached<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(CACHE_KEY_PREFIX + key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    sessionStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch { /* storage full */ }
}

// ---------------------------------------------------------------------------
// Scientific name → taxon ID mapping
// ---------------------------------------------------------------------------

const TAXON_MAP: Record<string, number> = {
  // Mushrooms
  'Laetiporus sulphureus': 53715,      // Chicken of the Woods
  'Cantharellus cibarius': 47347,      // Chanterelle
  'Morchella esculenta': 55072,        // Morel
  'Grifola frondosa': 62929,           // Hen of the Woods
  'Hericium erinaceus': 118138,        // Lion's Mane
  'Trametes versicolor': 54134,        // Turkey Tail
  'Ganoderma tsugae': 125751,          // Reishi
  'Pleurotus ostreatus': 48494,        // Oyster Mushroom
  'Craterellus cornucopioides': 63420, // Black Trumpet
  'Calvatia gigantea': 48742,          // Giant Puffball
  'Armillaria mellea': 55816,          // Honey Mushroom
  'Lactarius indigo': 118222,          // Indigo Milk Cap
  'Coprinus comatus': 47391,           // Shaggy Mane
  'Cantharellus cinnabarinus': 62684,  // Cinnabar Chanterelle
  'Cerioporus squamosus': 53264,       // Dryad's Saddle
  'Inonotus obliquus': 124989,         // Chaga
  'Auricularia auricula-judae': 56055, // Wood Ear
  'Tremella mesenterica': 54257,       // Witch's Butter
  // Plants
  'Allium tricoccum': 56050,           // Ramps
  'Sambucus nigra': 55792,             // Elderberry
  'Asimina triloba': 62890,            // Pawpaw
  'Monarda fistulosa': 49918,          // Wild Bergamot
  'Viola sororia': 55945,              // Wild Violet
};

/**
 * Look up the iNaturalist taxon ID for a scientific name.
 * Falls back to API search if not in local map.
 */
async function getTaxonId(scientificName: string): Promise<number | null> {
  // Check local map first
  if (TAXON_MAP[scientificName]) return TAXON_MAP[scientificName];

  // Search API
  try {
    const res = await fetch(`${BASE_URL}/taxa?q=${encodeURIComponent(scientificName)}&per_page=1`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results?.length > 0) {
      return data.results[0].id;
    }
  } catch { /* offline or API error */ }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get observation count and community photos for a species in Tennessee.
 */
export async function getSpeciesInfo(scientificName: string): Promise<INatSpeciesInfo | null> {
  const cacheKey = `info_${scientificName}`;
  const cached = getCached<INatSpeciesInfo>(cacheKey);
  if (cached) return cached;

  const taxonId = await getTaxonId(scientificName);
  if (!taxonId) return null;

  try {
    // Get observation count
    const countRes = await fetch(
      `${BASE_URL}/observations?taxon_id=${taxonId}&place_id=${TENNESSEE_PLACE_ID}&per_page=0&verifiable=true`
    );
    if (!countRes.ok) return null;
    const countData = await countRes.json();

    // Get photos from recent observations
    const photosRes = await fetch(
      `${BASE_URL}/observations?taxon_id=${taxonId}&place_id=${TENNESSEE_PLACE_ID}&per_page=6&order=desc&order_by=votes&photos=true&quality_grade=research`
    );
    const photosData = photosRes.ok ? await photosRes.json() : { results: [] };

    const communityPhotos: string[] = [];
    for (const obs of photosData.results ?? []) {
      if (obs.photos?.[0]?.url) {
        // Convert thumbnail URL to medium size
        communityPhotos.push(obs.photos[0].url.replace('square', 'medium'));
      }
    }

    // Get taxon info for wiki summary
    const taxonRes = await fetch(`${BASE_URL}/taxa/${taxonId}`);
    const taxonData = taxonRes.ok ? await taxonRes.json() : null;
    const wikiSummary = taxonData?.results?.[0]?.wikipedia_summary ?? null;

    const result: INatSpeciesInfo = {
      taxonId,
      observationCount: countData.total_results ?? 0,
      photoUrl: communityPhotos[0] ?? null,
      communityPhotos,
      wikiSummary,
    };

    setCache(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

/**
 * Get monthly seasonality histogram for a species in Tennessee.
 * Returns observation counts per month (1-12).
 */
export async function getSeasonality(scientificName: string): Promise<INatSeasonality[]> {
  const cacheKey = `season_${scientificName}`;
  const cached = getCached<INatSeasonality[]>(cacheKey);
  if (cached) return cached;

  const taxonId = await getTaxonId(scientificName);
  if (!taxonId) return [];

  try {
    const res = await fetch(
      `${BASE_URL}/observations/histogram?taxon_id=${taxonId}&place_id=${TENNESSEE_PLACE_ID}&date_field=observed&interval=month_of_year&verifiable=true`
    );
    if (!res.ok) return [];
    const data = await res.json();

    const monthData = data.results?.month_of_year ?? {};
    const result: INatSeasonality[] = [];
    for (let m = 1; m <= 12; m++) {
      result.push({ month: m, count: monthData[m] ?? 0 });
    }

    setCache(cacheKey, result);
    return result;
  } catch {
    return [];
  }
}

/**
 * Get recent observations of a species in Tennessee (for community feed).
 */
export async function getRecentObservations(scientificName: string, limit: number = 10): Promise<INatObservation[]> {
  const cacheKey = `recent_${scientificName}_${limit}`;
  const cached = getCached<INatObservation[]>(cacheKey);
  if (cached) return cached;

  const taxonId = await getTaxonId(scientificName);
  if (!taxonId) return [];

  try {
    const res = await fetch(
      `${BASE_URL}/observations?taxon_id=${taxonId}&place_id=${TENNESSEE_PLACE_ID}&per_page=${limit}&order=desc&order_by=observed_on&photos=true&quality_grade=research`
    );
    if (!res.ok) return [];
    const data = await res.json();

    const result: INatObservation[] = (data.results ?? []).map((obs: Record<string, unknown>) => ({
      id: obs.id as number,
      photoUrl: (obs as any).photos?.[0]?.url?.replace('square', 'medium') ?? null,
      observedOn: (obs as any).observed_on ?? '',
      placeName: (obs as any).place_guess ?? null,
      userName: (obs as any).user?.login ?? 'Unknown',
      quality: (obs as any).quality_grade ?? 'casual',
    }));

    setCache(cacheKey, result);
    return result;
  } catch {
    return [];
  }
}
