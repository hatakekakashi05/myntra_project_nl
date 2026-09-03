import { NextRequest, NextResponse } from "next/server";
import { runFullScrape } from "@/lib/apify-scraper";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apifyKey = process.env.APIFY_API_KEY;
  if (!apifyKey) {
    return NextResponse.json(
      { error: "APIFY_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const result = await runFullScrape();
    return NextResponse.json({
      success: true,
      total: result.total,
      relevantCount: result.relevantCount,
      playStore: result.playStore,
      reddit: result.reddit,
      message: `Scraped ${result.total} items, ${result.relevantCount} relevant to wishlist behavior`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Scrape failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ready",
    actors: [
      "apify/google-play-scraper (Myntra app, IN store, 200 reviews)",
      "trudax/reddit-scraper (6 queries across fashion/shopping subs)",
    ],
    keywordsFiltered: true,
    geminiClassification: !!process.env.GEMINI_API_KEY,
  });
}
