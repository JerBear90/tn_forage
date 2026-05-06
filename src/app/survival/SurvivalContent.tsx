'use client';

import Link from 'next/link';
import SurvivalToolkit from '@/components/SurvivalToolkit';
import QuickCapture from '@/components/QuickCapture';

export default function SurvivalContent() {
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
      <header className="mb-6">
        <Link
          href="/"
          className="text-sm text-brand-teal hover:underline mb-2 inline-block"
        >
          ← Home
        </Link>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Survival Toolkit
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Emergency field reference. Works offline. Not a substitute for training.
        </p>
      </header>

      <SurvivalToolkit />

      <section className="mt-6">
        <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-3">
          Quick Document
        </h2>
        <QuickCapture />
      </section>
    </main>
  );
}
