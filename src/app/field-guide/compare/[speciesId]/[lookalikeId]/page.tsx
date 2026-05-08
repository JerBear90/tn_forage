"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getAllRecords } from "@/offline/db";
import LookalikeComparison from "@/components/LookalikeComparison";
import type { Species } from "@/types";
import Link from "next/link";

/**
 * Lookalike comparison page showing side-by-side species differences.
 * Requirements: 32.1–32.8
 */
export default function ComparePage() {
  const params = useParams();
  const [species, setSpecies] = useState<Species | null>(null);
  const [lookalike, setLookalike] = useState<Species | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await getAllRecords("species");
        const allSpecies = all as Species[];
        setSpecies(allSpecies.find((s) => s.id === params.speciesId) ?? null);
        setLookalike(allSpecies.find((s) => s.id === params.lookalikeId) ?? null);
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [params.speciesId, params.lookalikeId]);

  if (isLoading) {
    return <div className="p-4 animate-pulse"><div className="h-64 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-lg" /></div>;
  }

  if (!species || !lookalike) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70">Species not found.</p>
        <Link href="/field-guide" className="text-sm text-teal-600 hover:underline mt-2 inline-block">← Back to Field Guide</Link>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <Link href={`/field-guide/${params.speciesId}`} className="text-xs text-teal-600 hover:underline mb-4 inline-block">
        ← Back to {species.commonName}
      </Link>
      <h1 className="text-lg font-bold text-brand-charcoal dark:text-brand-sand mb-4">Lookalike Comparison</h1>
      <LookalikeComparison species={species} lookalike={lookalike} />
    </div>
  );
}
