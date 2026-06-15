export default function SectionCard({ title, subtitle, children, className = "" }) {
  return (
    <section className={`surface p-4 md:p-6 ${className}`}>
      <div className="mb-4 pb-3 border-b border-stone-200/80">
        {subtitle ? <p className="text-xs uppercase tracking-[0.25em] text-stone-500 mb-1">{subtitle}</p> : null}
        <h3 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h3>
      </div>
      {children}
    </section>
  );
}
