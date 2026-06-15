import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import SectionCard from "@/components/SectionCard";
import BadgeWall from "@/components/BadgeWall";
import api from "@/lib/apiClient";
import usePageSession from "@/lib/usePageSession";

export default function InsightsPage() {
  const { user, loading, logout } = usePageSession();
  const [analytics, setAnalytics] = useState({ overview: { currentStreak: 0, longestStreak: 0, completionRate: 0 }, daily: [], weekly: [], monthly: [] });
  const [habitCount, setHabitCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [analyticsRes, habitsRes] = await Promise.all([api.get("/api/analytics"), api.get("/api/habits")]);
        setAnalytics(analyticsRes.data);
        setHabitCount(habitsRes.data.habits?.length || 0);
      } catch {
        toast.error("Unable to load insights");
      }
    };
    load();
  }, [user]);

  const comparison = useMemo(() => {
    const completedThisWeek = analytics.weekly?.reduce((sum, item) => sum + (item.completed || 0), 0) || 0;
    const totalThisWeek = analytics.weekly?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
    const ratio = totalThisWeek ? Math.round((completedThisWeek / totalThisWeek) * 100) : 0;
    return ratio;
  }, [analytics]);

  return (
    <AppShell user={user} onLogout={logout} active="/insights" title="Performance Insights" subtitle="Advanced analytics">
      {loading ? <div className="surface p-6">Loading insights...</div> : null}
      <div className="space-y-4">
        <AnalyticsCharts analytics={analytics} />
        <div className="grid xl:grid-cols-[1fr_0.75fr] gap-4">
          <SectionCard title="AI Summary" subtitle="Behavior analysis">
            <div className="space-y-3 text-sm text-stone-700">
              <p>Current streak: <strong>{analytics.overview.currentStreak}</strong></p>
              <p>Longest streak: <strong>{analytics.overview.longestStreak}</strong></p>
              <p>Completion rate: <strong>{analytics.overview.completionRate}%</strong></p>
              <p>Planned vs completed this week: <strong>{comparison}%</strong></p>
              <p>Total active habits: <strong>{habitCount}</strong></p>
              <p>Latest refresh: <strong>{dayjs().format("DD MMM YYYY")}</strong></p>
            </div>
          </SectionCard>
          <SectionCard title="Milestones" subtitle="Gamification">
            <BadgeWall streak={analytics.overview.currentStreak} />
          </SectionCard>
        </div>
      </div>

      <Footer />
    </AppShell>
  );
}
