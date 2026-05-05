'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { Park, Trail, Route, Coordinates } from '@/types';
import type { MushroomLocationMarker } from '@/hooks/useMushroomMapData';
import type { ParkCondition } from '@/hooks/useForagingConditions';
import { useGeolocation } from '@/hooks/useGeolocation';
import MushroomMapLayer from '@/map/MushroomMapLayer';
import ForagingConditionsLayer from '@/map/ForagingConditionsLayer';
import MapFilterPanel from '@/map/MapFilterPanel';
import { DEFAULT_MAP_FILTER_STATE, type MapFilterState } from '@/map/mapFilterTypes';

import MarkerClusterGroup from 'react-leaflet-cluster';

import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/lib/assets/MarkerCluster.css';
import 'react-leaflet-cluster/lib/assets/MarkerCluster.Default.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Center of Tennessee */
const TN_CENTER: L.LatLngExpression = [35.5, -86.0];
const TN_ZOOM = 7;

// Brand colors
const COLOR_TEAL = '#0F766E'; // Parks
const COLOR_MOSS = '#4D7C0F'; // Trails
const COLOR_EARTH = '#7C4A24'; // Routes

// ---------------------------------------------------------------------------
// Custom marker icons using brand colors
// ---------------------------------------------------------------------------

function createCircleIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'forageflow-marker',
    html: `<div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: ${color};
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

const parkIcon = createCircleIcon(COLOR_TEAL);

// ---------------------------------------------------------------------------
// Custom cluster icon using brand teal
// ---------------------------------------------------------------------------

function createClusterCustomIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  // Scale size based on cluster count
  let size = 40;
  let className = 'forageflow-cluster forageflow-cluster-small';
  if (count >= 100) {
    size = 56;
    className = 'forageflow-cluster forageflow-cluster-large';
  } else if (count >= 10) {
    size = 48;
    className = 'forageflow-cluster forageflow-cluster-medium';
  }

  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${COLOR_TEAL};
      opacity: 0.9;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: ${size > 48 ? 16 : 14}px;
      font-family: Inter, sans-serif;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">${count}</div>`,
    className,
    iconSize: L.point(size, size),
    iconAnchor: [size / 2, size / 2],
  });
}

// ---------------------------------------------------------------------------
// Fix Leaflet default icon paths (broken in bundlers)
// ---------------------------------------------------------------------------

