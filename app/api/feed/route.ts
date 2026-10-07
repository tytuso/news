import { NextResponse } from "next/server";
import { getSignals } from "../../../lib/feeds";

export const revalidate = 900;

export async function GET() {
  const signals = await getSignals(40);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    count: signals.length,
    signals
  });
}
