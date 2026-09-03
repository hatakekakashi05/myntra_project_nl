import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function testGemini36() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const models = ["gemini-3.6-flash", "gemini-1.5-pro", "gemini-pro"];
  
  for (const m of models) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey || "");
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("Say hello in one word.");
      console.log(`[SUCCESS] ${m} responded:`, res.response.text().trim());
      return m;
    } catch (err: any) {
      console.log(`[FAILED] ${m}:`, err.message);
    }
  }
}

testGemini36();
