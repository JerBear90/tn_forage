import type { Metadata } from 'next';
import MapPageClient from './MapPageClient';

export const metadata: Metadata = {
  title: 'Map — ForageWise',
  description:
    'Explore Tennessee state parks, trails, and routes on an interactive Leaflet map.',
};

export default function MapPage() {
  return <MapPageClient />;
}
