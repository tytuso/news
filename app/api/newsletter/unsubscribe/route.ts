import { NextRequest, NextResponse } from "next/server";
import { brevo, brevoListId, verifyNewsletterUnsubscribeToken } from "../../../../lib/newsletter";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  const redirect = (result: string) =>
    NextResponse.redirect(new URL("/newsletter/status?result=" + result, request.url), 303);
  try {
    const form = await request.formData();
    const email = verifyNewsletterUnsubscribeToken(form.get("token"));
    if (!email) return redirect("expired");
    // Scope the removal to NileSignal; do not blacklist the contact for other projects.
    await brevo("/contacts/" + encodeURIComponent(email), "PUT", {
      unlinkListIds: [brevoListId()]
    });
    return redirect("unsubscribed");
  } catch { return redirect("unavailable"); }
}
