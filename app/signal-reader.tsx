"use client";

import { useEffect, useMemo, useState } from "react";
import type { SignalItem } from "../lib/feeds";
import type { SignalSource } from "../lib/sources";

type FeedFilter = "All" | "Important" | "Africa" | "Models" | "Tools" | "Business" | "Research" | "Saved";
type SortOrder = "latest" | "impact";
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type SourceInfo = Pick<SignalSource, "key" | "name" | "homepage" | "region" | "type">;
const filters: FeedFilter[] = ["All", "Important", "Africa", "Models", "Tools", "Business", "Research", "Saved"];
const impactRank: Record<SignalItem["impact"], number> = { Major: 0, Important: 1, Watch: 2 };

function dateValue(date: string) { return date ? Date.parse(date) || 0 : 0; }
function timeAgo(value: string) {
  const timestamp = dateValue(value);
  if (!timestamp) return "Date unavailable";
  const diff = Math.max(0, Date.now() - timestamp);
  const hours = Math.floor(diff / 3600000);
  if (hours === 0) return "Just now";
  if (hours < 24) return hours + "h ago";
  if (hours < 48) return "Yesterday";
  const days = Math.floor(diff / 86400000);
  if (days < 7) return days + "d ago";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: new Date(value).getFullYear() < new Date().getFullYear() ? "numeric" : undefined }).format(new Date(value));
}
function filterMatch(item: SignalItem, filter: FeedFilter, saved: string[]) {
  if (filter === "Important") return item.impact !== "Watch";
  if (filter === "Africa") return item.africaAngle;
  if (filter === "Models") return item.category === "Models";
  if (filter === "Tools") return item.category === "Developers" || item.category === "Products";
  if (filter === "Business") return item.category === "Business";
  if (filter === "Research") return item.category === "Research" || item.category === "Safety";
  if (filter === "Saved") return saved.includes(item.id);
  return true;
}

