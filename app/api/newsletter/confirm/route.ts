import { NextRequest, NextResponse } from "next/server";
import {
  brevo, brevoListId, getNewsletterMembership, memberCount, newsletterConfigured,
  readConsent, MAX_FREE_SUBSCRIBERS
} from "../../../../lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const redirect = (status: string) => NextResponse.redirect(
    new URL("/newsletter/status?result=" + status, request.url), 303
  );
  if (!newsletterConfigured()) return redirect("unavailable");

  try {
    const data = await request.formData();
    const consent = readConsent(data.get("token"));
    if (!consent) return redirect("expired");

    const membership = await getNewsletterMembership(consent.email);
    if (membership === "subscribed") return redirect("already");
    if (membership === "opted_out") return redirect("opted_out");

    if (await memberCount() >= MAX_FREE_SUBSCRIBERS) return redirect("full");

    // The contact only joins NileSignal Daily after email confirmation.
    await brevo("/contacts", "POST", {
      email: consent.email,
      attributes: { FIRSTNAME: consent.name.split(" ")[0] },
      listIds: [brevoListId()],
      updateEnabled: true
    });
    return redirect("confirmed");
  } catch {
    return redirect("unavailable");
  }
}
