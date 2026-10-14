import { NextResponse } from "next/server";
import { newsletterConfigured, newsletterProviderReady } from "../../../../lib/newsletter";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!newsletterConfigured()) return NextResponse.json({ status: "not_configured" }, { status: 503 });
  if (!(await newsletterProviderReady())) return NextResponse.json({ status: "provider_unavailable" }, { status: 503 });
  return NextResponse.json({ status: "ready", provider: "brevo" }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" } });
}
