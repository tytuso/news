import type { SignalItem } from "./feeds";
import { escapeHtml, NEWSLETTER_ORIGIN } from "./newsletter";

const ONE_HOUR = 60 * 60 * 1000;
const MAX_STORIES = 10;

/**
 * Select high-impact, reasonably fresh updates. Cap at two per publisher
 * so a single source cannot dominate the whole digest. This is heuristic
 * ranking; it is not an editorially verified "top ten".
 */
export function selectDailyStories(signals: SignalItem[], now = Date.now()): SignalItem[] {
  const fresh = signals.filter((item) => {
    const published = Date.parse(item.publishedAt);
    return Number.isFinite(published) && published <= now + ONE_HOUR && published >= now - 72 * ONE_HOUR &&
      /^https?:\/\//.test(item.url);
  });

  function score(item: SignalItem): number {
    const age = (now - Date.parse(item.publishedAt)) / ONE_HOUR;
    const impact = item.impact === "Major" ? 100 : item.impact === "Important" ? 65 : 14;
    const type = item.sourceType === "official" ? 8 : item.sourceType === "research" ? 5 : 0;
    return impact + type + Math.max(0, 26 - age / 2);
  }

  const ordered = fresh.sort((a, b) => score(b) - score(a) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const chosen: SignalItem[] = [];
  const publishers = new Map<string, number>();
  const seen = new Set<string>();
  for (const item of ordered) {
    if (chosen.length >= MAX_STORIES) break;
    if (seen.has(item.url)) continue;
    if ((publishers.get(item.sourceKey) || 0) >= 2) continue;
    seen.add(item.url);
    publishers.set(item.sourceKey, (publishers.get(item.sourceKey) || 0) + 1);
    chosen.push(item);
  }
  return chosen;
}

export function digestDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Kampala"
  }).format(now);
}

function linkTo(value: string) {
  // Article URLs originate from validated http(s) feeds. Escape before HTML insertion.
  return escapeHtml(value);
}

