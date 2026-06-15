import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import HabitForm from "@/components/HabitForm";
import HabitList from "@/components/HabitList";
import QuoteCard from "@/components/QuoteCard";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import UpgradePromptModal from "@/components/UpgradePromptModal";
import api from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";

const quoteBank = [
  {
    quote: "Small actions repeated daily build the strongest identity.",
    habit_suggestion: "Choose one action you can repeat without resistance.",
    insight: "Consistency grows when the habit feels easy to start.",
  },
  {
    quote: "Progress becomes visible when effort stops depending on mood.",
    habit_suggestion: "Use a fixed trigger like after breakfast.",
    insight: "Stable cues reduce friction and protect momentum.",
  },
  {
    quote: "A streak is a system, not a mood.",
    habit_suggestion: "Keep the task short enough to never feel heavy.",
    insight: "Systems win when they are simple, repeatable, and measurable.",
  },
  {
    quote: "Discipline is built in the moments nobody notices.",
    habit_suggestion: "Protect the habit even on low-energy days.",
    insight: "Quiet days are the days that shape the final result.",
  },
];

function getOverviewNotificationTheme(message) {
  const text = (message || "").toLowerCase();

  if (text.includes("reject") || text.includes("declin") || text.includes("expired")) {
    return {
      kind: "rejected",
      label: "Rejected",
      card: "border-rose-200 bg-rose-50/70",
      title: "text-rose-900",
      meta: "text-rose-700",
      badge: "bg-rose-100 text-rose-700",
      iconBg: "bg-rose-100",
      iconFg: "text-rose-700",
    };
  }

  if (text.includes("approved") || text.includes("active") || text.includes("success")) {
    return {
      kind: "approved",
      label: "Approved",
      card: "border-emerald-200 bg-emerald-50/70",
      title: "text-emerald-900",
      meta: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-700",
      iconBg: "bg-emerald-100",
      iconFg: "text-emerald-700",
    };
  }

  return {
    kind: "update",
    label: "Update",
    card: "border-sky-200 bg-sky-50/70",
    title: "text-sky-900",
    meta: "text-sky-700",
    badge: "bg-sky-100 text-sky-700",
    iconBg: "bg-sky-100",
    iconFg: "text-sky-700",
  };
}

