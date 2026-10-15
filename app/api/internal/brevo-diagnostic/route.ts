import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const EXPIRES = Date.parse("2026-10-16T02:30:00Z");
const KNOWN_TEST_ID = "<202610141711.96939362786@smtp-relay.mailin.fr>";

export async function GET(request: NextRequest) {
  const secret = process.env.NILESIGNAL_DIAGNOSTIC_TOKEN || "";
  const provided = request.nextUrl.searchParams.get("token") || "";
  const a = Buffer.from(provided), b = Buffer.from(secret);
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b))
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  if (Date.now() > EXPIRES) return NextResponse.json({ status: "expired" }, { status: 410 });
  if (!process.env.BREVO_API_KEY) return NextResponse.json({ status: "no_provider" }, { status: 503 });
  const headers = { "api-key": process.env.BREVO_API_KEY, "accept": "application/json" };
  try {
    const base = "https://api.brevo.com/v3";
    const [eventsRes, campaignsRes] = await Promise.all([
      fetch(base + "/smtp/statistics/events?messageId=" + encodeURIComponent(KNOWN_TEST_ID) + "&limit=50", {
        headers, cache: "no-store", signal: AbortSignal.timeout(12000)
      }),
      fetch(base + "/emailCampaigns?type=classic&limit=10&offset=0", {
        headers, cache: "no-store", signal: AbortSignal.timeout(12000)
      })
    ]);
    const evBody = await eventsRes.json().catch(() => ({})) as {
      events?: Array<{ event?: string; reason?: string; date?: string; messageId?: string }>;
      code?: string; message?: string
    };
    const campaignBody = await campaignsRes.json().catch(() => ({})) as {
      count?: number; campaigns?: Array<{ id?: number; name?: string; status?: string }>;
      code?: string; message?: string
    };
    const matchedEvents = (evBody.events || [])
      .filter((x) => x.messageId === KNOWN_TEST_ID)
      .map(x => ({ event: x.event, reason: (x.reason || "").slice(0, 500), date: x.date }));
    return NextResponse.json({
      trackedMessage: "NileSignal top-ten transactional test",
      messageEventsHttp: eventsRes.status, events: matchedEvents,
      eventError: eventsRes.ok ? null : { code: evBody.code, message: evBody.message },
      marketingCampaignListHttp: campaignsRes.status,
      campaignListError: campaignsRes.ok ? null : { code: campaignBody.code, message: campaignBody.message },
      campaignListCount: campaignBody.count ?? null
    }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ status: "diagnostic_unavailable" }, { status: 503 }); }
}