/** Render email-friendly HTML: tables, inline styles, no external fonts or images. */
export function renderDailyDigest(stories: SignalItem[], day: string, preview = false): string {
  const count = stories.length;
  const unsubscribeLink = preview ? NEWSLETTER_ORIGIN + "/privacy" : "{{params.UNSUBSCRIBE_URL}}";
  const greeting = preview ? "Hello, AI explorer." : "Hello, {{params.FIRST_NAME}}.";
  const rows = stories.map((item, i) => {
    const rank = String(i + 1).padStart(2, "0");
    const badge = item.impact === "Major" ? "BIG UPDATE" : item.category.toUpperCase();
    const published = new Intl.DateTimeFormat("en-GB", {
      day: "numeric", month: "short", timeZone: "UTC"
    }).format(new Date(item.publishedAt));
    return '<tr><td style="padding:0 0 15px 0">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e6e9f4;border-radius:16px">' +
        '<tr><td style="padding:23px 25px 9px">' +
          '<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>' +
          '<td width="44" valign="top" style="vertical-align:top"><span style="display:inline-block;color:#5748dc;background:#f0edff;border-radius:9px;padding:9px 10px;font-size:13px;font-weight:800">' + rank + '</span></td>' +
          '<td valign="middle" style="font-size:11px;font-weight:700;letter-spacing:0.3px;color:#717c95;vertical-align:middle">' +
            escapeHtml(item.source) + ' &nbsp;&bull;&nbsp; ' + escapeHtml(published) +
          '</td><td align="right" valign="middle" style="font-size:10px;font-weight:800;color:#6956d8;vertical-align:middle;white-space:nowrap">' + escapeHtml(badge) + '</td></tr></table>' +
        '</td></tr>' +
        '<tr><td style="padding:3px 25px 21px">' +
          '<h2 style="font-size:21px;font-weight:800;line-height:1.35;letter-spacing:-0.45px;color:#17203a;margin:9px 0 11px">' + escapeHtml(item.title) + '</h2>' +
          (item.description ? '<p style="font-size:14px;line-height:1.75;color:#606c84;margin:0 0 13px">' + escapeHtml(item.description) + '</p>' : '') +
          '<p style="font-size:13px;line-height:1.7;color:#3b4865;background:#f6f7fd;padding:12px 14px;border-radius:9px;margin:0 0 17px"><strong style="color:#473acc">Why it matters:</strong> ' + escapeHtml(item.whyItMatters) + '</p>' +
          '<a href="' + linkTo(item.url) + '" style="font-size:13px;font-weight:800;color:#5141da;text-decoration:none">Read original story &rarr;</a>' +
        '</td></tr>' +
      '</table></td></tr>';
  }).join("");

  const preheader = 'Your daily NileSignal briefing: ' + count + ' AI updates, explained simply.';
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>' +
    '<body style="margin:0;padding:0;background:#f2f3fa;color:#17203a;font-family:Arial,Helvetica,sans-serif">' +
      '<div style="display:none;font-size:1px;color:#f2f3fa;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">' + escapeHtml(preheader) + '</div>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f2f3fa"><tr><td align="center" style="padding:26px 12px">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:660px;border-collapse:separate;border-spacing:0">' +
        '<tr><td style="background:#201948;background-image:linear-gradient(125deg,#201948,#5643d7);border-radius:22px 22px 0 0;padding:33px 31px 36px">' +
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td>' +
          '<span style="display:inline-block;padding:10px 13px;color:#ffffff;background:#5946e6;border-radius:11px;font-size:20px;font-weight:900;letter-spacing:-1px">N<span style="color:#c7fadd">&bull;</span></span>' +
          '<span style="color:#ffffff;font-size:20px;font-weight:800;vertical-align:middle;margin-left:11px;letter-spacing:-0.5px">NileSignal</span></td>' +
          '<td align="right" style="color:#d0c9ff;font-size:11px;font-weight:800;letter-spacing:1px">DAILY BRIEF</td></tr></table>' +
          '<p style="color:#bfb5ff;font-size:11px;letter-spacing:1.5px;font-weight:800;margin:29px 0 10px">THE AI NEWS THAT MATTERS</p>' +
          '<h1 style="margin:0;color:#ffffff;font-size:35px;line-height:1.19;letter-spacing:-0.9px;font-weight:800">Stay ahead of AI.<br/><span style="color:#d1c8ff">Skip the noise.</span></h1>' +
          '<p style="font-size:14px;line-height:1.65;color:#e1dcfb;margin:15px 0 0">' + escapeHtml(day) + ' &nbsp;&bull;&nbsp; ' + count + ' stories worth knowing</p>' +
        '</td></tr>' +
        '<tr><td style="padding:25px 18px 12px;background:#fcfcff">' +
          '<p style="font-size:15px;line-height:1.7;color:#43506c;margin:0 7px 9px">' + greeting + ' Here are today&#39;s key developments, with the original sources linked below.</p>' +
          '<table role="presentation" cellpadding="0" cellspacing="0" width="100%">' + rows + '</table>' +
        '</td></tr>' +
        '<tr><td align="center" style="padding:31px 22px;background:#f1efff">' +
          '<p style="margin:0 0 10px;color:#6155a5;font-size:11px;letter-spacing:1px;font-weight:800">THERE&#39;S MORE TO EXPLORE</p>' +
          '<h2 style="margin:0 0 19px;color:#211e4c;font-size:22px;letter-spacing:-0.4px">Follow every AI signal.</h2>' +
          '<a href="' + NEWSLETTER_ORIGIN + '/?utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=daily_digest" style="display:inline-block;background:#5543df;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:15px 22px;border-radius:11px">Explore NileSignal &rarr;</a>' +
        '</td></tr>' +
        '<tr><td align="center" style="padding:25px 25px 30px;background:#ffffff;border-radius:0 0 22px 22px">' +
          '<a href="' + NEWSLETTER_ORIGIN + '" style="font-size:13px;font-weight:800;color:#5442d5;text-decoration:none">signal.nileai.solutions</a>' +
          '<p style="color:#8890a5;font-size:11px;line-height:1.6;margin:12px 0 17px">NileSignal by Nile AI Solutions. Publisher excerpts and automated impact estimates; read original articles for full context.</p>' +
          '<a href="' + unsubscribeLink + '" style="font-size:12px;color:#717990;text-decoration:underline">Unsubscribe from daily emails</a>' +
        '</td></tr>' +
      '</table></td></tr></table></body></html>';
}
