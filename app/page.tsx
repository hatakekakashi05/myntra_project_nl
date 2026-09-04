"use client";
import { useState, useEffect } from "react";

interface ScrapedItem {
  source: string;
  date: string;
  text: string;
  rating?: number;
  url?: string;
  subreddit?: string;
  themes?: string[];
  evidenceClass?: string;
  hypothesesSupported?: string[];
  sentiment?: string;
  keyQuote?: string;
}

interface ScrapeResult {
  success: boolean;
  total: number;
  relevantCount: number;
  playStore: ScrapedItem[];
  reddit: ScrapedItem[];
  message: string;
}

type Confidence = "Low" | "Medium" | "High";

interface EvidenceRecord {
  id: string;
  source: string;
  sourceTier: number;
  originalText: string;
  evidenceClass: string;
  themes: string[];
  geography: string;
  date: string;
}

interface HypothesisScore {
  id: string;
  rank: number;
  name: string;
  definition: string;
  supportCount: number;
  contradictCount: number;
  sourceDiversity: number;
  avgSourceQuality: number;
  indiaSpecific: number;
  directWishlist: number;
  highPurchaseDelay: number;
  confidenceLabel: Confidence;
  confidenceRationale: string;
  supportingEvidence: EvidenceRecord[];
  contradictingEvidence: EvidenceRecord[];
}

interface ThemeItem {
  theme: string;
  count: number;
  pct: string;
}

interface DisconfirmationResult {
  hypothesisId: string;
  hypothesisName: string;
  whyMightBeWrong: string[];
  alternativeExplanations: string[];
  remainingUncertainty: string;
  falsificationCriteria: string;
  primaryResearchQuestions: string[];
}

const CONFIDENCE_COLORS: Record<Confidence, string> = {
  High: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Medium: "bg-amber-100 text-amber-800 border-amber-300",
  Low: "bg-red-100 text-red-800 border-red-300",
};

const TIER_COLORS: Record<number, string> = {
  1: "bg-blue-700",
  2: "bg-blue-500",
  3: "bg-sky-400",
  4: "bg-slate-400",
  5: "bg-slate-300",
};

const THEME_LABELS: Record<string, string> = {
  SALE: "Sale Anticipation", PRICE: "Price Too High", FIT: "Fit Uncertainty",
  SIZE: "Size Availability", QUALITY: "Quality Uncertainty", ALT: "Alternative Comparison",
  OCCASION: "Occasion/Timing", INTENT: "Intent Decay", FORGET: "Forgetting",
  OVERLOAD: "Decision Overload", INFO: "Information Gap", AVAIL: "Availability/OOS",
  TRUST: "Trust/Dynamic Pricing", SOCIAL: "Social Validation", OTHER: "Other",
};