function FixLeafletIcons() {
  const map = useMap();

  useEffect(() => {
    // Fix default icon issue with webpack/next.js bundlers
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // Force map to recalculate size after mount
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);

  return null;
}

// ---------------------------------------------------------------------------
// Find Me Control — GPS button rendered as a Leaflet control overlay
// ---------------------------------------------------------------------------

function FindMeControl() {
  const map = useMap();
  const { position, loading, error, isCached, requestLocation } = useGeolocation();
  const controlRef = useRef<HTMLDivElement | null>(null);

  // Fly to user position when it changes
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 14, { duration: 1.2 });
    }
  }, [map, position]);

  // Mount the control container into the Leaflet control pane so it
  // doesn't interfere with react-leaflet's rendering.
  useEffect(() => {
    const container = L.DomUtil.create('div', 'leaflet-find-me-control');
    const controlCorner = map.getContainer().querySelector(
      '.leaflet-bottom.leaflet-right'
    );
    if (controlCorner) {
      controlCorner.prepend(container);
    }
    controlRef.current = container;

    // Prevent map interactions when clicking the control area
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    return () => {
      container.remove();
    };
  }, [map]);

  // Render the button into the Leaflet control container via a portal-like
  // approach using direct DOM manipulation (avoids React portal complexity
  // with Leaflet's DOM).
  useEffect(() => {
    const container = controlRef.current;
    if (!container) return;

    // Build the button
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-bottom: 10px; margin-right: 10px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;';

    // Error / info message
    if (error) {
      const msg = document.createElement('div');
      msg.setAttribute('role', 'alert');
      msg.style.cssText = `
        background: white; border-radius: 8px; padding: 8px 12px;
        font-size: 12px; max-width: 220px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        color: ${isCached ? '#7C4A24' : '#b91c1c'};
        line-height: 1.4;
      `;
      msg.textContent = error;
      wrapper.appendChild(msg);
    }

    // Button
    const btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', loading ? 'Finding your location…' : 'Find my location');
    btn.setAttribute('title', 'Find Me');
    btn.disabled = loading;
    btn.style.cssText = `
      width: 48px; height: 48px; border-radius: 50%;
      background: ${loading ? '#5eead4' : '#0F766E'};
      border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      cursor: ${loading ? 'wait' : 'pointer'};
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
      touch-action: manipulation;
    `;

    // SVG icon — crosshair / location icon
    if (loading) {
      btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin" style="animation: findme-spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>`;
    } else {
      btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="8"/></svg>`;
    }

    btn.addEventListener('click', () => {
      requestLocation();
    });

    wrapper.appendChild(btn);
    container.appendChild(wrapper);

    // Add spin animation if not already present
    if (!document.getElementById('findme-spin-style')) {
      const style = document.createElement('style');
      style.id = 'findme-spin-style';
      style.textContent = '@keyframes findme-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
  }, [loading, error, isCached, requestLocation]);

  // Render user location marker via React
  if (!position) return null;

  return (
    <CircleMarker
      center={[position.lat, position.lng]}
      radius={10}
      pathOptions={{
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.35,
        weight: 3,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ForageFlowMapProps {
  parks: Park[];
  trails: Trail[];
  routes: Route[];
  onMarkerClick?: (type: 'park' | 'trail' | 'route', id: string) => void;
  mushroomMarkers?: MushroomLocationMarker[];
  onMushroomSpeciesClick?: (speciesId: string) => void;
  /** Park foraging conditions for the weather overlay */
  foragingConditions?: ParkCondition[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ForageFlowMap({
  parks,
  trails,
  routes,
  onMarkerClick,
  mushroomMarkers,
  onMushroomSpeciesClick,
  foragingConditions,
}: ForageFlowMapProps) {
  const [filters, setFilters] = useState<MapFilterState>(DEFAULT_MAP_FILTER_STATE);

  return (
    <div className="flex flex-col h-full">
      {/* Map Filter Panel rendered above the map */}
      <MapFilterPanel activeFilters={filters} onFilterChange={setFilters} />

      {/* Map container */}
      <MapContainer
        center={TN_CENTER}
        zoom={TN_ZOOM}
        className="h-full w-full flex-1"
        style={{ minHeight: '300px' }}
        aria-label="Interactive map of Tennessee state parks, trails, and routes"
      >
        <FixLeafletIcons />
        <FindMeControl />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Parks layer — shown when locationTypes.parks is active */}
        {filters.locationTypes.parks && (
          <ParkMarkers parks={parks} onMarkerClick={onMarkerClick} />
        )}

        {/* Trails layer — shown when locationTypes.trails is active */}
        {filters.locationTypes.trails && (
          <TrailPolylines trails={trails} onMarkerClick={onMarkerClick} />
        )}

        {/* Routes layer — shown when locationTypes.routes is active */}
        {filters.locationTypes.routes && (
          <RoutePolylines routes={routes} onMarkerClick={onMarkerClick} />
        )}

        {/* Mushroom Spots layer — shown when conditions.mushroomSpots is active */}
        {filters.conditions.mushroomSpots && (
          <MushroomMapLayer
            markers={mushroomMarkers ?? []}
            onSpeciesClick={onMushroomSpeciesClick ?? (() => {})}
          />
        )}

        {/* Foraging Conditions overlay — shown when conditions.foragingConditions is active */}
        {filters.conditions.foragingConditions && foragingConditions && foragingConditions.length > 0 && (
          <ForagingConditionsLayer conditions={foragingConditions} />
        )}
      </MapContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components for each layer
// ---------------------------------------------------------------------------

import { FeatureGroup } from 'react-leaflet';

function ParkMarkers({
  parks,
  onMarkerClick,
}: {
  parks: Park[];
  onMarkerClick?: ForageFlowMapProps['onMarkerClick'];
}) {
  return (
    <MarkerClusterGroup
      chunkedLoading
      iconCreateFunction={createClusterCustomIcon}
      maxClusterRadius={50}
      spiderfyOnMaxZoom
      showCoverageOnHover={false}
    >
      {parks.map((park) => (
        <Marker
          key={park.id}
          position={[park.coordinates.lat, park.coordinates.lng]}
          icon={parkIcon}
          eventHandlers={{
            click: () => onMarkerClick?.('park', park.id),
          }}
          title={park.name}
          alt={`Park: ${park.name}`}
        />
      ))}
    </MarkerClusterGroup>
  );
}

function TrailPolylines({
  trails,
  onMarkerClick,
}: {
  trails: Trail[];
  onMarkerClick?: ForageFlowMapProps['onMarkerClick'];
}) {
  return (
    <FeatureGroup>
      {trails.map((trail) => {
        if (trail.coordinates.length < 2) return null;
        const positions: L.LatLngExpression[] = trail.coordinates.map(
          (c) => [c.lat, c.lng] as L.LatLngExpression
        );
        return (
          <Polyline
            key={trail.id}
            positions={positions}
            pathOptions={{ color: COLOR_MOSS, weight: 4, opacity: 0.8 }}
            eventHandlers={{
              click: () => onMarkerClick?.('trail', trail.id),
            }}
          />
        );
      })}
    </FeatureGroup>
  );
}

function RoutePolylines({
  routes,
  onMarkerClick,
}: {
  routes: Route[];
  onMarkerClick?: ForageFlowMapProps['onMarkerClick'];
}) {
  return (
    <FeatureGroup>
      {routes.map((route) => {
        if (route.coordinates.length < 2) return null;
        const positions: L.LatLngExpression[] = route.coordinates.map(
          (c) => [c.lat, c.lng] as L.LatLngExpression
        );
        return (
          <Polyline
            key={route.id}
            positions={positions}
            pathOptions={{
              color: COLOR_EARTH,
              weight: 4,
              opacity: 0.8,
              dashArray: '8, 6',
            }}
            eventHandlers={{
              click: () => onMarkerClick?.('route', route.id),
            }}
          />
        );
      })}
    </FeatureGroup>
  );
}
