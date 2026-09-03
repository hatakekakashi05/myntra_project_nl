import { ApifyClient } from "apify-client";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function testActorInput() {
  const client = new ApifyClient({ token: process.env.APIFY_API_KEY });
  console.log("Calling google-play-scraper with simple input...");
  try {
    const run = await client.actor("apify/google-play-scraper").call({
      appId: "com.myntra.android",
      mode: "reviews",
      maxReviews: 10,
      country: "in",
      language: "en"
    });
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`[SUCCESS] Retrieved ${items.length} reviews.`);
    if (items.length > 0) {
      console.log("Sample:", items[0].text);
    }
  } catch (err: any) {
    console.error("[ERROR]:", err.message);
  }
}

testActorInput();
