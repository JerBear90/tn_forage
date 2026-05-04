"use client";

import { useState } from "react";

interface OnboardingWalkthroughProps {
  onComplete: () => void;
  onSkip: () => void;
}

const SCREENS = [
  {
    icon: "🍄",
    headline: "Discover Tennessee's Wild Species",
    description: "Browse our comprehensive field guide of mushrooms, plants, and trees found across Tennessee's diverse ecosystems.",
  },
  {
    icon: "🔍",
    headline: "Identify with Confidence",
    description: "Use our guided identification wizard, voice assistant, or spore print scanner to narrow down what you've found. Always verify with an expert.",
  },
  {
    icon: "🗺️",
    headline: "Explore Parks and Trails",
    description: "Find foraging-friendly parks, download maps for offline use, and follow guided tours with expert ecological commentary.",
  },
  {
    icon: "📓",
    headline: "Track Your Foraging Journey",
    description: "Log finds in your journal, track harvest sustainability, and watch seasonal countdowns for your favorite species.",
  },
  {
    icon: "🛡️",
    headline: "Stay Informed, Stay Cautious",
    description: "All identifications are possible matches only. Never consume anything without expert verification. Use the safety beacon when foraging alone.",
  },
];

/**
 * First-run onboarding walkthrough with swipeable screens.
 * Sets introAnimationShown to true on completion or skip.
 * Requirements: 19.1–19.5
 */
export default function OnboardingWalkthrough({ onComplete, onSkip }: OnboardingWalkthroughProps) {
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleNext = () => {
    if (currentScreen < SCREENS.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      onComplete();
    }
  };

  const screen = SCREENS[currentScreen];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-6">
      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute top-4 right-4 text-sm text-gray-500 hover:text-gray-700"
      >
        Skip
      </button>

      {/* Content */}
      <div className="flex flex-col items-center text-center max-w-sm">
        <span className="text-6xl mb-6" role="img" aria-hidden="true">{screen.icon}</span>
        <h2 className="text-xl font-bold text-gray-800 mb-3">{screen.headline}</h2>
        <p className="text-sm text-gray-600 mb-8">{screen.description}</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-6" role="tablist" aria-label="Onboarding progress">
        {SCREENS.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === currentScreen ? "bg-teal-600" : "bg-gray-300"
            }`}
            role="tab"
            aria-selected={i === currentScreen}
            aria-label={`Screen ${i + 1}`}
          />
        ))}
      </div>

      {/* Next/Done button */}
      <button
        onClick={handleNext}
        className="w-full max-w-sm rounded-md bg-teal-600 px-4 py-3 text-sm font-medium text-white hover:bg-teal-700"
      >
        {currentScreen < SCREENS.length - 1 ? "Next" : "Get Started"}
      </button>
    </div>
  );
}
