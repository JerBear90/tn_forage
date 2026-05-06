'use client';

/**
 * ForageWise — ForagingConditionsLayer
 *
 * Map overlay that shows colored circles on parks based on current
 * foraging conditions (weather + season). Larger, brighter circles
 * indicate better conditions.
 *
 * Rating colors:
 *   excellent → green (#22c55e)
 *   good      → yellow-green (#84cc16)
 *   fair      → amber (#f59e0b)
 *   poor      → gray (#9ca3af)
 */

import React from 'react';
import { CircleMarker, Popup, FeatureGroup } from 'react-leaflet';
import type { ParkCondition, ConditionRating } from '@/hooks/useForagingConditions';

// ---------------------------------------------------------------------------
// Styling
// ---------------------------------------------------------------------------

const RATING_COLORS: Record<ConditionRating, string> = {
  excellent: '#22c55e',
  good: '#84cc16',
  fair: '#f59e0b',
  poor: '#9ca3af',
};

const RATING_RADIUS: Record<ConditionRating, number> = {
  excellent: 18,
  good: 14,
  fair: 10,
  poor: 8,
};

const RATING_LABELS: Record<ConditionRating, string> = {
  excellent: '🟢 Excellent',
  good: '🟡 Good',
  fair: '🟠 Fair',
  poor: '⚪ Poor',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ForagingConditionsLayerProps {
  conditions: ParkCondition[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ForagingConditionsLayer({
  conditions,
}: ForagingConditionsLayerProps) {
  return (
    <FeatureGroup>
      {conditions.map((pc) => {
        const color = RATING_COLORS[pc.rating];
        const radius = RATING_RADIUS[pc.rating];

        return (
          <CircleMarker
            key={`condition-${pc.parkId}`}
            center={[pc.coordinates.lat, pc.coordinates.lng]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.35,
              weight: 2,
              opacity: 0.8,
            }}
          >
            <Popup>
              <div style={{ minWidth: 200, fontFamily: 'Inter, sans-serif' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14 }}>
                  {pc.parkName}
                </p>
                <p style={{ margin: '0 0 8px', fontSize: 13 }}>
                  {RATING_LABELS[pc.rating]} — {pc.score}/100
                </p>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {[
                    { icon: '🍄', label: 'Mushroom', data: pc.mushroom },
                    { icon: '🌿', label: 'Plant', data: pc.plant },
                    { icon: '🌳', label: 'Tree', data: pc.tree },
                  ].map((cat) => (
                    <div
                      key={cat.label}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        background: 'rgba(0,0,0,0.04)',
                        borderRadius: 6,
                        padding: '4px 2px',
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{cat.icon}</span>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{cat.data.score}</p>
                      <p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>{cat.data.rating}</p>
                    </div>
                  ))}
                </div>
                {pc.weather && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 11, color: '#555' }}>
                    <span>☀️ {pc.weather.conditions}</span>
                    <span>🌡️ {pc.weather.temperatureF}°F</span>
                    <span>💧 {pc.weather.humidity}%</span>
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </FeatureGroup>
  );
}
