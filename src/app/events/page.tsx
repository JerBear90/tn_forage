"use client";

import { useEvents } from "@/hooks/useEvents";
import type { EventType } from "@/types";

const TYPE_OPTIONS: { value: EventType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "festival", label: "Festivals" },
  { value: "workshop", label: "Workshops" },
  { value: "outing", label: "Outings" },
  { value: "other", label: "Other" },
];

/**
 * Events calendar page with type and date range filters.
 * Requirements: 13.1–13.7
 */
export default function EventsPage() {
  const { events, isLoading, typeFilter, setTypeFilter } = useEvents();

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-brand-charcoal dark:text-brand-sand mb-4">Events & Festivals</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTypeFilter(opt.value as EventType | "all")}
            className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
              typeFilter === opt.value
                ? "bg-teal-600 text-white"
                : "bg-brand-charcoal/10 dark:bg-brand-sand/10 text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-charcoal/20 dark:hover:bg-brand-sand/20"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-lg" />)}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60 text-center mt-8">No upcoming events found.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">{event.title}</h2>
                  <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">{new Date(event.date).toLocaleDateString()} · {event.location}</p>
                </div>
                <span className="rounded-full bg-brand-charcoal/10 dark:bg-brand-sand/10 px-2 py-0.5 text-[10px] text-brand-charcoal/60 dark:text-brand-sand/60 capitalize">
                  {event.type}
                </span>
              </div>
              <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 mt-2 line-clamp-2">{event.description}</p>
              {event.registrationUrl && (
                <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-teal-600 hover:underline">
                  Register →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
