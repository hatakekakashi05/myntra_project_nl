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

export interface ClassifiedReview extends ScrapedReview {
  themes: string[];
  evidenceClass: string;
  hypothesesSupported: string[];
  wishlistRelevance: "direct" | "indirect" | "none";
  sentiment: "positive" | "negative" | "neutral";
  keyQuote: string;
}

// --- PLAY STORE SCRAPER USING NEATRAT ACTOR ---
export async function scrapePlayStoreReviews(): Promise<ScrapedReview[]> {
  const client = getApifyClient();
  console.log("Starting Play Store scrape for Myntra via neatrat actor...");
  
  const run = await client.actor("neatrat/google-play-store-reviews-scraper").call({
    appIdOrUrl: "com.myntra.android",
    maxReviews: 25,
    language: ["en"],
    country: "in",
  });

  const dataset = await client.run(run.id).dataset();
  const { items } = await dataset.listItems();
  console.log(`Neatrat raw items fetched: ${items.length}`);

  const reviews: ScrapedReview[] = [];
  for (const item of items) {
    const body = (item.body as string) || (item.text as string) || (item.content as string) || "";
    if (body.length > 5) {
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

export async function classifyReviewsWithGemini(
  reviews: ScrapedReview[]
): Promise<ClassifiedReview[]> {
  const geminiKey = process.env.GEMINI_API_KEY;

  // If no Gemini key or reviews empty, return with clean default heuristic classification immediately
  if (!geminiKey || reviews.length === 0) {
    return fallbackClassify(reviews);
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    // Process all reviews in a single prompt for speed and zero timeout
    const prompt = `
You are analyzing user feedback on fashion shopping for Myntra.
Classify each review for research on Wishlist-to-Purchase conversion.

For each item below, produce a JSON object with:
- "index": index number (0 to ${reviews.length - 1})
- "themes": array from [SALE, PRICE, FIT, SIZE, QUALITY, ALT, OCCASION, INTENT, FORGET, OVERLOAD, INFO, AVAIL, TRUST, SOCIAL, OTHER]
- "evidenceClass": "USER-REPORTED EVIDENCE"
- "hypothesesSupported": array from [H1, H2, H3, H4, H5, H6, H7, H8, H9, H10, H11, H12, H13]
- "wishlistRelevance": "direct" if review mentions saving, price change, wishlist, or cart delay; else "indirect"
- "sentiment": "positive", "negative", or "neutral"
- "keyQuote": 1 concise sentence summarizing the main shopper blocker in their own words

Reviews:
${reviews.map((r, idx) => `[${idx}] "${r.text}"`).join("\n\n")}

Respond ONLY with valid JSON array of objects.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      const classified: ClassifiedReview[] = [];
      for (const item of parsed) {
        if (reviews[item.index]) {
          classified.push({
            ...reviews[item.index],
            themes: item.themes || ["PRICE"],
            evidenceClass: item.evidenceClass || "USER-REPORTED EVIDENCE",
            hypothesesSupported: item.hypothesesSupported || ["H1", "H2"],
            wishlistRelevance: item.wishlistRelevance || "indirect",
            sentiment: item.sentiment || "neutral",
            keyQuote: item.keyQuote || reviews[item.index].text.slice(0, 100),
          });
        }
      }
      if (classified.length > 0) return classified;
    }
  } catch (err: any) {
    console.error("Gemini classification failed, using heuristic fallback:", err.message);
  }

  return fallbackClassify(reviews);
}

function fallbackClassify(reviews: ScrapedReview[]): ClassifiedReview[] {
  return reviews.map((r) => {
    const textLower = r.text.toLowerCase();
    const themes: string[] = [];
    const hypotheses: string[] = [];

    if (textLower.includes("price") || textLower.includes("expensive") || textLower.includes("cost")) {
      themes.push("PRICE");
      hypotheses.push("H2");
    }
    if (textLower.includes("sale") || textLower.includes("discount") || textLower.includes("offer")) {
      themes.push("SALE");
      hypotheses.push("H1");
    }
    if (textLower.includes("size") || textLower.includes("fit")) {
      themes.push("FIT", "SIZE");
      hypotheses.push("H3");
    }
    if (textLower.includes("quality") || textLower.includes("cloth") || textLower.includes("material")) {
      themes.push("QUALITY");
      hypotheses.push("H4");
    }
    if (textLower.includes("stock") || textLower.includes("unavailable")) {
      themes.push("AVAIL");
      hypotheses.push("H9");
    }
    if (themes.length === 0) {
      themes.push("PRICE", "INFO");
      hypotheses.push("H11");
    }

    return {
      ...r,
      themes,
      evidenceClass: "USER-REPORTED EVIDENCE",
      hypothesesSupported: hypotheses,
      wishlistRelevance: (textLower.includes("wishlist") || textLower.includes("saved") || textLower.includes("later")) ? "direct" : "indirect",
      sentiment: (r.rating && r.rating <= 2) ? "negative" : "neutral",
      keyQuote: r.text.slice(0, 120),
    };
  });
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
