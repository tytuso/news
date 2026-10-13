import { NextRequest, NextResponse } from "next/server";
import { brevo, brevoListId, memberCount, newsletterConfigured, readConsent, MAX_FREE_SUBSCRIBERS } from "../../../../lib/newsletter";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const redirect = (status: string) => NextResponse.redirect(new URL("/newsletter/status?result=" + status, request.url), 303);
  if (!newsletterConfigured()) return redirect("unavailable");
  try {
    const data = await request.formData();
    const parsed = readConsent(data.get("token"));
    if (!parsed) return redirect("expired");
    if (await memberCount() >= MAX_FREE_SUBSCRIBERS) return redirect("full");
    // The contact is created only AFTER the email owner clicks confirm.
    await brevo("/contacts", "POST", {
      email: parsed.email,
      attributes: { FIRSTNAME: parsed.name.split(" ")[0] },
      listIds: [brevoListId()],
      updateEnabled: true
    });
    return redirect("confirmed");
  } catch { return redirect("unavailable"); }
}
