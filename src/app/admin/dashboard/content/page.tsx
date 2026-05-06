'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSightings,
  moderateSighting,
  getBlogArticles,
  createBlogArticle,
  updateBlogArticle,
  unpublishBlogArticle,
} from '@/services/admin/contentService';
import type {
  SightingStatus,
  ModerationAction,
  SightingRecord,
  SightingListResult,
  BlogArticle,
  BlogArticleListResult,
  BlogArticleData,
} from '@/services/admin/contentService';

const PER_PAGE = 10;

export default function ContentModerationPage() {
  const [activeTab, setActiveTab] = useState<'sightings' | 'blog'>('sightings');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
          Content Management
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Moderate community sightings and manage blog articles
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg bg-brand-sand/50 p-1 dark:bg-brand-charcoal/50" role="tablist" aria-label="Content management tabs">
        <button
          role="tab"
          aria-selected={activeTab === 'sightings'}
          aria-controls="sightings-panel"
          id="sightings-tab"
          onClick={() => setActiveTab('sightings')}
          className={`min-h-[44px] min-w-[44px] flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-teal/30 ${
            activeTab === 'sightings'
              ? 'bg-white text-brand-charcoal shadow-sm dark:bg-brand-charcoal dark:text-brand-sand'
              : 'text-gray-600 hover:text-brand-charcoal dark:text-gray-400 dark:hover:text-brand-sand'
          }`}
        >
          Sightings
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'blog'}
          aria-controls="blog-panel"
          id="blog-tab"
          onClick={() => setActiveTab('blog')}
          className={`min-h-[44px] min-w-[44px] flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-teal/30 ${
            activeTab === 'blog'
              ? 'bg-white text-brand-charcoal shadow-sm dark:bg-brand-charcoal dark:text-brand-sand'
              : 'text-gray-600 hover:text-brand-charcoal dark:text-gray-400 dark:hover:text-brand-sand'
          }`}
        >
          Blog Articles
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'sightings' && (
        <div role="tabpanel" id="sightings-panel" aria-labelledby="sightings-tab">
          <SightingsPanel />
        </div>
      )}
      {activeTab === 'blog' && (
        <div role="tabpanel" id="blog-panel" aria-labelledby="blog-tab">
          <BlogPanel />
        </div>
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Sightings Panel
// ---------------------------------------------------------------------------

function SightingsPanel() {
  const [statusFilter, setStatusFilter] = useState<SightingStatus | ''>('');
  const [sightings, setSightings] = useState<SightingListResult | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reasonDialog, setReasonDialog] = useState<{
    sightingId: string;
    action: ModerationAction;
  } | null>(null);
  const [reason, setReason] = useState('');

  const fetchSightings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSightings(
        statusFilter || undefined,
        page,
        PER_PAGE,
      );
      setSightings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sightings');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchSightings();
  }, [fetchSightings]);

  const handleModerate = async (sightingId: string, action: ModerationAction) => {
    if (action === 'flag' || action === 'remove') {
      setReasonDialog({ sightingId, action });
      return;
    }
    await executeModeration(sightingId, action);
  };

  const executeModeration = async (sightingId: string, action: ModerationAction, moderationReason?: string) => {
    setActionLoading(sightingId);
    try {
      await moderateSighting(sightingId, action, moderationReason);
      await fetchSightings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Moderation action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReasonSubmit = async () => {
    if (!reasonDialog) return;
    setReasonDialog(null);
    await executeModeration(reasonDialog.sightingId, reasonDialog.action, reason);
    setReason('');
  };

  return (
    <section className="space-y-4" aria-labelledby="sightings-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="sightings-heading" className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand">
          Community Sightings
        </h2>
        <div>
          <label htmlFor="sighting-status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="sighting-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as SightingStatus | '');
              setPage(1);
            }}
            aria-label="Filter sightings by status"
            className="min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-sm text-brand-charcoal focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:focus:border-brand-teal"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="flagged">Flagged</option>
            <option value="removed">Removed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10">
        <table className="w-full text-sm text-left" role="table" aria-label="Community sightings list">
          <thead>
            <tr className="border-b border-brand-charcoal/10 bg-brand-sand/30 dark:border-brand-sand/10 dark:bg-brand-charcoal/50">
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Title</th>
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Species</th>
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">User</th>
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Date</th>
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !sightings ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Loading sightings...
                </td>
              </tr>
            ) : sightings && sightings.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No sightings found.
                </td>
              </tr>
            ) : (
              sightings?.items.map((sighting) => (
                <tr
                  key={sighting.id}
                  className="border-b border-brand-charcoal/5 dark:border-brand-sand/5 hover:bg-brand-sand/50 dark:hover:bg-brand-charcoal/30"
                >
                  <td className="px-4 py-3 font-medium text-brand-charcoal dark:text-brand-sand">
                    {sighting.title || 'Untitled'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {sighting.species || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {sighting.userName}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(sighting.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={sighting.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {sighting.status !== 'approved' && (
                        <button
                          onClick={() => handleModerate(sighting.id, 'approve')}
                          disabled={actionLoading === sighting.id}
                          aria-label={`Approve sighting: ${sighting.title}`}
                          className="min-h-[44px] min-w-[44px] rounded-md bg-green-100 px-3 py-2 text-xs font-medium text-green-800 transition-colors hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                        >
                          Approve
                        </button>
                      )}
                      {sighting.status !== 'flagged' && (
                        <button
                          onClick={() => handleModerate(sighting.id, 'flag')}
                          disabled={actionLoading === sighting.id}
                          aria-label={`Flag sighting: ${sighting.title}`}
                          className="min-h-[44px] min-w-[44px] rounded-md bg-yellow-100 px-3 py-2 text-xs font-medium text-yellow-800 transition-colors hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 disabled:opacity-50 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
                        >
                          Flag
                        </button>
                      )}
                      {sighting.status !== 'removed' && (
                        <button
                          onClick={() => handleModerate(sighting.id, 'remove')}
                          disabled={actionLoading === sighting.id}
                          aria-label={`Remove sighting: ${sighting.title}`}
                          className="min-h-[44px] min-w-[44px] rounded-md bg-red-100 px-3 py-2 text-xs font-medium text-red-800 transition-colors hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sightings && sightings.totalPages > 1 && (
        <nav className="flex items-center justify-between" aria-label="Sightings pagination">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {sightings.totalPages} ({sightings.totalItems} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-sand/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand dark:hover:bg-brand-charcoal/50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(sightings.totalPages, p + 1))}
              disabled={page >= sightings.totalPages}
              aria-label="Next page"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-sand/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand dark:hover:bg-brand-charcoal/50"
            >
              Next
            </button>
          </div>
        </nav>
      )}

      {/* Reason Dialog */}
      {reasonDialog && (
        <ReasonDialog
          action={reasonDialog.action}
          reason={reason}
          onReasonChange={setReason}
          onConfirm={handleReasonSubmit}
          onCancel={() => {
            setReasonDialog(null);
            setReason('');
          }}
        />
      )}
    </section>
  );
}


// ---------------------------------------------------------------------------
// Blog Panel
// ---------------------------------------------------------------------------

function BlogPanel() {
  const [articles, setArticles] = useState<BlogArticleListResult | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBlogArticles(page, PER_PAGE);
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blog articles');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleCreate = () => {
    setEditingArticle(null);
    setShowForm(true);
  };

  const handleEdit = (article: BlogArticle) => {
    setEditingArticle(article);
    setShowForm(true);
  };

  const handleUnpublish = async (articleId: string) => {
    try {
      await unpublishBlogArticle(articleId);
      await fetchArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpublish article');
    }
  };

  const handleFormSubmit = async (data: BlogArticleData) => {
    try {
      if (editingArticle) {
        await updateBlogArticle(editingArticle.id, data);
      } else {
        await createBlogArticle(data);
      }
      setShowForm(false);
      setEditingArticle(null);
      await fetchArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingArticle(null);
  };

  if (showForm) {
    return (
      <BlogArticleForm
        article={editingArticle}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="blog-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="blog-heading" className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand">
          Blog Articles
        </h2>
        <button
          onClick={handleCreate}
          aria-label="Create new blog article"
          className="min-h-[44px] min-w-[44px] rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-teal/90 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:ring-offset-2"
        >
          + New Article
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10">
        <table className="w-full text-sm text-left" role="table" aria-label="Blog articles list">
          <thead>
            <tr className="border-b border-brand-charcoal/10 bg-brand-sand/30 dark:border-brand-sand/10 dark:bg-brand-charcoal/50">
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Title</th>
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Author</th>
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Tags</th>
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Updated</th>
              <th scope="col" className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !articles ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Loading articles...
                </td>
              </tr>
            ) : articles && articles.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No blog articles yet. Create your first article.
                </td>
              </tr>
            ) : (
              articles?.items.map((article) => (
                <tr
                  key={article.id}
                  className="border-b border-brand-charcoal/5 dark:border-brand-sand/5 hover:bg-brand-sand/50 dark:hover:bg-brand-charcoal/30"
                >
                  <td className="px-4 py-3 font-medium text-brand-charcoal dark:text-brand-sand">
                    {article.title}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {article.author}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex rounded-full bg-brand-moss/10 px-2 py-0.5 text-xs text-brand-moss dark:bg-brand-moss/20"
                        >
                          {tag}
                        </span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className="text-xs text-gray-400">+{article.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        article.published
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400'
                      }`}
                    >
                      {article.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(article.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => handleEdit(article)}
                        aria-label={`Edit article: ${article.title}`}
                        className="min-h-[44px] min-w-[44px] rounded-md bg-brand-teal/10 px-3 py-2 text-xs font-medium text-brand-teal transition-colors hover:bg-brand-teal/20 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:bg-brand-teal/20 dark:hover:bg-brand-teal/30"
                      >
                        Edit
                      </button>
                      {article.published && (
                        <button
                          onClick={() => handleUnpublish(article.id)}
                          aria-label={`Unpublish article: ${article.title}`}
                          className="min-h-[44px] min-w-[44px] rounded-md bg-yellow-100 px-3 py-2 text-xs font-medium text-yellow-800 transition-colors hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
                        >
                          Unpublish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {articles && articles.totalPages > 1 && (
        <nav className="flex items-center justify-between" aria-label="Blog articles pagination">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {articles.totalPages} ({articles.totalItems} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-sand/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand dark:hover:bg-brand-charcoal/50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(articles.totalPages, p + 1))}
              disabled={page >= articles.totalPages}
              aria-label="Next page"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium text-brand-charcoal transition-colors hover:bg-brand-sand/50 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand dark:hover:bg-brand-charcoal/50"
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}


// ---------------------------------------------------------------------------
// Blog Article Form
// ---------------------------------------------------------------------------

function BlogArticleForm({
  article,
  onSubmit,
  onCancel,
}: {
  article: BlogArticle | null;
  onSubmit: (data: BlogArticleData) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(article?.title ?? '');
  const [body, setBody] = useState(article?.body ?? '');
  const [author, setAuthor] = useState(article?.author ?? '');
  const [tagsInput, setTagsInput] = useState(article?.tags.join(', ') ?? '');
  const [featuredImage, setFeaturedImage] = useState(article?.featuredImage ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !body.trim() || !author.trim()) {
      setFormError('Title, body, and author are required.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        author: author.trim(),
        tags,
        featuredImage: featuredImage.trim(),
        published: true,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="rounded-xl border border-brand-charcoal/10 bg-white p-6 shadow-sm dark:border-brand-sand/10 dark:bg-brand-charcoal/50"
      aria-labelledby="article-form-heading"
    >
      <h2
        id="article-form-heading"
        className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand"
      >
        {article ? 'Edit Article' : 'Create New Article'}
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Title */}
        <div>
          <label
            htmlFor="article-title"
            className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="article-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            aria-label="Article title"
            aria-required="true"
            className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500 dark:focus:border-brand-teal"
          />
        </div>

        {/* Body (textarea for markdown/HTML) */}
        <div>
          <label
            htmlFor="article-body"
            className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
          >
            Body <span className="text-red-500">*</span>
            <span className="ml-2 text-xs text-gray-400 font-normal">(Supports Markdown/HTML)</span>
          </label>
          <textarea
            id="article-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your article content here... (Markdown and HTML supported)"
            aria-label="Article body content"
            aria-required="true"
            rows={12}
            className="mt-1 w-full min-h-[200px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-3 text-brand-charcoal placeholder-gray-400 font-mono text-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500 dark:focus:border-brand-teal resize-y"
          />
        </div>

        {/* Author */}
        <div>
          <label
            htmlFor="article-author"
            className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
          >
            Author <span className="text-red-500">*</span>
          </label>
          <input
            id="article-author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author name"
            aria-label="Article author"
            aria-required="true"
            className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500 dark:focus:border-brand-teal"
          />
        </div>

        {/* Tags */}
        <div>
          <label
            htmlFor="article-tags"
            className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
          >
            Tags <span className="text-xs text-gray-400 font-normal">(comma-separated)</span>
          </label>
          <input
            id="article-tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="foraging, safety, seasonal"
            aria-label="Article tags, comma-separated"
            className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500 dark:focus:border-brand-teal"
          />
        </div>

        {/* Featured Image URL */}
        <div>
          <label
            htmlFor="article-featured-image"
            className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
          >
            Featured Image URL <span className="text-xs text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="article-featured-image"
            type="url"
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
            aria-label="Featured image URL"
            className="mt-1 w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500 dark:focus:border-brand-teal"
          />
        </div>

        {/* Form Error */}
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" role="alert">
            {formError}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            aria-label={article ? 'Update article' : 'Create article'}
            className="min-h-[44px] min-w-[44px] rounded-lg bg-brand-teal px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-teal/90 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Saving...' : article ? 'Update Article' : 'Create Article'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel editing"
            className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-6 py-3 text-sm font-medium text-brand-charcoal transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:text-brand-sand dark:hover:bg-brand-charcoal/50"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}


// ---------------------------------------------------------------------------
// Shared Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: SightingStatus }) {
  const styles: Record<SightingStatus, string> = {
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    flagged: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    removed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ReasonDialog({
  action,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
}: {
  action: ModerationAction;
  reason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reason-dialog-title"
    >
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-brand-charcoal">
        <h2
          id="reason-dialog-title"
          className="text-lg font-bold text-brand-charcoal dark:text-brand-sand"
        >
          {action === 'flag' ? 'Flag Sighting' : 'Remove Sighting'}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {action === 'flag'
            ? 'Provide a reason for flagging this sighting (optional).'
            : 'Provide a reason for removing this sighting (optional).'}
        </p>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Reason for moderation action..."
          aria-label="Reason for moderation action"
          rows={3}
          className="mt-3 w-full min-h-[88px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-3 text-sm text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500 dark:focus:border-brand-teal resize-y"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            aria-label="Cancel moderation action"
            className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium text-brand-charcoal transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:text-brand-sand dark:hover:bg-brand-charcoal/50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            aria-label={`Confirm ${action} sighting`}
            className={`min-h-[44px] min-w-[44px] rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              action === 'remove'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500/30'
                : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500/30'
            }`}
          >
            {action === 'flag' ? 'Flag' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}
