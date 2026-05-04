'use client';

import React from 'react';
import { Marker, Popup, FeatureGroup } from 'react-leaflet';
import { mushroomIcon } from '@/map/mushroomMarkerIcon';
import MushroomLocationPopup from '@/map/MushroomLocationPopup';
import type { MushroomLocationMarker } from '@/hooks/useMushroomMapData';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MushroomMapLayerProps {
  markers: MushroomLocationMarker[];
  onSpeciesClick: (speciesId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders mushroom foraging location markers on the map.
 * Each marker uses a distinct mushroom-themed icon and opens a popup
 * with species details on click.
 *
 * This component renders markers inside a FeatureGroup. The
 * LayersControl.Overlay wrapper is added in the integration task (7.3).
 */
export default function MushroomMapLayer({
  markers,
  onSpeciesClick,
}: MushroomMapLayerProps) {
  return (
    <FeatureGroup>
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.coordinates.lat, marker.coordinates.lng]}
          icon={mushroomIcon}
          title={marker.name}
          alt={`Mushroom spot: ${marker.name}`}
        >
          <Popup>
            <MushroomLocationPopup
              type={marker.type}
              name={marker.name}
              parkName={marker.parkName}
              species={marker.mushroomSpecies}
              onSpeciesClick={onSpeciesClick}
            />
          </Popup>
        </Marker>
      ))}
    </FeatureGroup>
  );
}
