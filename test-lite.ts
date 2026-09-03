import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function testFastModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const list = ["gemini-2.5-flash-lite", "gemini-3.5-flash-lite", "gemini-flash-latest"];
  for (const m of list) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("Say OK");
      console.log(`[STABLE SUCCESS] ${m}:`, res.response.text().trim());
      return m;
    } catch (e: any) {
      console.log(`[FAIL] ${m}:`, e.message);
    }
  }
}

testFastModels();
