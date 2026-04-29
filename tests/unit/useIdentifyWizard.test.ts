/**
 * Unit tests for src/hooks/useIdentifyWizard.ts
 *
 * Tests the wizard state management logic: step navigation,
 * answer setting, stem feature toggling, GPS, canAdvance, and reset.
 */

import { describe, it, expect } from "vitest";
import {
  WIZARD_TOTAL_STEPS,
  WIZARD_STEP_LABELS,
} from "@/hooks/useIdentifyWizard";
import {
  DEFAULT_WIZARD_ANSWERS,
  type IdentificationWizardAnswers,
  type StemFeature,
} from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("wizard constants", () => {
  it("has 11 total steps (10 input + 1 summary)", () => {
    expect(WIZARD_TOTAL_STEPS).toBe(11);
  });

  it("has a label for every step", () => {
    expect(WIZARD_STEP_LABELS).toHaveLength(WIZARD_TOTAL_STEPS);
  });

  it("last step is Review", () => {
    expect(WIZARD_STEP_LABELS[WIZARD_STEP_LABELS.length - 1]).toBe("Review");
  });

  it("first step is Underside Type", () => {
    expect(WIZARD_STEP_LABELS[0]).toBe("Underside Type");
  });
});

// ---------------------------------------------------------------------------
// Default answers
// ---------------------------------------------------------------------------

