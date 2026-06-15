import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import SectionCard from "@/components/SectionCard";
import BadgeWall from "@/components/BadgeWall";
import api from "@/lib/apiClient";
import usePageSession from "@/lib/usePageSession";

export default function BadgesPage() {
  const { user, loading, logout } = usePageSession();
  const [analytics, setAnalytics] = useState({ overview: { currentStreak: 0, longestStreak: 0, completionRate: 0 } });
  const [habits, setHabits] = useState(0);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const [analyticsRes, habitsRes] = await Promise.all([api.get("/api/analytics"), api.get("/api/habits")]);
        setAnalytics(analyticsRes.data || { overview: { currentStreak: 0, longestStreak: 0, completionRate: 0 } });
        setHabits(habitsRes.data.habits?.length || 0);
      } catch {
        toast.error("Unable to load badges");
      }
    };

    load();
  }, [user]);

  const badgeSummary = useMemo(() => {
    const streak = analytics?.overview?.currentStreak || 0;
    if (streak >= 100) return "Legend-level discipline";
    if (streak >= 60) return "Exceptional consistency";
    if (streak >= 30) return "Monthly momentum secured";
    if (streak >= 14) return "Strong routine established";
    if (streak >= 7) return "First milestone unlocked";
    return "Start the streak to unlock badges";
  }, [analytics]);

  return (
    <AppShell
      user={user}
      onLogout={logout}
      active="/badges"
      title="Badge Library"
      subtitle="Achievement rewards"
      rightSlot={<p className="text-sm text-stone-600">Updated {dayjs().format("DD MMM YYYY")}</p>}
    >
      {loading ? <div className="surface p-6">Loading badges...</div> : null}

      <section className="surface p-5 md:p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(183,131,41,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(95,107,110,0.10),transparent_28%)]" />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500 font-semibold">Badge progress</p>
            <h3 className="mt-2 text-2xl md:text-4xl font-semibold tracking-tight text-stone-900">
              Unlock streak awards with clean, visible milestones.
            </h3>
            <p className="mt-3 text-sm md:text-base text-stone-600 leading-relaxed max-w-2xl">
              Each badge is a visual milestone for consistency. Tap any badge to view its meaning, target, and progress toward the next reward.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <div className="rounded-[20px] border border-stone-200 bg-white/85 p-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Current streak</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">{analytics?.overview?.currentStreak || 0}</p>
            </div>
            <div className="rounded-[20px] border border-stone-200 bg-white/85 p-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Longest</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">{analytics?.overview?.longestStreak || 0}</p>
            </div>
            <div className="rounded-[20px] border border-stone-200 bg-white/85 p-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Badges</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">7</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-4">
        <SectionCard title="Progress Summary" subtitle="Your current status">
          <div className="space-y-4 text-sm text-stone-700">
            <div className="rounded-[22px] border border-stone-200 bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Current streak</p>
              <p className="mt-1 text-3xl font-semibold text-stone-900">{analytics?.overview?.currentStreak || 0}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-stone-200 bg-white/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Longest streak</p>
                <p className="mt-1 text-xl font-semibold text-stone-900">{analytics?.overview?.longestStreak || 0}</p>
              </div>
              <div className="rounded-[22px] border border-stone-200 bg-white/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Active habits</p>
                <p className="mt-1 text-xl font-semibold text-stone-900">{habits}</p>
              </div>
            </div>
            <div className="rounded-[22px] border border-(--accent)/35 bg-[linear-gradient(180deg,#fff9ec_0%,#fff4dc_100%)] p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Badge status</p>
              <p className="mt-2 text-base font-semibold text-stone-900">{badgeSummary}</p>
              <p className="mt-1 text-sm text-stone-600">Earn more badges by extending your streak with daily consistency.</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Badge Library" subtitle="Tap a badge for details">
          <BadgeWall streak={analytics?.overview?.currentStreak || 0} />
        </SectionCard>
      </div>

      <Footer />
    </AppShell>
  );
}