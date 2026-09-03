import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApifyClient } from "apify-client";
import fs from "fs";

// Simple env loader
const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function testKeys() {
  console.log("Testing Gemini API Key...");
  const geminiKey = process.env.GEMINI_API_KEY;
  console.log("Gemini Key prefix:", geminiKey ? geminiKey.substring(0, 10) + "..." : "NONE");

  const testModels = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"];
  for (const m of testModels) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey || "");
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("Hello, write one word.");
      console.log(`[SUCCESS] ${m} responded:`, res.response.text().trim());
    } catch (err: any) {
      console.log(`[FAILED] ${m}:`, err.message);
    }
  }

  console.log("\nTesting Apify Client Key...");
  const apifyKey = process.env.APIFY_API_KEY;
  console.log("Apify Key prefix:", apifyKey ? apifyKey.substring(0, 15) + "..." : "NONE");
  try {
    const client = new ApifyClient({ token: apifyKey });
    const user = await client.user().get();
    console.log("[SUCCESS] Apify connected as user:", user ? user.username : "unknown");
  } catch (err: any) {
    console.log("[FAILED] Apify error:", err.message);
  }
}

testKeys();
