import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function listAllModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.models) {
    console.log("AVAILABLE MODELS FOR THIS KEY:");
    for (const m of data.models) {
      if (m.supportedGenerationMethods?.includes("generateContent")) {
        console.log(`- ${m.name.replace("models/", "")} (${m.displayName})`);
      }
    }
  } else {
    console.log("Error or response:", JSON.stringify(data));
  }
}

listAllModels();
