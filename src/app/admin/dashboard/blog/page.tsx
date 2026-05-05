'use client';

import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/auth/authService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlogArticle {
  id: string;
  title: string;
  body: string;
  author: string;
  tags: string[];
  featuredImage: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BlogArticleData {
  title: string;
  body: string;
  author: string;
  tags: string[];
  featuredImage: string;
  published: boolean;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PER_PAGE = 10;

export default function BlogPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await pb.collection('blog_articles').getList(page, PER_PAGE, {
        sort: '-created',
      });
      const items: BlogArticle[] = result.items.map((r) => ({
        id: r.id,
        title: (r.title as string) ?? '',
        body: (r.body as string) ?? '',
        author: (r.author as string) ?? '',
        tags: parseTags(r.tags),
        featuredImage: (r.featuredImage as string) ?? '',
        published: (r.published as boolean) ?? false,
        createdAt: (r.created as string) ?? '',
        updatedAt: (r.updated as string) ?? '',
      }));
      setArticles(items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      await pb.collection('blog_articles').delete(id);
      fetchArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article');
    }
  };

  const handleTogglePublish = async (article: BlogArticle) => {
    try {
      await pb.collection('blog_articles').update(article.id, { published: !article.published });
      fetchArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update article');
    }
  };

  const handleFormSubmit = async (data: BlogArticleData) => {
    try {
      if (editingArticle) {
        await pb.collection('blog_articles').update(editingArticle.id, {
          title: data.title,
          body: data.body,
          author: data.author,
          tags: JSON.stringify(data.tags),
          featuredImage: data.featuredImage,
          published: data.published,
        });
      } else {
        await pb.collection('blog_articles').create({
          title: data.title,
          body: data.body,
          author: data.author,
          tags: JSON.stringify(data.tags),
          featuredImage: data.featuredImage,
          published: data.published,
        });
      }
      setShowForm(false);
      setEditingArticle(null);
      fetchArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    }
  };

  if (showForm) {
    return (
      <ArticleForm
        article={editingArticle}
        onSubmit={handleFormSubmit}
        onCancel={() => { setShowForm(false); setEditingArticle(null); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">Blog</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage blog articles for ForageWise users
          </p>
        </div>
        <button
          onClick={handleCreate}
          aria-label="Create new article"
          className="min-h-[44px] rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          + New Article
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

      {/* Articles List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-teal border-t-transparent" />
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 p-12 text-center">
          <p className="text-lg font-medium text-brand-charcoal dark:text-brand-sand">No articles yet</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create your first blog article to get started.</p>
          <button
            onClick={handleCreate}
            className="mt-4 min-h-[44px] rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-teal/90"
          >
            Create Article
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-brand-charcoal dark:text-brand-sand truncate">
                      {article.title}
                    </h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      article.published
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400'
                    }`}>
                      {article.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    By {article.author} • {formatDate(article.createdAt)}
                  </p>
                  {article.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {article.tags.map((tag) => (
                        <span key={tag} className="inline-flex rounded-full bg-brand-teal/10 px-2 py-0.5 text-xs text-brand-teal dark:bg-brand-teal/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {stripHtml(article.body).slice(0, 150)}...
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleTogglePublish(article)}
                    aria-label={article.published ? 'Unpublish' : 'Publish'}
                    className="min-h-[44px] min-w-[44px] rounded-lg border border-brand-charcoal/20 px-3 py-2 text-xs font-medium text-brand-charcoal dark:border-brand-sand/20 dark:text-brand-sand hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {article.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleEdit(article)}
                    aria-label="Edit article"
                    className="min-h-[44px] min-w-[44px] rounded-lg bg-brand-teal/10 px-3 py-2 text-xs font-medium text-brand-teal hover:bg-brand-teal/20"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    aria-label="Delete article"
                    className="min-h-[44px] min-w-[44px] rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-between" aria-label="Blog pagination">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages} ({totalItems} articles)
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="min-h-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand">Previous</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="min-h-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand">Next</button>
          </div>
        </nav>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Article Form
// ---------------------------------------------------------------------------

function ArticleForm({ article, onSubmit, onCancel }: {
  article: BlogArticle | null;
  onSubmit: (data: BlogArticleData) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(article?.title ?? '');
  const [body, setBody] = useState(article?.body ?? '');
  const [author, setAuthor] = useState(article?.author ?? 'Jeramee Flemming');
  const [tagsInput, setTagsInput] = useState(article?.tags.join(', ') ?? '');
  const [featuredImage, setFeaturedImage] = useState(article?.featuredImage ?? '');
  const [published, setPublished] = useState(article?.published ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    await onSubmit({ title: title.trim(), body: body.trim(), author: author.trim(), tags, featuredImage: featuredImage.trim(), published });
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
          {article ? 'Edit Article' : 'New Article'}
        </h1>
        <button onClick={onCancel} className="min-h-[44px] rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm text-brand-charcoal dark:border-brand-sand/20 dark:text-brand-sand">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 p-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1">Title *</label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30" placeholder="Article title" />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1">Body * <span className="text-xs text-gray-400">(Markdown/HTML supported)</span></label>
          <textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} required rows={16} className="w-full min-h-[300px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-3 text-sm font-mono text-brand-charcoal dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30 resize-y" placeholder="Write your article content..." />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1">Author</label>
            <input id="author" type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30" />
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1">Tags <span className="text-xs text-gray-400">(comma-separated)</span></label>
            <input id="tags" type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30" placeholder="foraging, safety, seasonal" />
          </div>
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1">Featured Image URL</label>
          <input id="image" type="url" value={featuredImage} onChange={(e) => setFeaturedImage(e.target.value)} className="w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30" placeholder="https://..." />
        </div>

        <div className="flex items-center gap-3">
          <input id="published" type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-5 w-5 rounded border-brand-charcoal/30 text-brand-teal focus:ring-brand-teal/30" />
          <label htmlFor="published" className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">Publish immediately</label>
        </div>

        <button type="submit" disabled={submitting || !title.trim() || !body.trim()} className="min-h-[44px] rounded-lg bg-brand-teal px-6 py-3 text-sm font-medium text-white hover:bg-brand-teal/90 disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? 'Saving...' : article ? 'Update Article' : 'Create Article'}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try { const p = JSON.parse(value); if (Array.isArray(p)) return p; } catch { return value.split(',').map((t) => t.trim()).filter(Boolean); }
  }
  return [];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return '—'; }
}
