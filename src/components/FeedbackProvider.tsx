'use client';

/**
 * ForageWise — Feedback Provider
 *
 * Wraps the app and manages the 30-minute timer for showing the feedback popup.
 * Also provides a context so any component can trigger the feedback modal on demand.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import FeedbackPopup, { wasDismissedRecently } from '@/components/FeedbackPopup';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface FeedbackContextValue {
  openFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue>({
  openFeedback: () => {},
});

/**
 * Hook to open the feedback modal from any component.
 */
export function useFeedback(): FeedbackContextValue {
  return useContext(FeedbackContext);
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

// ---------------------------------------------------------------------------
// Provider Component
// ---------------------------------------------------------------------------

interface FeedbackProviderProps {
  children: React.ReactNode;
}

export default function FeedbackProvider({ children }: FeedbackProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timerFiredRef = useRef(false);

  // Start the 30-minute timer on mount (once per session)
  useEffect(() => {
    // Don't set timer if already dismissed recently
    if (wasDismissedRecently()) return;
    if (timerFiredRef.current) return;

    const timer = setTimeout(() => {
      timerFiredRef.current = true;
      // Double-check dismissal at trigger time (user may have submitted in the meantime)
      if (!wasDismissedRecently()) {
        setIsOpen(true);
      }
    }, THIRTY_MINUTES_MS);

    return () => clearTimeout(timer);
  }, []);

  const openFeedback = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeFeedback = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <FeedbackContext.Provider value={{ openFeedback }}>
      {children}
      <FeedbackPopup open={isOpen} onClose={closeFeedback} />
    </FeedbackContext.Provider>
  );
}
