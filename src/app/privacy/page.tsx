import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — ForageWise" };

/**
 * Privacy Policy page.
 * Requirements: 22.5–22.8
 */
export default function PrivacyPage() {
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Privacy Policy</h1>
      <p className="text-xs text-gray-500 mb-6">Last updated: January 2025</p>

      <div className="prose prose-sm text-gray-700 space-y-4">
        <section>
          <h2 className="text-sm font-semibold text-gray-800">1. Data We Collect</h2>
          <p className="text-xs">ForageWise stores data primarily on your device using IndexedDB. Data collected includes: account information (email, display name), foraging journal entries, harvest logs, microhabitat pins, trip plans, and usage analytics (if not opted out).</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-800">2. How We Use Your Data</h2>
          <p className="text-xs">Your data is used to provide app functionality, sync across devices when online, and improve the app experience. Usage analytics help us understand which features are most valuable.</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-800">3. Data Storage</h2>
          <p className="text-xs">Most data is stored locally on your device in IndexedDB. When online, data may be synced to our PocketBase server for backup and cross-device access. Microhabitat pins marked as &quot;local-only&quot; are never synced to the server.</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-800">4. Analytics Opt-Out</h2>
          <p className="text-xs">You can opt out of usage analytics at any time in Settings. When opted out, no usage events are recorded or transmitted.</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-800">5. Data Export</h2>
          <p className="text-xs">You can export all your personal data as a JSON file at any time from Settings. The export includes all user-generated content except photo binary data.</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-800">6. Account Deletion</h2>
          <p className="text-xs">You can permanently delete your account and all associated data from Settings. This action is irreversible and removes data from both your device and our servers.</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-800">7. Third-Party Services</h2>
          <p className="text-xs">ForageWise uses weather.gov (public weather data) and may use recreation.gov (park information). These services have their own privacy policies. No personal data is shared with these services.</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-800">8. Contact</h2>
          <p className="text-xs">For privacy questions or data requests, contact us at privacy@foragewise.app.</p>
        </section>
      </div>
    </div>
  );
}
