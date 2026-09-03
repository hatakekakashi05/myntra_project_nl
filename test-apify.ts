import { ApifyClient } from "apify-client";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function testApifyActors() {
  const client = new ApifyClient({ token: process.env.APIFY_API_KEY });
  
  console.log("Testing Apify Google Play Scraper call...");
  try {
    const run = await client.actor("apify/google-play-scraper").call({
      action: "reviews",
      appId: "com.myntra.android",
      sort: "NEWEST",
      reviewsCount: 5,
      country: "in",
      language: "en"
    }, { timeoutSecs: 30 });
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`[SUCCESS] Play Store scraped ${items.length} reviews! Sample:`, items[0]?.text?.substring(0, 60));
  } catch (err: any) {
    console.error("[FAILED] Play Store error:", err.message);
  }
}

testApifyActors();
