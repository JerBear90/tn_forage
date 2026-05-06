/**
 * ForageWise — Observation Types
 *
 * Types for the biodiversity observation system.
 * Inspired by iNaturalist's research-grade observation model.
 */

/** Quality grade of an observation — progresses as community agrees */
export type ObservationGrade = 'casual' | 'needs-id' | 'research';

/** An identification suggestion on an observation */
export interface ObservationIdentification {
  id: string;
  userId: string;
  userName: string;
  speciesId: string | null;
  speciesGuess: string;
  confidence: 'low' | 'medium' | 'high';
  comment: string;
  createdAt: string;
  isAI: boolean;
}

/** Agreement/disagreement on an identification */
export interface IdentificationVote {
  id: string;
  identificationId: string;
  userId: string;
  agree: boolean;
  createdAt: string;
}

/** A complete biodiversity observation */
export interface Observation {
  id: string;
  userId: string;
  userName: string;

  // Media
  photos: string[]; // blob URLs or synced URLs
  audioRecording: string | null;

  // Location & time
  coordinates: { lat: number; lng: number } | null;
  locationAccuracy: number | null; // meters
  placeName: string | null;
  observedAt: string; // ISO datetime
  createdAt: string;

  // Species identification
  speciesGuess: string;
  matchedSpeciesId: string | null;
  aiSuggestions: AISuggestion[];

  // Habitat & notes
  habitatNotes: string;
  substrate: string; // e.g., "dead oak log", "soil", "living tree"
  associatedTrees: string[];

  // Community identification
  identifications: ObservationIdentification[];
  votes: IdentificationVote[];
  qualityGrade: ObservationGrade;
  agreementCount: number;
  disagreementCount: number;

  // Metadata
  syncStatus: 'pending' | 'synced' | 'failed';
  isPublic: boolean;
}

/** AI species suggestion with confidence */
export interface AISuggestion {
  speciesId: string;
  commonName: string;
  scientificName: string;
  confidence: number; // 0-1
  reasoning: string;
}

/** Threshold for research grade — number of agreeing IDs needed */
export const RESEARCH_GRADE_THRESHOLD = 3;

/** Calculate the quality grade based on identifications and votes */
export function calculateQualityGrade(obs: Observation): ObservationGrade {
  if (obs.photos.length === 0 && !obs.audioRecording) return 'casual';
  if (!obs.coordinates) return 'casual';
  if (obs.identifications.length === 0) return 'needs-id';

  // Count agreements on the leading identification
  const idCounts: Record<string, number> = {};
  for (const id of obs.identifications) {
    const key = id.speciesId || id.speciesGuess;
    idCounts[key] = (idCounts[key] || 0) + 1;
  }

  // Add votes
  for (const vote of obs.votes) {
    if (vote.agree) {
      const relatedId = obs.identifications.find((i) => i.id === vote.identificationId);
      if (relatedId) {
        const key = relatedId.speciesId || relatedId.speciesGuess;
        idCounts[key] = (idCounts[key] || 0) + 1;
      }
    }
  }

  const maxAgreement = Math.max(...Object.values(idCounts), 0);
  if (maxAgreement >= RESEARCH_GRADE_THRESHOLD) return 'research';
  if (obs.identifications.length > 0) return 'needs-id';
  return 'casual';
}
