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
    <div className="rounded-lg border border-gray-200 p-4">
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
            <span className="text-sm font-medium text-gray-800">Checked in!</span>
          </div>

          {/* Rating */}
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-1">Rate this park:</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Park rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => onRate(star)}
                  className={`text-xl ${(currentRating ?? 0) >= star ? "text-yellow-400" : "text-gray-300"}`}
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
            <p className="text-xs text-gray-600 mb-1">Things to see/do:</p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                placeholder="Add item..."
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                aria-label="New to-do item"
              />
              <button onClick={handleAddTodo} className="rounded bg-gray-200 px-2 text-sm hover:bg-gray-300">+</button>
            </div>
            {todos.length > 0 && (
              <ul className="space-y-1">
                {todos.map((todo) => (
                  <li key={todo.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => onToggleTodo(todo.id)}
                      className="rounded border-gray-300"
                      aria-label={todo.text}
                    />
                    <span className={`text-sm ${todo.completed ? "line-through text-gray-400" : "text-gray-700"}`}>
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
