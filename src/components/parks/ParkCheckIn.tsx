"use client";

import { useState } from "react";
import type { CheckInTodo } from "@/types";

interface ParkCheckInProps {
  parkId: string;
  parkName: string;
  isCheckedIn: boolean;
  onCheckIn: () => void;
  todos: CheckInTodo[];
  onAddTodo: (text: string) => void;
  onToggleTodo: (todoId: string) => void;
  onRate: (rating: number) => void;
  currentRating?: number;
}

/**
 * Park check-in component with to-do list, rating, and share functionality.
 * Requirements: 16.1–16.7
 */
export default function ParkCheckIn({
  parkName,
  isCheckedIn,
  onCheckIn,
  todos,
  onAddTodo,
  onToggleTodo,
  onRate,
  currentRating,
}: ParkCheckInProps) {
  const [newTodo, setNewTodo] = useState("");

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;
    onAddTodo(newTodo.trim());
    setNewTodo("");
  };

  return (
    <div className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 p-4">
      {!isCheckedIn ? (
        <button
          onClick={onCheckIn}
          className="w-full rounded-md bg-teal-600 px-4 py-3 text-sm font-medium text-white hover:bg-teal-700"
        >
          Check In at {parkName}
        </button>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-600">✓</span>
            <span className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">Checked in!</span>
          </div>

          {/* Rating */}
          <div className="mb-3">
            <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">Rate this park:</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Park rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => onRate(star)}
                  className={`text-xl ${(currentRating ?? 0) >= star ? "text-yellow-400" : "text-brand-charcoal/20 dark:text-brand-sand/20"}`}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  role="radio"
                  aria-checked={(currentRating ?? 0) >= star}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* To-do list */}
          <div className="mb-3">
            <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">Things to see/do:</p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                placeholder="Add item..."
                className="flex-1 rounded border border-brand-charcoal/10 dark:border-brand-sand/10 px-2 py-1 text-sm"
                aria-label="New to-do item"
              />
              <button onClick={handleAddTodo} className="rounded bg-brand-charcoal/10 dark:bg-brand-sand/10 px-2 text-sm hover:bg-brand-charcoal/20 dark:hover:bg-brand-sand/20">+</button>
            </div>
            {todos.length > 0 && (
              <ul className="space-y-1">
                {todos.map((todo) => (
                  <li key={todo.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => onToggleTodo(todo.id)}
                      className="rounded border-brand-charcoal/10 dark:border-brand-sand/10"
                      aria-label={todo.text}
                    />
                    <span className={`text-sm ${todo.completed ? "line-through text-brand-charcoal/50 dark:text-brand-sand/50" : "text-brand-charcoal dark:text-brand-sand"}`}>
                      {todo.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
