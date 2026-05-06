'use client';

/**
 * ForageWise — Tooltip Component
 *
 * A lightweight tooltip that appears on tap (mobile) or hover (desktop).
 * Used to explain UI elements without cluttering the interface.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

export interface TooltipProps {
  /** The text to display in the tooltip */
  content: string;
  /** The element that triggers the tooltip */
  children: React.ReactNode;
  /** Position relative to trigger */
  position?: 'top' | 'bottom';
}

export default function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
    // Auto-hide after 3 seconds on mobile
    timeoutRef.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const toggle = useCallback(() => {
    if (visible) hide();
    else show();
  }, [visible, show, hide]);

  // Close on outside tap
  useEffect(() => {
    if (!visible) return;
    function handleOutside(e: Event) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        hide();
      }
    }
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [visible, hide]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = position === 'top'
    ? 'bottom-full mb-1.5 left-1/2 -translate-x-1/2'
    : 'top-full mt-1.5 left-1/2 -translate-x-1/2';

  return (
    <span className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        onMouseEnter={show}
        onMouseLeave={hide}
        aria-label={content}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-charcoal/10 dark:bg-brand-sand/10 text-brand-charcoal/50 dark:text-brand-sand/50 hover:bg-brand-charcoal/20 dark:hover:bg-brand-sand/20 transition-colors text-[9px] font-bold leading-none"
      >
        {children}
      </button>
      {visible && (
        <span
          role="tooltip"
          className={`absolute ${positionClasses} z-50 w-48 rounded-lg bg-brand-charcoal dark:bg-dark-border px-3 py-2 text-[11px] text-white dark:text-dark-text leading-relaxed shadow-lg pointer-events-none`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