export default function SignalReader({ signals, sources }: { signals: SignalItem[]; sources: SourceInfo[] }) {
  const [filter, setFilter] = useState<FeedFilter>("All");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<SortOrder>("latest");
  const [visible, setVisible] = useState(12);
  const [saved, setSaved] = useState<string[]>([]);
  const [dark, setDark] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [copyState, setCopyState] = useState("");

  useEffect(() => {
    try {
      const previous = JSON.parse(localStorage.getItem("nilesignal-bookmarks") || "[]");
      if (Array.isArray(previous)) setSaved(previous.filter((item): item is string => typeof item === "string"));
      const isDark = localStorage.getItem("nilesignal-theme") === "dark";
      setDark(isDark);
      document.documentElement.dataset.theme = isDark ? "dark" : "light";
    } catch {}
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const listener = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    window.addEventListener("beforeinstallprompt", listener);
    return () => window.removeEventListener("beforeinstallprompt", listener);
  }, []);

  const sorted = useMemo(() => [...signals].sort((a, b) => {
    if (order === "impact") return impactRank[a.impact] - impactRank[b.impact] || dateValue(b.publishedAt) - dateValue(a.publishedAt);
    return dateValue(b.publishedAt) - dateValue(a.publishedAt);
  }), [signals, order]);

  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sorted.filter((item) => filterMatch(item, filter, saved) && (
      !needle || (item.title + " " + item.description + " " + item.source + " " + item.category).toLowerCase().includes(needle)
    ));
  }, [sorted, filter, query, saved]);

  const briefing = useMemo(() => [...signals].sort((a, b) =>
    impactRank[a.impact] - impactRank[b.impact] || dateValue(b.publishedAt) - dateValue(a.publishedAt)
  ).slice(0, 3), [signals]);

  const latest = signals.length ? [...signals].sort((a,b) => dateValue(b.publishedAt) - dateValue(a.publishedAt))[0] : null;
  const africaCount = signals.filter((item) => item.africaAngle).length;
  const selectFilter = (value: FeedFilter) => { setFilter(value); setVisible(12); };
  const toggleSaved = (id: string) => {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id];
      try { localStorage.setItem("nilesignal-bookmarks", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("nilesignal-theme", next ? "dark" : "light"); } catch {}
  };
  const share = async (item: SignalItem) => {
    try {
      await navigator.clipboard.writeText(item.title + "\n" + item.url);
      setCopyState(item.id);
    } catch {
      setCopyState("");
    }
  };

  return (
    <div className="site">
      <header className="header">
        <div className="shell headerInner">
          <a href="/" className="brand" aria-label="NileSignal home">
            <span className="brandIcon" aria-hidden="true">N<span className="brandDot" /></span>
            <span>Nile<span className="brandBold">Signal</span><small>by Nile AI</small></span>
          </a>
          <nav className="headerNav" aria-label="Main navigation">
            <a href="#feed">Latest news</a>
            <a href="#sources">Our sources</a>
          </nav>
          <div className="navActions">
            <button type="button" className="iconButton" onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}>{dark ? "☀" : "☾"}</button>
            <a className="headerRss" href="/api/rss" target="_blank" rel="noreferrer">RSS <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero shell">
          <div className="heroText">
            <div className="eyebrow"><span className="statusDot" /> Your daily AI news, simplified</div>
            <h1>Stay ahead of AI.<br/><span>Skip the noise.</span></h1>
            <p>One place for important AI launches, research and business moves — explained in plain English, with links to the original stories.</p>
            <div className="heroStats">
              <span><strong>{sources.length}</strong> sources configured</span>
              <span className="statDivider" aria-hidden="true" />
              <span>Updated every 15 minutes</span>
            </div>
            <a className="primaryButton" href="#feed">Explore the news <span aria-hidden="true">↓</span></a>
          </div>
          <div className="dailyBrief">
            <div className="dailyBriefTop"><span className="spark">✳</span><span>THE QUICK BRIEF</span><span className="briefPill">TOP 3</span></div>
            <h2>Worth knowing</h2>
            <p className="briefIntro">A quick scan of the biggest updates in the feed.</p>
            {briefing.length ? <div className="briefItems">{briefing.map((item, index) =>
              <a key={item.id} className="briefItem" href={item.url} target="_blank" rel="noopener noreferrer">
                <span className="briefIndex">0{index + 1}</span>
                <span><strong>{item.title}</strong><small>{item.source} · {timeAgo(item.publishedAt)}</small></span>
                <span className="briefArrow" aria-hidden="true">↗</span>
              </a>
            )}</div> : <div className="briefEmpty">We couldn’t load the latest feeds right now. Please refresh shortly or visit the original sources below.</div>}
            <span className="briefNote">Ranked by estimated impact, not editorial verification.</span>
          </div>
        </section>

        <section className="feedSection" id="feed">
          <div className="shell feedShell">
            <div className="feedHeading">
              <div><div className="sectionEyebrow">THE FEED</div><h2>What’s happening in AI</h2><p>Browse, search, and save the updates that matter to you.</p></div>
              <div className="feedSummary"><span className="statusDot" /> {signals.length ? signals.length + " recent updates" : "Checking sources"}</div>
            </div>
            <div className="filters" role="group" aria-label="Filter news">
              {filters.map((name) => <button key={name} className={filter === name ? "filter active" : "filter"} type="button" aria-pressed={filter === name} onClick={() => selectFilter(name)}>{name === "Saved" ? "☆ " : ""}{name}</button>)}
            </div>
            <div className="toolbar">
              <label className="searchBox"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisible(12); }} placeholder="Search news, companies or topics" aria-label="Search news" /></label>
              <label className="sortBox"><span>Sort by</span><select value={order} onChange={(event) => setOrder(event.target.value as SortOrder)} aria-label="Sort news"><option value="latest">Newest first</option><option value="impact">Most important</option></select></label>
            </div>

            <div className="contentGrid">
              <div className="stories">
                {matching.length ? matching.slice(0, visible).map((item) =>
                  <article className="story" key={item.id}>
                    <div className="storyMain">
                      <div className="storyMeta">
                        <span className="sourceLabel"><span className="sourceMark">{item.source.charAt(0)}</span>{item.source}</span>
                        <span className="metaSep">·</span>
                        <time dateTime={item.publishedAt || undefined}>{timeAgo(item.publishedAt)}</time>
                        {item.impact === "Major" ? <span className="importantTag">Big update</span> : null}
                        {item.africaAngle ? <span className="africaBadge">Africa</span> : null}
                      </div>
                      <a className="storyLink" href={item.url} target="_blank" rel="noopener noreferrer"><h3>{item.title} <span aria-hidden="true">↗</span></h3></a>
                      {item.description ? <p className="storyDescription">{item.description}</p> : null}
                      <p className="storyContext"><strong>Why it matters</strong> {item.whyItMatters}</p>
                      <div className="storyBottom">
                        <span className="categoryTag">{item.category}</span>
                        <div className="storyActions">
                          <button type="button" onClick={() => toggleSaved(item.id)} className={saved.includes(item.id) ? "action saved" : "action"} aria-label={saved.includes(item.id) ? "Remove bookmark" : "Save article"} title={saved.includes(item.id) ? "Saved" : "Save article"}>{saved.includes(item.id) ? "★ Saved" : "☆ Save"}</button>
                          <button type="button" onClick={() => share(item)} className="action" aria-label={"Copy link to " + item.title}>{copyState === item.id ? "✓ Copied" : "↗ Share"}</button>
                        </div>
                      </div>
                    </div>
                  </article>
                ) : <div className="noStories"><div className="noStoriesIcon">⌕</div><h3>{filter === "Saved" ? "No saved stories yet" : "No stories found"}</h3><p>{filter === "Saved" ? "Use the Save button on any story to keep it here on this device." : signals.length ? "Try another topic or clear your search." : "The source feeds are temporarily unavailable. Check again later."}</p><button type="button" onClick={() => { setQuery(""); selectFilter("All"); }}>Show all news</button></div>}
                {matching.length > visible ? <button type="button" className="loadMore" onClick={() => setVisible((current) => current + 12)}>Show more stories <span aria-hidden="true">↓</span></button> : null}
                {matching.length > 0 ? <p className="resultsText">Showing {Math.min(visible, matching.length)} of {matching.length} matching updates</p> : null}
              </div>
              <aside className="sidebar">
                <div className="sideCard">
                  <div className="sideKicker">QUICK FILTERS</div>
                  <h3>Find what matters.</h3>
                  <button type="button" onClick={() => selectFilter("Important")}><span>✦ Big developments</span><span>→</span></button>
                  <button type="button" onClick={() => selectFilter("Africa")}><span>◉ AI across Africa</span><span>{africaCount} →</span></button>
                  <button type="button" onClick={() => selectFilter("Tools")}><span>⌘ Builders & tools</span><span>→</span></button>
                  <button type="button" onClick={() => selectFilter("Saved")}><span>☆ Your saved stories</span><span>{saved.length} →</span></button>
                </div>
                <div className="sideCard lightSide">
                  <div className="sideKicker">STAY IN THE LOOP</div>
                  <h3>Prefer a news reader?</h3>
                  <p>Follow our RSS feed in any news reader. It updates automatically, with original article links.</p>
                  <a className="sideRssLink" href="/api/rss" target="_blank" rel="noreferrer">Open RSS feed ↗</a>
                  {installPrompt ? <button className="installButton" type="button" onClick={async () => { await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); }}>Install NileSignal app ↓</button> : null}
                </div>
                {latest ? <div className="sideFoot">Latest indexed article<br/><strong>{timeAgo(latest.publishedAt)}</strong></div> : null}
              </aside>
            </div>
          </div>
        </section>

        <section className="sourcesSection shell" id="sources">
          <div className="sourcesIntro"><div><div className="sectionEyebrow">TRANSPARENT BY DESIGN</div><h2>Real sources. Original stories.</h2><p>NileSignal brings together company announcements, research, reporting and African technology coverage. We show the publisher so you can check the facts yourself.</p></div><span className="sourcesCount">{sources.length}<small>FEEDS CONFIGURED</small></span></div>
          <details className="sourcesDetails"><summary>See our sources <span aria-hidden="true">⌄</span></summary><div className="sourceList">{sources.map((source) => <a href={source.homepage} target="_blank" rel="noopener noreferrer" key={source.key}><span>{source.name}</span><small>{source.region === "africa" ? "Africa" : source.type === "official" ? "Official" : source.type === "research" ? "Research" : "News"} ↗</small></a>)}</div></details>
        </section>
        <section className="disclaimer shell">Summaries and impact labels are automated estimates, not independent fact checks or investment advice. Some publisher feeds may temporarily be unavailable.</section>
      </main>
      <footer className="footer"><div className="shell footerInner"><div className="footerBrand"><span className="brandIcon mini">N</span><div><strong>NileSignal</strong><small>AI news without the noise.</small></div></div><div className="footerLinks"><a href="https://nileai.solutions" target="_blank" rel="noopener noreferrer">Nile AI Solutions ↗</a><a href="mailto:info@nileai.solutions?subject=NileSignal%20feedback">Send feedback</a><a href="/api/rss">RSS</a></div><span className="copyright">© {new Date().getFullYear()} Nile AI Solutions</span></div></footer>
    </div>
  );
}
