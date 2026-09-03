import { NextRequest, NextResponse } from "next/server";
import { runFullScrape } from "@/lib/apify-scraper";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apifyKey = process.env.APIFY_API_KEY;
  if (!apifyKey) {
    return NextResponse.json(
      { error: "APIFY_API_KEY environment variable is missing on Vercel" },
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
  } catch (error: any) {
    console.error("Vercel Scrape Route Error:", error);
    return NextResponse.json({ 
      error: error?.message || "Scrape failed",
      stack: error?.stack,
      success: false 
    }, { status: 500 });
  }
}

export async function GET() {
  const hasApify = !!process.env.APIFY_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  return NextResponse.json({
    status: "ready",
    hasApifyKey: hasApify,
    hasGeminiKey: hasGemini,
    apifyKeyPrefix: hasApify ? process.env.APIFY_API_KEY?.substring(0, 10) + "..." : null,
  });
}