// Static scraped corpus stats — 1,050 Play Store reviews scraped via Apify, Aug 31–Sep 2 2026
const STATIC_SCRAPE = {
  total: 1050,
  relevantCount: 17,   // direct wishlist relevance (wishlistRelevance === "direct")
  playStore: 1050,
  reddit: 0,
  dateRange: "Aug 31 – Sep 2, 2026",
  themeCounts: {
    INFO:    { label: "General Experience & App Navigation",       desc: "General shopping feedback, wishlist feature accessibility, and app ease",           count: 833 },
    QUALITY: { label: "Fabric & Quality Uncertainty",              desc: "Concerns regarding material feel, duplicate items, or listing discrepancies",        count: 105 },
    TRUST:   { label: "Return, Refund & Service Trust",            desc: "Friction in return tag verification, delayed pickups, and customer service",         count: 66  },
    PRICE:   { label: "Price Sensitivity & Extra Fees",            desc: "Hesitation due to current retail pricing, delivery fees, or sudden price spikes",    count: 63  },
    SALE:    { label: "Discount & Coupon Anticipation",            desc: "Waiting for seasonal sales (EORS), working coupon codes, or special offers",        count: 32  },
    AVAIL:   { label: "Size Availability & Out-of-Stock",          desc: "Desired size or variant out-of-stock when attempting to finalize purchase",         count: 18  },
    FIT:     { label: "Fit & Sizing Uncertainty",                  desc: "Anxiety regarding true-to-fit sizing, exchanges, and fit-assistance gaps",          count: 10  },
    SIZE:    { label: "Size Chart Inconsistency",                  desc: "Brand-to-brand sizing drift; size charts not matching actual garment dimensions",    count: 10  },
  },
  sentiment: { positive: 913, negative: 123, neutral: 14 },
  ratings: { 1: 111, 2: 12, 3: 14, 4: 91, 5: 822 },
  // Curated wishlist-relevant + negative showcase reviews (real quotes from dataset)
  showcaseReviews: [
    { themes: ["PRICE", "FIT", "SIZE", "TRUST"], rating: 1, sentiment: "negative",  keyQuote: "My sister bought a suit worth ₹2k and returned it because it was small in size — the pickup agent took the item but the refund never came through.", hypotheses: ["H2", "H3", "H9"] },
    { themes: ["QUALITY", "TRUST"],              rating: 1, sentiment: "negative",  keyQuote: "A new way to scam customers — when you buy a product from Myntra, they send you cheap and different products. No way to escalate after first complaint.", hypotheses: ["H4", "H13"] },
    { themes: ["TRUST"],                         rating: 1, sentiment: "negative",  keyQuote: "Received a completely different product from what I ordered. After complaining, I was repeatedly told to wait. No resolution after 3 weeks.", hypotheses: ["H13", "H9"] },
    { themes: ["TRUST"],                         rating: 1, sentiment: "negative",  keyQuote: "Myntra express delivery was very poor — they mark the order as delivered and there is no way to get to the order or raise a complaint.", hypotheses: ["H13"] },
    { themes: ["QUALITY"],                       rating: 2, sentiment: "negative",  keyQuote: "Fake product sold in the name of real ones. Material quality completely different from what was shown in product photos.", hypotheses: ["H4"] },
    { themes: ["TRUST"],                         rating: 2, sentiment: "negative",  keyQuote: "The refund system is the worst — in the app they are showing that refund is completed but the amount never reflects in bank account.", hypotheses: ["H13"] },
    { themes: ["PRICE"],                         rating: 4, sentiment: "positive",  keyQuote: "Please don't charge the convenience fee for regular buyers. Rest all good.", hypotheses: ["H2"] },
    { themes: ["QUALITY"],                       rating: 5, sentiment: "positive",  keyQuote: "Every time I buy products from this site they seem good quality. Polite delivery agents. Had a great experience.", hypotheses: ["H4"] },
    { themes: ["INFO"],                          rating: 1, sentiment: "negative",  keyQuote: "Ordered 6 products so far but have been able to receive only 2. Orders get cancelled at the last moment without reason.", hypotheses: ["H9", "H13"] },
    { themes: ["INFO"],                          rating: 1, sentiment: "negative",  keyQuote: "They don't send the item you see when you order — they send what they think they like. Please don't buy anything from here.", hypotheses: ["H4", "H13"] },
  ],
};

