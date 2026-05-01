'use client';

/**
 * TrailMapRenderer — Leaflet map showing a trail polyline and trailhead markers.
 *
 * This component must be dynamically imported with `ssr: false` because Leaflet
 * requires browser APIs (window, document). Use the exported `TrailMap` dynamic
 * component for safe usage in Next.js pages.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { TrailExtended, Trailhead } from '@/types';

import 'leaflet/dist/leaflet.css';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TrailMapRendererProps {
  trail: TrailExtended;
  trailheads: Trailhead[];
}

// ---------------------------------------------------------------------------
// Custom trailhead marker icon
// ---------------------------------------------------------------------------

function createTrailheadIcon(): L.DivIcon {
  return L.divIcon({
    className: 'trailhead-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #0F766E;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// ---------------------------------------------------------------------------
// FitBounds helper — fits map to trail extent on mount
// ---------------------------------------------------------------------------

function FitBoundsHelper({ trail, trailheads }: { trail: TrailExtended; trailheads: Trailhead[] }) {
  const map = useMap();

  useEffect(() => {
    const allPoints: L.LatLngExpression[] = [];

    // Add trail coordinates
    if (trail.coordinates && trail.coordinates.length > 0) {
      trail.coordinates.forEach((c) => allPoints.push([c.lat, c.lng]));
    }

    // Add trailhead coordinates
    trailheads.forEach((th) => allPoints.push([th.coordinates.lat, th.coordinates.lng]));

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [map, trail.coordinates, trailheads]);

  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrailMapRenderer({ trail, trailheads }: TrailMapRendererProps) {
  const trailheadIcon = useMemo(() => createTrailheadIcon(), []);

  // Convert trail coordinates to Leaflet LatLng array
  const polylinePositions: L.LatLngExpression[] = useMemo(() => {
    if (!trail.coordinates || trail.coordinates.length === 0) return [];
    return trail.coordinates.map((c) => [c.lat, c.lng] as L.LatLngExpression);
  }, [trail.coordinates]);

  // Default center: first trail coordinate or first trailhead
  const defaultCenter: L.LatLngExpression = useMemo(() => {
    if (trail.coordinates && trail.coordinates.length > 0) {
      return [trail.coordinates[0].lat, trail.coordinates[0].lng];
    }
    if (trailheads.length > 0) {
      return [trailheads[0].coordinates.lat, trailheads[0].coordinates.lng];
    }
    return [35.5, -86.0]; // Tennessee center fallback
  }, [trail.coordinates, trailheads]);

  if (polylinePositions.length === 0 && trailheads.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] rounded-lg bg-brand-sand/20 dark:bg-brand-charcoal/20 border border-brand-charcoal/10 dark:border-dark-border">
        <p className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
          No map data available for this trail.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-brand-charcoal/10 dark:border-dark-border">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: '300px', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Trail polyline */}
        {polylinePositions.length > 0 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#0F766E',
              weight: 4,
              opacity: 0.85,
            }}
          />
        )}

        {/* Trailhead markers */}
        {trailheads.map((th, idx) => (
          <Marker
            key={`trailhead-${th.name}-${idx}`}
            position={[th.coordinates.lat, th.coordinates.lng]}
            icon={trailheadIcon}
          >
            <Popup>
              <span className="text-sm font-medium">{th.name}</span>
            </Popup>
          </Marker>
        ))}

        {/* Fit bounds to trail extent */}
        <FitBoundsHelper trail={trail} trailheads={trailheads} />
      </MapContainer>
    </div>
  );
}
