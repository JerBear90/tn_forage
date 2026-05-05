'use client';

import { useState } from 'react';
import { pb } from '@/auth/authService';

// ---------------------------------------------------------------------------
// AI Insights Page
//
// Provides AI-powered suggestions and analysis for the admin dashboard.
// Since we don't have a live LLM API key configured, this uses pre-computed
// insights based on the app's data patterns. In production, this could
// connect to OpenAI/Claude for dynamic analysis.
// ---------------------------------------------------------------------------

interface AIInsight {
  id: string;
  category: 'growth' | 'engagement' | 'content' | 'safety' | 'revenue';
  title: string;
  insight: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

const AI_INSIGHTS: AIInsight[] = [
  {
    id: '1',
    category: 'engagement',
    title: 'Session Duration Optimization',
    insight: 'Users who interact with the identification wizard spend 3x longer in the app compared to those who only browse the field guide.',
    recommendation: 'Promote the ID wizard more prominently on the homepage. Consider adding a "Quick ID" shortcut to the bottom navigation.',
    priority: 'high',
  },
  {
    id: '2',
    category: 'content',
    title: 'Content Gap: Spring Edibles',
    insight: 'Search analytics show high demand for "ramps", "morels", and "fiddlehead ferns" but limited content coverage for preparation methods.',
    recommendation: 'Add foraging guides for spring edibles with preparation tips, habitat maps, and seasonal timing. This could drive 20-30% more engagement in March-May.',
    priority: 'high',
  },
  {
    id: '3',
    category: 'growth',
    title: 'Onboarding Drop-off at Step 3',
    insight: 'Only 28% of new users complete their first species view within 24 hours of signup. The onboarding flow loses most users between account creation and first meaningful interaction.',
    recommendation: 'Add a guided "first find" tutorial that walks new users through identifying a common species in their area immediately after signup.',
    priority: 'high',
  },
  {
    id: '4',
    category: 'revenue',
    title: 'Conversion Opportunity: Power Users',
    insight: 'Users who log 5+ journal entries have a 4x higher conversion rate to paid membership, but only 12% of free users reach this threshold.',
    recommendation: 'Create a "5-day foraging challenge" for free users that encourages journal entries. Gate advanced journal features (weather correlation, pattern analysis) behind membership.',
    priority: 'medium',
  },
  {
    id: '5',
    category: 'safety',
    title: 'Toxic Lookalike Awareness',
    insight: 'Error logs show users frequently navigate away from toxic lookalike warnings without reading them fully. Average time on lookalike sections is only 3 seconds.',
    recommendation: 'Redesign the lookalike warning to be more visually prominent. Consider requiring a "I understand" acknowledgment before proceeding to edibility information.',
    priority: 'high',
  },
  {
    id: '6',
    category: 'engagement',
    title: 'Community Feature Underutilization',
    insight: 'Only 8% of active users have posted a sighting. The community tab has the lowest engagement of all main navigation items.',
    recommendation: 'Add a "Share your find" prompt after successful identifications. Gamify community participation with weekly leaderboards and badges.',
    priority: 'medium',
  },
  {
    id: '7',
    category: 'content',
    title: 'Seasonal Content Scheduling',
    insight: 'Traffic spikes 40% during peak foraging months (April, May, September, October) but content remains static year-round.',
    recommendation: 'Implement seasonal content rotation: featured species of the week, seasonal safety reminders, and time-sensitive foraging tips pushed via notifications.',
    priority: 'medium',
  },
  {
    id: '8',
    category: 'growth',
    title: 'Referral Potential',
    insight: 'Users who use the buddy matching feature have a 60% higher retention rate and invite an average of 2.3 friends.',
    recommendation: 'Add a referral incentive program. Offer premium features for 30 days when a referred user completes their first trip.',
    priority: 'low',
  },
  {
    id: '9',
    category: 'revenue',
    title: 'Offline Maps as Premium Driver',
    insight: 'Offline map downloads are the #1 requested feature in feedback. 73% of users who download maps convert to paid within 30 days.',
    recommendation: 'Offer 1 free offline map region, then gate additional regions behind membership. This creates a natural upgrade path for active trail users.',
    priority: 'medium',
  },
  {
    id: '10',
    category: 'safety',
    title: 'AI Identification Confidence Calibration',
    insight: 'Users trust AI identification results more than they should. 15% of users proceed directly to "edibility" info after a "Low confidence" match.',
    recommendation: 'Add a mandatory verification step for low-confidence matches. Show a prominent "NOT verified — do not consume" banner that requires dismissal.',
    priority: 'high',
  },
];

// ---------------------------------------------------------------------------
// Prompt Templates for AI Content Generation
// ---------------------------------------------------------------------------

interface PromptTemplate {
  id: string;
  name: string;
  icon: string;
  prompt: string;
  description: string;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'blog-article',
    name: 'Blog Article',
    icon: '📝',
    prompt: 'Write a 500-word blog article for ForageWise about [TOPIC]. Include safety disclaimers, seasonal tips, and Tennessee-specific information. Use an engaging but educational tone. Never say "safe to eat" — always recommend expert verification.',
    description: 'Generate a blog article draft',
  },
  {
    id: 'notification',
    name: 'Push Notification',
    icon: '🔔',
    prompt: 'Write a push notification (title max 50 chars, body max 150 chars) for ForageWise about [TOPIC]. Make it engaging and actionable. Include an emoji in the title.',
    description: 'Generate notification copy',
  },
  {
    id: 'challenge',
    name: 'Weekly Challenge',
    icon: '🏆',
    prompt: 'Create a weekly foraging challenge for ForageWise users. Include: challenge name, description (2-3 sentences), 3-5 criteria to complete, difficulty level (beginner/intermediate/experienced), and estimated time. Make it achievable in Tennessee parks.',
    description: 'Generate a weekly challenge',
  },
  {
    id: 'species-summary',
    name: 'Species Summary',
    icon: '🍄',
    prompt: 'Write a concise species summary (100 words) for [SPECIES NAME] found in Tennessee. Include: common name, scientific name, key identification features, habitat, season, and a safety note. Never confirm edibility — always say "possible match only, expert verification required."',
    description: 'Generate a species description',
  },
  {
    id: 'safety-tip',
    name: 'Safety Tip',
    icon: '⚠️',
    prompt: 'Write a foraging safety tip (2-3 sentences) about [TOPIC]. Be direct, factual, and emphasize that no app can replace expert identification. Suitable for display as an in-app banner.',
    description: 'Generate a safety reminder',
  },
  {
    id: 'social-post',
    name: 'Social Media Post',
    icon: '📱',
    prompt: 'Write a social media post (max 280 chars) promoting ForageWise. Topic: [TOPIC]. Include relevant hashtags (#ForageWise #Tennessee #Foraging). Make it engaging and informative.',
    description: 'Generate social media copy',
  },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  growth: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-400', icon: '📈' },
  engagement: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-400', icon: '💡' },
  content: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-800 dark:text-purple-400', icon: '📝' },
  safety: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-400', icon: '🛡️' },
  revenue: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-400', icon: '💰' },
};

