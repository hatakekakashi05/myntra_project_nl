import { ApifyClient } from "apify-client";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function testNeatrat3() {
  const client = new ApifyClient({ token: process.env.APIFY_API_KEY });
  try {
    const run = await client.actor("neatrat/google-play-store-reviews-scraper").call({
      appIdOrUrl: "com.myntra.android",
      maxReviews: 5,
      language: ["en"],
      country: "in"
    });
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`[SUCCESS] Neatrat retrieved ${items.length} reviews!`);
    if (items.length > 0) {
      console.log("Sample:", items[0].text || items[0].content);
    }
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

testNeatrat3();
