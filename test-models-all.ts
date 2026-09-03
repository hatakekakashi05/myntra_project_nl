import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function testWorkingModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const candidates = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.5-pro",
    "gemini-3-flash",
    "gemini-3.6-flash"
  ];

  for (const m of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("Quick test: reply OK");
      console.log(`[AVAILABLE & RESPONDING] ${m}:`, res.response.text().trim());
    } catch (err: any) {
      console.log(`[UNAVAILABLE] ${m}:`, err.message.substring(0, 100));
    }
  }
}

testWorkingModels();
