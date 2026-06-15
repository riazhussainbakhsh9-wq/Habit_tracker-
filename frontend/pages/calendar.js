import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import CalendarGrid from "@/components/CalendarGrid";
import SectionCard from "@/components/SectionCard";
import api from "@/lib/apiClient";
import usePageSession from "@/lib/usePageSession";

export default function CalendarPage() {
  const { user, loading, logout } = usePageSession();
  const [logs, setLogs] = useState([]);
  const [habits, setHabits] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [logsRes, habitsRes] = await Promise.all([api.get("/api/habit-logs"), api.get("/api/habits")]);
        setLogs(logsRes.data.logs || []);
        setHabits(habitsRes.data.habits || []);
      } catch {
        toast.error("Unable to load calendar data");
      }
    };
    load();
  }, [user]);

  const selectedLogs = useMemo(() => logs.filter((entry) => entry.date === selectedDate), [logs, selectedDate]);
  const completedHabitIds = new Set(selectedLogs.filter((entry) => entry.status === "completed").map((entry) => entry.habit_id));
  const completedNames = habits.filter((habit) => completedHabitIds.has(habit.id)).map((habit) => habit.title);

  return (
    <AppShell user={user} onLogout={logout} active="/calendar" title="Monthly Calendar" subtitle="Completion map">
      {loading ? <div className="surface p-6">Loading calendar...</div> : null}
      <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-4">
        <CalendarGrid logs={logs} onDateClick={setSelectedDate} />
        <SectionCard title={dayjs(selectedDate).format("DD MMMM YYYY")} subtitle="Selected day summary">
          <div className="space-y-3 text-sm text-stone-700">
            <p>Completed habits: <strong>{completedNames.length}</strong></p>
            <p>Selected date: <strong>{selectedDate}</strong></p>
            <div className="rounded-2xl border border-stone-200 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Completed</p>
              <div className="mt-2 space-y-2">
                {completedNames.length ? completedNames.map((name) => (
                  <div key={name} className="rounded-xl bg-stone-50 px-3 py-2">{name}</div>
                )) : <p className="text-stone-600">No completed habits recorded for this date.</p>}
              </div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Daily reminder</p>
              <p className="mt-2 text-stone-600">Use this calendar to inspect habit consistency and identify missed streak breaks.</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <Footer />
    </AppShell>
  );
}
