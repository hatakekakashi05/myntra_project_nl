import { ApifyClient } from "apify-client";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function runAndPrint() {
  const client = new ApifyClient({ token: process.env.APIFY_API_KEY });
  const run = await client.actor("neatrat/google-play-store-reviews-scraper").call({
    appIdOrUrl: "com.myntra.android",
    maxReviews: 2,
    language: ["en"]
  });
  const dataset = await client.run(run.id).dataset();
  const { items } = await dataset.listItems();
  console.log("Found items:", items.length);
  console.log("Full Item 0:", JSON.stringify(items[0], null, 2));
}

runAndPrint();
