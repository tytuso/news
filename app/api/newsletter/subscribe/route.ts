import { NextRequest, NextResponse } from "next/server";
import {
  getNewsletterMembership, memberCount, newsletterConfigured, safeEmail, safeName,
  brevo, brevoListId, MAX_FREE_SUBSCRIBERS
} from "../../../../lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RateEntry = { until: number; count: number };
const rateLimits = new Map<string, RateEntry>();
const HOUR = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (!newsletterConfigured()) {
    return NextResponse.json({ error: "Email subscriptions are temporarily unavailable." }, { status: 503 });
  }
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 4000) return NextResponse.json({ error: "Invalid request." }, { status: 413 });
    const data = await request.json() as Record<string, unknown>;
    const email = safeEmail(data.email);
    const name = safeName(data.name);
    if (!email || !name || data.consent !== true) {
      return NextResponse.json({ error: "Enter your name, a valid email address, and agree to the newsletter." }, { status: 400 });
    }
    // Leave this fake field unfilled. Helps avoid bot-triggered confirmation emails.
    if (data.company) return NextResponse.json({ ok: true, status: "subscribed", message: "Thanks for joining NileSignal Daily!" });

    const ip = (request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "anonymous").trim();
    const now = Date.now();
    if (rateLimits.size > 6000) rateLimits.clear();
    const ipKey = "ip:" + ip;
    const currentIp = rateLimits.get(ipKey);
    if (currentIp && currentIp.until > now && currentIp.count >= 20) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    rateLimits.set(ipKey, {
      until: currentIp && currentIp.until > now ? currentIp.until : now + HOUR,
      count: currentIp && currentIp.until > now ? currentIp.count + 1 : 1
    });

    const membership = await getNewsletterMembership(email);
    if (membership === "subscribed") {
      return NextResponse.json({
        ok: true, status: "already_subscribed",
        message: "This email is already subscribed to NileSignal Daily. No need to sign up again."
      });
    }
    if (membership === "opted_out") {
      return NextResponse.json({
        ok: true, status: "opted_out",
        message: "This address previously opted out of emails. Contact us if you want to resubscribe."
      });
    }

    if (await memberCount() >= MAX_FREE_SUBSCRIBERS) {
      return NextResponse.json({
        error: "Our free newsletter list is currently full. You can still read all the news on NileSignal."
      }, { status: 409 });
    }

    // Single opt-in: only add contacts after an explicit, unchecked-by-default consent box.
    // Never reset a blocklist or unsubscribe flag; getNewsletterMembership checks those first.
    await brevo("/contacts", "POST", {
      email,
      attributes: { FIRSTNAME: name.split(" ")[0] },
      listIds: [brevoListId()],
      updateEnabled: true
    });
    return NextResponse.json({
      ok: true,
      status: "subscribed",
      message: "You're subscribed to NileSignal Daily! Look out for your first daily AI briefing."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({
      error: "We couldn't complete your subscription right now. Please try again later."
    }, { status: 503 });
  }
}
