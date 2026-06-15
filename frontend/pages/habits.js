import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import SectionCard from "@/components/SectionCard";
import UpgradePromptModal from "@/components/UpgradePromptModal";
import api from "@/lib/apiClient";
import usePageSession from "@/lib/usePageSession";
import { getFriendlyError } from "@/lib/errorMessages";

const initialForm = { title: "", description: "", frequency: "daily" };

export default function HabitsPage() {
  const router = useRouter();
  const { user, loading, logout } = usePageSession();
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [expandedHabitId, setExpandedHabitId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const onFileChange = (e) => {
    const next = e.target.files?.[0] || null;
    if (!next) {
      setImageFile(null);
      setImagePreview("");
      return;
    }

    if (!next.type?.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (next.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    setImageFile(next);
    setImagePreview(URL.createObjectURL(next));
  };

  const logsByHabit = useMemo(() => {
    const mapped = {};
    logs.forEach((entry) => {
      if (!mapped[entry.habit_id]) mapped[entry.habit_id] = {};
      mapped[entry.habit_id][entry.date] = entry.status;
    });
    return mapped;
  }, [logs]);

  const loadData = useCallback(async () => {
    const [habitsRes, logsRes] = await Promise.allSettled([api.get("/api/habits"), api.get("/api/habit-logs")]);
    setHabits(habitsRes.status === "fulfilled" ? habitsRes.value.data.habits || [] : []);
    setLogs(logsRes.status === "fulfilled" ? logsRes.value.data.logs || [] : []);
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData, user]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Habit title is required.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", form.title || "");
      formData.append("description", form.description || "");
      formData.append("frequency", form.frequency || "daily");
      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editingId) {
        await api.put(`/api/habits/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Habit updated");
      } else {
        await api.post("/api/habits", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Habit created");
      }
      setForm(initialForm);
      setEditingId(null);
      setImageFile(null);
      setImagePreview("");
      await loadData();
    } catch (error) {
      if (error?.response?.status === 403) {
        setShowUpgradeModal(true);
        toast.error("Free plan reached. Upgrade to add more habits.");
        return;
      }
      toast.error(getFriendlyError(error, "Unable to save habit."));
    }
  };

  const runAiAssist = async (mode) => {
    if (mode === "generate" && !form.title.trim()) {
      toast.error("Enter habit title first.");
      return;
    }

    if (mode === "rephrase" && !form.description.trim()) {
      toast.error("Write a description first to rephrase it.");
      return;
    }

    try {
      setAiBusy(true);
      const { data } = await api.post("/api/habits/description-assist", {
        title: form.title,
        description: form.description,
        mode,
      });
      setForm((prev) => ({ ...prev, description: data?.description || prev.description }));
      toast.success(mode === "generate" ? "Description generated." : "Description improved.");
    } catch (error) {
      toast.error(getFriendlyError(error, "AI assist failed."));
    } finally {
      setAiBusy(false);
    }
  };

  const editHabit = (habit) => {
    setEditingId(habit.id);
    setForm({ title: habit.title, description: habit.description || "", frequency: habit.frequency || "daily" });
    setImageFile(null);
    setImagePreview(habit.image_url || "");
  };

  const removeHabit = async (id) => {
    try {
      await api.delete(`/api/habits/${id}`);
      toast.success("Habit deleted");
      await loadData();
    } catch {
      toast.error("Unable to delete habit");
    }
  };

  const toggleToday = async (habitId, currentStatus) => {
    try {
      await api.post("/api/habit-logs", {
        habit_id: habitId,
        date: dayjs().format("YYYY-MM-DD"),
        status: currentStatus === "completed" ? "missed" : "completed",
      });
      await loadData();
    } catch {
      toast.error("Unable to update completion");
    }
  };

  const today = dayjs().format("YYYY-MM-DD");

  return (
    <AppShell user={user} onLogout={logout} active="/habits" title="Habit Workspace" subtitle="Management">
      {loading ? <div className="surface p-6">Loading habits...</div> : null}
      <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-4">
        <SectionCard title={editingId ? "Edit Habit" : "Create Habit"} subtitle="Routine Builder">
          <form className="space-y-3" onSubmit={submit}>
            <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="input" rows={4} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-ghost text-sm" type="button" onClick={() => runAiAssist("rephrase")} disabled={aiBusy}>
                {aiBusy ? "Working..." : "AI Rephrase & Enhance"}
              </button>
              <button className="btn btn-ghost text-sm" type="button" onClick={() => runAiAssist("generate")} disabled={aiBusy}>
                {aiBusy ? "Working..." : "AI Generate Description"}
              </button>
            </div>
            <select className="input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <div className="flex gap-2">
              <button className="btn btn-primary" type="submit">{editingId ? "Save Changes" : "Add Habit"}</button>
              {editingId ? <button className="btn btn-ghost" type="button" onClick={() => { setEditingId(null); setForm(initialForm); setImageFile(null); setImagePreview(""); }}>Cancel</button> : null}
            </div>

            <div className="space-y-2">
              <input className="input" type="file" accept="image/*" onChange={onFileChange} />
              {imagePreview ? (
                <img src={imagePreview} alt="Habit preview" className="h-28 w-full object-cover rounded-xl border border-stone-200" />
              ) : null}
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Current Habits" subtitle="Daily execution">
          <div className="space-y-3">
            {habits.length ? habits.map((habit) => {
              const status = logsByHabit[habit.id]?.[today] || "incomplete";
              const isExpanded = expandedHabitId === habit.id;

              return (
                <div
                  key={habit.id}
                  className={`rounded-2xl border bg-white/80 transition-all ${
                    isExpanded ? "border-(--accent)/40 p-5 shadow-md" : "border-stone-200 p-4"
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setExpandedHabitId((prev) => (prev === habit.id ? null : habit.id))}
                  >
                    <div className="flex items-start gap-3">
                      {habit.image_url ? (
                        <img
                          src={habit.image_url}
                          alt={habit.title}
                          className={`${isExpanded ? "h-24 w-24" : "h-14 w-14"} rounded-xl object-cover border border-stone-200`}
                        />
                      ) : null}
                      <div>
                        <h4 className={`${isExpanded ? "text-xl" : "text-lg"} font-semibold`}>{habit.title}</h4>
                        <p className={`text-sm text-stone-600 ${isExpanded ? "whitespace-normal mt-1" : "line-clamp-1"}`}>
                          {habit.description || "No description"}
                        </p>
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-500 mt-2">{habit.frequency}</p>
                      </div>
                    </div>
                  </button>

                  <div className={`flex flex-wrap gap-2 ${isExpanded ? "mt-4" : "mt-3"}`}>
                    <button
                      className="btn btn-ghost text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleToday(habit.id, status);
                      }}
                    >
                      {status === "completed" ? "Mark Incomplete" : "Mark Complete"}
                    </button>
                    <button
                      className="btn btn-ghost text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        editHabit(habit);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-primary text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeHabit(habit.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            }) : <p className="text-stone-600">No habits yet. Create one using the form on the left.</p>}
          </div>
        </SectionCard>
      </div>

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
