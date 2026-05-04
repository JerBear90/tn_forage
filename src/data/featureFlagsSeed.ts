/**
 * ForageFlow — Feature Flags Seed Data
 *
 * Default feature flag configuration for Phase 3.2.
 * All features are set to 'free' access tier — no membership gating
 * in this phase. Membership-based gating will be introduced in Phase 4.
 *
 * Requirements: 18.1–18.5
 */

import type { FeatureFlag } from '@/types';

export const featureFlagsSeed: FeatureFlag[] = [
  {
    featureKey: 'offline-maps',
    accessTier: 'free',
    label: 'Offline Maps',
    description: 'Download map tiles and trail data for offline use.',
  },
  {
    featureKey: 'route-planner',
    accessTier: 'free',
    label: 'Route Planner',
    description: 'Create custom multi-stop routes for foraging trips.',
  },
  {
    featureKey: 'beacon',
    accessTier: 'free',
    label: 'Safety Beacon',
    description: 'Safety beacon that alerts emergency contacts on inactivity.',
  },
  {
    featureKey: 'guided-tours',
    accessTier: 'free',
    label: 'Guided Tours',
    description: 'Pre-authored guided tour content for select trails.',
  },
  {
    featureKey: 'blog-premium',
    accessTier: 'free',
    label: 'Premium Blog',
    description: 'Access to all blog articles and curated content.',
  },
  {
    featureKey: 'location-sharing',
    accessTier: 'free',
    label: 'Location Sharing',
    description: 'Share real-time GPS location with friends and family.',
  },
  {
    featureKey: 'foraging-journal',
    accessTier: 'free',
    label: 'Foraging Journal',
    description: 'Log finds with automatic weather tagging and pattern analysis.',
  },
  {
    featureKey: 'fruiting-forecast',
    accessTier: 'free',
    label: 'Fruiting Forecast',
    description: 'Weather-based predictions for species fruiting likelihood.',
  },
  {
    featureKey: 'spore-scanner',
    accessTier: 'free',
    label: 'Spore Print Scanner',
    description: 'Camera-based spore print color matching for identification.',
  },
  {
    featureKey: 'harvest-log',
    accessTier: 'free',
    label: 'Harvest Log',
    description: 'Track harvests with sustainability level indicators.',
  },
  {
    featureKey: 'microhabitat-mapping',
    accessTier: 'free',
    label: 'Microhabitat Mapping',
    description: 'Private habitat pins with visit history and success tracking.',
  },
  {
    featureKey: 'voice-id',
    accessTier: 'free',
    label: 'Voice ID Assistant',
    description: 'Offline voice-based species identification assistant.',
  },
  {
    featureKey: 'buddy-matching',
    accessTier: 'free',
    label: 'Buddy Matching',
    description: 'Find foraging partners based on experience and interests.',
  },
];
