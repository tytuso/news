import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getFeedSnapshot } from "../../../../lib/feeds";
import { digestDay, renderDailyDigest, selectDailyStories } from "../../../../lib/daily-digest";
import { brevo } from "../../../../lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TEST_EMAIL = "opiotitus333@gmail.com";
const EXPIRES_AT = Date.parse("2026-10-15T00:00:00Z");

export async function GET(request: NextRequest) {
  const actual = request.nextUrl.searchParams.get("token") || "";
  const secret = process.env.NILESIGNAL_TEST_TOKEN || "";
  const a = Buffer.from(actual);
  const b = Buffer.from(secret);

  if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (Date.now() > EXPIRES_AT) {
    return NextResponse.json({ error: "Testing has expired" }, { status: 410 });
  }

  try {
    // This is a single-recipient transactional test, not a campaign broadcast.
    const { signals } = await getFeedSnapshot();
    const stories = selectDailyStories(signals);
    if (stories.length < 1) {
      return NextResponse.json({ status: "no_recent_stories" }, { status: 503 });
    }

    const result = await brevo("/smtp/email", "POST", {
      sender: { name: "NileSignal", email: process.env.BREVO_FROM_EMAIL },
      to: [{ email: TEST_EMAIL, name: "NileSignal tester" }],
      subject: "[TEST] NileSignal Daily — " + stories.length + " important AI stories",
      htmlContent: renderDailyDigest(stories, digestDay(), true),
      tags: ["nilesignal-top10-test"]
    }) as { messageId?: string };

    if (!result.messageId) throw new Error("No messageId from provider");
    return NextResponse.json({
      status: "test_accepted_by_brevo",
      recipient: TEST_EMAIL,
      stories: stories.length,
      messageId: result.messageId,
      note: "Brevo accepted one test email. Delivery will be verified separately."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({
      status: "test_failed",
      note: "The test was not confirmed successful. Check the Brevo campaign draft and logs."
    }, { status: 503 });
  }
}
