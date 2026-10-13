import { NextResponse } from "next/server";
import { getFeedSnapshot } from "../../../lib/feeds";
export const dynamic = "force-dynamic";
export async function GET() {
  const { signals, sources, generatedAt } = await getFeedSnapshot();
  return NextResponse.json({ generatedAt, count: signals.length, configuredSources: sources.length,
    availableSources: sources.filter((s) => s.status === "ok").length, signals },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
