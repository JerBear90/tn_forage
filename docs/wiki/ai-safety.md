# ForageFlow AI Safety

## Core Principle

AI recognition in ForageFlow is **assistive only**. It provides possible matches to help users narrow down identification, but it never confirms edibility or safety. All AI results require manual verification.

## Safety Language Rules

### Forbidden Phrases
These phrases must **never** appear anywhere in the app:
- "Safe to eat"
- "Definitely edible"
- "Confirmed edible"
- "AI verified"

### Required Language
All identification results (AI and manual) must use:
- "Possible match"
- "Commonly considered edible with expert confirmation"
- "Verify with a qualified expert before consuming"

### Result Labels
The Guided ID Wizard and AI recognition return one of four confidence levels:
1. **Strong possible match** — High confidence, but still requires verification
2. **Possible match** — Moderate confidence
3. **Low confidence** — Insufficient data for reliable matching
4. **Insufficient information** — Not enough input to make any determination

Never shown: "Confirmed", "Safe to eat", "Definitely edible"

## AI Photo Recognition Flow

### Input
Users can provide photos via:
- Camera capture (live photo)
- Gallery upload (existing photo)
- Recommended multi-photo set: top view, underside, habitat, stem/base

### Output
- Top possible matches with confidence scores
- Similar species list
- **Toxic lookalikes shown first** (before any edible notes)
- Manual verification checklist (must be reviewed before proceeding)

### Required Warning
Every AI result displays:
> "Possible match only. Not safe for consumption decisions."

### AI/Manual Mismatch
When AI recognition disagrees with the Guided ID Wizard result:
> "Uncertain result — verify manually."

This triggers automatically when the top AI match differs from the wizard's top match.

## Verification Checklist (`src/services/verificationChecklist.ts`)

Before showing edible notes for any species, users must review a lookalike verification checklist:
- Compare with known toxic lookalikes
- Check cap shape, color, and underside
- Verify stem features and bruising reaction
- Confirm habitat and tree association
- Review spore print (for mushrooms)

The checklist is enforced in both the Guided ID Wizard and AI recognition flows.

## Offline AI Behavior

- **Online**: AI recognition processes photos and returns results
- **Offline**: AI recognition is disabled or queued
  - Photos are saved locally to IndexedDB with timestamp, GPS coordinates, and user notes
  - When the device comes back online, queued photos can be processed
  - Users are informed that AI is unavailable offline

## Scoring Logic (`src/services/identifyScoring.ts`)

The Guided ID Wizard uses a scoring algorithm that matches user-provided characteristics against the local species database:
- Each matching characteristic adds to the confidence score
- Toxic lookalikes are always included in results
- Results are sorted by confidence, with toxic species flagged prominently
- The algorithm runs entirely offline using IndexedDB species data

## Expert Content vs Community Content

| Source | Authority | Can Override Safety? |
|--------|-----------|---------------------|
| Expert-backed content | High — from university extensions, mycology organizations, state park guidance | No — safety warnings are always shown |
| Community identification | Low — user-submitted, not verified | No — community ID is not expert confirmation |
| AI recognition | Medium — assistive only | No — AI never confirms edibility |

## Global Safety Disclaimer

A safety disclaimer banner is shown on first use of the app:
- Dismissible by the user
- Cached after dismissal (not shown again)
- Available from the home page at any time
- States that the app is for educational purposes only
