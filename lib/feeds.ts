import Parser from "rss-parser";
import { SIGNAL_SOURCES } from "./sources";
import {
  classifySignal,
  explainWhyItMatters,
  hasAfricaAngle,
  scoreImpact,
  type SignalCategory,
  type SignalImpact
} from "./intelligence";

type FeedItem = {
  title?: string;
  link?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
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
};

const parser = new Parser<Record<string, unknown>, FeedItem>();

function stripHtml(value = "") {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string, max = 240) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

function stableId(source: string, title: string) {
  return `${source}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80)}`;
}

async function readSource(source: (typeof SIGNAL_SOURCES)[number]): Promise<SignalItem[]> {
  try {
    const response = await fetch(source.feedUrl, {
      next: { revalidate: 900 },
      headers: {
        "User-Agent": "NileAISignal/0.1 (+https://nileai.solutions)"
      }
    });

    if (!response.ok) throw new Error(`${source.name} returned ${response.status}`);

    const xml = await response.text();
    const feed = await parser.parseString(xml);

    return (feed.items ?? [])
      .slice(0, 18)
      .map((item) => {
        const title = stripHtml(item.title ?? "Untitled update");
        const description = compact(stripHtml(item.contentSnippet || item.content || ""));
        const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();
        const category = classifySignal(title, description);
        const impact = scoreImpact(title, description);

        return {
          id: stableId(source.key, title),
          title,
          url: item.link || source.homepage,
          source: source.name,
          sourceKey: source.key,
          publishedAt,
          description,
          category,
          impact,
          africaAngle: hasAfricaAngle(title, description),
          whyItMatters: explainWhyItMatters(category, impact, title)
        };
      })
      .filter((item) => item.title && item.url);
  } catch (error) {
    console.error(`Signal source failed: ${source.name}`, error);
    return [];
  }
}

function deduplicate(items: SignalItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const fingerprint = item.title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\b(the|a|an|and|for|to|of|with)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!fingerprint || seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
}

export async function getSignals(limit = 30): Promise<SignalItem[]> {
  const batches = await Promise.all(SIGNAL_SOURCES.map(readSource));
  return deduplicate(batches.flat())
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, limit);
}
