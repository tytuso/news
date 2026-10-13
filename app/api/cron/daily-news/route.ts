import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getFeedSnapshot } from "../../../../lib/feeds";
import { brevo, brevoListId, escapeHtml, MAX_FREE_SUBSCRIBERS, memberCount, newsletterConfigured, NEWSLETTER_ORIGIN } from "../../../../lib/newsletter";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function renderDigest(stories: Awaited<ReturnType<typeof getFeedSnapshot>>["signals"], day: string) {
  const cards = stories.map((item, i) =>
    '<tr><td style="padding:25px 0;border-bottom:1px solid #e9eaf3">' +
    '<div style="font-size:12px;color:#6256e8;font-weight:700;letter-spacing:1px">STORY ' + (i + 1) + ' · ' + escapeHtml(item.source) + '</div>' +
    '<h2 style="font-size:21px;line-height:1.3;margin:11px 0;color:#19223a">' + escapeHtml(item.title) + '</h2>' +
    '<p style="font-size:14px;line-height:1.7;color:#667189;margin:0 0 10px">' + escapeHtml(item.description || "") + '</p>' +
    '<p style="font-size:13px;line-height:1.6;color:#3d485e"><b>Why it matters:</b> ' + escapeHtml(item.whyItMatters) + '</p>' +
    '<a href="' + escapeHtml(item.url) + '" style="font-size:13px;font-weight:700;color:#5145e8">Read the original article →</a></td></tr>').join("");
  return '<!doctype html><html><body style="margin:0;background:#f3f5fb;font-family:Arial,Helvetica,sans-serif;color:#19223a">' +
    '<div style="max-width:620px;margin:24px auto;padding:0 12px">' +
    '<div style="background:#202744;color:white;border-radius:18px 18px 0 0;padding:32px">' +
    '<div style="font-size:20px;font-weight:800;color:#c8beff">NileSignal</div>' +
    '<h1 style="font-size:34px;line-height:1.15;margin:21px 0 10px;color:white">Your daily AI briefing.</h1>' +
    '<p style="font-size:14px;line-height:1.7;color:#c7cde3;margin:0">The important AI stories, minus the noise · ' + escapeHtml(day) + '</p></div>' +
    '<div style="background:white;padding:12px 32px 32px;border-radius:0 0 18px 18px">' +
    '<p style="font-size:15px;line-height:1.7;color:#5b6579">Good morning, {{ contact.FIRSTNAME }}! Here are the AI updates worth knowing today.</p>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%">' + cards + '</table>' +
    '<p style="margin:28px 0"><a href="' + NEWSLETTER_ORIGIN + '" style="display:inline-block;background:#5145e8;color:white;text-decoration:none;border-radius:10px;padding:14px 20px;font-weight:bold;font-size:13px">Explore all news →</a></p>' +
    '<p style="font-size:11px;line-height:1.6;color:#8991a3">Publisher descriptions and rule-based context; verify news through the linked original articles. Brought to you by Nile AI Solutions.</p>' +
    '<p style="font-size:12px;padding-top:16px;border-top:1px solid #e9eaf3"><a href="{{ unsubscribe }}" style="color:#6c7488">Unsubscribe from daily emails</a></p>' +
    '</div></div></body></html>';
}

export async function GET(request: NextRequest) {
  // Vercel securely sets the Authorization header for its daily cron.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!newsletterConfigured()) return NextResponse.json({ status: "not_configured" }, { status: 503 });
  try {
    const date = new Date().toISOString().slice(0, 10);
    const campaignName = "NileSignal Daily " + date;
    const recipientCount = await memberCount();
    if (!recipientCount) return NextResponse.json({ status: "no_subscribers" });
    if (recipientCount > MAX_FREE_SUBSCRIBERS) return NextResponse.json({ status: "list_over_free_limit", recipients: recipientCount }, { status: 409 });
    // A fixed campaign name plus an existing-campaign lookup avoids most duplicate sends.
    const campaigns = await brevo("/emailCampaigns?type=classic&limit=100&offset=0") as { campaigns?: Array<{ id: number; name: string; status: string }> };
    let campaign = campaigns.campaigns?.find((item) => item.name === campaignName);
    if (campaign && campaign.status !== "draft") return NextResponse.json({ status: "already_submitted", campaignId: campaign.id });
    if (!campaign) {
      const snapshot = await getFeedSnapshot();
      const recent = snapshot.signals.filter((s) => Date.now() - Date.parse(s.publishedAt) < 36 * 3600000);
      if (recent.length === 0) return NextResponse.json({ status: "no_recent_news" });
      const rank = { Major: 0, Important: 1, Watch: 2 };
      const used = new Set<string>();
      const stories = recent.sort((a, b) => rank[a.impact] - rank[b.impact] || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
        .filter((item) => { if (used.has(item.sourceKey)) return false; used.add(item.sourceKey); return true; }).slice(0, 5);
      const humanDate = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Kampala" }).format(new Date());
      const created = await brevo("/emailCampaigns", "POST", {
        name: campaignName, type: "classic",
        subject: "Your AI briefing · " + humanDate,
        sender: { name: "NileSignal", email: process.env.BREVO_FROM_EMAIL },
        recipients: { listIds: [brevoListId()] },
        htmlContent: renderDigest(stories, humanDate),
        previewText: "5 AI stories worth your attention today, explained simply.",
        tag: "NileSignal Daily"
      }) as { id?: number };
      if (!created.id) throw new Error("Email campaign could not be created");
      campaign = { id: created.id, name: campaignName, status: "draft" };
    }
    await brevo("/emailCampaigns/" + campaign.id + "/sendNow", "POST");
    return NextResponse.json({ status: "submitted", campaignId: campaign.id, recipients: recipientCount });
  } catch {
    return NextResponse.json({ status: "email_service_error" }, { status: 503 });
  }
}
