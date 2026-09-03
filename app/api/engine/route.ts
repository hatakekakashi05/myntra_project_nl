import { NextRequest, NextResponse } from "next/server";
import { scoreHypotheses, getThemeDistribution, getSourceBreakdown } from "@/lib/scorer";
import { runDisconfirmation, generateExecutiveSummary } from "@/lib/gemini-engine";

export const maxDuration = 60; // Vercel hobby plan limit

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    if (action === "score") {
      const scores = scoreHypotheses();
      const themeDistribution = getThemeDistribution();
      const sourceBreakdown = getSourceBreakdown();
      return NextResponse.json({ scores, themeDistribution, sourceBreakdown });
    }

    if (action === "disconfirm") {
      const scores = scoreHypotheses();
      const disconfirmation = await runDisconfirmation(scores);
      return NextResponse.json({ disconfirmation });
    }

    if (action === "executive") {
      const scores = scoreHypotheses();
      const disconfirmation = await runDisconfirmation(scores);
      const summary = await generateExecutiveSummary(scores, disconfirmation);
      return NextResponse.json({ summary, scores, disconfirmation });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Engine API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  // Quick score without Gemini — no API key needed
  const scores = scoreHypotheses();
  const themeDistribution = getThemeDistribution();
  const sourceBreakdown = getSourceBreakdown();
  return NextResponse.json({ scores, themeDistribution, sourceBreakdown, evidenceCount: 22 });
}
