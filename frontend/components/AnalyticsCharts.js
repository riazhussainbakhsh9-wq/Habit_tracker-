import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

function ChartFrame({ height, children }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const updateReady = () => {
      const rect = node.getBoundingClientRect();
      setReady(rect.width > 0 && rect.height > 0);
    };

    updateReady();

    const observer = new ResizeObserver(updateReady);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ height: `${height}px` }} className="min-w-0">
      {ready ? children : null}
    </div>
  );
}

export default function AnalyticsCharts({ analytics, compact = false }) {
  const chartHeight = compact ? 220 : 256;
  const [view, setView] = useState("daily");

  const dailySeries = useMemo(() => {
    const mapped = new Map((analytics?.daily || []).map((item) => [item.period, item]));
    return Array.from({ length: 14 }).map((_, index) => {
      const key = dayjs().subtract(13 - index, "day").format("YYYY-MM-DD");
      const row = mapped.get(key);
      return {
        period: dayjs(key).format("MM/DD"),
        rawPeriod: key,
        completed: row?.completed || 0,
        missed: row?.missed || 0,
      };
    });
  }, [analytics]);

  const weeklySeries = useMemo(() => {
    const mapped = new Map((analytics?.weekly || []).map((item) => [item.period, item]));
    return Array.from({ length: 8 }).map((_, index) => {
      const key = dayjs().startOf("week").subtract(7 - index, "week").format("YYYY-MM-DD");
      const row = mapped.get(key);
      return {
        period: `W ${dayjs(key).format("MMM D")}`,
        rawPeriod: key,
        completed: row?.completed || 0,
        missed: row?.missed || 0,
      };
    });
  }, [analytics]);

  const monthlySeries = useMemo(() => {
    const mapped = new Map((analytics?.monthly || []).map((item) => [item.period, item]));
    return Array.from({ length: 6 }).map((_, index) => {
      const key = dayjs().startOf("month").subtract(5 - index, "month").format("YYYY-MM");
      const row = mapped.get(key);
      return {
        period: dayjs(`${key}-01`).format("MMM YYYY"),
        rawPeriod: key,
        completed: row?.completed || 0,
        missed: row?.missed || 0,
      };
    });
  }, [analytics]);

  const chartData = useMemo(() => {
    if (view === "daily") return dailySeries;
    if (view === "weekly") return weeklySeries;
    return monthlySeries;
  }, [dailySeries, monthlySeries, view, weeklySeries]);

  const xAxisLabel = view === "daily" ? "Date" : view === "weekly" ? "Week" : "Month";
  const title = view === "daily" ? "Daily Completion Map" : view === "weekly" ? "Weekly Completion Map" : "Monthly Completion Map";
  const description = view === "daily"
    ? "Shows exactly which days were completed and which were missed."
    : view === "weekly"
      ? "Shows how completed and missed logs changed across weeks."
      : "Shows the monthly progress trend over time.";

  const buttons = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];

  const recentItems = [...chartData].slice(-5).reverse();

  return (
    <div className="surface p-4 md:p-6 space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Analytics</p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Habit Progress Overview</h2>
          <p className="text-sm text-stone-600 max-w-2xl">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {buttons.map((button) => (
            <button
              key={button.key}
              type="button"
              onClick={() => setView(button.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${view === button.key ? "bg-(--accent) text-white border-transparent shadow-[0_10px_20px_rgba(183,131,41,0.2)]" : "bg-white/80 text-stone-700 border-stone-200 hover:bg-white hover:border-stone-300"}`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white/75 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Current streak</p>
          <p className="mt-2 text-3xl font-semibold">{analytics?.overview?.currentStreak || 0}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white/75 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Longest streak</p>
          <p className="mt-2 text-3xl font-semibold">{analytics?.overview?.longestStreak || 0}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white/75 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Completion rate</p>
          <p className="mt-2 text-3xl font-semibold">{analytics?.overview?.completionRate || 0}%</p>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white/70 p-3 md:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-medium text-stone-900">{title}</h3>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{xAxisLabel}</p>
        </div>
        <ChartFrame height={chartHeight}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={chartHeight}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" name="Completed" fill="#b78329" radius={[6, 6, 0, 0]} />
              <Bar dataKey="missed" name="Missed" fill="#5f6b6e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white/75 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Recent entries</p>
        <div className="mt-3 space-y-2">
          {recentItems.length ? recentItems.map((item) => (
            <div key={item.rawPeriod || item.period} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
              <span className="font-medium text-stone-700">{item.period}</span>
              <span className="text-stone-600">Completed {item.completed || 0} · Missed {item.missed || 0}</span>
            </div>
          )) : <p className="text-sm text-stone-600">No analytics data yet.</p>}
        </div>
      </div>
    </div>
  );
}
