import { NextRequest, NextResponse } from "next/server";
import { getFeedSnapshot } from "../../../../lib/feeds";
import { digestDay, renderDailyDigest, selectDailyStories } from "../../../../lib/daily-digest";
import { brevo, brevoListId, MAX_FREE_SUBSCRIBERS, memberCount, newsletterConfigured } from "../../../../lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Vercel Cron is authorized using its CRON_SECRET header, never a public URL.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!newsletterConfigured()) return NextResponse.json({ status: "not_configured" }, { status: 503 });

  try {
    const now = new Date();
    const dayKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Kampala", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(now);
    const campaignName = "NileSignal Daily " + dayKey;
    const recipientCount = await memberCount();
    if (recipientCount === 0) return NextResponse.json({ status: "no_subscribers" });
    if (recipientCount > MAX_FREE_SUBSCRIBERS) {
      return NextResponse.json({ status: "list_over_free_limit", recipients: recipientCount }, { status: 409 });
    }

    // Recheck recent campaigns so scheduled retries don't send duplicates.
    const campaigns = await brevo("/emailCampaigns?type=classic&limit=100&offset=0") as {
      campaigns?: Array<{ id: number; name: string; status: string }>
    };
    let campaign = campaigns.campaigns?.find((item) => item.name === campaignName);
    if (campaign && campaign.status !== "draft") {
      return NextResponse.json({ status: "already_submitted", campaignId: campaign.id });
    }

    if (!campaign) {
      const snapshot = await getFeedSnapshot();
      const stories = selectDailyStories(snapshot.signals, now.getTime());
      if (stories.length === 0) return NextResponse.json({ status: "no_recent_news" });
      const today = digestDay(now);
      const created = await brevo("/emailCampaigns", "POST", {
        name: campaignName, type: "classic",
        subject: "NileSignal Daily: " + stories.length + " AI stories you should know · " + today,
        sender: { name: "NileSignal", email: process.env.BREVO_FROM_EMAIL },
        recipients: { listIds: [brevoListId()] },
        htmlContent: renderDailyDigest(stories, today),
        previewText: "The latest AI breakthroughs, launches and industry updates — explained simply.",
        tag: "NileSignal Daily"
      }) as { id?: number };
      if (!created.id) throw new Error("Brevo did not create an email campaign");
      campaign = { id: created.id, name: campaignName, status: "draft" };
    }
    await brevo("/emailCampaigns/" + campaign.id + "/sendNow", "POST");
    return NextResponse.json({ status: "submitted", campaignId: campaign.id, recipients: recipientCount });
  } catch {
    return NextResponse.json({ status: "email_service_error" }, { status: 503 });
  }
}
