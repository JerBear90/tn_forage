"use client";

import { useState, useCallback } from "react";
import type {
  IdentificationWizardAnswers,
  UndersideType,
  GrowthLocation,
  NearbyTree,
  CapColor,
  CapShape,
  StemFeature,
  BruisingReaction,
  Season,
  Moisture,
} from "@/types";
import { DEFAULT_WIZARD_ANSWERS } from "@/types";

/** Total number of wizard steps (including summary) */
export const WIZARD_TOTAL_STEPS = 11; // 10 input steps + 1 summary

/** Step labels for progress display */
export const WIZARD_STEP_LABELS = [
  "Underside Type",
  "Growth Location",
  "Nearby Tree",
  "Cap Color",
  "Cap Shape",
  "Stem Features",
  "Bruising / Cut Reaction",
  "Season",
  "Moisture",
  "GPS / Location",
  "Review",
] as const;

export interface UseIdentifyWizardReturn {
  /** Current step index (0-based) */
  currentStep: number;
  /** All wizard answers */
  answers: IdentificationWizardAnswers;
  /** Navigate to next step */
  goNext: () => void;
  /** Navigate to previous step */
  goBack: () => void;
  /** Jump to a specific step */
  goToStep: (step: number) => void;
  /** Whether we're on the first step */
  isFirstStep: boolean;
  /** Whether we're on the summary step */
  isSummaryStep: boolean;
  /** Whether the current step can advance (has a selection or is optional) */
  canAdvance: boolean;
  /** Set a single-select answer */
  setAnswer: <K extends keyof IdentificationWizardAnswers>(
    key: K,
    value: IdentificationWizardAnswers[K]
  ) => void;
  /** Toggle a stem feature (multi-select) */
  toggleStemFeature: (feature: StemFeature) => void;
  /** Set GPS coordinates */
  setGps: (coords: { lat: number; lng: number } | null) => void;
  /** Reset the wizard to the beginning */
  reset: () => void;
  /** Total number of steps */
  totalSteps: number;
}

export function useIdentifyWizard(): UseIdentifyWizardReturn {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<IdentificationWizardAnswers>({
    ...DEFAULT_WIZARD_ANSWERS,
    stemFeatures: [],
  });

  const totalSteps = WIZARD_TOTAL_STEPS;
  const isFirstStep = currentStep === 0;
  const isSummaryStep = currentStep === totalSteps - 1;

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [totalSteps]);

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps]
  );

  const setAnswer = useCallback(
    <K extends keyof IdentificationWizardAnswers>(
      key: K,
      value: IdentificationWizardAnswers[K]
    ) => {
      setAnswers((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleStemFeature = useCallback((feature: StemFeature) => {
    setAnswers((prev) => {
      const current = prev.stemFeatures;
      // If selecting "Unknown", clear others
      if (feature === "Unknown") {
        return {
          ...prev,
          stemFeatures: current.includes("Unknown") ? [] : ["Unknown"],
        };
      }
      // If selecting a non-Unknown feature, remove Unknown
      const withoutUnknown = current.filter((f) => f !== "Unknown");
      const has = withoutUnknown.includes(feature);
      return {
        ...prev,
        stemFeatures: has
          ? withoutUnknown.filter((f) => f !== feature)
          : [...withoutUnknown, feature],
      };
    });
  }, []);

  const setGps = useCallback(
    (coords: { lat: number; lng: number } | null) => {
      setAnswers((prev) => ({ ...prev, gpsCoordinates: coords }));
    },
    []
  );

  const reset = useCallback(() => {
    setCurrentStep(0);
    setAnswers({ ...DEFAULT_WIZARD_ANSWERS, stemFeatures: [] });
  }, []);

  // Determine if the current step can advance
  const canAdvance = (() => {
    switch (currentStep) {
      case 0:
        return answers.undersideType !== null;
      case 1:
        return answers.growthLocation !== null;
      case 2:
        return answers.nearbyTree !== null;
      case 3:
        return answers.capColor !== null;
      case 4:
        return answers.capShape !== null;
      case 5:
        return answers.stemFeatures.length > 0;
      case 6:
        return answers.bruisingReaction !== null;
      case 7:
        return answers.season !== null;
      case 8:
        return answers.moisture !== null;
      case 9:
        return true; // GPS is optional
      case 10:
        return true; // Summary — always can submit
      default:
        return false;
    }
  })();

  return {
    currentStep,
    answers,
    goNext,
    goBack,
    goToStep,
    isFirstStep,
    isSummaryStep,
    canAdvance,
    setAnswer,
    toggleStemFeature,
    setGps,
    reset,
    totalSteps,
  };
}