describe("default wizard answers", () => {
  it("all single-select fields are null", () => {
    expect(DEFAULT_WIZARD_ANSWERS.undersideType).toBeNull();
    expect(DEFAULT_WIZARD_ANSWERS.growthLocation).toBeNull();
    expect(DEFAULT_WIZARD_ANSWERS.nearbyTree).toBeNull();
    expect(DEFAULT_WIZARD_ANSWERS.capColor).toBeNull();
    expect(DEFAULT_WIZARD_ANSWERS.capShape).toBeNull();
    expect(DEFAULT_WIZARD_ANSWERS.bruisingReaction).toBeNull();
    expect(DEFAULT_WIZARD_ANSWERS.season).toBeNull();
    expect(DEFAULT_WIZARD_ANSWERS.moisture).toBeNull();
    expect(DEFAULT_WIZARD_ANSWERS.gpsCoordinates).toBeNull();
  });

  it("stemFeatures is an empty array", () => {
    expect(DEFAULT_WIZARD_ANSWERS.stemFeatures).toEqual([]);
  });

  it("capColorCustom is an empty string", () => {
    expect(DEFAULT_WIZARD_ANSWERS.capColorCustom).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Pure wizard logic simulation (mirrors hook behavior without React)
// ---------------------------------------------------------------------------

function createWizardState() {
  let currentStep = 0;
  let answers: IdentificationWizardAnswers = {
    ...DEFAULT_WIZARD_ANSWERS,
    stemFeatures: [],
  };

  const totalSteps = WIZARD_TOTAL_STEPS;

  return {
    get currentStep() {
      return currentStep;
    },
    get answers() {
      return answers;
    },
    get isFirstStep() {
      return currentStep === 0;
    },
    get isSummaryStep() {
      return currentStep === totalSteps - 1;
    },
    get totalSteps() {
      return totalSteps;
    },
    get canAdvance(): boolean {
      switch (currentStep) {
        case 0: return answers.undersideType !== null;
        case 1: return answers.growthLocation !== null;
        case 2: return answers.nearbyTree !== null;
        case 3: return answers.capColor !== null;
        case 4: return answers.capShape !== null;
        case 5: return answers.stemFeatures.length > 0;
        case 6: return answers.bruisingReaction !== null;
        case 7: return answers.season !== null;
        case 8: return answers.moisture !== null;
        case 9: return true; // GPS optional
        case 10: return true; // Summary
        default: return false;
      }
    },
    goNext() {
      currentStep = Math.min(currentStep + 1, totalSteps - 1);
    },
    goBack() {
      currentStep = Math.max(currentStep - 1, 0);
    },
    goToStep(step: number) {
      if (step >= 0 && step < totalSteps) {
        currentStep = step;
      }
    },
    setAnswer<K extends keyof IdentificationWizardAnswers>(
      key: K,
      value: IdentificationWizardAnswers[K]
    ) {
      answers = { ...answers, [key]: value };
    },
    toggleStemFeature(feature: StemFeature) {
      const current = answers.stemFeatures;
      if (feature === "Unknown") {
        answers = {
          ...answers,
          stemFeatures: current.includes("Unknown") ? [] : ["Unknown"],
        };
      } else {
        const withoutUnknown = current.filter((f) => f !== "Unknown");
        const has = withoutUnknown.includes(feature);
        answers = {
          ...answers,
          stemFeatures: has
            ? withoutUnknown.filter((f) => f !== feature)
            : [...withoutUnknown, feature],
        };
      }
    },
    setGps(coords: { lat: number; lng: number } | null) {
      answers = { ...answers, gpsCoordinates: coords };
    },
    reset() {
      currentStep = 0;
      answers = { ...DEFAULT_WIZARD_ANSWERS, stemFeatures: [] };
    },
  };
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

describe("wizard navigation", () => {
  it("starts at step 0", () => {
    const w = createWizardState();
    expect(w.currentStep).toBe(0);
    expect(w.isFirstStep).toBe(true);
    expect(w.isSummaryStep).toBe(false);
  });

  it("goNext advances the step", () => {
    const w = createWizardState();
    w.goNext();
    expect(w.currentStep).toBe(1);
    expect(w.isFirstStep).toBe(false);
  });

  it("goBack decrements the step", () => {
    const w = createWizardState();
    w.goNext();
    w.goNext();
    w.goBack();
    expect(w.currentStep).toBe(1);
  });

  it("goBack does not go below 0", () => {
    const w = createWizardState();
    w.goBack();
    expect(w.currentStep).toBe(0);
  });

  it("goNext does not exceed total steps", () => {
    const w = createWizardState();
    for (let i = 0; i < 20; i++) w.goNext();
    expect(w.currentStep).toBe(WIZARD_TOTAL_STEPS - 1);
    expect(w.isSummaryStep).toBe(true);
  });

  it("goToStep jumps to a valid step", () => {
    const w = createWizardState();
    w.goToStep(5);
    expect(w.currentStep).toBe(5);
  });

  it("goToStep ignores invalid negative step", () => {
    const w = createWizardState();
    w.goToStep(-1);
    expect(w.currentStep).toBe(0);
  });

  it("goToStep ignores step beyond total", () => {
    const w = createWizardState();
    w.goToStep(99);
    expect(w.currentStep).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// canAdvance
// ---------------------------------------------------------------------------

describe("canAdvance", () => {
  it("step 0 requires undersideType", () => {
    const w = createWizardState();
    expect(w.canAdvance).toBe(false);
    w.setAnswer("undersideType", "Gills");
    expect(w.canAdvance).toBe(true);
  });

  it("step 1 requires growthLocation", () => {
    const w = createWizardState();
    w.goToStep(1);
    expect(w.canAdvance).toBe(false);
    w.setAnswer("growthLocation", "Soil");
    expect(w.canAdvance).toBe(true);
  });

  it("step 5 requires at least one stem feature", () => {
    const w = createWizardState();
    w.goToStep(5);
    expect(w.canAdvance).toBe(false);
    w.toggleStemFeature("Thick");
    expect(w.canAdvance).toBe(true);
  });

  it("step 9 (GPS) is always advanceable", () => {
    const w = createWizardState();
    w.goToStep(9);
    expect(w.canAdvance).toBe(true);
  });

  it("step 10 (summary) is always advanceable", () => {
    const w = createWizardState();
    w.goToStep(10);
    expect(w.canAdvance).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Stem feature toggling
// ---------------------------------------------------------------------------

describe("stem feature toggling", () => {
  it("toggles a feature on", () => {
    const w = createWizardState();
    w.toggleStemFeature("Thick");
    expect(w.answers.stemFeatures).toEqual(["Thick"]);
  });

  it("toggles a feature off", () => {
    const w = createWizardState();
    w.toggleStemFeature("Thick");
    w.toggleStemFeature("Thick");
    expect(w.answers.stemFeatures).toEqual([]);
  });

  it("allows multiple features", () => {
    const w = createWizardState();
    w.toggleStemFeature("Thick");
    w.toggleStemFeature("Ring present");
    expect(w.answers.stemFeatures).toContain("Thick");
    expect(w.answers.stemFeatures).toContain("Ring present");
    expect(w.answers.stemFeatures).toHaveLength(2);
  });

  it("selecting Unknown clears other features", () => {
    const w = createWizardState();
    w.toggleStemFeature("Thick");
    w.toggleStemFeature("Hollow");
    w.toggleStemFeature("Unknown");
    expect(w.answers.stemFeatures).toEqual(["Unknown"]);
  });

  it("selecting a feature after Unknown removes Unknown", () => {
    const w = createWizardState();
    w.toggleStemFeature("Unknown");
    w.toggleStemFeature("Solid");
    expect(w.answers.stemFeatures).toEqual(["Solid"]);
    expect(w.answers.stemFeatures).not.toContain("Unknown");
  });

  it("toggling Unknown off results in empty array", () => {
    const w = createWizardState();
    w.toggleStemFeature("Unknown");
    w.toggleStemFeature("Unknown");
    expect(w.answers.stemFeatures).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GPS
// ---------------------------------------------------------------------------

describe("GPS", () => {
  it("sets GPS coordinates", () => {
    const w = createWizardState();
    w.setGps({ lat: 35.9606, lng: -83.9207 });
    expect(w.answers.gpsCoordinates).toEqual({ lat: 35.9606, lng: -83.9207 });
  });

  it("clears GPS coordinates", () => {
    const w = createWizardState();
    w.setGps({ lat: 35.9606, lng: -83.9207 });
    w.setGps(null);
    expect(w.answers.gpsCoordinates).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

describe("reset", () => {
  it("resets step and answers to defaults", () => {
    const w = createWizardState();
    w.goToStep(5);
    w.setAnswer("undersideType", "Pores");
    w.setAnswer("growthLocation", "Moss");
    w.toggleStemFeature("Thick");
    w.setGps({ lat: 36.0, lng: -84.0 });

    w.reset();

    expect(w.currentStep).toBe(0);
    expect(w.answers.undersideType).toBeNull();
    expect(w.answers.growthLocation).toBeNull();
    expect(w.answers.stemFeatures).toEqual([]);
    expect(w.answers.gpsCoordinates).toBeNull();
  });
});