export default function DiscoveryEngine() {
  const [tab, setTab] = useState<"overview" | "hypotheses" | "disconfirm" | "research" | "scraped">("overview");
  const [scores, setScores] = useState<HypothesisScore[]>([]);
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [sourceBreakdown, setSourceBreakdown] = useState<Record<string, number>>({});
  const [disconfirmation, setDisconfirmation] = useState<DisconfirmationResult[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [expandedHyp, setExpandedHyp] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    fetchScores();
  }, []);

  async function fetchScores() {
    setLoading(true);
    try {
      const res = await fetch("/api/engine");
      const data = await res.json();
      setScores(data.scores || []);
      setThemes(data.themeDistribution || []);
      setSourceBreakdown(data.sourceBreakdown || {});
    } catch {
      setError("Failed to load evidence scores.");
    } finally {
      setLoading(false);
    }
  }

  async function runGeminiAnalysis() {
    setGeminiLoading(true);
    setError("");
    try {
      const res = await fetch("/api/engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "executive" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "API error");
      }
      const data = await res.json();
      setDisconfirmation(data.disconfirmation || []);
      setExecutiveSummary(data.summary || "");
      setTab("disconfirm");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gemini analysis failed");
    } finally {
      setGeminiLoading(false);
    }
  }

  const totalEvidence = 22;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700">
                AI DISCOVERY ENGINE v1.0
              </span>
              <span className="text-xs text-slate-500">gemini-2.5-flash</span>
            </div>
            <h1 className="text-xl font-bold text-white">Myntra Wishlist → Purchase Conversion</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Why do users save products to Wishlist but not purchase within 30 days?
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-slate-500">
              <div>22 base evidence records</div>
              <div>1,050 scraped Play Store reviews</div>
              <div>Tiers 1–4 · Apify Aug 2026</div>
            </div>
            <button
              onClick={runGeminiAnalysis}
              disabled={geminiLoading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {geminiLoading ? "Running Gemini Analysis..." : "▶ Run Full AI Analysis"}
            </button>
          </div>
        </div>
        {error && (
          <div className="max-w-7xl mx-auto mt-3 bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-2 rounded-lg">
            ⚠ {error}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 flex gap-0">
          {(["overview", "hypotheses", "disconfirm", "research", "scraped"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t
                  ? "border-indigo-400 text-indigo-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t === "hypotheses" ? "Core Insights"
                : t === "disconfirm" ? "Disconfirmation"
                : t === "research" ? "Research Qs"
                : t === "scraped" ? "📊 Scraped Data"
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            Loading evidence scores...
          </div>
        )}

        {/* OVERVIEW TAB */}
        {!loading && tab === "overview" && (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Evidence Records", value: totalEvidence, sub: "Tiers 1–4" },
                { label: "Key Insights Identified", value: 13, sub: "I1–I13" },
                { label: "India-Specific Records", value: "~14", sub: "of " + totalEvidence },
                { label: "High Confidence", value: scores.filter(s => s.confidenceLabel === "High").length, sub: "High-confidence insights" },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm font-medium text-slate-300">{stat.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Source Breakdown */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Source Breakdown by Tier</h2>
              <div className="space-y-2">
                {Object.entries(sourceBreakdown).map(([tier, count]) => {
                  const tierNum = parseInt(tier);
                  const tierLabels: Record<number, string> = {
                    1: "T1 — Academic / McKinsey / Bain",
                    2: "T2 — Redseer / BCG / Industry Reports",
                    3: "T3 — PM Case Studies / Competitor Analysis",
                    4: "T4 — Play Store / App Reviews / Consumer Voice",
                    5: "T5 — Public Web Discussions",
                  };
                  const pct = Math.round((count / totalEvidence) * 100);
                  return (
                    <div key={tier} className="flex items-center gap-3">
                      <div className="text-xs text-slate-400 w-64 shrink-0">{tierLabels[tierNum]}</div>
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${TIER_COLORS[tierNum] || "bg-slate-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-300 w-16 text-right">{count} records</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Theme Distribution */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-1">Theme Distribution</h2>
              <p className="text-xs text-slate-500 mb-4">
                Share of shopper friction tags across {totalEvidence} records.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {themes.map((t) => (
                  <div key={t.theme} className="flex items-center gap-3">
                    <div className="text-xs text-slate-300 w-44 shrink-0">{THEME_LABELS[t.theme] || t.theme}</div>
                    <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{ width: `${Math.round((t.count / Math.max(...themes.map(x => x.count))) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 w-6 text-right">{t.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Insights Preview */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Top Behavioral Insights by Evidence Strength</h2>
              <div className="space-y-3">
                {scores.slice(0, 6).map((h) => (
                  <div key={h.id} className="flex items-start gap-4 p-3 bg-slate-900/60 rounded-lg border border-slate-700/60">
                    <div className="text-lg font-bold text-slate-500 w-6 shrink-0">#{h.rank}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-indigo-400">{h.id}</span>
                        <span className="font-medium text-white text-sm">{h.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded border ${CONFIDENCE_COLORS[h.confidenceLabel]}`}>
                          {h.confidenceLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{h.definition}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-white">{h.supportCount}</div>
                      <div className="text-xs text-slate-500">records</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setTab("hypotheses")} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
                View all 13 core insights →
              </button>
            </div>
          </div>
        )}

        {/* INSIGHTS TAB */}
        {!loading && tab === "hypotheses" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Ranked by composite score: support volume, source diversity, and relevance. Click any insight to inspect supporting evidence.
            </p>
            {scores.map((h) => (
              <div key={h.id} className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
                <button
                  className="w-full text-left p-5 flex items-start gap-4 hover:bg-slate-800/80 transition-colors"
                  onClick={() => setExpandedHyp(expandedHyp === h.id ? null : h.id)}
                >
                  <div className="text-xl font-bold text-slate-500 w-8 shrink-0">#{h.rank}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded">{h.id}</span>
                      <span className="font-semibold text-white">{h.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${CONFIDENCE_COLORS[h.confidenceLabel]}`}>
                        {h.confidenceLabel} Confidence
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{h.definition}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                      <span>✓ {h.supportCount} supporting</span>
                      <span>✗ {h.contradictCount} contradicting</span>
                      <span>⬡ {h.sourceDiversity} tier(s)</span>
                      <span>🇮🇳 {Math.round(h.indiaSpecific * 100)}% India</span>
                      <span>🎯 {Math.round(h.directWishlist * 100)}% direct</span>
                    </div>
                  </div>
                  <div className="text-slate-400 shrink-0">{expandedHyp === h.id ? "▲" : "▼"}</div>
                </button>

                {expandedHyp === h.id && (
                  <div className="border-t border-slate-700 p-5 space-y-4 bg-slate-900/40">
                    <p className="text-xs text-slate-400 italic">{h.confidenceRationale}</p>

                    {h.supportingEvidence.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">
                          Supporting Evidence ({h.supportingEvidence.length})
                        </h4>
                        <div className="space-y-2">
                          {h.supportingEvidence.map((ev) => (
                            <div key={ev.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-mono text-slate-400">{ev.id}</span>
                                <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">T{ev.sourceTier}</span>
                                <span className="text-xs text-slate-400">{ev.source}</span>
                                <span className="text-xs text-indigo-400">{ev.evidenceClass}</span>
                              </div>
                              <p className="text-sm text-slate-200 italic">"{ev.originalText}"</p>
                              <div className="text-xs text-slate-500 mt-1">{ev.geography} | {ev.date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {h.contradictingEvidence.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">
                          Contradicting Evidence ({h.contradictingEvidence.length})
                        </h4>
                        <div className="space-y-2">
                          {h.contradictingEvidence.map((ev) => (
                            <div key={ev.id} className="bg-slate-800 rounded-lg p-3 border border-red-900/40">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-mono text-slate-400">{ev.id}</span>
                                <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">T{ev.sourceTier}</span>
                                <span className="text-xs text-slate-400">{ev.source}</span>
                              </div>
                              <p className="text-sm text-slate-200 italic">"{ev.originalText}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* DISCONFIRMATION TAB */}
        {!loading && tab === "disconfirm" && (
          <div className="space-y-5">
            {disconfirmation.length === 0 ? (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-8 text-center">
                <p className="text-slate-400 mb-4">Click "Run Full AI Analysis" to generate Gemini-powered disconfirmation analysis.</p>
                <button
                  onClick={runGeminiAnalysis}
                  disabled={geminiLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg"
                >
                  {geminiLoading ? "Running..." : "▶ Run AI Analysis"}
                </button>
              </div>
            ) : (
              <>
                {executiveSummary && (
                  <div className="bg-slate-800/60 border border-indigo-700/40 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-indigo-300 uppercase tracking-wide mb-3">Executive Summary (Gemini-Generated)</h2>
                    <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{executiveSummary}</div>
                  </div>
                )}
                {disconfirmation.map((d) => (
                  <div key={d.hypothesisId} className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-mono bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded">{d.hypothesisId}</span>
                      <h3 className="font-semibold text-white">{d.hypothesisName}</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Why This Might Be Wrong</h4>
                        <ul className="space-y-1">
                          {d.whyMightBeWrong.map((r, i) => (
                            <li key={i} className="text-sm text-slate-300 flex gap-2">
                              <span className="text-red-500 shrink-0">✗</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">Alternative Explanations</h4>
                        <ul className="space-y-1">
                          {d.alternativeExplanations.map((a, i) => (
                            <li key={i} className="text-sm text-slate-300 flex gap-2">
                              <span className="text-amber-500 shrink-0">⟳</span> {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Remaining Uncertainty</h4>
                        <p className="text-sm text-slate-300">{d.remainingUncertainty}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">What Would Falsify This</h4>
                        <p className="text-sm text-slate-300">{d.falsificationCriteria}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* RESEARCH QUESTIONS TAB */}
        {!loading && tab === "research" && (
          <div className="space-y-4">
            {disconfirmation.length === 0 ? (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-8 text-center">
                <p className="text-slate-400 mb-4">Run Gemini analysis first to generate primary research questions.</p>
                <button
                  onClick={runGeminiAnalysis}
                  disabled={geminiLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg"
                >
                  {geminiLoading ? "Running..." : "▶ Run AI Analysis"}
                </button>
              </div>
            ) : (
              <>
                {disconfirmation.map((d) => (
                  <div key={d.hypothesisId} className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-mono bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded">{d.hypothesisId}</span>
                      <span className="text-sm font-medium text-white">{d.hypothesisName}</span>
                      <span className="text-xs text-slate-500">Primary Research Questions</span>
                    </div>
                    <ol className="space-y-2">
                      {d.primaryResearchQuestions.map((q, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-300">
                          <span className="text-indigo-400 font-medium shrink-0">Q{i + 1}.</span>
                          {q}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* SCRAPED DATA TAB — Static corpus from Apify scrape Aug 31–Sep 2 2026 */}
        {!loading && tab === "scraped" && (
          <div className="space-y-5">
            {/* Header banner */}
            <div className="bg-violet-950/40 border border-violet-700/50 rounded-xl p-4 flex items-start gap-3">
              <span className="text-violet-400 text-lg mt-0.5">📊</span>
              <div>
                <p className="text-sm font-semibold text-violet-200">Apify Corpus · Google Play Store · {STATIC_SCRAPE.dateRange}</p>
                <p className="text-xs text-violet-400 mt-0.5">
                  1,050 Myntra app reviews scraped (India, English, 1–5★) via Apify actor <code className="font-mono bg-violet-900/40 px-1 rounded">neatrat/google-play-store-reviews-scraper</code>,
                  then classified by Gemini 2.5 Flash against 13 behavioral theme codes and 13 hypotheses.
                </p>
              </div>
            </div>

            {/* Top-level stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Scraped",        value: STATIC_SCRAPE.total,         sub: "raw Play Store reviews" },
                { label: "Wishlist-Direct",       value: STATIC_SCRAPE.relevantCount, sub: "explicit wishlist/save mentions" },
                { label: "Play Store Reviews",    value: STATIC_SCRAPE.playStore,     sub: "India · English · Classified" },
                { label: "Reddit Posts",          value: STATIC_SCRAPE.reddit,        sub: "not scraped in this run" },
              ].map((s) => (
                <div key={s.label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{s.value.toLocaleString()}</div>
                  <div className="text-sm font-medium text-slate-300">{s.label}</div>
                  <div className="text-xs text-slate-500">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Sentiment & Rating breakdown */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Sentiment Distribution</h3>
                <div className="space-y-2">
                  {[
                    { label: "Positive", count: STATIC_SCRAPE.sentiment.positive, color: "bg-emerald-500" },
                    { label: "Negative", count: STATIC_SCRAPE.sentiment.negative, color: "bg-red-500" },
                    { label: "Neutral",  count: STATIC_SCRAPE.sentiment.neutral,  color: "bg-slate-500" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-3">
                      <div className="w-16 text-xs text-slate-400 text-right shrink-0">{s.label}</div>
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div className={`h-2 rounded-full ${s.color}`} style={{ width: `${Math.round(s.count / STATIC_SCRAPE.total * 100)}%` }} />
                      </div>
                      <div className="text-xs text-slate-300 w-20 text-right">{s.count.toLocaleString()} ({Math.round(s.count / STATIC_SCRAPE.total * 100)}%)</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Star Rating Distribution</h3>
                <div className="space-y-2">
                  {([5,4,3,2,1] as const).map((stars) => {
                    const count = STATIC_SCRAPE.ratings[stars];
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <div className="w-16 text-xs text-slate-400 text-right shrink-0">{"★".repeat(stars)}</div>
                        <div className="flex-1 bg-slate-700 rounded-full h-2">
                          <div className={`h-2 rounded-full ${stars >= 4 ? "bg-emerald-500" : stars === 3 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${Math.round(count / STATIC_SCRAPE.total * 100)}%` }} />
                        </div>
                        <div className="text-xs text-slate-300 w-16 text-right">{count.toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Theme breakdown */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-1">Behavioral Theme Distribution</h3>
              <p className="text-xs text-slate-500 mb-4">
                Theme tags assigned by Gemini 2.5 Flash across {STATIC_SCRAPE.total.toLocaleString()} reviews.
                Note: one review can carry multiple themes; counts reflect theme tag occurrences, not unique reviews.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(["ALL", ...Object.keys(STATIC_SCRAPE.themeCounts)] as string[]).filter(k => k !== "ALL").map((key) => {
                  const t = STATIC_SCRAPE.themeCounts[key as keyof typeof STATIC_SCRAPE.themeCounts];
                  const maxCount = Math.max(...Object.values(STATIC_SCRAPE.themeCounts).map(x => x.count));
                  const isSelected = selectedCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(isSelected ? "ALL" : key)}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        isSelected
                          ? "bg-indigo-950/80 border-indigo-500 text-white"
                          : "bg-slate-900/40 border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-200 line-clamp-1">{t.label}</span>
                        <span className="text-sm font-bold text-indigo-300 ml-2">{t.count}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1 mb-1">
                        <div className="h-1 rounded-full bg-indigo-500" style={{ width: `${Math.round(t.count / maxCount * 100)}%` }} />
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-2">{t.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Showcase reviews */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-1">
                Curated Signal Showcase
                {selectedCategory !== "ALL" && (
                  <span className="ml-2 text-indigo-400 font-normal normal-case">
                    — {STATIC_SCRAPE.themeCounts[selectedCategory as keyof typeof STATIC_SCRAPE.themeCounts]?.label}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mb-4">Real verbatim quotes from the corpus. Selected for hypothesis relevance by Gemini 2.5 Flash classification.</p>
              <div className="space-y-3">
                {STATIC_SCRAPE.showcaseReviews
                  .filter(r => selectedCategory === "ALL" || r.themes.includes(selectedCategory))
                  .map((item, i) => (
                  <div key={i} className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">Play Store</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${item.rating <= 2 ? "bg-red-900/40 text-red-400" : "bg-emerald-900/40 text-emerald-400"}`}>
                        {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                      </span>
                      {item.themes.map((t) => (
                        <span key={t} className="text-xs bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-900">
                          {STATIC_SCRAPE.themeCounts[t as keyof typeof STATIC_SCRAPE.themeCounts]?.label || THEME_LABELS[t] || t}
                        </span>
                      ))}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${item.sentiment === "negative" ? "text-red-400" : "text-emerald-400"}`}>
                        {item.sentiment}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 italic">"{item.keyQuote}"</p>
                    <p className="text-xs text-slate-500 mt-1">Links to: {item.hypotheses.join(", ")}</p>
                  </div>
                ))}
                {STATIC_SCRAPE.showcaseReviews.filter(r => selectedCategory === "ALL" || r.themes.includes(selectedCategory)).length === 0 && (
                  <div className="text-slate-500 text-sm text-center py-6">
                    No showcase reviews for this theme. Select a different category.
                  </div>
                )}
              </div>
            </div>

            {/* Methodology note */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
              <span className="text-slate-400 font-semibold">Methodology:</span> 1,050 Myntra Google Play Store reviews (India, English) were scraped via Apify between Aug 31–Sep 2, 2026
              using the <code className="font-mono bg-slate-800 px-1 rounded">neatrat/google-play-store-reviews-scraper</code> actor (ratings 1–5, 1,050 max).
              Each review was classified by Gemini 2.5 Flash against a closed-set taxonomy of 13 behavioral theme codes
              and mapped to relevant hypotheses (H1–H13). Only 17 reviews contained explicit wishlist/save/bookmark language (direct relevance).
              The remaining 1,033 are indirect signals — general platform experience that contextualises the purchase decision environment.
              Reddit scraping was not executed in this corpus run.
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-10 px-6 py-4 text-center text-xs text-slate-600">
        AI Discovery Engine · Myntra Wishlist → Purchase · Evidence-First PM Research · September 2026
      </div>
    </div>
  );
}
