'use client';

/**
 * ForageWise — GuidedIntro Component
 *
 * A skippable onboarding tour for new users. Shows feature highlights
 * one at a time with a progress indicator. Only shows once (first visit).
 * Stored in localStorage so it never shows again after completion or skip.
 */

import { useState, useEffect, useCallback } from 'react';

const INTRO_DONE_KEY = 'foragewise-intro-done';

interface IntroStep {
  icon: string;
  title: string;
  description: string;
}

const STEPS: IntroStep[] = [
  {
    icon: '🍄',
    title: 'Field Guide',
    description: 'Browse 30+ mushroom, plant, and tree species with identification steps, season info, and safety warnings. Works offline.',
  },
  {
    icon: '🗺️',
    title: 'Interactive Map',
    description: 'Explore Tennessee parks and trails. Download map areas for offline use when you\'re in the field without signal.',
  },
  {
    icon: '📍',
    title: 'Trip Planning',
    description: 'Plan foraging trips, see likely species for each trail, and log your finds. Everything saves locally first.',
  },
  {
    icon: '🌤️',
    title: 'Live Conditions',
    description: 'Tap the weather icon for real-time foraging conditions. The app tells you when conditions are prime for mushrooms.',
  },
  {
    icon: '📡',
    title: 'Offline First',
    description: 'This app works without internet. Species data, maps, and your trips are stored on your device. Sync when you\'re back online.',
  },
  {
    icon: '👥',
    title: 'Community',
    description: 'Share sightings, see what others are finding, and contribute to the foraging community. Sign in to participate.',
  },
];

export default function GuidedIntro() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only show on first visit
    const done = localStorage.getItem(INTRO_DONE_KEY);
    if (!done) {
      // Small delay so the app loads first
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      // Done
      localStorage.setItem(INTRO_DONE_KEY, 'true');
      setShow(false);
    }
  }, [step]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(INTRO_DONE_KEY, 'true');
    setShow(false);
  }, []);

  if (!show) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-label="Welcome tour"
      className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center bg-black/50 px-4 pb-24 sm:pb-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-dark-surface shadow-2xl overflow-hidden">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-4 pb-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-brand-teal' : i < step ? 'bg-brand-teal/40' : 'bg-brand-charcoal/15 dark:bg-brand-sand/15'
              }`}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-4 text-center">
          <span className="text-4xl mb-3 block" aria-hidden="true">{current.icon}</span>
          <h2 className="font-heading font-bold text-lg text-brand-forest dark:text-brand-moss mb-2">
            {current.title}
          </h2>
          <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 pb-5 pt-2">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 hover:text-brand-charcoal/70 dark:hover:text-brand-sand/70 transition-colors py-2 px-3 min-h-[44px]"
          >
            Skip tour
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg bg-brand-teal text-white font-semibold text-sm px-5 py-2.5 hover:bg-brand-teal/90 transition-colors active:scale-[0.98] min-h-[44px]"
          >
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