function OverviewNotificationIcon({ kind, iconBg, iconFg }) {
  return (
    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${iconBg} ${iconFg}`}>
      {kind === "rejected" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
      {kind === "approved" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
      {kind === "update" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
          <path d="M12 8h.01M12 12v4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      ) : null}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [ai, setAi] = useState({
    quote: "Discipline is your daily contract with your future self.",
    habit_suggestion: "Stack a small habit after breakfast.",
    insight: "Start tiny, stay consistent, then scale.",
  });
  const quoteRefreshIndexRef = useRef(0);
  const currentQuoteRef = useRef("Discipline is your daily contract with your future self.");
  const missedTodayRef = useRef(false);

  const logsByHabit = useMemo(() => {
    const mapped = {};
    logs.forEach((item) => {
      if (!mapped[item.habit_id]) mapped[item.habit_id] = {};
      mapped[item.habit_id][item.date] = item.status;
    });
    return mapped;
  }, [logs]);

  const loadAll = useCallback(async () => {
    const endpoints = [
      { key: "habits", url: "/api/habits" },
      { key: "logs", url: "/api/habit-logs" },
      { key: "analytics", url: "/api/analytics" },
      { key: "notifications", url: "/api/notifications" },
    ];

    const results = await Promise.allSettled(endpoints.map((item) => api.get(item.url)));
    const getValue = (key) => {
      const idx = endpoints.findIndex((e) => e.key === key);
      return results[idx];
    };

    const habitsResult = getValue("habits");
    const logsResult = getValue("logs");
    const analyticsResult = getValue("analytics");
    const notesResult = getValue("notifications");

    if (habitsResult.status === "fulfilled") {
      setHabits(habitsResult.value.data.habits || []);
    } else {
      setHabits([]);
    }

    if (logsResult.status === "fulfilled") {
      setLogs(logsResult.value.data.logs || []);
    } else {
      setLogs([]);
    }

    if (analyticsResult.status === "fulfilled") {
      setAnalytics(analyticsResult.value.data);
    } else {
      setAnalytics({
        overview: { currentStreak: 0, longestStreak: 0, completionRate: 0 },
        weekly: [],
        monthly: [],
      });
    }

    if (notesResult.status === "fulfilled") {
      setNotifications(notesResult.value.data.notifications || []);
    } else {
      setNotifications([]);
    }
  }, []);

  const fetchAi = useCallback(async () => {
    try {
      const { data } = await api.post("/api/motivation", { emotion: "focused", missedHabit: missedTodayRef.current });
      const incomingQuote = data?.quote || "";
      const shouldRotate = !incomingQuote || incomingQuote === currentQuoteRef.current;

      if (shouldRotate) {
        const fallback = quoteBank[quoteRefreshIndexRef.current % quoteBank.length];
        quoteRefreshIndexRef.current += 1;
        currentQuoteRef.current = fallback.quote;
        setAi(fallback);
        return;
      }

      currentQuoteRef.current = incomingQuote;
      setAi(data);
    } catch {
      const fallback = quoteBank[quoteRefreshIndexRef.current % quoteBank.length];
      quoteRefreshIndexRef.current += 1;
      currentQuoteRef.current = fallback.quote;
      setAi(fallback);
    }
  }, []);

  useEffect(() => {
    const today = dayjs().format("YYYY-MM-DD");
    missedTodayRef.current = habits.length > 0 && habits.some((h) => logsByHabit[h.id]?.[today] !== "completed");
  }, [habits, logsByHabit]);

  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.user) {
        router.replace("/login");
        return;
      }
      try {
        setUser(data.session.user);
        await loadAll();
      } finally {
        setLoading(false);
      }
    };

    boot();
  }, [loadAll, router]);

  useEffect(() => {
    if (!user) return;

    fetchAi();
    const intervalId = window.setInterval(() => {
      fetchAi();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [user, fetchAi]);

  const handleCreateHabit = async (payload) => {
    try {
      const formData = new FormData();
      formData.append("title", payload.title || "");
      formData.append("description", payload.description || "");
      formData.append("frequency", payload.frequency || "daily");
      if (payload.imageFile) {
        formData.append("image", payload.imageFile);
      }

      await api.post("/api/habits", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Habit added");
      await loadAll();
      return true;
    } catch (error) {
      if (error?.response?.status === 403) {
        setShowUpgradeModal(true);
        toast.error("Free plan reached. Upgrade to add more habits.");
        return false;
      }
      toast.error(error?.response?.data?.error || "Could not create habit");
      return false;
    }
  };

  const handleDeleteHabit = async (id) => {
    try {
      await api.delete(`/api/habits/${id}`);
      toast.success("Habit removed");
      await loadAll();
    } catch {
      toast.error("Could not delete habit");
    }
  };

  const handleToggle = async (habitId, completed) => {
    try {
      await api.post("/api/habit-logs", {
        habit_id: habitId,
        date: dayjs().format("YYYY-MM-DD"),
        status: completed ? "completed" : "missed",
      });
      await loadAll();
    } catch {
      toast.error("Could not update habit log");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const todayKey = dayjs().format("YYYY-MM-DD");
  const todayCompleted = habits.reduce((sum, habit) => {
    return sum + (logsByHabit[habit.id]?.[todayKey] === "completed" ? 1 : 0);
  }, 0);
  const todayTotal = habits.length;
  const todayRate = todayTotal ? Math.round((todayCompleted / todayTotal) * 100) : 0;
  const visibleHabits = habits; // Show all habits
  const visibleNotifications = notifications; // Show all notifications

  return (
    <AppShell
      user={user}
      onLogout={logout}
      active="/dashboard"
      title="Operations Dashboard"
      subtitle="Daily overview"
    >
      {loading ? (
        <div className="surface p-6 mb-4">Loading dashboard...</div>
      ) : null}
      <section className="surface p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Performance snapshot</p>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Today at a glance</h3>
          </div>
          <p className="text-sm text-stone-500">Updated for {dayjs().format("DD MMM YYYY")}</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          <motion.div whileHover={{ y: -3 }} className="kpi-card">
            <p className="kpi-label">Current streak</p>
            <h4 className="kpi-value">{analytics?.overview?.currentStreak || 0}</h4>
            <p className="kpi-note">days in motion</p>
          </motion.div>
          <motion.div whileHover={{ y: -3 }} className="kpi-card">
            <p className="kpi-label">Longest streak</p>
            <h4 className="kpi-value">{analytics?.overview?.longestStreak || 0}</h4>
            <p className="kpi-note">best historical run</p>
          </motion.div>
          <motion.div whileHover={{ y: -3 }} className="kpi-card">
            <p className="kpi-label">Completion</p>
            <h4 className="kpi-value">{analytics?.overview?.completionRate || 0}%</h4>
            <p className="kpi-note">overall consistency</p>
          </motion.div>
          <motion.div whileHover={{ y: -3 }} className="kpi-card">
            <p className="kpi-label">Today complete</p>
            <h4 className="kpi-value">{todayCompleted}/{todayTotal || 0}</h4>
            <p className="kpi-note">daily execution {todayRate}%</p>
          </motion.div>
        </div>
      </section>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
        <HabitForm onCreate={handleCreateHabit} className="min-w-0" />

        <QuoteCard
          quote={ai.quote}
          suggestion={ai.habit_suggestion}
          insight={ai.insight}
          onRefresh={fetchAi}
          className="min-w-0"
            todayCompleted={todayCompleted}
            todayTotal={todayTotal || 0}
            todayRate={todayRate}
            currentStreak={analytics?.overview?.currentStreak || 0}
        />

        <div className="surface p-4 md:p-6 h-full min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-lg font-semibold">Today&apos;s Habits</h3>
              <p className="text-sm text-stone-500 mt-1">Scroll to view more habits</p>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto pr-1">
            <HabitList
              habits={habits}
              logsByHabit={logsByHabit}
              onToggleComplete={handleToggle}
              onDelete={handleDeleteHabit}
              className="min-w-0"
              bare
            />
          </div>
        </div>

        <div className="surface p-4 md:p-6 h-full min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-lg font-semibold">Notifications</h3>
              <p className="text-sm text-stone-500 mt-1">Scroll to view more notifications</p>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto pr-1 space-y-3">
            {notifications.length ? notifications.map((notification) => {
              const theme = getOverviewNotificationTheme(notification.message);
              return (
                <div key={notification.id} className={`rounded-2xl border p-4 flex items-start justify-between gap-4 ${theme.card}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <OverviewNotificationIcon kind={theme.kind} iconBg={theme.iconBg} iconFg={theme.iconFg} />
                      <span className={`text-xs font-semibold uppercase tracking-wide ${theme.meta}`}>{theme.label}</span>
                    </div>
                    <p className={`font-semibold leading-relaxed ${theme.title}`}>{notification.message}</p>
                    <p className={`text-xs mt-1 ${theme.meta}`}>{dayjs(notification.created_at).format("DD MMM YYYY, h:mm A")}</p>
                  </div>
                </div>
              );
            }) : <p className="text-stone-600">No notifications.</p>}
          </div>
        </div>
      </motion.div>

      <AnalyticsCharts analytics={analytics} compact />

      <UpgradePromptModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          router.push("/subscription");
        }}
      />

      <Footer />
    </AppShell>
  );
}
