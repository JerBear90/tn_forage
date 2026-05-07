"use client";

import { useState, useEffect } from "react";
import type { BlogArticle } from "@/types";
import { seedBlogArticles } from "@/data/blogArticles";
import { pb } from "@/auth/authService";
import Link from "next/link";

/**
 * Blog feed page displaying articles in reverse-chronological order.
 * Loads from PocketBase blog_articles collection + seed articles.
 */
export default function BlogPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadArticles() {
      const allArticles: BlogArticle[] = [];
      const existingIds = new Set<string>();

      // Load from PocketBase first
      try {
        const result = await pb.collection('blog_articles').getList(1, 50, {
          sort: '-created',
          filter: 'published = true',
        });
        for (const record of result.items) {
          const article: BlogArticle = {
            id: record.id,
            title: (record.title as string) || '',
            author: (record.author as string) || 'ForageWise',
            publishedAt: (record.created as string) || '',
            summary: ((record.body as string) || '').slice(0, 150),
            body: (record.body as string) || '',
            coverImage: (record.featuredImage as string) || undefined,
            tags: parseTags(record.tags),
            sources: [],
            lastUpdated: (record.updated as string) || '',
            readTimeMinutes: Math.ceil(((record.body as string) || '').split(' ').length / 200),
          };
          allArticles.push(article);
          existingIds.add(article.id);
        }
      } catch {
        // PocketBase unavailable — continue with seed articles
      }

      // Add seed articles that aren't already from PocketBase
      for (const seed of seedBlogArticles) {
        if (!existingIds.has(seed.id)) {
          allArticles.push(seed);
        }
      }

      // Sort newest first
      allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      setArticles(allArticles);
      setIsLoading(false);
    }
    loadArticles();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-brand-sand mb-4">Blog</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-gray-800 dark:text-brand-sand mb-4">Blog</h1>
      <div className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/blog/${article.id}`}
            className="block rounded-xl border border-gray-200 dark:border-brand-charcoal/30 overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-brand-charcoal/50"
          >
            {/* Cover Image */}
            {article.coverImage && (
              <div className="w-full h-40 bg-brand-sand/30 dark:bg-brand-charcoal/60 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.coverImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-brand-sand mb-1">{article.title}</h2>
              <p className="text-xs text-gray-500 dark:text-brand-sand/60 mb-2">
                {article.author} · {new Date(article.publishedAt).toLocaleDateString()}
                {article.readTimeMinutes && (
                  <span> · {article.readTimeMinutes} min read</span>
                )}
              </p>
              <p className="text-xs text-gray-600 dark:text-brand-sand/70 line-clamp-2">{article.summary}</p>
              <div className="flex gap-1 mt-2">
                {article.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-gray-100 dark:bg-brand-charcoal/40 px-2 py-0.5 text-[10px] text-gray-500 dark:text-brand-sand/60">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {articles.length === 0 && (
        <p className="text-sm text-gray-500 text-center mt-8">No articles available.</p>
      )}
    </div>
  );
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try { const p = JSON.parse(value); if (Array.isArray(p)) return p; } catch { return value.split(',').map((t) => t.trim()).filter(Boolean); }
  }
  return [];
}
