'use client';

/**
 * ForageWise — VoicePronunciationButton Component
 *
 * Speaker button that reads species common and scientific names aloud
 * using the Web Speech API SpeechSynthesis interface. Works offline.
 * Hides itself when SpeechSynthesis is not supported.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 9.4
 */

import { useState, useEffect, useCallback } from 'react';
import { isSpeechSupported, speakName, cancelSpeech } from '@/utils/voicePronunciation';

export interface VoicePronunciationButtonProps {
  /** Common name to speak first */
  commonName: string;
  /** Scientific name to speak second */
  scientificName: string;
}

export default function VoicePronunciationButton({
  commonName,
  scientificName,
}: VoicePronunciationButtonProps) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Check speech support after mount (window is only available client-side)
  useEffect(() => {
    setSupported(isSpeechSupported());
  }, []);

  // Cancel any in-progress speech on unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (speaking) return;

    setSpeaking(true);
    try {
      await speakName(commonName, scientificName);
    } catch {
      // Speech failure is non-critical — return to idle silently
    } finally {
      setSpeaking(false);
    }
  }, [commonName, scientificName, speaking]);

  if (!supported) {
    return null;
  }

  const ariaLabel = speaking
    ? 'Speaking…'
    : `Hear pronunciation of ${commonName}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={`
        inline-flex items-center justify-center
        w-8 h-8 rounded-full
        text-brand-moss hover:bg-brand-moss/10
        focus:outline-none focus:ring-2 focus:ring-brand-moss focus:ring-offset-1
        transition-colors
        ${speaking ? 'animate-pulse' : ''}
      `}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
        aria-hidden="true"
      >
        {/* Speaker body */}
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {/* Sound waves */}
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        {speaking && (
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        )}
      </svg>
    </button>
  );
}
