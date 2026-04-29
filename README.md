# ForageFlow

ForageFlow is an offline-first, mobile-ready field app for mushroom, plant, tree, park, trail, and expedition discovery in Tennessee.

The app is designed as a safe identification-support tool, not a consumption decision tool.

## Core Priorities

1. Offline-first field usability
2. Mobile-native behavior
3. Safety-first mushroom and plant identification
4. Reliable map, trip, and expedition logging
5. Secure authentication, SSO, membership, and Super User access

## Core Features

- Offline Field Guide
- Mushroom and plant species detail pages
- Lookalike comparisons
- Spore Print Guide
- Habitat Matcher
- Tree association support
- Leaflet map with parks, trails, and routes
- Trip Planner
- Expedition Log with offline photo capture
- AI photo recognition as possible-match only
- Community sightings and moderation
- Profile editing and avatar upload
- Membership with Stripe
- Super User tools
- SSO with Google, Apple, and Microsoft
- PWA install support
- GitHub CI/testing workflow

## Safety Disclaimer

Mushroom and plant identification is for educational purposes only. Do not consume any wild mushroom or plant based solely on this app. Confirm with a qualified expert and follow all local regulations.

## Kiro Spec Location

```txt
.kiro/specs/forageflow/
  requirements.md
  design.md
  tasks.md
  security-sso-requirements.md
  security-sso-design.md
  security-sso-tasks.md
```

## Getting Started

```bash
npm install
npm run dev
```

## GitHub Workflow

Recommended branch strategy:

- `main` = stable production-ready branch
- `spec/*` = spec/documentation updates
- `feature/*` = feature implementation
- `fix/*` = bug fixes
- `security/*` = authentication/security changes

## Required Before Build

Ask Kiro to validate the spec before implementation:

```txt
Read all ForageFlow spec and steering files. Do not implement yet. Validate requirements, design, tasks, offline-first constraints, security, SSO, membership, and testing coverage. Return contradictions, risks, and missing dependencies.
```
