import { NextResponse } from "next/server";
import { getFeedSnapshot } from "../../../lib/feeds";
import { digestDay, renderDailyDigest, selectDailyStories } from "../../../lib/daily-digest";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getFeedSnapshot();
  const now = new Date();
  const stories = selectDailyStories(snapshot.signals, now.getTime());
  if (!stories.length) {
    return new NextResponse("No recent AI stories are available for the newsletter preview.", {
      status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" }
    });
  }
  return new NextResponse(renderDailyDigest(stories, digestDay(now), true), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}
