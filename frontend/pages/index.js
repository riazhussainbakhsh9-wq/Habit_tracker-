import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Footer from "@/components/Footer";

const panels = [
  {
    title: "Daily Habit Engine",
    text: "Create routines, mark completions, and review momentum in one focused workspace.",
  },
  {
    title: "AI Motivation",
    text: "Generate daily quotes and emotion-aware guidance with a clean premium presentation.",
  },
  {
    title: "Subscription and Admin",
    text: "Monthly and yearly plans, screenshot approval, and admin operations in separate screens.",
  },
  {
    title: "Advanced Tracking",
    text: "Calendar view, analytics, badges, and progress history for FYP-grade presentation.",
  },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
    <div className="min-h-screen space-y-4 overflow-x-hidden">
      <header className="relative left-[calc(-50vw+50%)] w-full md:w-screen pt-3 md:pt-0 pb-5 px-0 md:px-0 overflow-hidden">
        <div className="surface rounded-2xl md:rounded-none border-x md:border-x-0 px-4 sm:px-5 md:px-6 lg:px-10 py-4 md:py-5 backdrop-blur-xl bg-white/80 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_top_right,rgba(183,131,41,0.16),transparent_36%),radial-gradient(circle_at_left,rgba(95,107,110,0.1),transparent_42%)]" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start justify-between gap-3 md:block">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Habit OS</p>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight leading-tight">Industrial Habit Tracker Platform</h1>
              </div>
              <button
                type="button"
                className="md:hidden nav-menu-toggle shrink-0"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Toggle authentication menu"
              >
                {menuOpen ? "Close" : "Menu"}
              </button>
            </div>

            <div className="hidden md:flex flex-col sm:flex-row gap-2 sm:gap-2 w-full md:w-auto">
              <Link href="/login" className="btn btn-ghost text-center">Login</Link>
              <Link href="/signup" className="btn btn-primary text-center">Create Account</Link>
            </div>

            <AnimatePresence>
              {menuOpen ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="md:hidden border-t border-stone-200 pt-3"
                >
                  <div className="flex flex-col gap-2">
                    <Link href="/login" className="btn btn-ghost text-center" onClick={() => setMenuOpen(false)}>Login</Link>
                    <Link href="/signup" className="btn btn-primary text-center" onClick={() => setMenuOpen(false)}>Create Account</Link>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="layout-shell grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface p-5 sm:p-6 md:p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(183,131,41,0.2),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(95,107,110,0.16),transparent_30%)] pointer-events-none" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Multi-page productivity system</p>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-tight mt-3 leading-[1.05]">
              A professional habit app with AI, analytics, subscriptions, and admin control.
            </h2>
            <p className="mt-5 text-stone-700 max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed">
              Built for real-world use and polished presentations. Track habits, review progress, generate motivational quotes,
              manage monthly or yearly subscriptions, and approve manual payments from a dedicated admin panel.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
              <Link href="/dashboard" className="btn btn-primary">Open Dashboard</Link>
              <Link href="/habits" className="btn btn-ghost">Manage Habits</Link>
              <Link href="/subscription" className="btn btn-ghost">Subscription Plans</Link>
            </div>
          </div>
        </motion.section>

        <div className="space-y-4">
          <div className="surface p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Included screens</p>
            <div className="mt-4 space-y-3">
              {[
                ["Dashboard", "Overview of streaks, completion, and AI quote of the day."],
                ["Habits", "Create, edit, delete, and complete habits quickly."],
                ["Insights", "Weekly, monthly, and streak analytics with badges."],
                ["Subscription", "Monthly/yearly plans and manual payment approval flow."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-stone-200 bg-white/80 p-4">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-stone-600 mt-1">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <div className="layout-shell h-8 md:h-12" aria-hidden="true" />

      <section className="layout-shell grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {panels.map((panel, index) => (
          <motion.div
            key={panel.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="surface p-5"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">0{index + 1}</p>
            <h3 className="text-xl font-semibold mt-2">{panel.title}</h3>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">{panel.text}</p>
          </motion.div>
        ))}
      </section>
    </div>

    <Footer />
    </>
  );
}
