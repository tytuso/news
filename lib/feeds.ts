import Parser from "rss-parser";
import { SIGNAL_SOURCES, type SignalSource } from "./sources";
import { classifySignal, explainWhyItMatters, hasAfricaAngle, isAboutAI, scoreImpact, type SignalCategory, type SignalImpact } from "./intelligence";

type FeedItem = {
  title?: string;
  link?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
  guid?: string;
};

export type SignalItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceKey: string;
  publishedAt: string;
  description: string;
  category: SignalCategory;
  impact: SignalImpact;
  africaAngle: boolean;
  whyItMatters: string;
  sourceType: SignalSource["type"];
};

const parser = new Parser<Record<string, unknown>, FeedItem>({ timeout: 8000 });

function stripHtml(value = ""): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string, max = 220): string {
  return value.length <= max ? value : value.slice(0, max).trimEnd() + "…";
}

function validUrl(value: string | undefined, fallback: string): string {
  try {
    const parsed = new URL(value || fallback);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

function fingerprint(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\b(the|a|an|and|for|to|of|with|new)\b/g, "").replace(/\s+/g, " ").trim();
}

async function readSource(source: SignalSource): Promise<SignalItem[]> {
  try {
    const response = await fetch(source.feedUrl, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "NileAISignal/1.0 (https://signal.nileai.solutions)" }
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const feed = await parser.parseString(await response.text());
    return (feed.items || []).slice(0, 18).flatMap((item) => {
      const title = stripHtml(item.title || "");
      const description = compact(stripHtml(item.contentSnippet || item.summary || item.content || ""));
      if (!title || (source.aiOnly && !isAboutAI(title, description))) return [];
      const dateString = item.isoDate || item.pubDate || "";
      const date = dateString ? new Date(dateString) : null;
      const publishedAt = date && Number.isFinite(date.getTime()) ? date.toISOString() : "";
      const category = classifySignal(title, description);
      const impact = scoreImpact(title, description);
      return [{
        id: source.key + "-" + fingerprint(item.guid || item.link || title).slice(0, 90),
        title,
        description,
        url: validUrl(item.link, source.homepage),
        source: source.name,
        sourceKey: source.key,
        publishedAt,
        category,
        impact,
        africaAngle: source.region === "africa" || hasAfricaAngle(title, description),
        whyItMatters: explainWhyItMatters(category, impact, title),
        sourceType: source.type
      }];
    });
  } catch (error) {
    // One unavailable provider must never break the entire reader.
    console.warn("NileSignal source unavailable:", source.name, error instanceof Error ? error.message : "unknown error");
    return [];
  }
}

export async function getSignals(limit = 90): Promise<SignalItem[]> {
  const batches = await Promise.all(SIGNAL_SOURCES.map(readSource));
  const seen = new Set<string>();
  const items = batches.flat().sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0));
  return items.filter((item) => {
    const key = fingerprint(item.title);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}
