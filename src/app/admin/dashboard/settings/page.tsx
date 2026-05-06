'use client';

import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/auth/authService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminSettings {
  llm: {
    enabled: boolean;
    provider: 'openai' | 'claude';
    apiKey: string;
    model: string;
  };
  notifications: {
    emailEnabled: boolean;
    senderEmail: string;
    rateLimit: number;
    provider: 'none' | 'sendgrid' | 'resend';
    sendgridApiKey: string;
    sendgridFromName: string;
  };
  dataRetention: {
    analyticsDays: number;
  };
  security: {
    twoFactorEnabled: boolean;
    auditLogRetentionDays: number;
  };
}

const DEFAULT_SETTINGS: AdminSettings = {
  llm: {
    enabled: false,
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o',
  },
  notifications: {
    emailEnabled: false,
    senderEmail: '',
    rateLimit: 50,
    provider: 'none',
    sendgridApiKey: '',
    sendgridFromName: 'ForageWise',
  },
  dataRetention: {
    analyticsDays: 90,
  },
  security: {
    twoFactorEnabled: false,
    auditLogRetentionDays: 365,
  },
};

const STORAGE_KEY = 'fw_admin_settings';

const MODEL_OPTIONS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  claude: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
};

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [deletingSeed, setDeletingSeed] = useState(false);
  const [deleteSeedResult, setDeleteSeedResult] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AdminSettings;
        setSettings(parsed);
      }
    } catch {
      // Use defaults if parsing fails
    }
  }, []);

  // Save settings to localStorage
  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Storage full or unavailable
    }
  }, [settings]);

  // Purge old analytics data
  const handlePurge = useCallback(async () => {
    setPurging(true);
    setPurgeResult(null);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - settings.dataRetention.analyticsDays);
    const cutoff = cutoffDate.toISOString().replace('T', ' ');

    let totalDeleted = 0;
    const collections = [
      'analytics_page_views',
      'analytics_sessions',
      'analytics_errors',
      'analytics_feedback',
      'analytics_search_queries',
    ];

    try {
      for (const collection of collections) {
        try {
          const records = await pb.collection(collection).getFullList({
            filter: `timestamp >= "2000-01-01" && timestamp <= "${cutoff}"`,
          });
          for (const record of records) {
            await pb.collection(collection).delete(record.id);
            totalDeleted++;
          }
        } catch {
          // Collection might not exist or be empty
        }
      }
      setPurgeResult(`Purged ${totalDeleted} records older than ${settings.dataRetention.analyticsDays} days.`);
    } catch {
      setPurgeResult('Failed to purge data. Check your connection.');
    } finally {
      setPurging(false);
    }
  }, [settings.dataRetention.analyticsDays]);

  // Generate sample data — tracks created IDs for clean deletion
  const handleSeedData = useCallback(async () => {
    setSeeding(true);
    setSeedResult(null);

    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const seedIds: Record<string, string[]> = {};

    function randomTimestamp(): string {
      const offset = Math.random() * SEVEN_DAYS;
      return new Date(now - offset).toISOString();
    }

    function randomSessionId(): string {
      return `sess_${Math.random().toString(36).substring(2, 15)}`;
    }

    const paths = ['/field-guide', '/field-guide/chanterelle', '/field-guide/chicken-of-the-woods', '/parks', '/parks/fall-creek-falls', '/community', '/forecast', '/membership', '/identify', '/'];
    const errorMessages = ['TypeError: Cannot read properties of undefined', 'NetworkError: Failed to fetch', 'RangeError: Maximum call stack size exceeded', 'SyntaxError: Unexpected token in JSON', 'Error: PocketBase connection timeout'];
    const feedbackMessages = ['Love the new identification feature!', 'The map loads slowly on my phone.', 'Great app for beginners.', 'Would love more species in the database.', 'Offline mode works perfectly.'];
    const searchTerms = ['chanterelle', 'morel mushroom', 'poisonous lookalikes'];

    let created = 0;

    try {
      // 50 page views
      seedIds['analytics_page_views'] = [];
      for (let i = 0; i < 50; i++) {
        const record = await pb.collection('analytics_page_views').create({
          path: paths[Math.floor(Math.random() * paths.length)],
          timestamp: randomTimestamp(),
          sessionId: randomSessionId(),
        });
        seedIds['analytics_page_views'].push(record.id);
        created++;
      }

      // 10 sessions
      seedIds['analytics_sessions'] = [];
      for (let i = 0; i < 10; i++) {
        const startTime = now - Math.random() * SEVEN_DAYS;
        const duration = Math.floor(Math.random() * 1800) + 30;
        const endTime = startTime + duration * 1000;
        const record = await pb.collection('analytics_sessions').create({
          sessionId: randomSessionId(),
          startedAt: new Date(startTime).toISOString(),
          endedAt: new Date(endTime).toISOString(),
          duration,
          pageCount: Math.floor(Math.random() * 12) + 1,
        });
        seedIds['analytics_sessions'].push(record.id);
        created++;
      }

      // 5 error logs
      seedIds['analytics_errors'] = [];
      for (let i = 0; i < 5; i++) {
        const record = await pb.collection('analytics_errors').create({
          message: errorMessages[i],
          pageUrl: paths[Math.floor(Math.random() * paths.length)],
          timestamp: randomTimestamp(),
          browser: ['Chrome 120', 'Safari 17', 'Firefox 121', 'Edge 120', 'Chrome Mobile 120'][i],
          resolved: Math.random() > 0.5,
        });
        seedIds['analytics_errors'].push(record.id);
        created++;
      }

      // 5 feedback entries
      seedIds['analytics_feedback'] = [];
      for (let i = 0; i < 5; i++) {
        const record = await pb.collection('analytics_feedback').create({
          rating: i + 1,
          message: feedbackMessages[i],
          pageUrl: paths[Math.floor(Math.random() * paths.length)],
          timestamp: randomTimestamp(),
          userId: pb.authStore.record?.id ?? '',
        });
        seedIds['analytics_feedback'].push(record.id);
        created++;
      }

      // 3 search queries
      seedIds['analytics_search_queries'] = [];
      for (let i = 0; i < 3; i++) {
        const record = await pb.collection('analytics_search_queries').create({
          term: searchTerms[i],
          timestamp: randomTimestamp(),
          resultsCount: Math.floor(Math.random() * 20) + 1,
          clickedResult: Math.random() > 0.3,
        });
        seedIds['analytics_search_queries'].push(record.id);
        created++;
      }

      // Store seed IDs in localStorage for clean deletion
      localStorage.setItem('fw_seed_data_ids', JSON.stringify(seedIds));
      setSeedResult(`Successfully created ${created} sample records. You can delete them without affecting real data.`);
    } catch (err) {
      // Store whatever was created so far
      localStorage.setItem('fw_seed_data_ids', JSON.stringify(seedIds));
      setSeedResult(`Created ${created} records before error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSeeding(false);
    }
  }, []);

  // Delete only the seeded sample data
  const handleDeleteSeedData = useCallback(async () => {
    setDeletingSeed(true);
    setDeleteSeedResult(null);

    try {
      const stored = localStorage.getItem('fw_seed_data_ids');
      if (!stored) {
        setDeleteSeedResult('No seed data found to delete. Generate sample data first.');
        setDeletingSeed(false);
        return;
      }

      const seedIds: Record<string, string[]> = JSON.parse(stored);
      let deleted = 0;

      for (const [collection, ids] of Object.entries(seedIds)) {
        for (const id of ids) {
          try {
            await pb.collection(collection).delete(id);
            deleted++;
          } catch {
            // Record may already be deleted
          }
        }
      }

      localStorage.removeItem('fw_seed_data_ids');
      setDeleteSeedResult(`Deleted ${deleted} seed records. Real data is untouched.`);
      setSeedResult(null);
    } catch (err) {
      setDeleteSeedResult(`Error: ${err instanceof Error ? err.message : 'Failed to delete seed data'}`);
    } finally {
      setDeletingSeed(false);
    }
  }, []);

  // Update a nested setting
  const updateLLM = (key: keyof AdminSettings['llm'], value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      llm: { ...prev.llm, [key]: value },
    }));
  };

  const updateNotifications = (key: keyof AdminSettings['notifications'], value: string | boolean | number) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updateDataRetention = (key: keyof AdminSettings['dataRetention'], value: number) => {
    setSettings((prev) => ({
      ...prev,
      dataRetention: { ...prev.dataRetention, [key]: value },
    }));
  };

  const updateSecurity = (key: keyof AdminSettings['security'], value: boolean | number) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, [key]: value },
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
          Dashboard Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure AI, notifications, data retention, and security settings.
        </p>
      </div>

      {/* LLM Configuration */}
      <section
        className="rounded-xl border border-brand-charcoal/10 bg-white p-6 shadow-sm dark:border-brand-sand/10 dark:bg-brand-charcoal/50"
        aria-labelledby="llm-heading"
      >
        <h2
          id="llm-heading"
          className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand"
        >
          LLM Configuration
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure AI provider settings for content generation and insights.
        </p>

        <div className="mt-4 space-y-4">
          {/* Enable AI Toggle */}
          <div className="flex items-center gap-3">
            <input
              id="llm-enabled"
              type="checkbox"
              checked={settings.llm.enabled}
              onChange={(e) => updateLLM('enabled', e.target.checked)}
              className="h-5 w-5 rounded border-brand-charcoal/30 text-brand-teal focus:ring-brand-teal/30 dark:border-brand-sand/30"
              aria-label="Enable AI features"
            />
            <label
              htmlFor="llm-enabled"
              className="text-sm font-medium text-brand-charcoal dark:text-brand-sand cursor-pointer"
            >
              Enable AI Features
            </label>
          </div>

          {/* Provider */}
          <div>
            <label
              htmlFor="llm-provider"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Provider
            </label>
            <select
              id="llm-provider"
              value={settings.llm.provider}
              onChange={(e) => {
                const provider = e.target.value as 'openai' | 'claude';
                updateLLM('provider', provider);
                updateLLM('model', MODEL_OPTIONS[provider][0]);
              }}
              aria-label="AI provider"
              className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:focus:border-brand-teal"
            >
              <option value="openai">OpenAI</option>
              <option value="claude">Claude (Anthropic)</option>
            </select>
          </div>

          {/* API Key */}
          <div>
            <label
              htmlFor="llm-api-key"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              API Key
            </label>
            <input
              id="llm-api-key"
              type="password"
              value={settings.llm.apiKey}
              onChange={(e) => updateLLM('apiKey', e.target.value)}
              placeholder="sk-••••••••••••••••"
              aria-label="API key (masked)"
              className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500 dark:focus:border-brand-teal"
            />
          </div>

          {/* Model Selector */}
          <div>
            <label
              htmlFor="llm-model"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Model
            </label>
            <select
              id="llm-model"
              value={settings.llm.model}
              onChange={(e) => updateLLM('model', e.target.value)}
              aria-label="AI model"
              className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:focus:border-brand-teal"
            >
              {MODEL_OPTIONS[settings.llm.provider].map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Notification Settings */}
      <section
        className="rounded-xl border border-brand-charcoal/10 bg-white p-6 shadow-sm dark:border-brand-sand/10 dark:bg-brand-charcoal/50"
        aria-labelledby="notifications-heading"
      >
        <h2
          id="notifications-heading"
          className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand"
        >
          Notification Settings
        </h2>

        <div className="mt-4 space-y-4">
          {/* Email Service Toggle */}
          <div className="flex items-center gap-3">
            <input
              id="email-enabled"
              type="checkbox"
              checked={settings.notifications.emailEnabled}
              onChange={(e) => updateNotifications('emailEnabled', e.target.checked)}
              className="h-5 w-5 rounded border-brand-charcoal/30 text-brand-teal focus:ring-brand-teal/30 dark:border-brand-sand/30"
              aria-label="Enable email notifications"
            />
            <label
              htmlFor="email-enabled"
              className="text-sm font-medium text-brand-charcoal dark:text-brand-sand cursor-pointer"
            >
              Enable Email Notifications
            </label>
          </div>

          {/* Email Provider */}
          <div>
            <label
              htmlFor="email-provider"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Email Provider
            </label>
            <select
              id="email-provider"
              value={settings.notifications.provider}
              onChange={(e) => updateNotifications('provider', e.target.value)}
              aria-label="Email service provider"
              className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:focus:border-brand-teal"
            >
              <option value="none">None (in-app only)</option>
              <option value="sendgrid">SendGrid</option>
              <option value="resend">Resend</option>
            </select>
          </div>

          {/* SendGrid Configuration */}
          {settings.notifications.provider === 'sendgrid' && (
            <div className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 bg-brand-sand/30 dark:bg-brand-charcoal/30 p-4 space-y-4">
              <p className="text-xs font-semibold text-brand-charcoal dark:text-brand-sand">SendGrid Configuration</p>

              <div>
                <label htmlFor="sendgrid-api-key" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                  SendGrid API Key
                </label>
                <input
                  id="sendgrid-api-key"
                  type="password"
                  value={settings.notifications.sendgridApiKey}
                  onChange={(e) => updateNotifications('sendgridApiKey', e.target.value)}
                  placeholder="SG.••••••••••••••••"
                  aria-label="SendGrid API key (masked)"
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Get your API key from <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="text-brand-teal underline">SendGrid Dashboard → Settings → API Keys</a>
                </p>
              </div>

              <div>
                <label htmlFor="sendgrid-from-name" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                  From Name
                </label>
                <input
                  id="sendgrid-from-name"
                  type="text"
                  value={settings.notifications.sendgridFromName}
                  onChange={(e) => updateNotifications('sendgridFromName', e.target.value)}
                  placeholder="ForageWise"
                  aria-label="Sender display name"
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500"
                />
              </div>
            </div>
          )}

          {/* Resend Configuration */}
          {settings.notifications.provider === 'resend' && (
            <div className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 bg-brand-sand/30 dark:bg-brand-charcoal/30 p-4 space-y-4">
              <p className="text-xs font-semibold text-brand-charcoal dark:text-brand-sand">Resend Configuration</p>
              <div>
                <label htmlFor="resend-api-key" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                  Resend API Key
                </label>
                <input
                  id="resend-api-key"
                  type="password"
                  value={settings.notifications.sendgridApiKey}
                  onChange={(e) => updateNotifications('sendgridApiKey', e.target.value)}
                  placeholder="re_••••••••••••••••"
                  aria-label="Resend API key (masked)"
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500"
                />
              </div>
            </div>
          )}

          {/* Sender Email */}
          <div>
            <label
              htmlFor="sender-email"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Sender Email Address
            </label>
            <input
              id="sender-email"
              type="email"
              value={settings.notifications.senderEmail}
              onChange={(e) => updateNotifications('senderEmail', e.target.value)}
              placeholder="noreply@foragewise.app"
              aria-label="Sender email address"
              className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500 dark:focus:border-brand-teal"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must be a verified sender in your email provider.
            </p>
          </div>

          {/* Rate Limit */}
          <div>
            <label
              htmlFor="rate-limit"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Max Notifications Per Hour
            </label>
            <input
              id="rate-limit"
              type="number"
              min={1}
              max={1000}
              value={settings.notifications.rateLimit}
              onChange={(e) => updateNotifications('rateLimit', parseInt(e.target.value) || 50)}
              aria-label="Maximum notifications per hour"
              className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:focus:border-brand-teal"
            />
          </div>
        </div>
      </section>

      {/* Data Retention */}
      <section
        className="rounded-xl border border-brand-charcoal/10 bg-white p-6 shadow-sm dark:border-brand-sand/10 dark:bg-brand-charcoal/50"
        aria-labelledby="retention-heading"
      >
        <h2
          id="retention-heading"
          className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand"
        >
          Data Retention
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="analytics-days"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Days to Keep Analytics Data
            </label>
            <input
              id="analytics-days"
              type="number"
              min={7}
              max={730}
              value={settings.dataRetention.analyticsDays}
              onChange={(e) => updateDataRetention('analyticsDays', parseInt(e.target.value) || 90)}
              aria-label="Analytics data retention days"
              className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:focus:border-brand-teal"
            />
          </div>

          <button
            onClick={handlePurge}
            disabled={purging}
            aria-label="Purge old analytics data"
            className="min-h-[44px] min-w-[44px] rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
          >
            {purging ? 'Purging...' : `Purge Data Older Than ${settings.dataRetention.analyticsDays} Days`}
          </button>

          {purgeResult && (
            <p
              className="text-sm text-gray-600 dark:text-gray-400"
              role="status"
              aria-live="polite"
            >
              {purgeResult}
            </p>
          )}
        </div>
      </section>

      {/* Security */}
      <section
        className="rounded-xl border border-brand-charcoal/10 bg-white p-6 shadow-sm dark:border-brand-sand/10 dark:bg-brand-charcoal/50"
        aria-labelledby="security-heading"
      >
        <h2
          id="security-heading"
          className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand"
        >
          Security
        </h2>

        <div className="mt-4 space-y-4">
          {/* 2FA Toggle */}
          <div className="flex items-center gap-3">
            <input
              id="2fa-enabled"
              type="checkbox"
              checked={settings.security.twoFactorEnabled}
              onChange={(e) => updateSecurity('twoFactorEnabled', e.target.checked)}
              className="h-5 w-5 rounded border-brand-charcoal/30 text-brand-teal focus:ring-brand-teal/30 dark:border-brand-sand/30"
              aria-label="Enable two-factor authentication (placeholder)"
            />
            <label
              htmlFor="2fa-enabled"
              className="text-sm font-medium text-brand-charcoal dark:text-brand-sand cursor-pointer"
            >
              Enable Two-Factor Authentication
              <span className="ml-2 text-xs text-gray-400">(placeholder)</span>
            </label>
          </div>

          {/* Audit Log Retention */}
          <div>
            <label
              htmlFor="audit-retention"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Audit Log Retention (days)
            </label>
            <input
              id="audit-retention"
              type="number"
              min={30}
              max={1825}
              value={settings.security.auditLogRetentionDays}
              onChange={(e) => updateSecurity('auditLogRetentionDays', parseInt(e.target.value) || 365)}
              aria-label="Audit log retention days"
              className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:focus:border-brand-teal"
            />
          </div>
        </div>
      </section>

      {/* Generate Sample Data */}
      <section
        className="rounded-xl border border-brand-charcoal/10 bg-white p-6 shadow-sm dark:border-brand-sand/10 dark:bg-brand-charcoal/50"
        aria-labelledby="seed-heading"
      >
        <h2
          id="seed-heading"
          className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand"
        >
          Sample Data
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Seed PocketBase with sample analytics data for testing. Created records are tracked separately so they can be deleted without affecting real user data.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleSeedData}
            disabled={seeding}
            aria-label="Generate sample analytics data"
            className="min-h-[44px] min-w-[44px] rounded-lg bg-brand-moss px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-moss/90 focus:outline-none focus:ring-2 focus:ring-brand-moss/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {seeding ? 'Generating...' : '🌱 Generate Sample Data'}
          </button>

          <button
            onClick={handleDeleteSeedData}
            disabled={deletingSeed}
            aria-label="Delete only sample data (keeps real data)"
            className="min-h-[44px] min-w-[44px] rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
          >
            {deletingSeed ? 'Deleting...' : '🗑️ Delete Seed Data Only'}
          </button>
        </div>

        {seedResult && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400" role="status" aria-live="polite">
            {seedResult}
          </p>
        )}
        {deleteSeedResult && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400" role="status" aria-live="polite">
            {deleteSeedResult}
          </p>
        )}
      </section>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          aria-label="Save all settings"
          className="min-h-[44px] min-w-[44px] rounded-lg bg-brand-teal px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-teal/90 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:ring-offset-2"
        >
          Save Settings
        </button>

        {saved && (
          <span
            className="text-sm text-green-600 dark:text-green-400"
            role="status"
            aria-live="polite"
          >
            ✓ Settings saved
          </span>
        )}
      </div>
    </div>
  );
}
