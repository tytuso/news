import { NextResponse } from "next/server";
import { getSignals } from "../../../lib/feeds";
import { SIGNAL_SOURCES } from "../../../lib/sources";

export const dynamic = "force-dynamic";

export async function GET() {
  const signals = await getSignals(120);
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    count: signals.length,
    configuredSources: SIGNAL_SOURCES.length,
    signals
  }, {
    headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" }
  });
}
