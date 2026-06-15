import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const primaryLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/habits", label: "Habits" },
  { href: "/insights", label: "Insights" },
  { href: "/badges", label: "Badges" },
  { href: "/quotes", label: "Quotes" },
  { href: "/calendar", label: "Calendar" },
];

const utilityLinks = [
  { href: "/subscription", label: "Subscription" },
  { href: "/notifications", label: "Notifications" },
];

export default function AppShell({ user, onLogout, active, title, subtitle, children, rightSlot }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileLinks = useMemo(() => [...primaryLinks, ...utilityLinks], []);

  const getLinkClass = (href, utility = false) => {
    const isActive = active === href;
    if (isActive) {
      return utility ? "nav-utility nav-utility-active" : "nav-pill nav-pill-active";
    }

    return utility ? "nav-utility" : "nav-pill";
  };

  return (
    <div className="pb-10">
      <header className="relative left-[calc(-50vw+50%)] w-full md:w-screen pt-3 md:pt-0 pb-5 px-0 md:px-0 overflow-hidden">
        <div className="surface rounded-2xl md:rounded-none border-x md:border-x-0 px-4 sm:px-5 md:px-6 lg:px-10 py-4 md:py-5 backdrop-blur-xl bg-white/75 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_top_right,rgba(183,131,41,0.16),transparent_36%),radial-gradient(circle_at_left,rgba(95,107,110,0.1),transparent_42%)]" />

          <div className="relative flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3 sm:items-center">
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <Link href="/dashboard" className="inline-flex items-start gap-2 pr-2">
                  <span className="h-3 w-3 rounded-full bg-(--accent) shadow-[0_0_20px_rgba(183,131,41,0.6)]" />
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight leading-tight">Habit OS</h1>
                    <p className="text-[11px] sm:text-xs md:text-sm text-stone-600 leading-snug">Professional habit intelligence and subscription workflow</p>
                  </div>
                </Link>
              </motion.div>

              <div className="hidden lg:flex items-center gap-3">
                <div className="text-right max-w-55">
                  <p className="text-sm font-medium max-w-65 truncate">{user?.email || "Guest"}</p>
                  <p className="text-xs text-stone-500">Signed in</p>
                </div>
                {onLogout ? <button className="btn btn-primary text-sm" onClick={onLogout}>Logout</button> : null}
              </div>

              <button className="lg:hidden nav-menu-toggle shrink-0" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Toggle menu">
                <span>{menuOpen ? "Close" : "Menu"}</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {primaryLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={getLinkClass(link.href)}>
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {utilityLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={getLinkClass(link.href, true)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {menuOpen ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="lg:hidden border-t border-stone-200 pt-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mobileLinks.map((link) => (
                      <Link key={link.href} href={link.href} className={getLinkClass(link.href)} onClick={() => setMenuOpen(false)}>
                        {link.label}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user?.email || "Guest"}</p>
                      <p className="text-xs text-stone-500">Signed in</p>
                    </div>
                    {onLogout ? <button className="btn btn-primary text-sm w-full sm:w-auto" onClick={onLogout}>Logout</button> : null}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="layout-shell space-y-4">
        {(title || subtitle || rightSlot) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface p-5 md:p-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4"
          >
            <div>
              {subtitle ? <p className="text-xs uppercase tracking-[0.28em] text-stone-500 mb-2">{subtitle}</p> : null}
              {title ? <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{title}</h2> : null}
            </div>
            {rightSlot}
          </motion.div>
        )}

        {children}
      </main>
    </div>
  );
}
