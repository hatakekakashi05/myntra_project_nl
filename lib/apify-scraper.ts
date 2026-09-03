// Apify scraping layer — collects real user reviews from Play Store and Reddit
// Targets: Myntra app reviews (Play Store) + Reddit fashion/shopping discussions

import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_API_KEY });

export interface ScrapedReview {
  source: "play_store" | "reddit" | "app_store";
  date: string;
  text: string;
  rating?: number;
  author?: string;
  url?: string;
  subreddit?: string;
}

// Keywords that make a review relevant to wishlist/purchase decision
const WISHLIST_KEYWORDS = [
  "wishlist", "wish list", "saved", "save for later", "heart", "liked",
  "waiting for sale", "price drop", "discount", "size", "fit", "quality",
  "didn't buy", "not buying", "didn't purchase", "never bought",
  "price went up", "out of stock", "unavailable", "EORS", "end of reason",
  "comparing", "flipkart", "ajio", "amazon", "forgot", "overload",
  "too expensive", "can't afford", "reviews", "material", "return",
];

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return WISHLIST_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

// --- PLAY STORE SCRAPER ---
export async function scrapePlayStoreReviews(): Promise<ScrapedReview[]> {
  try {
    console.log("Starting Play Store scrape for Myntra reviews...");
    const run = await client.actor("apify/google-play-scraper").call({
      queries: ["Myntra"],
      country: "in",
      language: "en",
      category: "SHOPPING",
      limit: 3, // limit apps
    });

    // Get reviews separately using the reviews actor
    const reviewRun = await client.actor("apify/google-play-scraper").call({
      action: "reviews",
      appId: "com.myntra.android",
      sort: "NEWEST",
      reviewsCount: 200,
      country: "in",
      language: "en",
    });

    const { items } = await client.dataset(reviewRun.defaultDatasetId).listItems();

    const reviews: ScrapedReview[] = [];
    for (const item of items) {
      const text = (item.text as string) || "";
      if (text.length > 20 && isRelevant(text)) {
        reviews.push({
          source: "play_store",
          date: (item.at as string) || new Date().toISOString(),
          text: text.slice(0, 1000),
          rating: item.score as number,
          author: item.userName as string,
          url: `https://play.google.com/store/apps/details?id=com.myntra.android`,
        });
      }
    }
    console.log(`Play Store: found ${reviews.length} relevant reviews`);
    return reviews;
  } catch (err) {
    console.error("Play Store scrape failed:", err);
    return [];
  }
}

// --- REDDIT SCRAPER ---
export async function scrapeReddit(): Promise<ScrapedReview[]> {
  try {
    console.log("Starting Reddit scrape...");
    const searchQueries = [
      "Myntra wishlist",
      "Myntra price drop waiting",
      "Myntra sale EORS wishlist",
      "Myntra size unavailable",
      "Myntra vs Ajio",
      "saved items Myntra",
    ];

    const allResults: ScrapedReview[] = [];

    for (const query of searchQueries) {
      try {
        const run = await client.actor("trudax/reddit-scraper").call({
          searches: [query],
          type: "posts",
          maxComments: 20,
          maxPostCount: 10,
          proxy: { useApifyProxy: true },
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        for (const item of items) {
          const text = ((item.body as string) || (item.title as string) || "");
          if (text.length > 15 && isRelevant(text)) {
            allResults.push({
              source: "reddit",
              date: item.createdAt
                ? new Date((item.createdAt as number) * 1000).toISOString()
                : new Date().toISOString(),
              text: text.slice(0, 1000),
              author: item.author as string,
              url: item.url as string,
              subreddit: item.subreddit as string,
            });
          }
          // Also scrape comments
          if (item.comments && Array.isArray(item.comments)) {
            for (const comment of item.comments as Record<string, unknown>[]) {
              const cText = (comment.body as string) || "";
              if (cText.length > 15 && isRelevant(cText)) {
                allResults.push({
                  source: "reddit",
                  date: new Date().toISOString(),
                  text: cText.slice(0, 500),
                  author: comment.author as string,
                  url: item.url as string,
                  subreddit: item.subreddit as string,
                });
              }
            }
          }
        }
      } catch (queryErr) {
        console.error(`Reddit query "${query}" failed:`, queryErr);
      }
    }

    console.log(`Reddit: found ${allResults.length} relevant posts/comments`);
    return allResults;
  } catch (err) {
    console.error("Reddit scrape failed:", err);
    return [];
  }
}

// --- CLASSIFY WITH GEMINI ---
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  if (!process.env.GEMINI_API_KEY || reviews.length === 0) return [];

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const classified: ClassifiedReview[] = [];

  // Process in batches of 10
  const batchSize = 10;
  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize);
    const prompt = `
You are classifying user reviews/posts for a product research study on Myntra Wishlist → Purchase conversion.

For each review below, output a JSON array where each item has:
- "index": the review index (0-based)
- "themes": array of codes from [SALE, PRICE, FIT, SIZE, QUALITY, ALT, OCCASION, INTENT, FORGET, OVERLOAD, INFO, AVAIL, TRUST, SOCIAL, OTHER]
- "evidenceClass": one of [USER-REPORTED EVIDENCE, OBSERVATION, FACT]
- "hypothesesSupported": array from [H1, H2, H3, H4, H5, H6, H7, H8, H9, H10, H11, H12, H13]
  H1=Sale waiting, H2=Price too high, H3=Fit uncertainty, H4=Quality uncertainty, H5=Alternatives,
  H6=Occasion/timing, H7=Intent decay, H8=Wishlist as bookmark, H9=OOS/availability,
  H10=Decision overload, H11=Information gap (no alerts), H12=Social validation, H13=Dynamic pricing trust
- "wishlistRelevance": "direct", "indirect", or "none"
- "sentiment": "positive", "negative", or "neutral"
- "keyQuote": the most relevant 1-sentence extract (verbatim, max 100 chars)

If a review is not relevant to wishlist/purchase behavior, set wishlistRelevance to "none" and themes to ["OTHER"].

REVIEWS:
${batch.map((r, idx) => `[${idx}] "${r.text}"`).join("\n\n")}

Respond ONLY with a valid JSON array, no other text.
`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        for (const item of parsed) {
          if (item.wishlistRelevance !== "none") {
            classified.push({
              ...batch[item.index],
              themes: item.themes || [],
              evidenceClass: item.evidenceClass || "USER-REPORTED EVIDENCE",
              hypothesesSupported: item.hypothesesSupported || [],
              wishlistRelevance: item.wishlistRelevance || "indirect",
              sentiment: item.sentiment || "neutral",
              keyQuote: item.keyQuote || batch[item.index].text.slice(0, 100),
            });
          }
        }
      }
    } catch (err) {
      console.error(`Batch ${i / batchSize} classification failed:`, err);
    }
  }

  return classified;
}

export async function runFullScrape(): Promise<{
  playStore: ClassifiedReview[];
  reddit: ClassifiedReview[];
  total: number;
  relevantCount: number;
}> {
  const [playStoreRaw, redditRaw] = await Promise.all([
    scrapePlayStoreReviews(),
    scrapeReddit(),
  ]);

  const [playStoreClassified, redditClassified] = await Promise.all([
    classifyReviewsWithGemini(playStoreRaw),
    classifyReviewsWithGemini(redditRaw),
  ]);

  return {
    playStore: playStoreClassified,
    reddit: redditClassified,
    total: playStoreRaw.length + redditRaw.length,
    relevantCount: playStoreClassified.length + redditClassified.length,
  };
}
