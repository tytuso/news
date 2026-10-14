import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { memberCount, newsletterConfigured } from "../../../../lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checkBrevo = unstable_cache(async () => {
  await memberCount();
  return true;
}, ["nilesignal-brevo-health-v1"], { revalidate: 300 });

export async function GET() {
  if (!newsletterConfigured()) {
    return NextResponse.json({ status: "not_configured" }, { status: 503 });
  }
  try {
    await checkBrevo();
    return NextResponse.json({ status: "ready", provider: "brevo" }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300" }
    });
  } catch {
    return NextResponse.json({ status: "provider_unavailable" }, { status: 503 });
  }
}
