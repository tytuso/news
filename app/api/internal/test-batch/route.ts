import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getFeedSnapshot } from "../../../../lib/feeds";
import { selectDailyStories, renderDailyDigest, digestDay } from "../../../../lib/daily-digest";
import { brevo, newsletterUnsubscribeUrl } from "../../../../lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TO = "opiotitus333@gmail.com";
const TEST_EXPIRES = Date.parse("2026-10-18T01:00:00Z");
export async function GET(request: NextRequest) {
  const secret = process.env.NILESIGNAL_BATCH_TEST_TOKEN || "";
  const got = request.nextUrl.searchParams.get("token") || "";
  const a = Buffer.from(secret), b = Buffer.from(got);
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b))
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  if (Date.now() > TEST_EXPIRES)
    return NextResponse.json({ status: "expired" }, { status: 410 });
  try {
    const stories = selectDailyStories((await getFeedSnapshot()).signals);
    if (!stories.length) return NextResponse.json({ status: "no_recent_stories" }, { status: 503 });
    const response = await brevo("/smtp/email", "POST", {
      sender: { name: "NileSignal", email: process.env.BREVO_FROM_EMAIL },
      subject: "[BATCH TEST] NileSignal Daily — " + stories.length + " AI stories",
      htmlContent: renderDailyDigest(stories, digestDay()),
      messageVersions: [{
        to: [{ email: TO }],
        params: { FIRST_NAME: "Titus", UNSUBSCRIBE_URL: newsletterUnsubscribeUrl(TO) }
      }],
      headers: { idempotencyKey: "a59bc316-7e87-4205-987f-f23759781429" },
      tags: ["nilesignal-batch-test-oct17"]
    }) as { messageIds?: string[]; messageId?: string };
    return NextResponse.json({
      status: "brevo_response",
      recipient: TO,
      stories: stories.length,
      count: response.messageIds?.length || (response.messageId ? 1 : 0),
      accepted: Boolean(response.messageIds?.length || response.messageId),
      messageIds: response.messageIds || (response.messageId ? [response.messageId] : [])
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "test_failed_review_provider_logs" }, { status: 503 });
  }
}
