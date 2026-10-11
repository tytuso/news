# NileSignal

**Stay ahead of AI. Skip the noise.**

NileSignal is a free, mobile-first AI news reader by Nile AI Solutions. It aggregates RSS and Atom updates from labs, researchers, developers, technology publishers, and African technology outlets.

## What is live
- 21 configured sources, fetched individually so failures are isolated.
- AI-only filtering for broader feeds, normalised metadata, duplicate removal, original-source links.
- Automated, rule-based categories, rough impact indicators, and "why it matters" context (these are **not** independently verified AI analyses).
- One readable, searchable, sortable feed with tabs for important stories, Africa, models, developers, business, research and bookmarks.
- Local browser bookmarks and light/dark theme.
- RSS at /api/rss and JSON at /api/feed. The source fetch cache revalidates approximately every 15 minutes when visited.
- Basic installable PWA, with an offline cache of the last visited homepage.
- Responsive design and transparent source list; no sign-up or paid API needed.

## Deployment
Deploy the GitHub repository with Vercel's Next.js preset. Node 22+.
Suggested subdomain: signal.nileai.solutions. Add it under Vercel Project > Domains, then create the CNAME record Vercel specifies in Hostinger.
No environment variables required.

## Development
npm install
npm run dev

## Editorial note
Publisher descriptions are automated summaries of RSS metadata. "Why it matters" and impact labels are topic-based heuristics, not fact-checks, financial advice, or full LLM-generated analysis. RSS providers can change their URLs, publication cadence or access policies.
