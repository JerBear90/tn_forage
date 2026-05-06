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
    smsEnabled: boolean;
    smsProvider: 'none' | 'twilio';
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioPhoneNumber: string;
  };
  integrations: {
    stripeSecretKey: string;
    stripeWebhookSecret: string;
    googleMapsApiKey: string;
    pocketbaseUrl: string;
    googleOAuthClientId: string;
    googleOAuthClientSecret: string;
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
    smsEnabled: false,
    smsProvider: 'none',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
  },
  integrations: {
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    googleMapsApiKey: '',
    pocketbaseUrl: 'http://127.0.0.1:8090',
    googleOAuthClientId: '',
    googleOAuthClientSecret: '',
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
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure email and SMS delivery for user notifications, blog alerts, and system messages.
        </p>

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

          {/* Divider */}
          <hr className="border-brand-charcoal/10 dark:border-brand-sand/10" />

          {/* SMS Toggle */}
          <div className="flex items-center gap-3">
            <input
              id="sms-enabled"
              type="checkbox"
              checked={settings.notifications.smsEnabled}
              onChange={(e) => updateNotifications('smsEnabled', e.target.checked)}
              className="h-5 w-5 rounded border-brand-charcoal/30 text-brand-teal focus:ring-brand-teal/30 dark:border-brand-sand/30"
              aria-label="Enable SMS notifications"
            />
            <label
              htmlFor="sms-enabled"
              className="text-sm font-medium text-brand-charcoal dark:text-brand-sand cursor-pointer"
            >
              Enable SMS Notifications
            </label>
          </div>

          {/* SMS Provider */}
          <div>
            <label
              htmlFor="sms-provider"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              SMS Provider
            </label>
            <select
              id="sms-provider"
              value={settings.notifications.smsProvider}
              onChange={(e) => updateNotifications('smsProvider', e.target.value)}
              aria-label="SMS service provider"
              className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:focus:border-brand-teal"
            >
              <option value="none">None (no SMS)</option>
              <option value="twilio">Twilio</option>
            </select>
          </div>

          {/* Twilio Configuration */}
          {settings.notifications.smsProvider === 'twilio' && (
            <div className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 bg-brand-sand/30 dark:bg-brand-charcoal/30 p-4 space-y-4">
              <p className="text-xs font-semibold text-brand-charcoal dark:text-brand-sand">Twilio Configuration</p>

              <div>
                <label htmlFor="twilio-sid" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                  Account SID
                </label>
                <input
                  id="twilio-sid"
                  type="text"
                  value={settings.notifications.twilioAccountSid}
                  onChange={(e) => updateNotifications('twilioAccountSid', e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  aria-label="Twilio Account SID"
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="twilio-token" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                  Auth Token
                </label>
                <input
                  id="twilio-token"
                  type="password"
                  value={settings.notifications.twilioAuthToken}
                  onChange={(e) => updateNotifications('twilioAuthToken', e.target.value)}
                  placeholder="••••••••••••••••"
                  aria-label="Twilio Auth Token (masked)"
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="twilio-phone" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                  Twilio Phone Number
                </label>
                <input
                  id="twilio-phone"
                  type="tel"
                  value={settings.notifications.twilioPhoneNumber}
                  onChange={(e) => updateNotifications('twilioPhoneNumber', e.target.value)}
                  placeholder="+1234567890"
                  aria-label="Twilio phone number"
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Must be a Twilio-purchased number with SMS capability.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Setup Guide */}
      <section
        className="rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm dark:border-blue-800 dark:bg-blue-900/20"
        aria-labelledby="setup-guide-heading"
      >
        <h2
          id="setup-guide-heading"
          className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand flex items-center gap-2"
        >
          <span aria-hidden="true">📖</span> Setup Guide: Email &amp; SMS
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Follow these steps to configure notification delivery. You also need to set these as environment variables in Vercel for production.
        </p>

        <div className="mt-5 space-y-5">
          {/* SendGrid Setup */}
          <div className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/40 p-4">
            <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand flex items-center gap-2">
              <span aria-hidden="true">📧</span> SendGrid (Email)
            </h3>
            <ol className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
              <li>Create a free account at <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-brand-teal underline">sendgrid.com</a> (100 emails/day free)</li>
              <li>Go to <strong>Settings → API Keys</strong> and create a key with &quot;Mail Send&quot; permission</li>
              <li>Go to <strong>Settings → Sender Authentication</strong> and verify your sender email</li>
              <li>Paste the API key above and enter your verified sender email</li>
            </ol>
            <div className="mt-3 rounded-md bg-gray-100 dark:bg-brand-charcoal/60 p-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Vercel Environment Variables:</p>
              <code className="block text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">SENDGRID_API_KEY=SG.your_key_here{'\n'}SENDGRID_FROM_EMAIL=notifications@yourdomain.com{'\n'}SENDGRID_FROM_NAME=ForageWise</code>
            </div>
          </div>

          {/* Twilio Setup */}
          <div className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/40 p-4">
            <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand flex items-center gap-2">
              <span aria-hidden="true">📱</span> Twilio (SMS)
            </h3>
            <ol className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
              <li>Create an account at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-brand-teal underline">twilio.com</a> (trial gives ~$15 credit)</li>
              <li>From the <strong>Console Dashboard</strong>, copy your Account SID and Auth Token</li>
              <li>Go to <strong>Phone Numbers → Buy a Number</strong> and purchase an SMS-capable number (~$1.15/mo)</li>
              <li>Paste the credentials above</li>
            </ol>
            <div className="mt-3 rounded-md bg-gray-100 dark:bg-brand-charcoal/60 p-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Vercel Environment Variables:</p>
              <code className="block text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx{'\n'}TWILIO_AUTH_TOKEN=your_auth_token{'\n'}TWILIO_PHONE_NUMBER=+1234567890</code>
            </div>
            <div className="mt-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Cost:</strong> ~$0.0079 per SMS segment in the US + $1.15/mo for the phone number. Trial accounts can only send to verified numbers.
              </p>
            </div>
          </div>

          {/* Resend Setup */}
          <div className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/40 p-4">
            <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand flex items-center gap-2">
              <span aria-hidden="true">✉️</span> Resend (Email Alternative)
            </h3>
            <ol className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
              <li>Create an account at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-brand-teal underline">resend.com</a> (100 emails/day free)</li>
              <li>Go to <strong>API Keys</strong> and create a new key</li>
              <li>Add and verify your sending domain under <strong>Domains</strong></li>
              <li>Select &quot;Resend&quot; as your email provider above and paste the key</li>
            </ol>
            <div className="mt-3 rounded-md bg-gray-100 dark:bg-brand-charcoal/60 p-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Vercel Environment Variables:</p>
              <code className="block text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">RESEND_API_KEY=re_your_key_here{'\n'}RESEND_FROM_EMAIL=notifications@yourdomain.com</code>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations & API Keys */}
      <section
        className="rounded-xl border border-brand-charcoal/10 bg-white p-6 shadow-sm dark:border-brand-sand/10 dark:bg-brand-charcoal/50"
        aria-labelledby="integrations-heading"
      >
        <h2
          id="integrations-heading"
          className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand"
        >
          Integrations & API Keys
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure third-party service credentials. All keys are stored locally and never sent to external servers.
        </p>

        <div className="mt-4 space-y-4">
          {/* Stripe */}
          <div className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 bg-brand-sand/30 dark:bg-brand-charcoal/30 p-4 space-y-3">
            <p className="text-xs font-semibold text-brand-charcoal dark:text-brand-sand flex items-center gap-2">
              💳 Stripe (Payments & Membership)
            </p>
            <div>
              <label htmlFor="stripe-secret" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand">Secret Key</label>
              <input id="stripe-secret" type="password" value={settings.integrations.stripeSecretKey} onChange={(e) => setSettings(prev => ({ ...prev, integrations: { ...prev.integrations, stripeSecretKey: e.target.value } }))} placeholder="sk_test_••••••••" className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500" />
            </div>
            <div>
              <label htmlFor="stripe-webhook" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand">Webhook Secret</label>
              <input id="stripe-webhook" type="password" value={settings.integrations.stripeWebhookSecret} onChange={(e) => setSettings(prev => ({ ...prev, integrations: { ...prev.integrations, stripeWebhookSecret: e.target.value } }))} placeholder="whsec_••••••••" className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500" />
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Get keys from <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-brand-teal underline">Stripe Dashboard</a></p>
          </div>

          {/* Google OAuth */}
          <div className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 bg-brand-sand/30 dark:bg-brand-charcoal/30 p-4 space-y-3">
            <p className="text-xs font-semibold text-brand-charcoal dark:text-brand-sand flex items-center gap-2">
              🔐 Google OAuth (SSO Login)
            </p>
            <div>
              <label htmlFor="google-client-id" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand">Client ID</label>
              <input id="google-client-id" type="text" value={settings.integrations.googleOAuthClientId} onChange={(e) => setSettings(prev => ({ ...prev, integrations: { ...prev.integrations, googleOAuthClientId: e.target.value } }))} placeholder="123456789.apps.googleusercontent.com" className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500" />
            </div>
            <div>
              <label htmlFor="google-client-secret" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand">Client Secret</label>
              <input id="google-client-secret" type="password" value={settings.integrations.googleOAuthClientSecret} onChange={(e) => setSettings(prev => ({ ...prev, integrations: { ...prev.integrations, googleOAuthClientSecret: e.target.value } }))} placeholder="GOCSPX-••••••••" className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500" />
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Configure in <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-brand-teal underline">Google Cloud Console</a>. Also add to PocketBase admin → Auth providers.</p>
          </div>

          {/* PocketBase URL */}
          <div>
            <label htmlFor="pocketbase-url" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand">PocketBase URL</label>
            <input id="pocketbase-url" type="url" value={settings.integrations.pocketbaseUrl} onChange={(e) => setSettings(prev => ({ ...prev, integrations: { ...prev.integrations, pocketbaseUrl: e.target.value } }))} placeholder="http://127.0.0.1:8090" className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500" />
            <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">Admin panel: <a href="http://127.0.0.1:8090/_/" target="_blank" rel="noopener noreferrer" className="text-brand-teal underline">Open PocketBase Admin</a></p>
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
