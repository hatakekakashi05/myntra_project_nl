// Gemini-powered analysis: disconfirmation engine + primary research question generation
// Uses Gemini 2.5 Flash API

import { GoogleGenerativeAI } from "@google/generative-ai";
import { HypothesisScore } from "./scorer";

const MODEL = "gemini-2.5-flash";

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set in environment");
  return new GoogleGenerativeAI(apiKey);
}

export interface DisconfirmationResult {
  hypothesisId: string;
  hypothesisName: string;
  whyMightBeWrong: string[];
  alternativeExplanations: string[];
  remainingUncertainty: string;
  falsificationCriteria: string;
  primaryResearchQuestions: string[];
}

export async function runDisconfirmation(
  topHypotheses: HypothesisScore[]
): Promise<DisconfirmationResult[]> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: MODEL });

  const results: DisconfirmationResult[] = [];

  for (const hyp of topHypotheses.slice(0, 5)) {
    const supportingSummary = hyp.supportingEvidence
      .map((e) => `[${e.id}] ${e.source}: "${e.originalText}"`)
      .join("\n");

    const prompt = `
You are a skeptical PM research lead running a disconfirmation exercise.

HYPOTHESIS: ${hyp.id} — ${hyp.name}
DEFINITION: ${hyp.definition}
CONFIDENCE: ${hyp.confidenceLabel}

SUPPORTING EVIDENCE (${hyp.supportCount} records):
${supportingSummary}

CONTEXT: This hypothesis is about why Myntra users save products to Wishlist but do NOT purchase within 30 days. 
No monetary incentives are available as solutions.

Your job is to CHALLENGE this hypothesis rigorously. Respond in JSON with this exact structure:
{
  "whyMightBeWrong": ["reason 1", "reason 2", "reason 3"],
  "alternativeExplanations": ["alternative 1", "alternative 2"],
  "remainingUncertainty": "what key uncertainty remains even if evidence seems strong",
  "falsificationCriteria": "what specific primary research finding would REJECT this hypothesis",
  "primaryResearchQuestions": ["question 1 for survey", "question 2 for survey", "question 3 for survey"]
}

Rules:
- Do NOT confuse correlation with causation
- Do NOT present alternatives as the same as the hypothesis
- Questions must be neutral — do NOT reveal the hypothesis to respondents
- Questions must ask about REAL RECENT behavior, not hypothetical opinions
- Questions must be answerable by real Myntra users in a survey
`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        results.push({
          hypothesisId: hyp.id,
          hypothesisName: hyp.name,
          whyMightBeWrong: parsed.whyMightBeWrong || [],
          alternativeExplanations: parsed.alternativeExplanations || [],
          remainingUncertainty: parsed.remainingUncertainty || "",
          falsificationCriteria: parsed.falsificationCriteria || "",
          primaryResearchQuestions: parsed.primaryResearchQuestions || [],
        });
      }
    } catch (err) {
      console.error(`Disconfirmation failed for ${hyp.id}:`, err);
      results.push({
        hypothesisId: hyp.id,
        hypothesisName: hyp.name,
        whyMightBeWrong: ["API error — manual review required"],
        alternativeExplanations: [],
        remainingUncertainty: "API error",
        falsificationCriteria: "",
        primaryResearchQuestions: [],
      });
    }
  }

  return results;
}

export async function generateExecutiveSummary(
  scores: HypothesisScore[],
  disconfirmation: DisconfirmationResult[]
): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: MODEL });

  const topHyps = scores.slice(0, 5).map(
    (h) =>
      `${h.rank}. ${h.id} — ${h.name} | Support: ${h.supportCount} | Confidence: ${h.confidenceLabel} | Source Diversity: ${h.sourceDiversity} tiers`
  ).join("\n");

  const prompt = `
You are a Senior PM writing an AI Discovery Engine executive summary for an internal product research project.

PROJECT: Myntra Wishlist → Purchase Conversion
BUSINESS QUESTION: Why do Myntra users save products to Wishlist but NOT purchase within 30 days?
CONSTRAINT: No monetary incentives.

TOP 5 HYPOTHESES BY EVIDENCE STRENGTH:
${topHyps}

Write a concise (4-6 paragraph) executive summary that:
1. States the business question clearly
2. Summarizes what the evidence base shows
3. Names the leading hypothesis and why it leads (evidence quality, not just mention count)
4. Names 2 competing hypotheses that could challenge it
5. States what primary research must resolve
6. Ends with: "CURRENT LEADING HYPOTHESIS — NOT YET VALIDATED. Primary research required before any solution is selected."

Tone: rigorous, evidence-first, transparent about uncertainty. Do NOT present hypotheses as facts.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    return "Executive summary generation failed. Please check API key and retry.";
  }
}
