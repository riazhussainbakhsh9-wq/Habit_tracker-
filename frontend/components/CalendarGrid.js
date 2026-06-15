import dayjs from "dayjs";

export default function CalendarGrid({ logs = [], onDateClick }) {
  const current = dayjs();
  const start = current.startOf("month");
  const startDay = start.day();
  const daysInMonth = current.daysInMonth();
  const cells = [];

  for (let i = 0; i < startDay; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(dayjs(`${current.format("YYYY-MM")}-${String(day).padStart(2, "0")}`));

  const completedSet = new Set((logs || []).filter((entry) => entry.status === "completed").map((entry) => entry.date));

  return (
    <div className="surface p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Calendar View</p>
          <h3 className="text-xl font-semibold">{current.format("MMMM YYYY")}</h3>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs text-stone-500 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((value, index) => {
          if (!value) return <div key={`pad-${index}`} className="aspect-square rounded-xl bg-white/40 border border-dashed border-stone-200" />;
          const key = value.format("YYYY-MM-DD");
          const done = completedSet.has(key);
          return (
            <button
              key={key}
              className={`aspect-square rounded-xl border text-sm font-medium transition ${done ? "bg-[var(--accent)] text-white border-transparent shadow-lg" : "bg-white border-stone-200 hover:border-[var(--accent)]"}`}
              onClick={() => onDateClick?.(key)}
            >
              {value.date()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
