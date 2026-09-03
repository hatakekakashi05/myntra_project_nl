import { ApifyClient } from "apify-client";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function inspectNeatratItems() {
  const client = new ApifyClient({ token: process.env.APIFY_API_KEY });
  const dataset = client.dataset("CrK2vtcL6priLgBa1"); // from the previous run
  const { items } = await dataset.listItems();
  console.log("Sample keys:", Object.keys(items[0] || {}));
  console.log("Review item:", items[0]);
}

inspectNeatratItems();
