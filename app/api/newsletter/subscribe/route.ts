import { NextRequest, NextResponse } from "next/server";
import { brevoListId, memberCount, newsletterConfigured, safeEmail, safeName, sendConfirmation, signConsent, MAX_FREE_SUBSCRIBERS } from "../../../../lib/newsletter";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; until: number }>();
export async function POST(request: NextRequest) {
  if (!newsletterConfigured()) return NextResponse.json({ error: "The email newsletter is not accepting subscriptions yet." }, { status: 503 });
  try {
    if (Number(request.headers.get("content-length") || 0) > 4000) return NextResponse.json({ error: "Invalid request." }, { status: 413 });
    const data = await request.json() as Record<string, unknown>;
    const email = safeEmail(data.email), name = safeName(data.name);
    if (!email || !name || data.consent !== true) return NextResponse.json({ error: "Enter a valid name and email and agree to receive the newsletter." }, { status: 400 });
    // Honeypot; a filled field signals a bot. Replies are intentionally generic.
    if (data.company) return NextResponse.json({ ok: true, message: "Please check your email to confirm." });
    const ip = request.headers.get("x-real-ip") || request.headers.get("x-vercel-forwarded-for") || "anonymous";
    const key = ip + ":" + email;
    const now = Date.now();
    if (attempts.size > 5000) attempts.clear();
    const current = attempts.get(key);
    if (current && current.until > now && current.count >= 2) return NextResponse.json({ error: "Please check your inbox before requesting another email." }, { status: 429 });
    attempts.set(key, { count: current && current.until > now ? current.count + 1 : 1, until: now + 3600000 });
    if (await memberCount() >= MAX_FREE_SUBSCRIBERS) return NextResponse.json({ error: "Our free daily email list is currently full. You can still read every story on the website." }, { status: 409 });
    await sendConfirmation(name, email, signConsent(name, email));
    return NextResponse.json({ ok: true, message: "Please check your inbox and confirm your email." });
  } catch {
    return NextResponse.json({ error: "We could not send the confirmation email. Please try again later." }, { status: 503 });
  }
}
