import { useMemo, useState } from "react";

const badgeRules = [
  {
    threshold: 3,
    label: "Warm Start",
    tier: "Starter",
    icon: "●",
    tone: "stone",
    description: "Earned after the first few days of building the habit.",
  },
  {
    threshold: 7,
    label: "Momentum Starter",
    tier: "Starter",
    icon: "◆",
    tone: "amber",
    description: "Unlocked after one disciplined week of consistency.",
  },
  {
    threshold: 14,
    label: "Consistency Builder",
    tier: "Growth",
    icon: "✦",
    tone: "gold",
    description: "Unlocked when the habit becomes part of the routine.",
  },
  {
    threshold: 21,
    label: "Routine Guardian",
    tier: "Growth",
    icon: "⬟",
    tone: "amber",
    description: "Unlocked when the streak begins to feel stable.",
  },
  {
    threshold: 30,
    label: "Monthly Anchor",
    tier: "Elite",
    icon: "✪",
    tone: "gold",
    description: "Unlocked for one full month of sustained execution.",
  },
  {
    threshold: 60,
    label: "Reliability Core",
    tier: "Elite",
    icon: "◈",
    tone: "stone",
    description: "Unlocked when performance becomes dependable.",
  },
  {
    threshold: 100,
    label: "Legacy Streak",
    tier: "Legend",
    icon: "◆",
    tone: "gold",
    description: "Unlocked for exceptional long-term discipline.",
  },
];

function getProgress(previousThreshold, currentThreshold, streak) {
  const range = currentThreshold - previousThreshold;
  const current = Math.min(Math.max(streak - previousThreshold, 0), range);
  return range ? Math.round((current / range) * 100) : 0;
}

export default function BadgeWall({ streak = 0 }) {
  const badges = useMemo(() => badgeRules.map((badge, index) => {
    const earned = streak >= badge.threshold;
    const previousThreshold = index === 0 ? 0 : badgeRules[index - 1].threshold;
    const progress = getProgress(previousThreshold, badge.threshold, streak);

    return {
      ...badge,
      earned,
      progress,
      index,
      previousThreshold,
    };
  }), [streak]);

  const [selectedLabel, setSelectedLabel] = useState(badges[0]?.label || "");
  const selectedBadge = badges.find((badge) => badge.label === selectedLabel) || badges[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {badges.map((badge) => (
          <button
            key={badge.label}
            type="button"
            onClick={() => setSelectedLabel(badge.label)}
            className={`group rounded-3xl border p-4 text-left transition-all duration-200 ${selectedBadge?.label === badge.label
              ? "border-(--accent) bg-[linear-gradient(180deg,#fffaf3_0%,#fff6e1_100%)] shadow-[0_18px_36px_rgba(183,131,41,0.18)]"
              : "border-stone-200 bg-white/88 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white hover:shadow-[0_12px_24px_rgba(35,31,24,0.07)]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`relative inline-flex h-10 w-10 aspect-square shrink-0 items-center justify-center rounded-full border text-sm font-semibold leading-none overflow-hidden ${badge.earned ? "border-(--accent) bg-(--accent) text-white" : "border-stone-300 bg-stone-100 text-stone-500"}`}>
                  <span className={`absolute inset-0 rounded-full ${badge.earned ? "ring-4 ring-(--accent)/15" : ""}`} />
                  <span className="relative flex items-center justify-center leading-none">{badge.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">{badge.tier}</p>
                  <h4 className="text-sm font-semibold truncate text-stone-900">{badge.label}</h4>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${badge.earned ? "bg-(--accent) text-white" : "bg-stone-100 text-stone-500"}`}>
                {badge.earned ? "Earned" : `${badge.threshold}d`}
              </span>
            </div>
            <p className="mt-3 text-xs text-stone-600 leading-relaxed line-clamp-2">{badge.description}</p>
          </button>
        ))}
      </div>

      {selectedBadge ? (
        <div className={`rounded-[26px] border p-5 md:p-6 shadow-[0_14px_30px_rgba(35,31,24,0.08)] ${selectedBadge.earned
          ? "border-(--accent) bg-[linear-gradient(180deg,#fffdf7_0%,#fff6df_100%)]"
          : "border-stone-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfaf7_100%)]"
        }`}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className={`relative inline-flex h-12 w-12 aspect-square shrink-0 items-center justify-center rounded-full border text-base font-semibold leading-none overflow-hidden ${selectedBadge.earned ? "border-(--accent) bg-(--accent) text-white" : "border-stone-300 bg-stone-100 text-stone-500"}`}>
                <span className={`absolute inset-0 rounded-full ${selectedBadge.earned ? "ring-4 ring-(--accent)/15" : ""}`} />
                <span className="relative flex items-center justify-center leading-none">{selectedBadge.icon}</span>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Selected badge</p>
                <h4 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-stone-900">{selectedBadge.label}</h4>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed max-w-2xl">{selectedBadge.description}</p>
              </div>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${selectedBadge.earned ? "bg-(--accent) text-white" : "bg-stone-100 text-stone-500"}`}>
              {selectedBadge.earned ? "Unlocked" : "Locked"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-stone-500 mb-2">
                <span>Streak target</span>
                <span>{selectedBadge.threshold} days</span>
              </div>
              <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
                <div className={`h-full rounded-full ${selectedBadge.earned ? "bg-(--accent)" : "bg-stone-400/70"}`} style={{ width: `${selectedBadge.earned ? 100 : selectedBadge.progress}%` }} />
              </div>
            </div>
            <div className="text-sm text-stone-600 md:text-right">
              {selectedBadge.earned
                ? "Achievement earned through consistency."
                : `${streak} / ${selectedBadge.threshold} days completed.`}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
