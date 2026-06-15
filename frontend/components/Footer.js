import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative left-[calc(-50vw+50%)] w-full md:w-screen mt-10 md:mt-12 border-t border-stone-200 bg-[linear-gradient(180deg,#fbfaf7_0%,#f3efe7_100%)] shadow-[0_-12px_28px_rgba(35,31,24,0.06)] overflow-hidden">
      <div className="h-1 w-full bg-linear-to-r from-transparent via-[rgba(183,131,41,0.55)] to-transparent" />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-5 md:px-8 lg:px-10 py-9 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-stone-600 font-semibold">
              Habit OS
            </p>
            <h3 className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight text-stone-900 leading-tight">
              Professional Habit Command Center
            </h3>
            <p className="mt-3 text-sm md:text-[15px] leading-relaxed text-stone-600 max-w-xl">
              A clean, full-width footer for habits, analytics, notifications, and subscription control.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-2.5">
              <Link href="/dashboard" className="rounded-xl bg-(--accent) px-4 py-2 text-center text-sm font-semibold text-white shadow-[0_8px_18px_rgba(183,131,41,0.22)] hover:bg-(--accent-strong) transition-colors">
                Open Dashboard
              </Link>
              <Link href="/habits" className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-center text-sm font-semibold text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition-colors">
                Manage Habits
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 sm:gap-8">
            <div>
              <h4 className="text-[11px] uppercase tracking-[0.2em] text-stone-500 font-semibold mb-3">Features</h4>
              <ul className="space-y-2">
                <li><Link href="/habits" className="text-sm text-stone-700 hover:text-(--accent-strong) font-medium transition-colors">Habits</Link></li>
                <li><Link href="/calendar" className="text-sm text-stone-700 hover:text-(--accent-strong) font-medium transition-colors">Calendar</Link></li>
                <li><Link href="/insights" className="text-sm text-stone-700 hover:text-(--accent-strong) font-medium transition-colors">Insights</Link></li>
                <li><Link href="/badges" className="text-sm text-stone-700 hover:text-(--accent-strong) font-medium transition-colors">Badges</Link></li>
                <li><Link href="/quotes" className="text-sm text-stone-700 hover:text-(--accent-strong) font-medium transition-colors">Quotes</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] uppercase tracking-[0.2em] text-stone-500 font-semibold mb-3">Account</h4>
              <ul className="space-y-2">
                <li><Link href="/subscription" className="text-sm text-stone-700 hover:text-(--accent-strong) font-medium transition-colors">Subscription</Link></li>
                <li><Link href="/notifications" className="text-sm text-stone-700 hover:text-(--accent-strong) font-medium transition-colors">Notifications</Link></li>
                <li><Link href="/admin" className="text-sm text-stone-700 hover:text-(--accent-strong) font-medium transition-colors">Admin</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 h-px bg-linear-to-r from-transparent via-stone-300 to-transparent" />

        <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-xs font-semibold text-stone-500">© {currentYear} Habit OS. Crafted for consistency.</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-stone-500">
            <a href="#" className="hover:text-stone-700 transition-colors">Privacy</a>
            <span className="text-stone-300">•</span>
            <a href="#" className="hover:text-stone-700 transition-colors">Terms</a>
            <span className="text-stone-300">•</span>
            <a href="#" className="hover:text-stone-700 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
