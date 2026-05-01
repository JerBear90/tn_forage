/**
 * ForageFlow — IndexedDB Search Utility
 *
 * Searches across species, plants, trees, parks, and trails stores
 * using case-insensitive substring matching on specified fields.
 * Returns results grouped by category: Species, Parks, Trails.
 *
 * All searches run against local IndexedDB data — no network required.
 */

import { getAllRecords, type StoreName } from '@/offline/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  href: string;
}

export interface SearchResultGroup {
  category: 'Species' | 'Parks' | 'Trails';
  items: SearchResultItem[];
}

export interface SearchOptions {
  query: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Field Definitions
// ---------------------------------------------------------------------------

/**
 * Fields to search per store, and how to map results to SearchResultItem.
 */
interface StoreSearchConfig {
  storeName: StoreName;
  fields: string[];
  category: 'Species' | 'Parks' | 'Trails';
  mapItem: (record: Record<string, unknown>) => SearchResultItem;
}

const STORE_CONFIGS: StoreSearchConfig[] = [
  {
    storeName: 'species',
    fields: ['commonName', 'scientificName'],
    category: 'Species',
    mapItem: (r) => ({
      id: r.id as string,
      title: r.commonName as string,
      subtitle: r.scientificName as string,
      image: Array.isArray(r.images) && r.images.length > 0 ? (r.images[0] as string) : undefined,
      href: `/field-guide/${r.id}`,
    }),
  },
  {
    storeName: 'plants',
    fields: ['commonName', 'scientificName'],
    category: 'Species',
    mapItem: (r) => ({
      id: r.id as string,
      title: r.commonName as string,
      subtitle: r.scientificName as string,
      image: Array.isArray(r.images) && r.images.length > 0 ? (r.images[0] as string) : undefined,
      href: `/field-guide/${r.id}`,
    }),
  },
  {
    storeName: 'trees',
    fields: ['commonName', 'scientificName'],
    category: 'Species',
    mapItem: (r) => ({
      id: r.id as string,
      title: r.commonName as string,
      subtitle: r.scientificName as string,
      image: Array.isArray(r.images) && r.images.length > 0 ? (r.images[0] as string) : undefined,
      href: `/field-guide/${r.id}`,
    }),
  },
  {
    storeName: 'parks',
    fields: ['name'],
    category: 'Parks',
    mapItem: (r) => ({
      id: r.id as string,
      title: r.name as string,
      subtitle: r.region as string,
      image: r.image as string | undefined,
      href: '/map',
    }),
  },
  {
    storeName: 'trails',
    fields: ['name'],
    category: 'Trails',
    mapItem: (r) => ({
      id: r.id as string,
      title: r.name as string,
      subtitle: `${r.distance ?? ''}mi · ${r.difficulty ?? ''}`,
      image: Array.isArray(r.images) && r.images.length > 0 ? (r.images[0] as string) : undefined,
      href: '/map',
    }),
  },
];

// ---------------------------------------------------------------------------
// Core Search Function
// ---------------------------------------------------------------------------

/**
 * Search IndexedDB stores for records matching the query string.
 *
 * Searches species, plants, and trees by `commonName` and `scientificName`;
 * parks and trails by `name`. Matching is case-insensitive substring (`includes`).
 *
 * Results are grouped by category (Species, Parks, Trails) and limited to
 * `limit` results per store (default 10).
 */
export async function searchIndexedDB(
  options: SearchOptions,
): Promise<SearchResultGroup[]> {
  const { query, limit = 10 } = options;

  if (!query || query.trim().length < 1) {
    return [];
  }

  const lowerQuery = query.toLowerCase();

  // Search all stores in parallel
  const storeResults = await Promise.all(
    STORE_CONFIGS.map(async (config) => {
      try {
        const records = await getAllRecords(config.storeName);
        const matched: SearchResultItem[] = [];

        for (const record of records) {
          if (matched.length >= limit) break;

          const rec = record as unknown as Record<string, unknown>;
          const matches = config.fields.some((field) => {
            const value = rec[field];
            return typeof value === 'string' && value.toLowerCase().includes(lowerQuery);
          });

          if (matches) {
            matched.push(config.mapItem(rec));
          }
        }

        return { category: config.category, items: matched };
      } catch {
        // Gracefully handle store read failures
        return { category: config.category, items: [] };
      }
    }),
  );

  // Group results by category
  const grouped = new Map<string, SearchResultItem[]>();

  for (const result of storeResults) {
    const existing = grouped.get(result.category) ?? [];
    existing.push(...result.items);
    grouped.set(result.category, existing);
  }

  // Build final grouped array, filtering out empty categories
  const categories: Array<'Species' | 'Parks' | 'Trails'> = ['Species', 'Parks', 'Trails'];
  const groups: SearchResultGroup[] = [];

  for (const category of categories) {
    const items = grouped.get(category);
    if (items && items.length > 0) {
      groups.push({ category, items });
    }
  }

  return groups;
}
