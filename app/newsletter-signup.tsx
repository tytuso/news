"use client";

import { useState, type FormEvent } from "react";

export default function NewsletterSignup({ enabled }: { enabled: boolean }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || busy || !consent) return;
    setBusy(true);
    setMessage(null);
    const honey = (new FormData(event.currentTarget).get("company") || "").toString();
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, consent, company: honey })
      });
      const result = await response.json() as { error?: string; message?: string };
      setMessage({
        ok: response.ok,
        text: result.error || result.message || (response.ok ? "Check your inbox for your confirmation link." : "Please try again.")
      });
      if (response.ok) {
        setEmail("");
        setName("");
        setConsent(false);
      }
    } catch {
      setMessage({ ok: false, text: "We couldn't reach the email service. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="newsletterSection shell" id="newsletter" aria-labelledby="newsletter-title">
      <div className="newsletterContent">
        <span className="newsletterEyebrow"><span className="newsletterSpark" aria-hidden="true">✦</span> FREE DAILY AI NEWSLETTER</span>
        <h2 id="newsletter-title">The AI news that matters.<br /><span>Delivered to you.</span></h2>
        <p>Five important stories, explained simply. One useful email every morning — no noise, no cost.</p>
        <div className="newsletterFeatures"><span>✓ Free forever</span><span>✓ One email a day</span><span>✓ Unsubscribe anytime</span></div>
      </div>
      <div className="newsletterFormWrap">
        {enabled ? (
          <form className="newsletterForm newsletterTopForm" onSubmit={subscribe}>
            <div className="newsletterFormHeading"><strong>Join NileSignal Daily</strong><span>No account needed</span></div>
            <label htmlFor="nl-email">Email address <span aria-hidden="true">*</span></label>
            <input
              id="nl-email" type="email" name="email" autoComplete="email"
              value={email} onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com" maxLength={254} required
            />
            <label htmlFor="nl-name">First name <span className="optional">(optional)</span></label>
            <input
              id="nl-name" type="text" name="name" autoComplete="given-name"
              value={name} onChange={(event) => setName(event.target.value)}
              placeholder="What should we call you?" maxLength={80}
            />
            <div className="newsletterHoneypot" aria-hidden="true">
              <label htmlFor="nl-company">Company</label>
              <input id="nl-company" type="text" name="company" tabIndex={-1} autoComplete="off" />
            </div>
            <label className="newsletterConsent">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required />
              <span>I agree to receive NileSignal's daily AI news by email. I can unsubscribe at any time.</span>
            </label>
            <button type="submit" disabled={busy || !consent}>
              {busy ? "Sending confirmation…" : "Subscribe for free →"}
            </button>
            {message ? <p className={message.ok ? "newsletterStatus ok" : "newsletterStatus error"} role="status">{message.text}</p> : null}
            <small>We’ll send a confirmation link to your inbox first. See our <a href="/privacy">privacy policy</a>.</small>
          </form>
        ) : (
          <div className="newsletterForm newsletterTopForm newsletterWaiting">
            <span className="newsletterWaitingMark" aria-hidden="true">✉</span>
            <h3>Daily AI briefing, coming soon.</h3>
            <p>We’re connecting secure email delivery. The free newsletter will open for subscriptions shortly.</p>
            <a href="#feed">Read today’s AI news <span aria-hidden="true">↓</span></a>
            <small>We won't collect email addresses until subscriptions are active.</small>
          </div>
        )}
      </div>
    </section>
  );
}
