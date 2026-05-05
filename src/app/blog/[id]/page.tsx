"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getAllRecords } from "@/offline/db";
import type { BlogArticle } from "@/types";
import Link from "next/link";

/**
 * Blog article detail page with full content and source attribution.
 * Requirements: 2.3, 2.6, 2.7
 */
export default function BlogArticlePage() {
  const params = useParams();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      try {
        const all = await getAllRecords("blogArticles");
        const found = (all as BlogArticle[]).find((a) => a.id === params.id);
        setArticle(found ?? null);
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    loadArticle();
  }, [params.id]);

  if (isLoading) {
    return <div className="p-4 animate-pulse"><div className="h-8 bg-gray-200 rounded mb-4" /><div className="h-64 bg-gray-200 rounded" /></div>;
  }

  if (!article) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-gray-600">Article not found.</p>
        <Link href="/community#blog" className="text-sm text-teal-600 hover:underline mt-2 inline-block">← Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <Link href="/community#blog" className="text-xs text-teal-600 hover:underline mb-4 inline-block">← Back to Blog</Link>
      <h1 className="text-xl font-bold text-gray-800 mb-2">{article.title}</h1>
      <p className="text-xs text-gray-500 mb-4">
        {article.author} · {new Date(article.publishedAt).toLocaleDateString()}
      </p>
      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-6">
        {article.body}
      </div>

      {/* Source Attribution */}
      {article.sources.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">Sources</h3>
          <ul className="space-y-1">
            {article.sources.map((source, i) => (
              <li key={i} className="text-xs text-gray-500">
                {source.name}
                {source.author && ` — ${source.author}`}
                {source.publication && ` (${source.publication})`}
                {source.url && (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline ml-1">
                    [link]
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
