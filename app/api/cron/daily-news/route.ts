import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getFeedSnapshot } from "../../../../lib/feeds";
import { digestDay, renderDailyDigest, selectDailyStories } from "../../../../lib/daily-digest";
import {
  brevo, brevoListId, MAX_FREE_SUBSCRIBERS, newsletterConfigured,
  newsletterUnsubscribeUrl, safeEmail
} from "../../../../lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type BrevoListContact = {
  email?: string;
  emailBlacklisted?: boolean;
  listUnsubscribed?: number[];
  attributes?: { FIRSTNAME?: string };
};
type ContactListResponse = { contacts?: BrevoListContact[]; count?: number };

function dailyIdempotencyKey(day: string): string {
  // Deterministic RFC 4122 UUID v4 shape for one daily send attempt.
  const b = createHash("sha256").update("nilesignal-digest-v2:" + day).digest().subarray(0, 16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = b.toString("hex");
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20,32)].join("-");
}

export async function GET(request: NextRequest) {
  // Vercel sends its CRON_SECRET as Authorization header to the scheduled job.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!newsletterConfigured()) return NextResponse.json({ status: "not_configured" }, { status: 503 });
  if (process.env.NILESIGNAL_DAILY_ENABLED !== "true") {
    return NextResponse.json({ status: "paused_for_delivery_testing" });
  }
  try {
    const now = new Date();
    const listId = brevoListId();
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Kampala",
      year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const result = await brevo("/contacts/lists/" + listId + "/contacts?limit=500&offset=0") as ContactListResponse;
    const count = result.count ?? 0;
    if (count === 0) return NextResponse.json({ status: "no_subscribers" });
    if (count > MAX_FREE_SUBSCRIBERS) {
      return NextResponse.json({ status: "over_free_list_limit", count }, { status: 409 });
    }
    const recipients = (result.contacts || []).filter((contact) =>
      !!safeEmail(contact.email) && !contact.emailBlacklisted &&
      !contact.listUnsubscribed?.includes(listId)
    );
    if (!recipients.length) return NextResponse.json({ status: "no_active_subscribers" });
    if (recipients.length > MAX_FREE_SUBSCRIBERS) {
      return NextResponse.json({ status: "over_free_send_limit" }, { status: 409 });
    }
    const snapshot = await getFeedSnapshot();
    const stories = selectDailyStories(snapshot.signals, now.getTime());
    if (!stories.length) return NextResponse.json({ status: "no_recent_news" });
    const template = renderDailyDigest(stories, digestDay(now));
    const response = await brevo("/smtp/email", "POST", {
      sender: { name: "NileSignal", email: process.env.BREVO_FROM_EMAIL },
      subject: "NileSignal Daily: " + stories.length + " AI stories · " + digestDay(now),
      htmlContent: template,
      messageVersions: recipients.map((contact) => ({
        to: [{ email: contact.email }],
        params: {
          FIRST_NAME: typeof contact.attributes?.FIRSTNAME === "string"
            ? contact.attributes.FIRSTNAME.slice(0, 50) : "there",
          UNSUBSCRIBE_URL: newsletterUnsubscribeUrl(contact.email!)
        }
      })),
      tags: ["nilesignal-daily-" + day],
      headers: { idempotencyKey: dailyIdempotencyKey(day) }
    }) as { messageIds?: string[] };
    if (!Array.isArray(response.messageIds) || response.messageIds.length !== recipients.length) {
      throw new Error("Batch response did not match intended recipients");
    }
    return NextResponse.json({
      status: "accepted_by_brevo",
      day,
      recipients: recipients.length,
      stories: stories.length,
      note: "Recipient mail-server delivery is not guaranteed; check transactional logs."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "delivery_failed_check_brevo_logs" }, { status: 503 });
  }
}
