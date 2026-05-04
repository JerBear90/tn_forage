import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service — ForageFlow" };

/**
 * Terms of Service page.
 * Requirements: 22.1–22.4
 */
export default function TermsPage() {
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Terms of Service</h1>
      <p className="text-xs text-gray-500 mb-6">Last updated: January 2025</p>

      <div className="prose prose-sm text-gray-700 space-y-4">
        <section>
          <h2 className="text-sm font-semibold text-gray-800">1. Acceptance of Terms</h2>
          <p className="text-xs">By using ForageFlow, you agree to these Terms of Service. If you do not agree, do not use the application.</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-800">2. Nature of Content</h2>
          <p className="text-xs">ForageFlow provides educational information about wild species identification. All identifications are possible matches only and require expert verification. ForageFlow does not guarantee the accuracy of any identification.</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-800">3. Assumption of Risk</h2>
          <p className="text-xs">Foraging wild species carries inherent risks including poisoning, allergic reactions, and environmental hazards. You assume all risks associated with foraging activities. Never consume any wild species without expert verification.</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-800">4. Limitation of Liability</h2>
          <p className="text-xs">ForageFlow and its creators are not liable for any injury, illness, death, or property damage resulting from the use of this application or reliance on its content.</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-800">5. User Conduct</h2>
          <p className="text-xs">You agree to use ForageFlow responsibly, follow all local regulations regarding foraging and park use, and not submit false or misleading content.</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-800">6. Data and Privacy</h2>
          <p className="text-xs">Your use of ForageFlow is also governed by our Privacy Policy. By using the app, you consent to the data practices described therein.</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-800">7. Changes to Terms</h2>
          <p className="text-xs">We may update these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.</p>
        </section>
      </div>
    </div>
  );
}
