import { ApifyClient } from "apify-client";
import fs from "fs";

// Load environment variables
const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function debugApifyLive() {
  const apiKey = process.env.APIFY_API_KEY;
  console.log("Using API Key prefix:", apiKey ? apiKey.substring(0, 12) + "..." : "NONE");
  const client = new ApifyClient({ token: apiKey });

  console.log("\n--- TEST 1: Play Store Reviews Scraper (neatrat) ---");
  try {
    const run = await client.actor("neatrat/google-play-store-reviews-scraper").call({
      appIdOrUrl: "com.myntra.android",
      maxReviews: 10,
      language: ["en"],
      country: "in"
    });
    console.log("Run finished, ID:", run.id, "Status:", run.status);
    const dataset = await client.run(run.id).dataset();
    const { items } = await dataset.listItems();
    console.log(`Retrieved ${items.length} items from dataset.`);
    if (items.length > 0) {
      console.log("First item keys:", Object.keys(items[0]));
      console.log("Sample text:", items[0].body || items[0].text || items[0].content);
    }
  } catch (err: any) {
    console.error("Play Store Scraper Error:", err.message);
  }
}

debugApifyLive();
