import { motion } from "framer-motion";

export default function QuoteCard({
  quote,
  suggestion,
  insight,
  onRefresh,
  className = "",
  todayCompleted = 0,
  todayTotal = 0,
  todayRate = 0,
  currentStreak = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`quote-card flex w-full min-w-0 ${className}`}
    >
      <div className="quote-card-overlay" />
      <div className="relative flex min-h-0 w-full flex-col">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/65">Daily quote</p>
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white leading-tight mt-1">AI Motivational Brief</h2>
          </div>
          <button
            type="button"
            className="btn text-sm py-2 px-3 w-full sm:w-auto bg-(--accent) border border-transparent text-white shadow-[0_10px_22px_rgba(183,131,41,0.28)] hover:bg-(--accent-strong)"
            onClick={onRefresh}
          >
            Refresh
          </button>
        </div>
        <div className="flex-1 flex items-center py-1">
          <p className="text-base sm:text-lg md:text-[1.2rem] leading-7 text-white font-medium">&ldquo;{quote}&rdquo;</p>
        </div>

        <div className="mt-2 rounded-2xl border border-white/20 bg-white/10 p-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/65">Today snapshot</p>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-white/10 bg-white/5 py-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/55">Done</p>
              <p className="mt-1 text-sm font-semibold text-white">{todayCompleted}/{todayTotal}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 py-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/55">Rate</p>
              <p className="mt-1 text-sm font-semibold text-white">{todayRate}%</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 py-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/55">Streak</p>
              <p className="mt-1 text-sm font-semibold text-white">{currentStreak}d</p>
            </div>
          </div>
        </div>

        <div className="mt-2 grid gap-2">
          <div className="quote-insight-item">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Suggestion</p>
            <p className="text-sm text-white/90 mt-0.5 leading-6">{suggestion}</p>
          </div>
          <div className="quote-insight-item">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Insight</p>
            <p className="text-sm text-white/90 mt-0.5 leading-6">{insight}</p>
          </div>
          <div className="quote-insight-item">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Action steps</p>
            <ul className="mt-1 space-y-1 text-sm text-white/90 list-disc pl-4">
              <li>Complete one small habit now.</li>
              <li>Keep the task short and repeatable.</li>
              <li>Refresh quote when focus drops.</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
