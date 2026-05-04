"use client";

import { useState, useEffect } from "react";
import { getAllRecords } from "@/offline/db";
import type { BlogArticle } from "@/types";
import Link from "next/link";

/**
 * Blog feed page displaying articles in reverse-chronological order.
 * Requirements: 2.1–2.9
 */
export default function BlogPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadArticles() {
      try {
        const all = await getAllRecords("blogArticles");
        const sorted = (all as BlogArticle[]).sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
        );
        setArticles(sorted);
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    loadArticles();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Blog</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Blog</h1>
      <div className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/blog/${article.id}`}
            className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-sm font-semibold text-gray-800 mb-1">{article.title}</h2>
            <p className="text-xs text-gray-500 mb-2">
              {article.author} · {new Date(article.publishedAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-600 line-clamp-2">{article.summary}</p>
            <div className="flex gap-1 mt-2">
              {article.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                  {tag}
                </span>
              ))}
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
