import { createHmac, timingSafeEqual } from "node:crypto";

export const NEWSLETTER_ORIGIN = "https://signal.nileai.solutions";
export const MAX_FREE_SUBSCRIBERS = 200;
export type Consent = { name: string; email: string; exp: number; kind: "subscribe" };

export function newsletterConfigured() {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_FROM_EMAIL &&
    process.env.BREVO_LIST_ID && process.env.NEWSLETTER_SECRET);
}
export function safeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(email) ? email : null;
}
export function safeName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 2 && name.length <= 80 && !/[<>]/.test(name) ? name : null;
}
export function signConsent(name: string, email: string): string {
  const secret = process.env.NEWSLETTER_SECRET;
  if (!secret) throw new Error("Newsletter signing not configured");
  const data: Consent = { name, email, exp: Date.now() + 7 * 86400000, kind: "subscribe" };
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const mac = createHmac("sha256", secret).update(payload).digest("base64url");
  return payload + "." + mac;
}
export function readConsent(token: unknown): Consent | null {
  const secret = process.env.NEWSLETTER_SECRET;
  if (typeof token !== "string" || token.length > 700 || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, mac] = parts;
  const expected = createHmac("sha256", secret).update(payload).digest();
  let actual: Buffer;
  try { actual = Buffer.from(mac, "base64url"); } catch { return null; }
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Consent;
    if (value.kind !== "subscribe" || typeof value.exp !== "number" || value.exp < Date.now() ||
      !safeName(value.name) || !safeEmail(value.email)) return null;
    return value;
  } catch { return null; }
}
export function escapeHtml(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
export function brevoListId(): number {
  const id = Number(process.env.BREVO_LIST_ID);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Invalid BREVO_LIST_ID");
  return id;
}
export async function brevo(path: string, method = "GET", body?: unknown) {
  if (!process.env.BREVO_API_KEY) throw new Error("Brevo is not configured");
  const response = await fetch("https://api.brevo.com/v3" + path, {
    method, headers: { "api-key": process.env.BREVO_API_KEY, accept: "application/json",
      ...(body === undefined ? {} : { "content-type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store", signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    // Do not expose addresses, response bodies or credentials in application logs.
    console.error("Newsletter provider request failed", method, path.split("?")[0], response.status);
    throw new Error("Email service temporarily unavailable");
  }
  if (response.status === 204) return {};
  return response.json();
}
export async function memberCount(): Promise<number> {
  const data = await brevo("/contacts/lists/" + brevoListId() + "/contacts?limit=1&offset=0") as { count?: number };
  if (typeof data.count !== "number") throw new Error("Newsletter list unavailable");
  return data.count;
}
export async function sendConfirmation(name: string, email: string, token: string) {
  const link = NEWSLETTER_ORIGIN + "/newsletter/confirm?token=" + encodeURIComponent(token);
  const htmlContent = '<!doctype html><html><body style="margin:0;background:#f6f7fb;font-family:Arial,sans-serif;color:#172039">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:36px auto;background:white;border-radius:18px;width:94%"><tr><td style="padding:34px">' +
    '<div style="font-size:20px;font-weight:800;color:#5145e8">NileSignal</div>' +
    '<h1 style="font-size:29px;margin:25px 0 12px">Confirm your daily AI briefing</h1>' +
    '<p style="font-size:15px;line-height:1.8">Hi ' + escapeHtml(name) + ', thanks for signing up. Please confirm your email to receive one concise AI news digest each day.</p>' +
    '<a href="' + escapeHtml(link) + '" style="display:inline-block;margin:18px 0;padding:15px 22px;background:#5145e8;color:white;text-decoration:none;border-radius:10px;font-weight:bold">Confirm subscription</a>' +
    '<p style="font-size:12px;color:#788199">If you did not request this, just ignore this message. The link expires in 7 days.</p></td></tr></table></body></html>';
  await brevo("/smtp/email", "POST", {
    sender: { name: "NileSignal", email: process.env.BREVO_FROM_EMAIL },
    to: [{ email, name }], subject: "Confirm your NileSignal daily AI newsletter",
    htmlContent
  });
}
