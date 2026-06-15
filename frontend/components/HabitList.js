import { useState } from "react";
import dayjs from "dayjs";

export default function HabitList({ habits, logsByHabit, onToggleComplete, onDelete, className = "", bare = false }) {
  const today = dayjs().format("YYYY-MM-DD");
  const [expandedHabitId, setExpandedHabitId] = useState(null);

  return (
    <div className={`${bare ? "" : "surface p-4 md:p-6 h-full"} ${className}`}>
      {!bare ? <h2 className="text-xl font-semibold mb-3">Today&apos;s Habits</h2> : null}
      <div className="space-y-3">
        {habits.map((habit) => {
          const isDone = logsByHabit[habit.id]?.[today] === "completed";
          const isExpanded = expandedHabitId === habit.id;

          return (
            <div
              key={habit.id}
              className={`border border-stone-200 rounded-xl bg-white/80 transition-all ${isExpanded ? "p-4 shadow-md" : "p-3"}`}
              style={isExpanded ? { borderColor: "rgba(183, 131, 41, 0.4)" } : undefined}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpandedHabitId((prev) => (prev === habit.id ? null : habit.id))}
              >
                <div className={`flex ${isExpanded ? "items-start" : "items-center"} gap-3 min-w-0`}>
                  {habit.image_url ? (
                    <img
                      src={habit.image_url}
                      alt={habit.title}
                      className={`${isExpanded ? "h-24 w-24 rounded-xl" : "h-12 w-12 rounded-lg"} object-cover border border-stone-200 shrink-0`}
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className={`${isExpanded ? "text-lg" : "text-base"} font-semibold`}>{habit.title}</p>
                    <p className={`text-sm text-stone-600 ${isExpanded ? "whitespace-normal mt-1" : "truncate"}`}>
                      {habit.description || "No description"}
                    </p>
                    {isExpanded ? <p className="text-xs uppercase tracking-[0.2em] text-stone-500 mt-2">{habit.frequency}</p> : null}
                  </div>
                </div>
              </button>

              <div className={`flex items-center gap-2 ${isExpanded ? "mt-3" : "mt-2"}`}>
                <button
                  className="btn btn-ghost text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(habit.id, !isDone);
                  }}
                >
                  {isDone ? "Completed" : "Mark Complete"}
                </button>
                <button
                  className="btn btn-ghost text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(habit.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {!habits.length && <p className="text-stone-500">No habits yet. Create your first routine.</p>}
      </div>
    </div>
  );
}
