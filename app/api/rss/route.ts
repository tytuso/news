import { getSignals } from "../../../lib/feeds";

export const dynamic = "force-dynamic";

function xmlSafe(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const signals = await getSignals(70);
  const items = signals.map((item) => (
    "<item><title>" + xmlSafe(item.title) + "</title>" +
    "<link>" + xmlSafe(item.url) + "</link>" +
    "<guid isPermaLink=\"false\">" + xmlSafe(item.id) + "</guid>" +
    (item.publishedAt ? "<pubDate>" + new Date(item.publishedAt).toUTCString() + "</pubDate>" : "") +
    "<description>" + xmlSafe(item.description || item.whyItMatters) + "</description>" +
    "<category>" + xmlSafe(item.category) + "</category>" +
    "</item>"
  )).join("");
  const xml = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<rss version="2.0"><channel><title>Nile AI Signal</title>' +
    '<link>https://signal.nileai.solutions/</link>' +
    '<description>AI news that matters, with original sources.</description>' +
    '<language>en</language>' + items + '</channel></rss>';
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" } });
}
