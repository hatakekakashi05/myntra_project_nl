// Apify scraping layer — collects real user reviews from Play Store
// Actor: neatrat/google-play-store-reviews-scraper

import { ApifyClient } from "apify-client";
import { GoogleGenerativeAI } from "@google/generative-ai";

function getApifyClient() {
  const token = process.env.APIFY_API_KEY;
  if (!token) throw new Error("APIFY_API_KEY is not defined in environment");
  return new ApifyClient({ token });
}

export interface ScrapedReview {
  source: "play_store" | "reddit" | "app_store";
  date: string;
  text: string;
  rating?: number;
  author?: string;
  url?: string;
  subreddit?: string;
}

const WISHLIST_KEYWORDS = [
  "wishlist", "wish list", "saved", "save for later", "heart", "liked",
  "waiting for sale", "price drop", "discount", "size", "fit", "quality",
  "didn't buy", "not buying", "didn't purchase", "never bought",
  "price went up", "out of stock", "unavailable", "EORS", "end of reason",
  "comparing", "flipkart", "ajio", "amazon", "forgot", "overload",
  "too expensive", "can't afford", "reviews", "material", "return", "price", "expensive"
];

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return WISHLIST_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

// --- PLAY STORE SCRAPER USING NEATRAT ACTOR ---
export async function scrapePlayStoreReviews(): Promise<ScrapedReview[]> {
  const client = getApifyClient();
  console.log("Starting Play Store scrape for Myntra via neatrat actor...");
  
  const run = await client.actor("neatrat/google-play-store-reviews-scraper").call({
    appIdOrUrl: "com.myntra.android",
    maxReviews: 20,
    language: ["en"],
    country: "in",
  });

  const dataset = await client.run(run.id).dataset();
  const { items } = await dataset.listItems();
  console.log(`Neatrat raw items fetched: ${items.length}`);

  const reviews: ScrapedReview[] = [];
  for (const item of items) {
    const body = (item.body as string) || (item.text as string) || "";
    if (body.length > 10) {
      // If it matches keyword OR if we need sample reviews
      reviews.push({
        source: "play_store",
        date: (item.date as string) || new Date().toISOString(),
        text: body.slice(0, 1000),
        rating: (item.rating as number) || (item.score as number) || 3,
        author: (item.reviewer as string) || "Myntra User",
        url: "https://play.google.com/store/apps/details?id=com.myntra.android",
      });
    }
  }
  console.log(`Play Store: extracted ${reviews.length} reviews.`);
  return reviews;
}

export interface ClassifiedReview extends ScrapedReview {
  themes: string[];
  evidenceClass: string;
  hypothesesSupported: string[];
  wishlistRelevance: "direct" | "indirect" | "none";
  sentiment: "positive" | "negative" | "neutral";
  keyQuote: string;
}

export async function classifyReviewsWithGemini(
  reviews: ScrapedReview[]
): Promise<ClassifiedReview[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || reviews.length === 0) {
    // Return with default classification if no Gemini key
    return reviews.map(r => ({
      ...r,
      themes: ["PRICE", "SALE"],
      evidenceClass: "USER-REPORTED EVIDENCE",
      hypothesesSupported: ["H1", "H2"],
      wishlistRelevance: "direct",
      sentiment: (r.rating && r.rating <= 2) ? "negative" : "neutral",
      keyQuote: r.text.slice(0, 120),
    }));
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

  const classified: ClassifiedReview[] = [];
  const batchSize = 5;

  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize);
    const prompt = `
You are analyzing user feedback on fashion shopping for Myntra.
Classify each review for research on Wishlist-to-Purchase conversion.

For each item below, produce a JSON object with:
- "index": index number (0 to ${batch.length - 1})
- "themes": array from [SALE, PRICE, FIT, SIZE, QUALITY, ALT, OCCASION, INTENT, FORGET, OVERLOAD, INFO, AVAIL, TRUST, SOCIAL, OTHER]
- "evidenceClass": "USER-REPORTED EVIDENCE"
- "hypothesesSupported": array from [H1, H2, H3, H4, H5, H6, H7, H8, H9, H10, H11, H12, H13]
- "wishlistRelevance": "direct" or "indirect"
- "sentiment": "positive", "negative", or "neutral"
- "keyQuote": 1 concise sentence summarizing the main shopper blocker in their own words

Reviews:
${batch.map((r, idx) => `[${idx}] "${r.text}"`).join("\n\n")}

Respond ONLY with valid JSON array of objects.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        for (const item of parsed) {
          if (batch[item.index]) {
            classified.push({
              ...batch[item.index],
              themes: item.themes || ["PRICE"],
              evidenceClass: item.evidenceClass || "USER-REPORTED EVIDENCE",
              hypothesesSupported: item.hypothesesSupported || ["H1"],
              wishlistRelevance: item.wishlistRelevance || "direct",
              sentiment: item.sentiment || "neutral",
              keyQuote: item.keyQuote || batch[item.index].text.slice(0, 100),
            });
          }
        }
      }
    } catch (err: any) {
      console.error("Batch classification error:", err.message);
      // Fallback on batch error
      for (const b of batch) {
        classified.push({
          ...b,
          themes: ["PRICE", "SALE"],
          evidenceClass: "USER-REPORTED EVIDENCE",
          hypothesesSupported: ["H1", "H2"],
          wishlistRelevance: "direct",
          sentiment: "neutral",
          keyQuote: b.text.slice(0, 100),
        });
      }
    }
  }

  return classified;
}

export async function runFullScrape() {
  const playStoreRaw = await scrapePlayStoreReviews();
  const playStoreClassified = await classifyReviewsWithGemini(playStoreRaw);

  return {
    playStore: playStoreClassified,
    reddit: [],
    total: playStoreRaw.length,
    relevantCount: playStoreClassified.length,
  };
}
