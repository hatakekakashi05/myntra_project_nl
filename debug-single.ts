import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function debugSinglePrompt() {
  console.log("Testing single generation call...");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
  
  const start = Date.now();
  const res = await model.generateContent("Give 1 sentence why users don't buy wishlisted clothes.");
  console.log(`Finished in ${Date.now() - start}ms:`, res.response.text());
}

debugSinglePrompt();
