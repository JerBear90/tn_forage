import L from 'leaflet';

/**
 * Distinct mushroom-themed DivIcon for the Mushroom Map Layer.
 * Uses earth brown (#7C4A24) background with a white mushroom SVG,
 * differentiated from teal park markers and green trail lines.
 */
export const mushroomIcon: L.DivIcon = L.divIcon({
  className: 'mushroom-marker',
  html: `<div style="
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #7C4A24;
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 13c0-5 3.5-9 8-9s8 4 8 9H4z"/>
      <rect x="10" y="13" width="4" height="7" rx="1"/>
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});
