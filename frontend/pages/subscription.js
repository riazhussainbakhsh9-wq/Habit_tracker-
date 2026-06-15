import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import PlanCard from "@/components/PlanCard";
import SectionCard from "@/components/SectionCard";
import api from "@/lib/apiClient";
import usePageSession from "@/lib/usePageSession";

const plans = [
  {
    key: "free",
    badge: "Free Plan",
    title: "Starter access",
    price: "0",
    period: "No payment required",
    description: "Best for trying the app and keeping a small daily routine.",
    features: ["Up to 3 habits", "Basic AI quote each day", "Simple completion charts"],
    ctaLabel: "Stay on Free",
    tone: "stone",
  },
  {
    key: "monthly",
    badge: "Monthly",
    title: "Premium Monthly",
    price: "300",
    period: "PKR / month",
    description: "Flexible premium access when you want to upgrade without a long commitment.",
    features: ["Unlimited habits", "Priority insights", "Manual EasyPaisa approval"],
    ctaLabel: "Choose Monthly",
    tone: "cream",
  },
  {
    key: "yearly",
    badge: "Yearly",
    title: "Premium Yearly",
    price: "3000",
    period: "PKR / year",
    description: "Best value for people who want uninterrupted access for the full year.",
    features: ["All monthly features", "Lower long-term cost", "Simple yearly renewal"],
    recommended: true,
    ctaLabel: "Choose Yearly",
    tone: "gold",
  },
];

