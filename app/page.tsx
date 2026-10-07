import { getSignals } from "../lib/feeds";
import { SIGNAL_SOURCES } from "../lib/sources";

export const revalidate = 900;

const impactOrder = { Major: 0, Important: 1, Watch: 2 } as const;

function formatDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diff = Math.max(0, now.getTime() - date.getTime());
  const hours = Math.floor(diff / 3_600_000);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
  }).format(date);
}

export default async function Home() {
  const signals = await getSignals(36);
  const briefing = [...signals]
    .sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])
    .slice(0, 5);
  const lead = briefing[0] || signals[0];
  const africa = signals.filter((item) => item.africaAngle).slice(0, 4);

  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="/">
          <span className="brandMark">N</span>
          <span>Nile AI <strong>Signal</strong></span>
        </a>
        <nav>
          <a href="#briefing">Briefing</a>
          <a href="#signals">Live signals</a>
          <a href="#africa">Africa</a>
        </nav>
        <a className="navCta" href="mailto:info@nileai.solutions?subject=Nile%20AI%20Signal%20early%20access">
          Get early access
        </a>
      </header>

      <section className="hero shell">
        <div className="eyebrow"><span className="liveDot" /> Live AI intelligence</div>
        <h1>Know what changed in AI.<br /><span>Know why it matters.</span></h1>
        <p>
          Nile AI Signal monitors trusted AI sources, removes the noise and turns important
          releases, research and business moves into decision-ready intelligence.
        </p>
        <div className="heroMeta">
          <span>{SIGNAL_SOURCES.length} trusted sources in V1</span>
          <span>Refreshes every 15 minutes</span>
          <span>Original sources always linked</span>
        </div>
      </section>

      {lead ? (
        <section className="leadWrap shell">
          <a className="lead" href={lead.url} target="_blank" rel="noreferrer">
            <div className="leadTop">
              <span className={`impact impact${lead.impact}`}>{lead.impact} signal</span>
              <span>{lead.source} · {formatDate(lead.publishedAt)}</span>
            </div>
            <div className="leadGrid">
              <div>
                <div className="kicker">Top signal</div>
                <h2>{lead.title}</h2>
                <p>{lead.description || lead.whyItMatters}</p>
              </div>
              <div className="why">
                <span>Why it matters</span>
                <p>{lead.whyItMatters}</p>
                <b>Read original ↗</b>
              </div>
            </div>
          </a>
        </section>
      ) : null}

      <section id="briefing" className="section shell">
        <div className="sectionHead">
          <div>
            <span className="sectionLabel">The briefing</span>
            <h2>What deserves your attention today</h2>
          </div>
          <p>Ranked for likely product, developer and business impact — not clicks.</p>
        </div>

        <div className="briefingGrid">
          {briefing.map((item, index) => (
            <a className="briefCard" href={item.url} target="_blank" rel="noreferrer" key={item.id}>
              <span className="briefNumber">0{index + 1}</span>
              <div className="briefMeta">
                <span>{item.category}</span>
                <span>{item.source}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.whyItMatters}</p>
              <div className="cardFooter">
                <span>{formatDate(item.publishedAt)}</span>
                <span>Source ↗</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="signals" className="section shell">
        <div className="sectionHead">
          <div>
            <span className="sectionLabel">Signal stream</span>
            <h2>The latest moves, minus the noise</h2>
          </div>
          <p>Official-source updates first. Aggregated reporting and verification come next.</p>
        </div>

        <div className="stream">
          {signals.slice(0, 18).map((item) => (
            <a className="signalRow" href={item.url} target="_blank" rel="noreferrer" key={item.id}>
              <div className="signalSource">
                <span className="sourceIcon">{item.source.slice(0, 1)}</span>
                <div>
                  <strong>{item.source}</strong>
                  <span>{formatDate(item.publishedAt)}</span>
                </div>
              </div>
              <div className="signalBody">
                <div className="tags">
                  <span>{item.category}</span>
                  {item.africaAngle ? <span className="africaTag">Africa</span> : null}
                  <span className={`miniImpact mini${item.impact}`}>{item.impact}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description || item.whyItMatters}</p>
              </div>
              <span className="arrow">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section id="africa" className="section shell">
        <div className="africaPanel">
          <div className="africaIntro">
            <span className="sectionLabel">Africa signal</span>
            <h2>Global AI news is not enough.</h2>
            <p>
              We are building a dedicated layer for AI developments, deployments, policy,
              funding and opportunities that matter across African markets.
            </p>
          </div>
          <div className="africaList">
            {africa.length ? africa.map((item) => (
              <a href={item.url} target="_blank" rel="noreferrer" key={item.id}>
                <span>{item.source}</span>
                <strong>{item.title}</strong>
                <small>{formatDate(item.publishedAt)} ↗</small>
              </a>
            )) : (
              <div className="emptyState">
                <strong>Africa monitoring is being expanded.</strong>
                <span>Dedicated African technology, policy and startup sources are next.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="manifesto shell">
        <span className="sectionLabel">What we are building</span>
        <h2>From news feed to intelligence network.</h2>
        <div className="manifestoGrid">
          <div><b>01</b><strong>Monitor</strong><p>Trusted company, research, developer and regional sources.</p></div>
          <div><b>02</b><strong>Understand</strong><p>Detect duplicates, classify events and explain likely impact.</p></div>
          <div><b>03</b><strong>Personalize</strong><p>Founder, developer, investor, enterprise and Africa-specific feeds.</p></div>
          <div><b>04</b><strong>Deliver</strong><p>Web, email, Telegram, WhatsApp channels and business alerts.</p></div>
        </div>
      </section>

      <footer>
        <div className="shell footerInner">
          <div>
            <div className="brand"><span className="brandMark">N</span><span>Nile AI <strong>Signal</strong></span></div>
            <p>AI intelligence without the noise.</p>
          </div>
          <div className="footerRight">
            <span>Built by Nile AI Solutions</span>
            <a href="mailto:info@nileai.solutions">info@nileai.solutions</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
