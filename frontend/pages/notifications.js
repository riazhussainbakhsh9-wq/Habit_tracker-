import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import SectionCard from "@/components/SectionCard";
import api from "@/lib/apiClient";
import usePageSession from "@/lib/usePageSession";

function getNotificationTheme(message) {
  const text = (message || "").toLowerCase();

  if (text.includes("reject") || text.includes("declin") || text.includes("expired")) {
    return {
      kind: "rejected",
      label: "Rejected",
      dot: "bg-rose-500",
      card: "border-rose-200 bg-rose-50/70",
      title: "text-rose-900",
      meta: "text-rose-700",
      badge: "bg-rose-100 text-rose-700",
      iconBg: "bg-rose-100",
      iconFg: "text-rose-700",
    };
  }

  if (text.includes("approved") || text.includes("active") || text.includes("success")) {
    return {
      kind: "approved",
      label: "Approved",
      dot: "bg-emerald-500",
      card: "border-emerald-200 bg-emerald-50/70",
      title: "text-emerald-900",
      meta: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-700",
      iconBg: "bg-emerald-100",
      iconFg: "text-emerald-700",
    };
  }

  return {
    kind: "update",
    label: "Update",
    dot: "bg-sky-500",
    card: "border-sky-200 bg-sky-50/70",
    title: "text-sky-900",
    meta: "text-sky-700",
    badge: "bg-sky-100 text-sky-700",
    iconBg: "bg-sky-100",
    iconFg: "text-sky-700",
  };
}

function NotificationTypeIcon({ kind, iconBg, iconFg }) {
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${iconBg} ${iconFg}`}>
      {kind === "rejected" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
      {kind === "approved" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
      {kind === "update" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M12 8h.01M12 12v4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      ) : null}
    </span>
  );
}

export default function NotificationsPage() {
  const { user, loading, logout } = usePageSession();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data } = await api.get("/api/notifications");
        setNotifications(data.notifications || []);
      } catch {
        toast.error("Unable to load notifications");
      }
    };
    load();
  }, [user]);

  return (
    <AppShell user={user} onLogout={logout} active="/notifications" title="Notification Center" subtitle="Daily reminders">
      {loading ? <div className="surface p-6">Loading notifications...</div> : null}
      <SectionCard title="Recent Updates" subtitle="Reminder stream">
        <div className="space-y-3">
          {notifications.length ? notifications.map((notification) => {
            const theme = getNotificationTheme(notification.message);
            return (
              <div
                key={notification.id}
                className={`rounded-2xl border p-4 sm:p-5 flex items-start justify-between gap-4 transition-shadow hover:shadow-sm ${theme.card}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <NotificationTypeIcon kind={theme.kind} iconBg={theme.iconBg} iconFg={theme.iconFg} />
                    <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wide ${theme.meta}`}>
                      {theme.label}
                    </span>
                  </div>
                  <p className={`font-semibold leading-relaxed ${theme.title}`}>
                    {notification.message}
                  </p>
                  <p className={`text-xs mt-1 ${theme.meta}`}>
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${notification.read ? theme.badge : "bg-(--accent) text-white"}`}>
                  {notification.read ? "Read" : "Unread"}
                </span>
              </div>
            );
          }) : (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-6 sm:p-7 text-center">
              <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                  <path d="M12 8h.01M12 12v4" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <p className="text-sky-900 font-semibold">No notifications yet</p>
              <p className="text-sm text-sky-700 mt-1">Daily reminders and admin messages will appear here as soon as they are available.</p>
            </div>
          )}
        </div>
      </SectionCard>

      <Footer />
    </AppShell>
  );
}
