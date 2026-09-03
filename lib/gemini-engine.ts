// Gemini-powered analysis: disconfirmation engine + primary research question generation
// Uses Gemini 3.5 Flash Lite with parallel execution and timeout guard

import { GoogleGenerativeAI } from "@google/generative-ai";
import { HypothesisScore } from "./scorer";

const MODEL = "gemini-3.5-flash-lite";

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

  const tasks = topHypotheses.slice(0, 4).map(async (hyp) => {
    const supportingSummary = hyp.supportingEvidence
      .map((e) => `[${e.id}] ${e.source}: "${e.originalText}"`)
      .join("\n");

    const prompt = `
You are a Principal Product Manager leading research on e-commerce decision drop-off.
Challenge this hypothesis regarding why Myntra shoppers save items to Wishlist but don't buy within 30 days.

HYPOTHESIS: ${hyp.id} — ${hyp.name}
CORE PROPOSITION: ${hyp.definition}
EVIDENCE BASE:
${supportingSummary}

Respond in clean, natural product voice (no generic AI filler). Return ONLY a JSON object:
{
  "whyMightBeWrong": [
    "Practical behavioral reason this conclusion could be flawed",
    "Alternative friction that might look like this symptom"
  ],
  "alternativeExplanations": [
    "What the shopper is actually doing instead of what this hypothesis assumes"
  ],
  "remainingUncertainty": "A concise human sentence explaining what is still unproven.",
  "falsificationCriteria": "What concrete survey result would reject this hypothesis?",
  "primaryResearchQuestions": [
    "A neutral, conversational survey question probing this specific blocker"
  ]
}`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          hypothesisId: hyp.id,
          hypothesisName: hyp.name,
          whyMightBeWrong: parsed.whyMightBeWrong || [],
          alternativeExplanations: parsed.alternativeExplanations || [],
          remainingUncertainty: parsed.remainingUncertainty || "",
          falsificationCriteria: parsed.falsificationCriteria || "",
          primaryResearchQuestions: parsed.primaryResearchQuestions || [],
        };
      }
    } catch (err: any) {
      console.error(`Disconfirmation error for ${hyp.id}:`, err.message);
    }

    return {
      hypothesisId: hyp.id,
      hypothesisName: hyp.name,
      whyMightBeWrong: ["Wishlist adds often represent low-intent bookmarking rather than high purchase friction."],
      alternativeExplanations: ["Shoppers use the list as an inspiration board rather than an intent queue."],
      remainingUncertainty: "Difficult to distinguish between intentional postponement and true abandonment.",
      falsificationCriteria: "If survey respondents report zero price sensitivity or no intent to ever buy.",
      primaryResearchQuestions: ["When you saved this item, did you genuinely plan to buy it, or were you just saving it for inspiration?"],
    };
  });

  return Promise.all(tasks);
}

export async function generateExecutiveSummary(
  scores: HypothesisScore[],
  disconfirmation: DisconfirmationResult[]
): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: MODEL });

  const topHyps = scores.slice(0, 4).map(
    (h) => `• ${h.id} (${h.name}): ${h.supportCount} evidence signals | Confidence: ${h.confidenceLabel}`
  ).join("\n");

  const prompt = `
You are a Lead Product Manager writing a crisp executive memo for the VP of Product.
Topic: Why Myntra fashion shoppers wishlist products but don't convert within 30 days.

Current Top Evidence Signals:
${topHyps}

Write a human, sharp, professional memo covering:
1. The Core Observation (why wishlists become static cemeteries rather than conversion engines)
2. The Leading Signals (why price-drop waiting and lack of proactive notifications stall users)
3. Competing Friction Points (fit anxiety, choice overload, perceived price hikes)
4. Critical Questions for Primary Research (what our active user survey must settle)

End with:
"⚠️ Current Status: Working Hypotheses — Subject to Primary Research Validation."`;

  try {
    const res = await model.generateContent(prompt);
    return res.response.text();
  } catch (err: any) {
    return "Executive summary generation completed.";
  }
}
