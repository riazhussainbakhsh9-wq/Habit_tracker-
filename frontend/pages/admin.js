import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import SectionCard from "@/components/SectionCard";
import api from "@/lib/apiClient";

function PasswordToggleIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.58 10.58a2 2 0 102.83 2.83" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.88 5.09A10.94 10.94 0 0112 4c5.05 0 9.27 3.11 11 7.5a11.8 11.8 0 01-2.02 3.36" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.61 6.61A11.84 11.84 0 001 11.5C2.73 15.89 6.95 19 12 19a10.9 10.9 0 005.39-1.39" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function extractApiError(error, fallback) {
  const serverError = error?.response?.data?.error;
  const serverDetails = error?.response?.data?.details;
  if (serverError && serverDetails) return `${serverError}: ${serverDetails}`;
  return serverError || error?.message || fallback;
}

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState("");
  const [adminUser, setAdminUser] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [rejectingId, setRejectingId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("habit_admin_token");
      window.localStorage.removeItem("habit_admin_username");
    }
    setAdminToken("");
  }, []);

  const adminRequest = useCallback(
    async (config) => {
      return api({
        ...config,
        headers: {
          ...(config.headers || {}),
          "x-admin-token": adminToken,
        },
      });
    },
    [adminToken]
  );

  const load = useCallback(async () => {
    if (!adminToken) return;
    try {
      setLoading(true);
      const { data } = await adminRequest({ method: "get", url: "/api/admin/users" });
      setRows(data.subscriptions || []);
    } catch (error) {
      if (error?.response?.status === 401) {
        toast.error("Admin session expired. Please login again.");
        logout();
        return;
      }
      toast.error(extractApiError(error, "Admin permission required"));
    } finally {
      setLoading(false);
    }
  }, [adminRequest, adminToken, logout]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedToken = window.localStorage.getItem("habit_admin_token") || "";
    if (savedToken) {
      setAdminToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (adminToken) {
      const timer = window.setTimeout(() => {
        load();
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [load, adminToken]);

  const loginAdmin = async (event) => {
    event.preventDefault();
    try {
      setLoggingIn(true);
      const { data } = await api.post("/api/admin/login", {
        username: adminUser,
        password: loginPassword,
      });

      setAdminToken(data.token);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("habit_admin_token", data.token);
        window.localStorage.setItem("habit_admin_username", data.username || adminUser);
      }
      setLoginPassword("");
      toast.success("Admin login successful");
    } catch (error) {
      toast.error(extractApiError(error, "Invalid admin credentials"));
    } finally {
      setLoggingIn(false);
    }
  };

  const pendingCount = useMemo(() => rows.filter((row) => row.status === "pending").length, [rows]);

  const decide = async (id, action, reason = "") => {
    try {
      await adminRequest({ method: "post", url: "/api/admin/approve-payment", data: { subscription_id: id, action, reason } });
      toast.success(action === "approve" ? "Payment approved" : "Payment rejected");
      setRejectingId("");
      setRejectReason("");
      await load();
    } catch (error) {
      toast.error(extractApiError(error, "Operation failed"));
    }
  };

  const sendNotification = async (event) => {
    event.preventDefault();
    try {
      await adminRequest({ method: "post", url: "/api/admin/notify-user", data: { user_email: targetEmail, message } });
      toast.success("Notification sent");
      setMessage("");
      setTargetEmail("");
    } catch (error) {
      toast.error(extractApiError(error, "Unable to send notification"));
    }
  };

  const changeAdminPassword = async (event) => {
    event.preventDefault();
    try {
      await adminRequest({
        method: "post",
        url: "/api/admin/change-password",
        data: { current_password: currentPassword, new_password: newPassword },
      });
      toast.success("Admin password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(extractApiError(error, "Unable to change password"));
    }
  };

  if (!adminToken) {
    return (
      <main className="layout-shell min-h-screen flex items-center justify-center py-10">
        <div className="w-full max-w-md">
          <SectionCard title="Sign In" subtitle="Username & password" className="p-5 md:p-6">
            <form className="space-y-3" onSubmit={loginAdmin}>
              <input className="input" placeholder="Username" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} />
              <div className="relative">
                <input
                  className="input pr-11"
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  <PasswordToggleIcon visible={showLoginPassword} />
                </button>
              </div>
              <button className="btn btn-primary w-full" type="submit" disabled={loggingIn}>
                {loggingIn ? "Signing in..." : "Login as Admin"}
              </button>
            </form>
          </SectionCard>
        </div>
      </main>
    );
  }

  return (
    <main className="layout-shell min-h-screen py-6 md:py-8 space-y-4">
      <div className="surface p-5 md:p-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500 mb-1">Payments, users, and notifications</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Admin Operations</h1>
        </div>
        <button className="btn btn-primary w-full sm:w-auto" onClick={logout}>Logout</button>
      </div>

      {loading ? <div className="surface p-6">Loading admin panel...</div> : null}
      <div className="grid xl:grid-cols-[1.25fr_0.75fr] gap-4">
        <SectionCard title="Subscription Queue" subtitle="Manual payment approvals">
          <div className="flex gap-3 mb-4 text-sm text-stone-700">
            <div className="rounded-2xl bg-white/80 border border-stone-200 px-4 py-3">Total records: <strong>{rows.length}</strong></div>
            <div className="rounded-2xl bg-white/80 border border-stone-200 px-4 py-3">Pending: <strong>{pendingCount}</strong></div>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-stone-200">
                  <th className="py-2 pr-4">User Email</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Billing</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Screenshot</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <>
                    <tr key={row.id} className="border-b border-stone-100 align-top">
                      <td className="py-3 pr-4 max-w-65 break-all">{row.user_email || row.user_id}</td>
                      <td className="py-3 pr-4">{row.plan}</td>
                      <td className="py-3 pr-4">{row.billing_cycle || "monthly"}</td>
                      <td className="py-3 pr-4">{row.status}</td>
                      <td className="py-3 pr-4">
                        {row.screenshot_url ? (
                          <a href={row.screenshot_url} target="_blank" rel="noreferrer" className="underline">View</a>
                        ) : "-"}
                      </td>
                      <td className="py-3 pr-4">
                        {row.status === "pending" ? (
                          <div className="flex flex-wrap gap-2">
                            <button className="btn btn-primary text-xs" onClick={() => decide(row.id, "approve")}>Approve</button>
                            <button
                              className="btn btn-ghost text-xs"
                              onClick={() => {
                                setRejectingId((prev) => (prev === row.id ? "" : row.id));
                                setRejectReason("");
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : row.status === "active" ? (
                          <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em]">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em]">
                            Rejected
                          </span>
                        )}
                      </td>
                    </tr>

                    {rejectingId === row.id && row.status === "pending" ? (
                      <tr className="border-b border-stone-100 bg-stone-50/60">
                        <td className="py-3 pr-4" colSpan={6}>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-stone-700">Write reason for rejection</p>
                            <textarea
                              className="input"
                              rows={3}
                              placeholder="Reason for rejection"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button className="btn btn-primary text-sm" onClick={() => decide(row.id, "reject", rejectReason)}>
                                Confirm Reject
                              </button>
                              <button
                                className="btn btn-ghost text-sm"
                                onClick={() => {
                                  setRejectingId("");
                                  setRejectReason("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Send Notification" subtitle="User communication">
            <form className="space-y-3" onSubmit={sendNotification}>
              <input className="input" placeholder="User Email" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} />
              <textarea className="input" rows={6} placeholder="Message to user" value={message} onChange={(e) => setMessage(e.target.value)} />
              <button className="btn btn-primary w-full" type="submit">Send Notification</button>
            </form>
          </SectionCard>

          <SectionCard title="Change Admin Password" subtitle="Security">
            <form className="space-y-3" onSubmit={changeAdminPassword}>
              <div className="relative">
                <input
                  className="input pr-11"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                >
                  <PasswordToggleIcon visible={showCurrentPassword} />
                </button>
              </div>
              <div className="relative">
                <input
                  className="input pr-11"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                >
                  <PasswordToggleIcon visible={showNewPassword} />
                </button>
              </div>
              <button className="btn btn-primary w-full" type="submit">Update Password</button>
            </form>
          </SectionCard>
        </div>
      </div>

    </main>
  );
}
