import { NextResponse } from "next/server";
import { getFeedSnapshot } from "../../../lib/feeds";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const snapshot = await getFeedSnapshot();
    const active = snapshot.sources.filter((s) => s.status === "ok").length;
    const broken = snapshot.sources.filter((s) => s.status === "error").length;
    const latest = snapshot.signals[0]?.publishedAt || null;
    const recent = latest !== null && Date.now() - Date.parse(latest) < 7 * 86400000;
    const status = !snapshot.signals.length || !recent ? "unhealthy" : broken ? "degraded" : "healthy";
    return NextResponse.json({ status, generatedAt: snapshot.generatedAt, articles: snapshot.signals.length,
      newestArticle: latest, sources: { configured: snapshot.sources.length, available: active, unavailable: broken },
      sourceStatus: snapshot.sources }, { status: status === "unhealthy" ? 503 : 200,
      headers: { "Cache-Control": "public, s-maxage=300" } });
  } catch {
    return NextResponse.json({ status: "unhealthy", message: "The feed is unavailable." }, { status: 503 });
  }
}
