// Hypothesis Scoring Engine — scores all 13 hypotheses against the evidence base
// No Gemini needed for scoring; pure evidence aggregation

import { evidenceBase, hypotheses, EvidenceRecord } from "./evidence-data";

export interface HypothesisScore {
  id: string;
  name: string;
  definition: string;
  supportingEvidence: EvidenceRecord[];
  contradictingEvidence: EvidenceRecord[];
  supportCount: number;
  contradictCount: number;
  sourceDiversity: number;       // number of unique source tiers represented
  avgSourceQuality: number;      // weighted avg tier (lower = better)
  indiaSpecific: number;         // % of evidence that is India-specific
  directWishlist: number;        // % with direct wishlist relevance
  highPurchaseDelay: number;     // % with high purchase delay relevance
  confidenceLabel: "Low" | "Medium" | "High";
  confidenceRationale: string;
  rank: number;
}

function tierQualityScore(tier: number): number {
  // Tier 1 = 5 points (best), Tier 5 = 1 point
  return 6 - tier;
}

function calcConfidence(score: HypothesisScore): "Low" | "Medium" | "High" {
  const { supportCount, sourceDiversity, indiaSpecific, directWishlist } = score;
  if (supportCount >= 4 && sourceDiversity >= 3 && directWishlist >= 0.6) return "High";
  if (supportCount >= 2 && sourceDiversity >= 2) return "Medium";
  return "Low";
}

function calcConfidenceRationale(score: HypothesisScore): string {
  const parts: string[] = [];
  parts.push(`${score.supportCount} supporting record(s)`);
  parts.push(`${score.sourceDiversity} source tier(s) represented`);
  parts.push(`${Math.round(score.directWishlist * 100)}% direct wishlist relevance`);
  parts.push(`${Math.round(score.indiaSpecific * 100)}% India-specific`);
  if (score.contradictCount > 0) parts.push(`${score.contradictCount} contradicting record(s)`);
  return parts.join(" | ");
}

export function scoreHypotheses(): HypothesisScore[] {
  const scores: HypothesisScore[] = hypotheses.map((hyp) => {
    const supporting = evidenceBase.filter((ev) => ev.hypothesesSupported.includes(hyp.id));
    const contradicting = evidenceBase.filter((ev) => ev.hypothesesContradicted.includes(hyp.id));

    const tiers = new Set(supporting.map((ev) => ev.sourceTier));
    const sourceDiversity = tiers.size;

    const qualitySum = supporting.reduce((acc, ev) => acc + tierQualityScore(ev.sourceTier), 0);
    const avgSourceQuality = supporting.length > 0 ? qualitySum / supporting.length : 0;

    const indiaCount = supporting.filter((ev) =>
      ev.geography.toLowerCase().includes("india")
    ).length;
    const indiaSpecific = supporting.length > 0 ? indiaCount / supporting.length : 0;

    const directCount = supporting.filter((ev) => ev.wishlistRelevance === "direct").length;
    const directWishlist = supporting.length > 0 ? directCount / supporting.length : 0;

    const highDelayCount = supporting.filter((ev) => ev.purchaseDelayRelevance === "high").length;
    const highPurchaseDelay = supporting.length > 0 ? highDelayCount / supporting.length : 0;

    const partial: HypothesisScore = {
      id: hyp.id,
      name: hyp.name,
      definition: hyp.definition,
      supportingEvidence: supporting,
      contradictingEvidence: contradicting,
      supportCount: supporting.length,
      contradictCount: contradicting.length,
      sourceDiversity,
      avgSourceQuality,
      indiaSpecific,
      directWishlist,
      highPurchaseDelay,
      confidenceLabel: "Low",
      confidenceRationale: "",
      rank: 0,
    };

    partial.confidenceLabel = calcConfidence(partial);
    partial.confidenceRationale = calcConfidenceRationale(partial);
    return partial;
  });

  // Composite score for ranking: supportCount × sourceDiversity × avgSourceQuality × directWishlist
  const ranked = scores
    .map((s) => ({
      ...s,
      compositeScore:
        s.supportCount * s.sourceDiversity * s.avgSourceQuality * (s.directWishlist + 0.1),
    }))
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  return ranked;
}

export function getThemeDistribution() {
  const themeCounts: Record<string, number> = {};
  evidenceBase.forEach((ev) => {
    ev.themes.forEach((t) => {
      themeCounts[t] = (themeCounts[t] || 0) + 1;
    });
  });
  const total = Object.values(themeCounts).reduce((a, b) => a + b, 0);
  return Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([theme, count]) => ({
      theme,
      count,
      pct: `${Math.round((count / total) * 100)}% of ${total} theme tags across ${evidenceBase.length} records`,
    }));
}

export function getSourceBreakdown() {
  const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  evidenceBase.forEach((ev) => {
    tierCounts[ev.sourceTier]++;
  });
  return tierCounts;
}
