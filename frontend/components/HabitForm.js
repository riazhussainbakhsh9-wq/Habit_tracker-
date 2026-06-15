import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/apiClient";

export default function HabitForm({ onCreate, className = "" }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const runAiAssist = async (mode) => {
    if (mode === "generate" && !title.trim()) {
      toast.error("Enter habit title first.");
      return;
    }

    if (mode === "rephrase" && !description.trim()) {
      toast.error("Write a description first to rephrase it.");
      return;
    }

    try {
      setAiBusy(true);
      const { data } = await api.post("/api/habits/description-assist", {
        title,
        description,
        mode,
      });
      setDescription(data?.description || description);
      toast.success(mode === "generate" ? "Description generated." : "Description improved.");
    } catch (error) {
      toast.error(error?.response?.data?.error || "AI assist failed");
    } finally {
      setAiBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Habit title is required.");
      return;
    }

    try {
      setSaving(true);
      const ok = await onCreate({ title, description, frequency, imageFile });
      if (ok === false) return;

      setTitle("");
      setDescription("");
      setFrequency("daily");
      setImageFile(null);
      setImagePreview("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className={`surface p-4 md:p-6 space-y-3 h-full ${className}`}>
      <h2 className="text-xl font-semibold">Create Habit</h2>
      <input className="input" placeholder="Habit title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input" rows={3} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

      <div className="flex flex-wrap gap-2">
        <button className="btn btn-ghost text-sm" type="button" onClick={() => runAiAssist("rephrase")} disabled={aiBusy}>
          {aiBusy ? "Working..." : "AI Rephrase & Enhance"}
        </button>
        <button className="btn btn-ghost text-sm" type="button" onClick={() => runAiAssist("generate")} disabled={aiBusy}>
          {aiBusy ? "Working..." : "AI Generate Description"}
        </button>
      </div>

      <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>

      <div className="space-y-2">
        <input className="input" type="file" accept="image/*" onChange={onFileChange} />
        {imagePreview ? (
          <img src={imagePreview} alt="Habit preview" className="h-28 w-full object-cover rounded-xl border border-stone-200" />
        ) : null}
      </div>

      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? "Saving..." : "Add Habit"}
      </button>
    </form>
  );
}
