import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ForageWise — Discover. Identify. Explore safely.",
  description: "Tennessee's premier foraging companion app. Identify mushrooms, plants, and trees. Explore parks and trails. Stay safe in the field.",
};

/**
 * Marketing landing page promoting the ForageWise app.
 * Requirements: 5.1–5.7
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-sand-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-teal-800 to-teal-900 text-white px-6 py-16 text-center">
        <img src="/branding/mush_logo.png" alt="ForageWise logo" className="h-16 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-3">ForageWise</h1>
        <p className="text-lg text-teal-100 mb-6">Discover. Identify. Explore safely.</p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-white text-teal-800 px-6 py-3 font-semibold hover:bg-teal-50 transition-colors"
        >
          Get Started
        </Link>
      </section>

      {/* Features */}
      <section className="px-6 py-12 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand text-center mb-8">Why ForageWise?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "🍄", title: "Comprehensive Field Guide", desc: "30+ mushroom species, 16+ plants, and Tennessee's trees — all with safety-first identification steps." },
            { icon: "🗺️", title: "Offline-First Maps", desc: "Download maps and trail data before you head out. Works without cell service." },
            { icon: "🛡️", title: "Safety Beacon", desc: "Alert your emergency contacts if you're away too long. Peace of mind in remote areas." },
            { icon: "📓", title: "Foraging Journal", desc: "Log finds with automatic weather tagging. Discover patterns in your foraging success." },
            { icon: "🔮", title: "Fruiting Forecasts", desc: "Weather-based predictions for when your favorite species are likely to fruit." },
            { icon: "👥", title: "Buddy Matching", desc: "Find foraging partners who share your interests, experience level, and preferred regions." },
          ].map((feature) => (
            <div key={feature.title} className="text-center p-4">
              <span className="text-4xl block mb-3">{feature.icon}</span>
              <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-1">{feature.title}</h3>
              <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-teal-800 text-white px-6 py-12 text-center">
        <h2 className="text-xl font-bold mb-3">Ready to explore Tennessee&apos;s wild side?</h2>
        <p className="text-teal-100 mb-6 text-sm">Free to use. No account required for basic features.</p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-white text-teal-800 px-6 py-3 font-semibold hover:bg-teal-50 transition-colors"
        >
          Start Foraging
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
        <div className="flex justify-center gap-4 mb-2">
          <Link href="/terms" className="hover:text-teal-600">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-teal-600">Privacy Policy</Link>
          <Link href="/admin/dashboard" className="hover:text-teal-600">Admin Dashboard</Link>
        </div>
        <p>© {new Date().getFullYear()} ForageWise. All rights reserved.</p>
      </footer>
    </div>
  );
}
