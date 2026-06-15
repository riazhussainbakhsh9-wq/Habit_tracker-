import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import Footer from "@/components/Footer";
import api from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import { getFriendlyError } from "@/lib/errorMessages";

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      toast.error("Email is required.");
      return;
    }
    if (!password.trim()) {
      toast.error("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email: normalizedEmail, password });
      if (data?.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
      toast.success("Welcome back");
      router.push("/dashboard");
    } catch (error) {
      toast.error(getFriendlyError(error, "Login failed."));
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (e) => {
    e.preventDefault();
    const targetEmail = email.trim();
    if (!targetEmail) {
      toast.error("Enter your email first");
      return;
    }

    setResetLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, { redirectTo });
      if (error) throw error;
      toast.success("Password reset link sent to your email");
      setResetMode(false);
    } catch (error) {
      toast.error(error?.message || "Unable to send reset link");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
    <div className="layout-shell min-h-screen grid place-items-center py-10">
      <form className="surface p-8 w-full max-w-md space-y-3" onSubmit={onSubmit} noValidate>
        <h1 className="text-2xl font-semibold">Login</h1>
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div className="relative">
          <input
            className="input pr-11"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <PasswordToggleIcon visible={showPassword} />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            className="text-stone-600 underline underline-offset-4 hover:text-(--accent-strong)"
            onClick={() => setResetMode((prev) => !prev)}
          >
            Forgot password?
          </button>
          <Link href="/signup" className="underline text-stone-600 hover:text-(--accent-strong)">Sign up</Link>
        </div>

        {resetMode ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-3">
            <p className="text-sm text-stone-700">We&apos;ll email you a link to set a new password.</p>
            <button className="btn btn-primary w-full" type="button" onClick={onResetPassword} disabled={resetLoading}>
              {resetLoading ? "Sending reset link..." : "Send reset link"}
            </button>
          </div>
        ) : null}

        <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
        <p className="text-sm text-stone-600">No account? <Link href="/signup" className="underline">Sign up</Link></p>
      </form>
    </div>

    <Footer />
    </>
  );
}
