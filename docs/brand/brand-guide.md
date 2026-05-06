# ForageWise Brand Guide

## Brand Name
**ForageWise**

## Positioning
A safe, offline-first field companion for mushroom, plant, tree, park, trail, and expedition discovery in Tennessee.

## Tagline
Discover. Identify. Explore safely.

## Tone
Clear, grounded, safety-first, field-ready. ForageWise speaks with the confidence of a knowledgeable trail companion — helpful and direct, never reckless or overpromising.

---

## Colors

### Primary Palette

| Name | Hex | Tailwind Token | Usage |
|------|-----|---------------|-------|
| Primary Teal | `#0F766E` | `brand-teal` | Primary buttons, links, active states, focus rings |
| Forest Green | `#14532D` | `brand-forest` | Secondary accents, headers, dark mode highlights |
| Moss Green | `#4D7C0F` | `brand-moss` | Success states, nature-themed accents |
| Earth Brown | `#7C4A24` | `brand-earth` | Warm accents, trail/expedition elements |
| Sand/Cream | `#F5F0DF` | `brand-sand` | Light mode backgrounds, card surfaces |
| Charcoal | `#1F2937` | `brand-charcoal` | Primary text (light mode), dark mode backgrounds |
| White | `#FFFFFF` | — | Card backgrounds, light mode surfaces |

### Usage Rules
- **Light mode**: Charcoal text on Sand/White backgrounds
- **Dark mode**: Sand/White text on Charcoal backgrounds
- **Never**: White text on light backgrounds (WCAG AA violation)
- **Buttons**: Teal background with white text
- **Links**: Teal color with underline on hover
- **Warnings**: Earth Brown for caution, red for danger/toxic
- **Safety badges**: Teal for "possible match", red for "toxic"

---

## Typography

### Font Stack

| Font | Role | Weight | Source |
|------|------|--------|--------|
| **Inter** | Primary body text | 400, 500, 600 | `next/font` or Google Fonts |
| **Poppins** | Headings (optional) | 500, 600, 700 | `next/font` or Google Fonts |
| **Nunito Sans** | Fallback | 400, 600 | System or Google Fonts |

### Hierarchy
- `h1`: 24–28px, Poppins 600 or Inter 600
- `h2`: 20–24px, Poppins 500 or Inter 500
- `h3`: 18–20px, Inter 500
- Body: 16px, Inter 400
- Small/caption: 14px, Inter 400
- All text: sans-serif only

### Accessibility
- Minimum body text size: 16px
- Line height: 1.5 for body text
- Scalable layout — text respects user font size preferences

---

## Logo

### Concept
A mushroom cap combined with a map pin, with a small leaf accent. Represents the intersection of foraging and navigation.

### Assets

| File | Location | Usage |
|------|----------|-------|
| `mush_logo.png` | `public/branding/mush_logo.png` | Primary logo (light and dark mode) |
| `app-icon.svg` | `public/branding/app-icon.svg` | App icon, favicon base |

### PWA Icons

| File | Size | Usage |
|------|------|-------|
| `icon-192x192.png` | 192×192 | Android home screen |
| `icon-512x512.png` | 512×512 | Android splash, PWA install |
| `icon-maskable-192x192.png` | 192×192 | Android adaptive icon |
| `icon-maskable-512x512.png` | 512×512 | Android adaptive icon |
| `apple-touch-icon.png` | 180×180 | iOS home screen |

All icons are in `public/icons/`.

### Logo Usage Rules
- Always use SVG for web display
- Maintain aspect ratio — do not stretch or distort
- Minimum clear space: equal to the height of the mushroom cap
- Works on both light and dark backgrounds (use appropriate variant)
- Do not place the logo on busy photographic backgrounds without a solid backing

---

## Animated Logo Intro

- Duration: 2–3 seconds maximum
- Skippable by tap/click
- Shown once per session, then cached in `localStorage`
- Does not block app use if animation fails
- Component: `src/components/LogoIntro.tsx`

---

## PWA Splash Screen

- Background: Sand (`#F5F0DF`) for light mode
- Logo centered
- App name below logo
- Configured in `public/manifest.json`

---

## Component Styling Patterns

### Buttons
- Primary: `bg-brand-teal text-white` with `hover:bg-brand-teal/90`
- Minimum touch target: 44×44px (`min-h-[44px]`)
- Focus ring: `focus-visible:outline-2 focus-visible:outline-brand-teal`

### Cards
- Light mode: White background with subtle shadow
- Dark mode: Charcoal background with border
- Rounded corners: `rounded-lg` (8px)

### Navigation
- Bottom nav with 5 tabs
- Active tab: Teal icon and label
- Inactive tab: Gray icon and label
- Large tap targets for mobile use

### Safety Badges
- Toxic: Red background with white text
- Edible (with expert confirmation): Teal outline
- Unknown: Gray outline
- Inedible: Earth Brown outline
