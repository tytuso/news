import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getFeedSnapshot } from "../../../../lib/feeds";
import { digestDay, renderDailyDigest, selectDailyStories } from "../../../../lib/daily-digest";
import { brevo, brevoListId } from "../../../../lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TEST_EMAIL = "opiotitus333@gmail.com";
const TEST_CAMPAIGN = "NileSignal INTERNAL TEST 2026-10-14 Top 10";
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
    // Never use sendNow: this test only targets the one address below.
    const recentCampaigns = await brevo("/emailCampaigns?type=classic&limit=100&offset=0") as {
      campaigns?: Array<{ id: number; name: string }>
    };
    const existing = recentCampaigns.campaigns?.find((item) => item.name === TEST_CAMPAIGN);
    if (existing) {
      return NextResponse.json({ status: "already_attempted", campaignId: existing.id });
    }

    const { signals } = await getFeedSnapshot();
    const stories = selectDailyStories(signals);
    if (stories.length < 1) {
      return NextResponse.json({ status: "no_recent_stories" }, { status: 503 });
    }

    const day = digestDay();
    const campaign = await brevo("/emailCampaigns", "POST", {
      name: TEST_CAMPAIGN,
      type: "classic",
      subject: "[TEST] NileSignal Daily — " + stories.length + " important AI stories",
      sender: { name: "NileSignal", email: process.env.BREVO_FROM_EMAIL },
      recipients: { listIds: [brevoListId()] },
      htmlContent: renderDailyDigest(stories, day),
      previewText: "Test of the NileSignal top stories briefing — not the daily send",
      tag: "NileSignal Testing"
    }) as { id?: number };

    if (!Number.isSafeInteger(campaign.id) || !campaign.id) {
      throw new Error("Draft was not created");
    }

    // Brevo explicitly supports sendTest to a specified emailTo array. No mailing list blast.
    await brevo("/emailCampaigns/" + campaign.id + "/sendTest", "POST", {
      emailTo: [TEST_EMAIL]
    });

    return NextResponse.json({
      status: "test_accepted_by_brevo",
      campaignId: campaign.id,
      recipient: TEST_EMAIL,
      stories: stories.length,
      note: "Brevo accepted the test. Inbox delivery is not yet confirmed."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({
      status: "test_failed",
      note: "The test was not confirmed successful. Check the Brevo campaign draft and logs."
    }, { status: 503 });
  }
}
