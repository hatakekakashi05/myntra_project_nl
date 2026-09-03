import { ApifyClient } from "apify-client";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function findStoreActors() {
  const client = new ApifyClient({ token: process.env.APIFY_API_KEY });
  const store = await client.store().list({ search: "play store reviews", limit: 5 });
  console.log("Store results:");
  for (const item of store.items) {
    console.log(`- ${item.username}/${item.name}: ${item.title}`);
  }
}

findStoreActors();