export default function SubscriptionPage() {
  const { user, loading, logout } = usePageSession();
  const [subscription, setSubscription] = useState(null);
  const [step, setStep] = useState(1);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const selectedPlanLabel = useMemo(() => {
    return billingCycle === "yearly" ? "Premium Yearly" : "Premium Monthly";
  }, [billingCycle]);

  const selectedPlanPrice = useMemo(() => {
    return billingCycle === "yearly" ? "3000" : "300";
  }, [billingCycle]);

  const currentPlanLabel = useMemo(() => {
    if (subscription?.plan === "premium") {
      return subscription?.billing_cycle === "yearly" ? "Premium Yearly" : "Premium Monthly";
    }

    return "Free Plan";
  }, [subscription]);

  const currentPlanPrice = useMemo(() => {
    if (subscription?.plan === "premium") {
      return subscription?.billing_cycle === "yearly" ? "PKR 3000" : "PKR 300";
    }

    return "PKR 0";
  }, [subscription]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/subscription/status");
      setSubscription(data.subscription || null);
    } catch {
      setSubscription(null);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load, user]);

  const choosePlan = (cycle) => {
    setSelectedPlan("premium");
    setBillingCycle(cycle);
    setStep(2);
  };

  const submitManual = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please attach a screenshot");

    try {
      const formData = new FormData();
      formData.append("screenshot", file);
      formData.append("billing_cycle", billingCycle);
      formData.append("plan", selectedPlan);
      await api.post("/api/subscription/manual", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Submitted to admin for approval");
      setFile(null);
      setSubmitted(true);
      setStep(3);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Unable to submit payment");
    }
  };

  return (
    <AppShell user={user} onLogout={logout} active="/subscription" title="Subscription Center" subtitle="Billing & access">
      {loading ? <div className="surface p-6">Loading subscription...</div> : null}

      <section className="surface p-5 md:p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(183,131,41,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(95,107,110,0.1),transparent_32%)]" />
        <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Choose a plan</p>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Clean pricing with PKR shown clearly</h3>
          </div>
          <p className="text-sm text-stone-600 max-w-2xl">
            Start free if you want the basics, or select a premium card below. Monthly is PKR 300 and yearly is PKR 3000.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.key}
              badge={plan.badge}
              title={plan.title}
              price={plan.price}
              period={plan.period}
              description={plan.description}
              features={plan.features}
              recommended={plan.recommended}
              selected={billingCycle === plan.key}
              tone={plan.tone}
              ctaLabel={plan.ctaLabel}
              onSelect={() => {
                if (plan.key === "free") {
                  toast("Free account is active.");
                  return;
                }
                choosePlan(plan.key);
              }}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-stone-500">
          <span className="rounded-full border border-stone-200 bg-white/80 px-3 py-2">Free includes 3 habits</span>
          <span className="rounded-full border border-stone-200 bg-white/80 px-3 py-2">Monthly PKR 300</span>
          <span className="rounded-full border border-stone-200 bg-white/80 px-3 py-2">Yearly PKR 3000</span>
        </div>
        </div>
      </section>

      <div className="grid xl:grid-cols-2 gap-4 mt-4">
        <SectionCard title="EasyPaisa Payment" subtitle="Step 2: Complete the transfer">
          {step === 1 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/75 p-5 text-sm text-stone-600">
              Choose the Monthly or Yearly card above to unlock the payment details step.
            </div>
          ) : null}

          {step === 2 && !submitted ? (
            <form className="space-y-4" onSubmit={submitManual}>
              <div className="rounded-2xl border border-(--accent)/25 bg-[linear-gradient(180deg,#fffdf8_0%,#fff6e3_100%)] p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Selected package</p>
                <p className="mt-1 text-xl font-semibold text-stone-900">{selectedPlanLabel}</p>
                <p className="mt-1 text-sm text-stone-600">PKR {selectedPlanPrice} will be reviewed by admin after submission.</p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 space-y-2 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">EasyPaisa account</p>
                <p className="text-sm text-stone-600">Account number</p>
                <p className="text-2xl md:text-3xl font-semibold text-stone-900 tracking-[0.08em]">03496744768</p>
                <p className="text-sm text-stone-600">Account holder: <strong>Riaz Hussain</strong></p>
              </div>

              <div>
                <input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white/80 p-4">
                <p className="text-sm text-stone-600">Upload only the payment screenshot as proof. The request will be sent to admin for approval.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary" type="submit">Submit Screenshot to Admin</button>
                <button className="btn btn-ghost" type="button" onClick={() => setStep(1)}>Back</button>
              </div>
            </form>
          ) : null}

          {step === 3 && submitted ? (
            <div className="rounded-2xl border border-(--accent)/30 bg-[linear-gradient(180deg,#fffaf0_0%,#fff6df_100%)] p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Submitted</p>
              <h4 className="mt-2 text-2xl font-semibold text-stone-900">Request sent to admin</h4>
              <p className="mt-2 text-sm text-stone-600">Your subscription screenshot has been submitted. Admin will review and activate it.</p>
              <button className="btn btn-primary mt-4" type="button" onClick={() => setStep(1)}>Choose another plan</button>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title="Plan Status" subtitle="Account access">
          <div className="rounded-3xl border border-stone-200 bg-[linear-gradient(180deg,#fffdf9_0%,#f8f4eb_100%)] p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">Current access</p>
                <h4 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{currentPlanLabel}</h4>
                <p className="mt-2 text-sm text-stone-600">Your account is shown here with the current billing state and the next action required.</p>
              </div>

              <div className="w-40 rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Price</p>
                <p className="mt-2 text-2xl font-semibold text-stone-900">{currentPlanPrice}</p>
                <p className="text-xs text-stone-500 mt-1">{subscription?.billing_cycle || "monthly"}</p>
              </div>
            </div>

            <div className="mt-5 grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-stone-200 bg-white/85 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Status</p>
                <p className="mt-2 text-lg font-semibold text-stone-900">{subscription?.status || "active"}</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/85 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Billing</p>
                <p className="mt-2 text-lg font-semibold text-stone-900">{subscription?.billing_cycle || "monthly"}</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/85 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Plan type</p>
                <p className="mt-2 text-lg font-semibold text-stone-900">{subscription?.plan || "free"}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-(--accent)/20 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">How approval works</p>
              <ul className="mt-3 space-y-2 text-sm text-stone-700">
                <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: "var(--accent)" }} />Choose monthly or yearly premium billing.</li>
                <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: "var(--accent)" }} />Transfer to the EasyPaisa account shown above.</li>
                <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: "var(--accent)" }} />Upload the screenshot proof only.</li>
                <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: "var(--accent)" }} />Admin reviews and activates the subscription.</li>
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>

      <Footer />
    </AppShell>
  );
}
