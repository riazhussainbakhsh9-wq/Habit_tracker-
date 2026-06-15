import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import QuoteCard from "@/components/QuoteCard";
import SectionCard from "@/components/SectionCard";
import api from "@/lib/apiClient";
import usePageSession from "@/lib/usePageSession";

const emotions = ["focused", "happy", "sad", "lazy", "stressed"];

const quoteBank = [
  {
    quote: "Small actions repeated daily build the strongest identity.",
    habit_suggestion: "Choose one action you can repeat without resistance.",
    insight: "Consistency grows when the habit feels easy to start.",
  },
  {
    quote: "Progress becomes visible when effort stops depending on mood.",
    habit_suggestion: "Use a fixed trigger like after breakfast or after prayer.",
    insight: "Stable cues reduce friction and protect momentum.",
  },
  {
    quote: "A streak is a system, not a mood.",
    habit_suggestion: "Keep the task short enough to never feel heavy.",
    insight: "Systems win when they are simple, repeatable, and measurable.",
  },
  {
    quote: "Discipline is built in the moments nobody notices.",
    habit_suggestion: "Protect the habit even on low-energy days.",
    insight: "The quiet days are the days that shape the final result.",
  },
  {
    quote: "Every completed day is a vote for the future you want.",
    habit_suggestion: "Track one visible win before the day ends.",
    insight: "Small wins compound into confidence and identity.",
  },
];

export default function QuotesPage() {
  const { user, loading, logout } = usePageSession();
  const [emotion, setEmotion] = useState("focused");
  const [refreshing, setRefreshing] = useState(false);
  const refreshIndexRef = useRef(0);
  const currentQuoteRef = useRef({
    quote: "Consistency compounds faster than motivation fades.",
    habit_suggestion: "Keep the habit small and repeatable.",
    insight: "Start with one clear action.",
  });
  const [quote, setQuote] = useState({
    quote: "Consistency compounds faster than motivation fades.",
    habit_suggestion: "Keep the habit small and repeatable.",
    insight: "Start with one clear action.",
  });
  const [history, setHistory] = useState([]);

  const generateQuote = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await api.post("/api/motivation", { emotion, missedHabit: emotion === "sad" || emotion === "lazy" });
      const apiQuote = data?.quote || "";
      const shouldRotate = !apiQuote || apiQuote === currentQuoteRef.current.quote;
      const rotatedQuote = quoteBank[refreshIndexRef.current % quoteBank.length];
      const nextQuote = shouldRotate ? rotatedQuote : data;

      currentQuoteRef.current = nextQuote;
      refreshIndexRef.current += 1;
      setQuote(nextQuote);
      setHistory((current) => [{ ...nextQuote, emotion, id: Date.now() }, ...current].slice(0, 6));
    } catch (error) {
      const fallback = quoteBank[refreshIndexRef.current % quoteBank.length];
      refreshIndexRef.current += 1;
      currentQuoteRef.current = fallback;
      setQuote(fallback);
      setHistory((current) => [{ ...fallback, emotion, id: Date.now() }, ...current].slice(0, 6));
    } finally {
      setRefreshing(false);
    }
  }, [emotion]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      generateQuote();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [generateQuote, user]);

  return (
    <AppShell user={user} onLogout={logout} active="/quotes" title="AI Quote Studio" subtitle="Motivation">
      {loading ? <div className="surface p-6">Loading quotes...</div> : null}
      <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-4 items-start">
        <SectionCard title="Daily AI Quote" subtitle="Animated motivation" className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap gap-2 mb-5">
            {emotions.map((value) => (
              <button
                key={value}
                type="button"
                className={`btn text-sm capitalize ${emotion === value ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setEmotion(value)}
              >
                {value}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-primary text-sm"
              onClick={generateQuote}
            >
              {refreshing ? "Refreshing..." : "Refresh Quote"}
            </button>
          </div>

          <div className="min-w-0">
            <QuoteCard
              quote={quote.quote}
              suggestion={quote.habit_suggestion}
              insight={quote.insight}
              onRefresh={generateQuote}
            />
          </div>

          <p className="mt-4 text-sm text-stone-600">
            Current emotion: <strong>{emotion}</strong>. Click Refresh Quote to generate a new AI response.
          </p>
        </SectionCard>

        <SectionCard title="Quote History" subtitle="Recent generations" className="min-w-0">
          <div className="space-y-3">
            {history.length ? history.map((item) => (
              <div key={item.id} className="rounded-2xl border border-stone-200 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{item.emotion}</p>
                <p className="font-medium mt-2 text-stone-900">{item.quote}</p>
              </div>
            )) : <p className="text-stone-600">Your generated quotes will appear here.</p>}
          </div>
        </SectionCard>
      </div>

      <Footer />
    </AppShell>
  );
}
