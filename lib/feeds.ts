import Parser from "rss-parser";
import { unstable_cache } from "next/cache";
import { SIGNAL_SOURCES, type SignalSource } from "./sources";
import { classifySignal, explainWhyItMatters, hasAfricaAngle, isAboutAI, scoreImpact, type SignalCategory, type SignalImpact } from "./intelligence";

type FeedItem = { title?: string; link?: string; isoDate?: string; pubDate?: string; contentSnippet?: string; content?: string; summary?: string; guid?: string };
export type SignalItem = {
  id: string; title: string; url: string; source: string; sourceKey: string; publishedAt: string;
  description: string; category: SignalCategory; impact: SignalImpact; africaAngle: boolean;
  whyItMatters: string; sourceType: SignalSource["type"];
};
export type SourceReport = { key: string; name: string; status: "ok" | "empty" | "error"; articleCount: number };
export type FeedSnapshot = { signals: SignalItem[]; sources: SourceReport[]; generatedAt: string };
const parser = new Parser<Record<string, unknown>, FeedItem>();
const MAX_AGE_MS = 75 * 86400000;
const MAX_FEED_CHARS = 1200000;

function stripHtml(value = ""): string {
  return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => {
      const n = Number(code);
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
    }).replace(/\s+/g, " ").trim();
}
function compact(value: string, max = 200) {
  return value.length <= max ? value : value.slice(0, max).trimEnd() + "…";
}
function fingerprint(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\b(the|a|an|and|for|to|of|with|new)\b/g, "").replace(/\s+/g, " ").trim();
}
function stableId(source: string, link: string) {
  return source + "-" + link.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(-120);
}
function safeUrl(value: string | undefined, fallback: string) {
  try {
    const parsed = new URL(value || fallback, fallback);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : fallback;
  } catch { return fallback; }
}
function validDate(value: string | undefined, now: number) {
  const stamp = value ? Date.parse(value) : NaN;
  return Number.isFinite(stamp) && stamp < now + 86400000 && stamp > now - MAX_AGE_MS ? new Date(stamp).toISOString() : "";
}

async function readSource(source: SignalSource, now: number): Promise<{ items: SignalItem[]; report: SourceReport }> {
  const report: SourceReport = { key: source.key, name: source.name, status: "error", articleCount: 0 };
  try {
    const response = await fetch(source.feedUrl, {
      next: { revalidate: 900 }, signal: AbortSignal.timeout(7000),
      headers: { "User-Agent": "NileSignal/1.1 (+https://signal.nileai.solutions)" }
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    if (Number(response.headers.get("content-length") || 0) > MAX_FEED_CHARS) throw new Error("Oversized feed");
    const xml = await response.text();
    if (xml.length > MAX_FEED_CHARS) throw new Error("Oversized feed");
    const feed = await parser.parseString(xml);
    if (!feed.items?.length) {
      report.status = "empty";
      return { items: [], report };
    }
    const items: SignalItem[] = feed.items.slice(0, 24).flatMap((item) => {
      const title = compact(stripHtml(item.title || ""), 185);
      const description = compact(stripHtml(item.contentSnippet || item.summary || item.content || ""));
      const publishedAt = validDate(item.isoDate || item.pubDate, now);
      if (!title || !publishedAt || (source.aiOnly && !isAboutAI(title, description))) return [];
      const url = safeUrl(item.link, source.homepage);
      const category = classifySignal(title, description);
      const impact = scoreImpact(title, description);
      return [{ id: stableId(source.key, url), title, description, url, source: source.name, sourceKey: source.key,
        publishedAt, category, impact, africaAngle: source.region === "africa" || hasAfricaAngle(title, description),
        whyItMatters: explainWhyItMatters(category, impact, title), sourceType: source.type }];
    }).slice(0, source.type === "research" ? 6 : 12);
    report.status = items.length ? "ok" : "empty";
    report.articleCount = items.length;
    return { items, report };
  } catch (error) {
    console.warn("NileSignal source unavailable:", source.name, error instanceof Error ? error.message : "unknown error");
    return { items: [], report };
  }
}
async function buildSnapshot(): Promise<FeedSnapshot> {
  const now = Date.now();
  const batches = await Promise.all(SIGNAL_SOURCES.map((source) => readSource(source, now)));
  const seen = new Set<string>();
  const signals = batches.flatMap((batch) => batch.items)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .filter((item) => {
      const key = fingerprint(item.title);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 160);
  return { signals, sources: batches.map((batch) => batch.report), generatedAt: new Date(now).toISOString() };
}
// Shared cache prevents repeated downloads and XML parsing for each visitor.
export const getFeedSnapshot = unstable_cache(buildSnapshot, ["nilesignal-feed-v3"], { revalidate: 900 });
export async function getSignals(limit = 90) {
  const snapshot = await getFeedSnapshot();
  return snapshot.signals.slice(0, limit);
}