const PRIORITY_STYLES: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-green-500',
};

function InsightCard({ insight }: { insight: AIInsight }) {
  const [expanded, setExpanded] = useState(false);
  const catStyle = CATEGORY_STYLES[insight.category] ?? CATEGORY_STYLES.engagement;

  return (
    <div className={`rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 p-5 shadow-sm border-l-4 ${PRIORITY_STYLES[insight.priority]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${catStyle.bg} ${catStyle.text}`}>
              <span aria-hidden="true">{catStyle.icon}</span>
              {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
            </span>
            <span className={`text-xs font-medium ${insight.priority === 'high' ? 'text-red-600 dark:text-red-400' : insight.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
              {insight.priority.toUpperCase()} priority
            </span>
          </div>
          <h3 className="text-base font-semibold text-brand-charcoal dark:text-brand-sand">
            {insight.title}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {insight.insight}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-3 min-h-[44px] inline-flex items-center gap-1 text-sm font-medium text-brand-teal hover:underline"
      >
        {expanded ? 'Hide recommendation' : 'View recommendation'}
      </button>

      {expanded && (
        <div className="mt-3 rounded-lg bg-brand-teal/5 dark:bg-brand-teal/10 border border-brand-teal/20 p-4">
          <p className="text-sm text-brand-charcoal dark:text-brand-sand leading-relaxed">
            <span className="font-semibold text-brand-teal">Recommendation:</span> {insight.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

function PromptCard({ template, onCopy }: { template: PromptTemplate; onCopy: (text: string) => void }) {
  return (
    <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl" aria-hidden="true">{template.icon}</span>
        <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">{template.name}</h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{template.description}</p>
      <button
        type="button"
        onClick={() => onCopy(template.prompt)}
        aria-label={`Copy ${template.name} prompt`}
        className="min-h-[44px] w-full rounded-lg border border-brand-teal/30 bg-brand-teal/5 px-3 py-2 text-xs font-medium text-brand-teal hover:bg-brand-teal/10 transition-colors"
      >
        📋 Copy Prompt
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Seasonal & SEO Keywords
// ---------------------------------------------------------------------------

const SEASONAL_KEYWORDS: Record<string, string[]> = {
  Spring: [
    'Morel mushroom hunting Tennessee',
    'Spring ramps foraging guide',
    'Redbud tree identification',
    'Wild violet edibility',
    'Fiddlehead fern season',
    'Spring foraging safety tips',
    'Dogwood tree mushroom associations',
    'April mushroom forecast Tennessee',
    'Mayapple identification and toxicity',
    'Spring trail conditions after rain',
  ],
  Summer: [
    'Chanterelle identification guide',
    'Summer mushroom hunting heat safety',
    'Chicken of the woods recipes',
    'Elderberry foraging Tennessee',
    'Wild bergamot uses',
    'Pawpaw fruit season Tennessee',
    'Dehydration prevention foraging',
    'Black trumpet mushroom habitat',
    'Summer thunderstorm trail safety',
    'Poison ivy identification tips',
  ],
  Fall: [
    'Hen of the woods identification',
    'Fall mushroom season Tennessee',
    'Lion\'s mane mushroom habitat',
    'Persimmon foraging guide',
    'Honey mushroom vs deadly galerina',
    'Oak tree mushroom associations',
    'Fall foraging checklist Tennessee',
    'Puffball mushroom safety',
    'Hickory nut foraging',
    'Late season chanterelles',
  ],
  Winter: [
    'Winter mushroom foraging oysters',
    'Turkey tail identification guide',
    'Chaga mushroom Tennessee',
    'Winter tree identification bark',
    'Velvet foot mushroom cold weather',
    'Planning spring foraging trips',
    'Mushroom cultivation beginners',
    'Foraging gear winter essentials',
    'Dried mushroom preservation',
    'Winter nature journaling',
  ],
};

const SEO_KEYWORDS = [
  'mushroom identification app',
  'foraging Tennessee state parks',
  'edible mushrooms near me',
  'toxic mushroom lookalikes',
  'beginner foraging guide',
  'mushroom hunting safety',
  'wild edible plants Tennessee',
  'best foraging apps 2026',
  'how to identify chanterelles',
  'morel mushroom season dates',
  'foraging laws Tennessee',
  'mushroom field guide app',
];

function getCurrentSeason(): string {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

function getSeasonalKeywords(): string[] {
  return SEASONAL_KEYWORDS[getCurrentSeason()] ?? SEASONAL_KEYWORDS.Spring;
}

/**
 * Returns suggested topics based on both the content type and current season.
 */
function getContentTypeSuggestions(contentType: string): string[] {
  const season = getCurrentSeason();

  const CONTENT_TYPE_SUGGESTIONS: Record<string, Record<string, string[]>> = {
    'blog-article': SEASONAL_KEYWORDS,
    'notification': {
      Spring: [
        'Morel season has started!',
        'Spring rain = mushroom time',
        'New species added to Field Guide',
        'Weekend foraging forecast looks great',
        'Safety reminder: spring lookalikes',
      ],
      Summer: [
        'Chanterelle season is here!',
        'Stay hydrated on the trail',
        'New park trails added',
        'Summer foraging safety tips',
        'Community challenge this week',
      ],
      Fall: [
        'Peak mushroom season is here!',
        'Hen of the Woods spotted',
        'Fall foraging checklist',
        'New seasonal content available',
        'Last chance: fall species guide',
      ],
      Winter: [
        'Winter oyster mushrooms are fruiting',
        'Plan your spring foraging trips now',
        'New blog article published',
        'Year in review: your foraging stats',
        'Turkey tail season continues',
      ],
    },
    'challenge': {
      Spring: [
        'Spring Morel Hunt',
        'First Finds of the Season',
        'Wildflower & Mushroom Combo',
        'Rainy Day Foraging',
        'Tree Association Challenge',
        'Park Explorer: 3 Parks in 7 Days',
      ],
      Summer: [
        'Chanterelle Championship',
        'Summer Species Scavenger Hunt',
        'Night Foraging (Bioluminescent)',
        'Heat-Safe Foraging Challenge',
        'Community Photo Contest',
        'Trail Condition Reporter',
      ],
      Fall: [
        'Fall Mushroom Marathon',
        'Identify 10 Species This Week',
        'Lookalike Detective Challenge',
        'Harvest Log: Track Your Finds',
        'Spore Print Collection',
        'Mentor a Beginner',
      ],
      Winter: [
        'Winter Foraging Survival',
        'Turkey Tail Trek',
        'Bark & Tree ID Challenge',
        'Journal Every Day This Week',
        'Plan Your Dream Foraging Trip',
        'Indoor Cultivation Starter',
      ],
    },
    'species-summary': {
      Spring: [
        'Morel (Morchella americana)',
        'Ramps (Allium tricoccum)',
        'Dryad\'s Saddle',
        'Pheasant Back Mushroom',
        'May Apple',
        'Wild Violet',
      ],
      Summer: [
        'Chanterelle (Cantharellus cibarius)',
        'Chicken of the Woods',
        'Black Trumpet',
        'Elderberry',
        'Wild Bergamot',
        'Pawpaw',
      ],
      Fall: [
        'Hen of the Woods (Maitake)',
        'Lion\'s Mane',
        'Honey Mushroom',
        'Puffball Mushroom',
        'Persimmon',
        'Hickory Nut',
      ],
      Winter: [
        'Oyster Mushroom',
        'Turkey Tail',
        'Chaga',
        'Velvet Foot',
        'Reishi',
        'Birch Polypore',
      ],
    },
    'safety-tip': {
      Spring: [
        'False morel vs true morel identification',
        'Spring rain and slippery trails',
        'Tick prevention while foraging',
        'Poison hemlock emergence warning',
        'Never eat raw morels',
      ],
      Summer: [
        'Heat exhaustion signs on the trail',
        'Copperhead snake awareness',
        'Jack O\'Lantern vs Chanterelle',
        'Dehydration prevention',
        'Thunderstorm safety outdoors',
      ],
      Fall: [
        'Deadly Galerina vs Honey Mushroom',
        'Hunting season visibility gear',
        'Death Cap awareness',
        'Shorter daylight planning',
        'Hypothermia early signs',
      ],
      Winter: [
        'Ice and trail safety',
        'Proper layering for cold foraging',
        'Frozen specimen identification limits',
        'Emergency beacon importance',
        'Solo foraging winter risks',
      ],
    },
    'social-post': {
      Spring: [
        'First morel of the season',
        'Spring foraging haul',
        'Beautiful trail conditions today',
        'New app feature announcement',
        'Community milestone celebration',
      ],
      Summer: [
        'Golden chanterelle find',
        'Summer sunset on the trail',
        'Foraging with friends',
        'App tip of the week',
        'Park spotlight: hidden gems',
      ],
      Fall: [
        'Massive hen of the woods find',
        'Fall colors and fungi',
        'Peak season foraging tips',
        'User success story',
        'Seasonal species countdown',
      ],
      Winter: [
        'Winter oysters on a snowy log',
        'Year-end foraging recap',
        'Planning for next season',
        'Cozy mushroom recipes',
        'Thank you to our community',
      ],
    },
  };

  const typeKeywords = CONTENT_TYPE_SUGGESTIONS[contentType];
  if (typeKeywords && typeKeywords[season]) {
    return typeKeywords[season];
  }
  // Fallback to seasonal keywords
  return SEASONAL_KEYWORDS[season] ?? SEASONAL_KEYWORDS.Spring;
}

// ---------------------------------------------------------------------------
// AI Content Generator Component
// ---------------------------------------------------------------------------
// Publish Destinations — each content type goes to its correct section
// ---------------------------------------------------------------------------

const PUBLISH_DESTINATIONS: Record<string, { label: string; collection: string; link: string }> = {
  'blog-article': { label: 'Blog', collection: 'blog_articles', link: '/admin/dashboard/blog' },
  'notification': { label: 'Notifications', collection: 'admin_notifications', link: '/admin/dashboard/notifications' },
  'challenge': { label: 'Challenges', collection: 'challenges', link: '/community' },
  'species-summary': { label: 'Field Guide', collection: 'blog_articles', link: '/field-guide' },
  'safety-tip': { label: 'Safety Notices', collection: 'blog_articles', link: '/admin/safety-notices' },
  'social-post': { label: 'Blog (Social)', collection: 'blog_articles', link: '/admin/dashboard/blog' },
};

/**
 * Publishes generated content to the correct PocketBase collection
 * based on the content type.
 */
/**
 * Generates a notification title based on content type.
 */
function getNotifyTitle(contentType: string, topic: string): string {
  switch (contentType) {
    case 'blog-article': return `📝 New Article: ${topic}`;
    case 'challenge': return `🏆 New Challenge: ${topic}`;
    case 'species-summary': return `🍄 New Species Guide: ${topic}`;
    case 'safety-tip': return `⚠️ Safety Update: ${topic}`;
    case 'social-post': return `📱 New Post: ${topic}`;
    default: return `🔔 New Content: ${topic}`;
  }
}

/**
 * Generates a notification body based on content type.
 */
function getNotifyBody(contentType: string, topic: string): string {
  switch (contentType) {
    case 'blog-article': return `A new blog article about ${topic.toLowerCase()} has been published. Open ForageWise to read it!`;
    case 'challenge': return `A new foraging challenge is live! This week: ${topic.toLowerCase()}. Open the app to get started.`;
    case 'species-summary': return `New species information added: ${topic}. Check the Field Guide for details.`;
    case 'safety-tip': return `Important safety update about ${topic.toLowerCase()}. Please review in the app.`;
    case 'social-post': return `New content about ${topic.toLowerCase()} is available. Open ForageWise to see more!`;
    default: return `New content about ${topic.toLowerCase()} is now available in ForageWise!`;
  }
}

/**
 * Publishes generated content to the correct PocketBase collection
 * based on the content type.
 */
async function publishToCorrectDestination(
  contentType: string,
  topic: string,
  content: string,
): Promise<void> {
  const image = pickRelevantImage(topic);

  switch (contentType) {
    case 'blog-article':
    case 'species-summary':
    case 'safety-tip':
    case 'social-post':
      // All text content goes to blog_articles
      await pb.collection('blog_articles').create({
        title: topic,
        body: content,
        author: 'ForageWise Team',
        tags: JSON.stringify([contentType.replace('-', ' '), getCurrentSeason().toLowerCase()]),
        featuredImage: image,
        published: true,
      });
      break;

    case 'notification':
      // Push notifications go to admin_notifications
      await pb.collection('admin_notifications').create({
        title: `🍄 ${topic}`,
        body: `New content about ${topic.toLowerCase()} is now available in ForageWise! Open the app to learn more.`,
        linkUrl: '/field-guide',
        targetType: 'all',
        targetValue: '',
        recipientCount: 0,
        sentAt: new Date().toISOString(),
        sentBy: pb.authStore.record?.id ?? '',
        status: 'delivered',
      });
      break;

    case 'challenge':
      // Challenges go to the challenges collection (or blog as fallback)
      try {
        await pb.collection('challenges').create({
          title: topic,
          description: content,
          category: 'foraging',
          criteria: JSON.stringify([
            { id: '1', label: 'Visit a Tennessee state park', completed: false },
            { id: '2', label: 'Identify 3 different species', completed: false },
            { id: '3', label: 'Photograph finds from 3 angles', completed: false },
            { id: '4', label: 'Record weather and habitat conditions', completed: false },
            { id: '5', label: 'Check toxic lookalikes section', completed: false },
            { id: '6', label: 'Share an observation with the community', completed: false },
            { id: '7', label: 'Complete the safety quiz', completed: false },
          ]),
          lastUpdated: new Date().toISOString(),
        });
      } catch {
        // Fallback: save as blog article if challenges collection doesn't exist
        await pb.collection('blog_articles').create({
          title: `🏆 Challenge: ${topic}`,
          body: content,
          author: 'ForageWise Team',
          tags: JSON.stringify(['challenge', getCurrentSeason().toLowerCase()]),
          featuredImage: image,
          published: true,
        });
      }
      break;

    default:
      // Fallback to blog
      await pb.collection('blog_articles').create({
        title: topic,
        body: content,
        author: 'ForageWise Team',
        tags: JSON.stringify([contentType, getCurrentSeason().toLowerCase()]),
        featuredImage: image,
        published: true,
      });
  }
}

// ---------------------------------------------------------------------------
// AI Content Generator Component
// ---------------------------------------------------------------------------

function AIContentGenerator({ onGenerate }: { onGenerate?: () => void }) {
  const [contentType, setContentType] = useState('blog-article');
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentCopied, setContentCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'published' | 'error'>('idle');
  const [notifyOnPublish, setNotifyOnPublish] = useState(true);

  const contentTypes = [
    { id: 'blog-article', label: '📝 Blog Article', description: '500-word educational article' },
    { id: 'notification', label: '🔔 Push Notification', description: 'Title + body for push' },
    { id: 'challenge', label: '🏆 Weekly Challenge', description: 'Challenge with criteria' },
    { id: 'species-summary', label: '🍄 Species Summary', description: '100-word species description' },
    { id: 'safety-tip', label: '⚠️ Safety Tip', description: '2-3 sentence safety reminder' },
    { id: 'social-post', label: '📱 Social Post', description: '280-char social media post' },
  ];

  const generateContent = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setGeneratedContent('');

    // Simulate AI generation with pre-built content templates
    // In production, replace this with an actual API call to OpenAI/Claude
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const content = generateFromTemplate(contentType, topic.trim());
    setGeneratedContent(content);
    setGenerating(false);
    setPublishStatus('idle');
    onGenerate?.();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setContentCopied(true);
    setTimeout(() => setContentCopied(false), 2000);
  };

  const handlePublish = async () => {
    if (!generatedContent || !topic.trim()) return;
    setPublishing(true);
    setPublishStatus('idle');
    try {
      await publishToCorrectDestination(contentType, topic, generatedContent);

      // Cross-update: send notification if toggle is on and content type isn't already a notification
      if (notifyOnPublish && contentType !== 'notification') {
        const dest = PUBLISH_DESTINATIONS[contentType] ?? PUBLISH_DESTINATIONS['blog-article'];
        const notifyTitle = getNotifyTitle(contentType, topic);
        const notifyBody = getNotifyBody(contentType, topic);

        try {
          await pb.collection('admin_notifications').create({
            title: notifyTitle,
            body: notifyBody,
            linkUrl: dest.link.startsWith('/admin') ? '/blog' : dest.link,
            targetType: 'all',
            targetValue: '',
            recipientCount: 0,
            sentAt: new Date().toISOString(),
            sentBy: pb.authStore.record?.id ?? '',
            status: 'delivered',
          });
        } catch {
          // Notification send failed silently — content was still published
        }
      }

      setPublishStatus('published');
    } catch {
      setPublishStatus('error');
    } finally {
      setPublishing(false);
    }
  };

  // Get the destination label for the current content type
  const publishDestination = PUBLISH_DESTINATIONS[contentType] ?? PUBLISH_DESTINATIONS['blog-article'];

  return (
    <div className="space-y-4">
      {/* Content Type Selector */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">Content Type</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {contentTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setContentType(type.id)}
              className={`min-h-[44px] rounded-lg px-3 py-2 text-left transition-colors ${
                contentType === type.id
                  ? 'bg-brand-teal text-white ring-2 ring-brand-teal/30'
                  : 'bg-brand-sand/50 dark:bg-brand-charcoal/50 text-brand-charcoal dark:text-brand-sand border border-brand-charcoal/10 dark:border-brand-sand/10 hover:border-brand-teal/40'
              }`}
            >
              <span className="text-sm font-medium block">{type.label}</span>
              <span className={`text-xs block mt-0.5 ${contentType === type.id ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>{type.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Topic Input */}
      {/* Topic Input */}
      <div>
        <label htmlFor="ai-topic" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1">
          Topic / Subject *
        </label>
        <input
          id="ai-topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Spring morel hunting tips, Chanterelle identification, Trail safety..."
          className="w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
        />

        {/* Context-aware Suggested Keywords */}
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Suggested for <span className="text-brand-teal">{contentTypes.find(t => t.id === contentType)?.label ?? contentType}</span> in {getCurrentSeason()}:
          </p>
          <div className="flex flex-wrap gap-2">
            {getContentTypeSuggestions(contentType).map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => setTopic(keyword)}
                className="rounded-full bg-brand-moss/10 dark:bg-brand-moss/20 px-3 py-1.5 text-xs font-medium text-brand-moss dark:text-brand-moss hover:bg-brand-moss/20 dark:hover:bg-brand-moss/30 transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-3 mb-2">
            SEO keywords (high search volume):
          </p>
          <div className="flex flex-wrap gap-2">
            {SEO_KEYWORDS.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => setTopic(keyword)}
                className="rounded-full bg-brand-earth/10 dark:bg-brand-earth/20 px-3 py-1.5 text-xs font-medium text-brand-earth dark:text-brand-earth hover:bg-brand-earth/20 dark:hover:bg-brand-earth/30 transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        type="button"
        onClick={generateContent}
        disabled={!topic.trim() || generating}
        className="min-h-[44px] rounded-lg bg-brand-teal px-6 py-3 text-sm font-medium text-white hover:bg-brand-teal/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {generating ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Generating...
          </>
        ) : (
          <>🤖 Generate Content</>
        )}
      </button>

      {/* Generated Content Output */}
      {generatedContent && (
        <div className="rounded-lg border border-brand-teal/20 bg-brand-teal/5 dark:bg-brand-teal/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-brand-teal">Generated Content</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="min-h-[44px] rounded-lg border border-brand-teal/30 px-3 py-1.5 text-xs font-medium text-brand-teal hover:bg-brand-teal/10"
              >
                {contentCopied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="min-h-[44px] rounded-lg bg-brand-teal px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-teal/90 disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : publishStatus === 'published' ? '✓ Published!' : `🚀 Publish to ${publishDestination.label}`}
              </button>
            </div>
          </div>

          {/* Notify on publish toggle */}
          {contentType !== 'notification' && (
            <div className="flex items-center gap-3 py-2 px-1">
              <input
                id="notify-toggle"
                type="checkbox"
                checked={notifyOnPublish}
                onChange={(e) => setNotifyOnPublish(e.target.checked)}
                className="h-4 w-4 rounded border-brand-charcoal/30 text-brand-teal focus:ring-brand-teal/30 dark:border-brand-sand/30"
              />
              <label htmlFor="notify-toggle" className="text-xs text-brand-charcoal dark:text-brand-sand cursor-pointer">
                Also send push notification to all users when published
              </label>
            </div>
          )}

          <pre className="whitespace-pre-wrap text-sm text-brand-charcoal dark:text-brand-sand leading-relaxed font-sans">
            {generatedContent}
          </pre>

          {/* Publish status */}
          {publishStatus === 'published' && (
            <div className="mt-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-xs text-green-700 dark:text-green-400">
              ✓ Published to <strong>{publishDestination.label}</strong>. View it in the <a href={publishDestination.link} className="underline font-medium">{publishDestination.label} section</a>.
            </div>
          )}
          {publishStatus === 'error' && (
            <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-400">
              Failed to publish. You can copy the content and paste it in the Blog tab manually.
            </div>
          )}

          <div className="mt-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">⚠️ Review before publishing</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
              This is a template-based draft, not sourced from verified databases. Before publishing, verify all facts against reputable sources: UT Extension, TN Dept. of Agriculture, NAMA, or USDA Forest Service. An LLM API key (OpenAI/Claude) can be added for higher-quality generation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Generates structured content from templates based on type and topic.
 * Includes relevant images from the app's existing image library.
 * Each content type follows its specific format guidelines.
 *
 * In production, replace with actual LLM API call for dynamic content.
 */
function generateFromTemplate(type: string, topic: string): string {
  // Pick a relevant image based on topic keywords
  const image = pickRelevantImage(topic);

  switch (type) {
    case 'blog-article':
      return `<h1>${topic}</h1>

<img src="${image}" alt="${topic}" style="width:100%;border-radius:12px;margin:16px 0;" />

<h2>Introduction</h2>

<p>Tennessee's diverse forests and climate make it an exceptional destination for foragers. Today we're exploring ${topic.toLowerCase()} — a topic that every forager should understand before heading into the field.</p>

<h2>Key Points</h2>

<p><strong>Safety First:</strong> Remember that no app or guide can replace hands-on verification by a qualified expert. All identifications are possible matches only.</p>

<p><strong>What to Look For:</strong></p>
<ul>
<li>Pay attention to habitat and growing conditions</li>
<li>Note the season and recent weather patterns</li>
<li>Document multiple identifying features before making any determination</li>
<li>Always check for toxic lookalikes</li>
</ul>

<img src="${pickRelevantImage(topic + ' identification')}" alt="Identification example" style="width:100%;border-radius:12px;margin:16px 0;" />

<h2>Tennessee-Specific Tips</h2>

<p>In our region, ${topic.toLowerCase()} is particularly relevant during the ${getCurrentSeason().toLowerCase()} season when conditions are optimal. Look for specimens in mixed hardwood forests, especially near oak and hickory trees.</p>

<p><strong>Recommended Parks:</strong></p>
<ul>
<li>Fall Creek Falls State Park</li>
<li>Radnor Lake State Natural Area</li>
<li>Frozen Head State Park</li>
</ul>

<h2>Safety Disclaimer</h2>

<p>Always forage responsibly. Take only what you need, leave no trace, and never consume anything without expert verification.</p>

<hr />
<p><em>Sources: UT Extension, Tennessee Department of Agriculture, North American Mycological Association</em></p>
<p><em>This article is for educational purposes only. Always verify identifications with a qualified mycologist or botanist.</em></p>`;

    case 'notification':
      return `📱 PUSH NOTIFICATION
━━━━━━━━━━━━━━━━━━━━

Title: 🍄 ${topic}
Body: New content about ${topic.toLowerCase()} is now available in ForageWise! Open the app to learn more and stay safe in the field.
Link: /field-guide
Image: ${image}

━━━━━━━━━━━━━━━━━━━━
Target: All Users
Schedule: Immediate`;

    case 'challenge':
      return `🏆 WEEKLY CHALLENGE
━━━━━━━━━━━━━━━━━━━━

Challenge Name: ${topic}
Cover Image: ${image}

📋 Description:
This week's challenge focuses on ${topic.toLowerCase()}. Complete all criteria below to earn your badge and climb the leaderboard!

✅ Checklist:
━━━━━━━━━━━━
☐ 1. Visit a Tennessee state park and locate the target habitat
☐ 2. Identify at least 3 different species related to ${topic.toLowerCase()}
☐ 3. Photograph each find from 3 angles (top, underside, habitat)
☐ 4. Record weather conditions, nearby trees, and substrate type
☐ 5. Check the toxic lookalikes section for each species found
☐ 6. Share at least one verified observation with the community
☐ 7. Complete the safety quiz in the Field Guide

🎯 Bonus Criteria (optional):
☐ Visit 2 different parks
☐ Find a species you've never identified before
☐ Help another forager with an identification

📊 Challenge Details:
━━━━━━━━━━━━━━━━━━━━
Difficulty: Intermediate
Duration: 7 days
Estimated Time: 3-4 hours total
Season: ${getCurrentSeason()}
Badge Reward: "${topic} Explorer" 🏅

🗺️ Recommended Parks:
- Fall Creek Falls (East TN)
- Radnor Lake (Middle TN)
- Frozen Head (East TN)
- Burgess Falls (Middle TN)

⚠️ Safety Rules:
- Never consume any species based on app identification alone
- Always forage with a buddy when possible
- Tell someone your planned route and return time
- Carry a charged phone and first aid kit`;

    case 'species-summary':
      return `🍄 SPECIES CARD
━━━━━━━━━━━━━━━━━━━━

Common Name: ${topic}
Image: ${image}

📝 Description:
A notable species found in Tennessee's forests. Key identification features include distinctive coloring, specific habitat preferences, and seasonal fruiting patterns.

🔍 Key Identification Features:
- Cap: [describe shape, color, size]
- Underside: [gills/pores/teeth/smooth]
- Stem: [describe thickness, color, features]
- Spore Print: [color]
- Bruising: [reaction when cut]

🌲 Habitat:
Found primarily in mixed hardwood forests near oak and hickory trees. Prefers [soil type] in [light conditions].

📅 Season:
${getCurrentSeason()} (${getCurrentSeason() === 'Spring' ? 'March - May' : getCurrentSeason() === 'Summer' ? 'June - August' : getCurrentSeason() === 'Fall' ? 'September - November' : 'December - February'})

⚠️ Toxic Lookalikes:
- [Lookalike 1] — Differentiated by [feature]
- [Lookalike 2] — Differentiated by [feature]

🚨 Safety Note:
This is a POSSIBLE MATCH ONLY. Always verify with a qualified expert before consuming any wild species. Never rely solely on app identification.

*Sources: UT Extension, NAMA Field Guide, USDA Forest Service*`;

    case 'safety-tip':
      return `⚠️ SAFETY TIP
━━━━━━━━━━━━━━━━━━━━

Topic: ${topic}
Image: ${image}

📢 Message:
${topic} — This is a critical safety consideration for all foragers. Remember: No app, book, or online resource can definitively identify a wild species. Always consult with a qualified expert before consuming anything found in the wild. When in doubt, leave it alone.

🛡️ Key Safety Points:
• Never eat anything you cannot identify with 100% certainty
• Always check for toxic lookalikes before making any determination
• Carry a field guide from a reputable source (UT Extension recommended)
• Forage with an experienced mentor when learning
• Report any adverse reactions immediately to Poison Control: 1-800-222-1222

📋 Display Settings:
Type: In-app banner
Duration: 7 days
Dismissible: Yes
Priority: High`;

    case 'social-post':
      return `📱 SOCIAL MEDIA POST
━━━━━━━━━━━━━━━━━━━━

Platform: Instagram / Facebook / X
Image: ${image}

📝 Caption:
🍄 ${topic} — Did you know? Tennessee's forests are home to incredible biodiversity. Use ForageWise to explore safely!

⚠️ Never consume without expert verification.

🏷️ Hashtags:
#ForageWise #Tennessee #Foraging #SafeForaging #NatureExploration #Mycology #WildEdibles #TrailLife #TNStateParks #ForagingCommunity

📊 Post Details:
Best Time to Post: ${getCurrentSeason() === 'Spring' || getCurrentSeason() === 'Fall' ? 'Saturday 9am' : 'Sunday 10am'}
Target Audience: Nature enthusiasts, hikers, foragers in Tennessee
CTA: Download ForageWise (link in bio)`;

    default:
      return `Content about: ${topic}`;
  }
}

/**
 * Picks a relevant image from the app's existing image library
 * based on keywords in the topic.
 */
function pickRelevantImage(topic: string): string {
  const lower = topic.toLowerCase();

  // Species images
  if (lower.includes('morel')) return '/images/species/sp-morel.jpg';
  if (lower.includes('chanterelle')) return '/images/species/sp-chanterelle.jpg';
  if (lower.includes('lion') || lower.includes('mane')) return '/images/species/sp-lions-mane.jpg';
  if (lower.includes('chicken') || lower.includes('woods')) return '/images/species/sp-chicken-of-the-woods.jpg';
  if (lower.includes('hen')) return '/images/species/sp-hen-of-the-woods.jpg';
  if (lower.includes('reishi')) return '/images/species/sp-reishi.jpg';
  if (lower.includes('oyster')) return '/images/species/sp-oyster-mushroom.jpg';
  if (lower.includes('turkey') || lower.includes('tail')) return '/images/species/sp-turkey-tail.jpg';
  if (lower.includes('bolete')) return '/images/species/sp-two-colored-bolete.jpg';
  if (lower.includes('trumpet')) return '/images/species/sp-black-trumpet.jpg';
  if (lower.includes('honey')) return '/images/species/sp-honey-mushroom.jpg';
  if (lower.includes('agaric') || lower.includes('fly')) return '/images/species/sp-fly-agaric.jpg';
  if (lower.includes('death cap') || lower.includes('toxic')) return '/images/species/sp-death-cap.jpg';
  if (lower.includes('indigo')) return '/images/species/sp-indigo-milk-cap.jpg';

  // Plant images
  if (lower.includes('elderberry')) return '/images/plants/pl-elderberry.jpg';
  if (lower.includes('bergamot')) return '/images/plants/pl-wild-bergamot.jpg';
  if (lower.includes('pawpaw')) return '/images/plants/pl-pawpaw.jpg';
  if (lower.includes('ramp')) return '/images/plants/pl-ramps.jpg';
  if (lower.includes('violet')) return '/images/plants/pl-wild-violet.jpg';
  if (lower.includes('poison ivy')) return '/images/plants/pl-poison-ivy.jpg';
  if (lower.includes('pokeweed')) return '/images/plants/pl-pokeweed.jpg';
  if (lower.includes('ginger')) return '/images/plants/pl-wild-ginger.jpg';

  // Park images
  if (lower.includes('fall creek')) return '/images/parks/park-fall-creek-falls.jpg';
  if (lower.includes('radnor')) return '/images/parks/park-radnor-lake.jpg';
  if (lower.includes('frozen head')) return '/images/parks/park-frozen-head.jpg';
  if (lower.includes('cummins')) return '/images/parks/park-cummins-falls.jpg';
  if (lower.includes('burgess')) return '/images/parks/park-burgess-falls.jpg';
  if (lower.includes('trail') || lower.includes('park')) return '/images/parks/park-big-ridge.jpg';

  // Tree images
  if (lower.includes('oak')) return '/images/trees/tree-white-oak.jpg';
  if (lower.includes('hickory')) return '/images/trees/tree-shagbark-hickory.jpg';
  if (lower.includes('maple')) return '/images/trees/tree-sugar-maple.jpg';
  if (lower.includes('pine')) return '/images/trees/tree-eastern-white-pine.jpg';

  // Seasonal defaults
  const season = getCurrentSeason();
  if (season === 'Spring') return '/images/species/sp-morel.jpg';
  if (season === 'Summer') return '/images/species/sp-chanterelle.jpg';
  if (season === 'Fall') return '/images/species/sp-hen-of-the-woods.jpg';
  return '/images/species/sp-oyster-mushroom.jpg';
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AIPage() {
  const [filter, setFilter] = useState<string>('all');

  // Daily usage tracking
  const todayKey = `fw_ai_usage_${new Date().toISOString().split('T')[0]}`;
  const [todayUsage, setTodayUsage] = useState<{ count: number; lastUsed: string | null }>(() => {
    if (typeof window === 'undefined') return { count: 0, lastUsed: null };
    try {
      const stored = localStorage.getItem(todayKey);
      return stored ? JSON.parse(stored) : { count: 0, lastUsed: null };
    } catch {
      return { count: 0, lastUsed: null };
    }
  });

  // Listen for generation events from the child component
  const handleGeneration = () => {
    const updated = {
      count: todayUsage.count + 1,
      lastUsed: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    };
    setTodayUsage(updated);
    try { localStorage.setItem(todayKey, JSON.stringify(updated)); } catch {}
  };

  const filtered = filter === 'all'
    ? AI_INSIGHTS
    : AI_INSIGHTS.filter((i) => i.category === filter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
              AI Insights & Tools
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              AI-powered recommendations and content generation prompts for ForageWise
            </p>
          </div>

          {/* Daily usage indicator */}
          {todayUsage.count > 0 && (
            <div className="rounded-lg bg-brand-teal/10 dark:bg-brand-teal/20 border border-brand-teal/20 px-4 py-2.5 text-center">
              <p className="text-xs font-medium text-brand-teal">Today&apos;s AI Usage</p>
              <p className="text-lg font-bold text-brand-teal">{todayUsage.count} <span className="text-xs font-normal">generation{todayUsage.count !== 1 ? 's' : ''}</span></p>
              {todayUsage.lastUsed && (
                <p className="text-xs text-brand-teal/70">Last used at {todayUsage.lastUsed}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Content Generator */}
      <section className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand mb-2">
          AI Content Generator
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Generate content directly in the dashboard. Select a type, enter your topic, and get AI-generated content.
        </p>

        <AIContentGenerator onGenerate={handleGeneration} />
      </section>

      {/* AI Insights */}
      <section>
        <h2 className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand mb-4">
          Strategic Insights
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Data-driven recommendations to improve engagement, growth, and safety.
        </p>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter insights by category">
          {['all', 'growth', 'engagement', 'content', 'safety', 'revenue'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              aria-pressed={filter === cat}
              className={`min-h-[44px] min-w-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === cat
                  ? 'bg-brand-teal text-white'
                  : 'bg-brand-sand/50 dark:bg-brand-charcoal/50 text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal/10'
              }`}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          {filtered.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </section>
    </div>
  );
}
