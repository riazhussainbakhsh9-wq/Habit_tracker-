import { motion } from "framer-motion";

export default function PlanCard({
  title,
  price,
  period,
  features,
  recommended,
  selected,
  onSelect,
  description,
  badge,
  ctaLabel = "Choose Plan",
  tone = "gold",
}) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="surface p-5 md:p-6 relative overflow-hidden"
      style={recommended || selected ? { boxShadow: "0 0 0 2px var(--accent), 0 14px 34px rgba(30, 28, 22, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.45)" } : undefined}
    >
      <div
        className={`absolute inset-0 opacity-70 pointer-events-none ${
          tone === "stone"
            ? "bg-[radial-gradient(circle_at_top_left,rgba(95,107,110,0.13),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.75),transparent_40%)]"
            : tone === "cream"
              ? "bg-[radial-gradient(circle_at_top_left,rgba(183,131,41,0.12),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.72),transparent_40%)]"
              : "bg-[radial-gradient(circle_at_top_left,rgba(183,131,41,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.7),transparent_40%)]"
        }`}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500 font-semibold">{badge}</p>
            <h3 className="text-2xl font-semibold mt-2 tracking-tight">{title}</h3>
            <p className="text-stone-600 mt-2 text-sm leading-6 max-w-sm">{description}</p>
          </div>

          <div className="shrink-0 text-right rounded-2xl border border-stone-200 bg-white/85 px-4 py-3 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Price</p>
            <div className="mt-2 flex items-end justify-end gap-1">
              <span className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900">PKR {price}</span>
            </div>
            <p className="mt-1 text-xs text-stone-500">{period}</p>
          </div>
        </div>

        {recommended ? <span className="mt-4 inline-flex text-xs px-3 py-1 rounded-full text-white" style={{ backgroundColor: "var(--accent)" }}>Recommended</span> : null}

        <ul className="mt-5 space-y-2 text-sm text-stone-700">
          {features.map((feature) => (
            <li key={feature} className="flex gap-2">
              <span className="mt-1 h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: "var(--accent)" }} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button className={`btn w-full mt-5 ${recommended || selected ? "btn-primary" : "btn-ghost"}`} onClick={onSelect} type="button">
          {ctaLabel}
        </button>
      </div>
    </motion.div>
  );
}
