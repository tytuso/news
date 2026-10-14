import { NextRequest, NextResponse } from "next/server";
import { getBrevoDeliveryState, verifyDeliveryReceipt } from "../../../../lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 900) {
      return NextResponse.json({ error: "Invalid tracking request." }, { status: 413 });
    }
    const body = await request.json() as { receipt?: unknown };
    const messageId = verifyDeliveryReceipt(body.receipt);
    if (!messageId) {
      return NextResponse.json({ error: "This tracking session has expired. Request a new confirmation if needed." }, { status: 400 });
    }
    const status = await getBrevoDeliveryState(messageId);
    return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "We couldn't check delivery just now. Try again shortly." }, { status: 503 });
  }
}
