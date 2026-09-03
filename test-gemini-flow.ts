import { scoreHypotheses } from "./lib/scorer";
import { runDisconfirmation, generateExecutiveSummary } from "./lib/gemini-engine";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function testFullGeminiFlow() {
  console.log("Running scoreHypotheses()...");
  const scores = scoreHypotheses();
  console.log(`Scored ${scores.length} hypotheses.`);
  console.log(`Top 1: ${scores[0].id} - ${scores[0].name} (Score rank #${scores[0].rank})`);

  console.log("\nRunning runDisconfirmation()...");
  const disconf = await runDisconfirmation(scores);
  console.log(`Generated disconfirmation for ${disconf.length} hypotheses.`);
  if (disconf.length > 0) {
    console.log("Sample whyMightBeWrong for", disconf[0].hypothesisId, ":", disconf[0].whyMightBeWrong);
    console.log("Sample research questions:", disconf[0].primaryResearchQuestions);
  }

  console.log("\nRunning generateExecutiveSummary()...");
  const summary = await generateExecutiveSummary(scores, disconf);
  console.log("\n--- EXECUTIVE SUMMARY OUTPUT ---\n");
  console.log(summary.substring(0, 350) + "...\n");
  console.log("Gemini end-to-end test passed!");
}

testFullGeminiFlow();
