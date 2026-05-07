"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { BlogArticle } from "@/types";
import { seedBlogArticles } from "@/data/blogArticles";
import { pb } from "@/auth/authService";
import Link from "next/link";

/**
 * Blog article detail page with full content and source attribution.
 * Loads from PocketBase blog_articles or seed articles.
 */
export default function BlogArticlePage() {
  const params = useParams();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      // Check seed articles first (instant, no network)
      const seedFound = seedBlogArticles.find((a) => a.id === params.id);
      if (seedFound) {
        setArticle(seedFound);
        setIsLoading(false);
        return;
      }

      // Try PocketBase
      try {
        const record = await pb.collection('blog_articles').getOne(params.id as string);
        const body = (record.body as string) || '';
        setArticle({
          id: record.id,
          title: (record.title as string) || '',
          author: (record.author as string) || 'ForageWise',
          publishedAt: (record.created as string) || '',
          summary: body.slice(0, 150),
          body,
          coverImage: (record.featuredImage as string) || undefined,
          tags: parseTags(record.tags),
          sources: [],
          lastUpdated: (record.updated as string) || '',
          readTimeMinutes: Math.ceil(body.split(' ').length / 200),
        });
      } catch {
        setArticle(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadArticle();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="p-4 max-w-2xl mx-auto animate-pulse">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
        <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-8" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-4 text-center py-16">
        <div className="text-4xl mb-3" aria-hidden="true">📄</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Article not found.</p>
        <Link href="/community#blog" className="text-sm text-brand-teal hover:underline mt-3 inline-block">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="px-4 py-6 pb-24 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href="/community#blog"
        className="inline-flex items-center gap-1 text-xs text-brand-teal hover:underline mb-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
      >
        ← Back to Blog
      </Link>

      {/* Cover Image */}
      {article.coverImage && (
        <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden mb-6 bg-brand-sand/40 dark:bg-brand-charcoal/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.coverImage}
            alt={`Cover image for ${article.title}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-charcoal dark:text-brand-sand font-heading leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            {article.author}
          </span>
          <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">•</span>
          <time dateTime={article.publishedAt} className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {new Date(article.publishedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          {article.readTimeMinutes && (
            <>
              <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">•</span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {article.readTimeMinutes} min read
              </span>
            </>
          )}
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4" aria-label="Article tags">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-brand-teal/10 dark:bg-brand-teal/20 px-3 py-1 text-xs font-medium text-brand-teal"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Summary */}
      {article.summary && (
        <div className="mb-6 rounded-lg border-l-4 border-brand-teal bg-brand-teal/5 dark:bg-brand-teal/10 p-4">
          <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 italic leading-relaxed">
            {article.summary}
          </p>
        </div>
      )}

      {/* Body Content */}
      <div className="article-body">
        <BlogBody content={article.body} />
      </div>

      {/* Source Attribution */}
      {article.sources.length > 0 && (
        <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            Sources &amp; References
          </h2>
          <ul className="space-y-2">
            {article.sources.map((source, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg bg-gray-50 dark:bg-brand-charcoal/30 px-3 py-2"
              >
                <span className="text-gray-400 dark:text-gray-500 font-mono text-xs mt-0.5">{i + 1}.</span>
                <div>
                  <span className="font-medium text-brand-charcoal dark:text-brand-sand">{source.name}</span>
                  {source.author && <span className="text-gray-500"> — {source.author}</span>}
                  {source.publication && <span className="text-gray-500"> ({source.publication})</span>}
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-brand-teal hover:underline text-xs"
                    >
                      View source ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// BlogBody — Renders article content with proper structure
// ---------------------------------------------------------------------------

/**
 * Renders blog body content with proper formatting.
 * Handles:
 * - HTML content (rendered via dangerouslySetInnerHTML with prose styles)
 * - Plain text with newlines (converted to paragraphs)
 * - Markdown-like headings (## Heading)
 * - Markdown-like bold (**text**)
 * - Markdown-like lists (- item or * item)
 */
function BlogBody({ content }: { content: string }) {
  // If content contains HTML tags, render as HTML with prose styling
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);

  if (hasHtml) {
    return (
      <div
        className="prose prose-sm sm:prose-base max-w-none text-brand-charcoal dark:text-brand-sand prose-headings:text-brand-charcoal dark:prose-headings:text-brand-sand prose-a:text-brand-teal prose-strong:text-brand-charcoal dark:prose-strong:text-brand-sand prose-li:text-brand-charcoal/80 dark:prose-li:text-brand-sand/80"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Plain text — parse into structured blocks
  const blocks = parseTextToBlocks(content);

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={i}
                className="text-lg font-bold text-brand-charcoal dark:text-brand-sand mt-6 mb-2 font-heading"
              >
                {block.content}
              </h2>
            );
          case "subheading":
            return (
              <h3
                key={i}
                className="text-base font-semibold text-brand-charcoal dark:text-brand-sand mt-4 mb-1"
              >
                {block.content}
              </h3>
            );
          case "list":
            return (
              <ul key={i} className="list-disc list-inside space-y-1.5 pl-2 text-sm text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed">
                {block.items!.map((item, j) => (
                  <li key={j}>{renderInlineFormatting(item)}</li>
                ))}
              </ul>
            );
          case "paragraph":
          default:
            return (
              <p
                key={i}
                className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed"
              >
                {renderInlineFormatting(block.content)}
              </p>
            );
        }
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Text parsing helpers
// ---------------------------------------------------------------------------

interface TextBlock {
  type: "heading" | "subheading" | "paragraph" | "list";
  content: string;
  items?: string[];
}

function parseTextToBlocks(text: string): TextBlock[] {
  const lines = text.split("\n");
  const blocks: TextBlock[] = [];
  let currentList: string[] = [];

  function flushList() {
    if (currentList.length > 0) {
      blocks.push({ type: "list", content: "", items: [...currentList] });
      currentList = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line — flush any pending list
    if (!trimmed) {
      flushList();
      continue;
    }

    // Heading: ## Title or # Title
    if (trimmed.startsWith("## ")) {
      flushList();
      blocks.push({ type: "subheading", content: trimmed.slice(3).trim() });
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      blocks.push({ type: "heading", content: trimmed.slice(2).trim() });
      continue;
    }

    // ALL CAPS line (likely a section header)
    if (trimmed.length > 3 && trimmed === trimmed.toUpperCase() && /^[A-Z\s&:]+$/.test(trimmed)) {
      flushList();
      blocks.push({ type: "heading", content: titleCase(trimmed) });
      continue;
    }

    // List item: - item, * item, or numbered (1. item)
    const listMatch = trimmed.match(/^[-*•]\s+(.+)/) || trimmed.match(/^\d+[.)]\s+(.+)/);
    if (listMatch) {
      currentList.push(listMatch[1]);
      continue;
    }

    // Regular paragraph line
    flushList();
    blocks.push({ type: "paragraph", content: trimmed });
  }

  flushList();
  return blocks;
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Render inline formatting: **bold**, *italic*, [links](url)
 */
function renderInlineFormatting(text: string): React.ReactNode {
  // Split on **bold** patterns
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-brand-charcoal dark:text-brand-sand">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try { const p = JSON.parse(value); if (Array.isArray(p)) return p; } catch { return value.split(',').map((t) => t.trim()).filter(Boolean); }
  }
  return [];
}
