"use client";
import { useState, type FormEvent } from "react";

export default function NewsletterSignup({ enabled }: { enabled: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || busy) return;
    setBusy(true); setState(null);
    const form = event.currentTarget;
    const honey = (new FormData(form).get("company") || "").toString();
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, consent, company: honey })
      });
      const result = await response.json() as { error?: string; message?: string };
      setState({ ok: response.ok, text: result.error || result.message || (response.ok ? "Check your inbox." : "Something went wrong. Please try again.") });
      if (response.ok) { setName(""); setEmail(""); setConsent(false); }
    } catch { setState({ ok: false, text: "Could not connect. Please try again." }); }
    finally { setBusy(false); }
  }
  return <section className="newsletterSection shell" id="newsletter" aria-labelledby="newsletter-title">
    <div className="newsletterContent">
      <div className="newsletterEyebrow"><span className="newsletterSpark">✦</span> THE DAILY BRIEFING</div>
      <h2 id="newsletter-title">AI news in your inbox.<br/><span>Not another noisy newsletter.</span></h2>
      <p>Five important AI stories. Plain-English explanations. One simple email every morning.</p>
      <div className="newsletterFeatures"><span>✓ Free to subscribe</span><span>✓ No spam</span><span>✓ Unsubscribe anytime</span></div>
    </div>
    <div className="newsletterFormWrap">
      {enabled ? <form className="newsletterForm" onSubmit={submit}>
        <label htmlFor="nl-name">Your name</label>
        <input id="nl-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} minLength={2} required placeholder="e.g. Alex" autoComplete="given-name" />
        <label htmlFor="nl-email">Email address</label>
        <input id="nl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} required placeholder="you@example.com" autoComplete="email" />
        <div aria-hidden="true" className="newsletterHoneypot"><label htmlFor="nl-company">Company</label><input name="company" id="nl-company" type="text" tabIndex={-1} autoComplete="off" /></div>
        <label className="newsletterConsent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required/><span>I agree to receive NileSignal's daily AI newsletter by email. I can unsubscribe any time.</span></label>
        <button type="submit" disabled={busy || !consent}>{busy ? "Sending confirmation…" : "Get the free daily briefing →"}</button>
        {state ? <p role="status" className={state.ok ? "newsletterStatus ok" : "newsletterStatus error"}>{state.text}</p> : null}
        <small>We'll email you a confirmation link first. Your details are used only for this newsletter. <a href="/privacy">Privacy</a>.</small>
      </form> : <div className="newsletterForm unavailable">
        <span className="newsletterComingIcon">✉</span>
        <h3>Daily emails are coming soon.</h3>
        <p>We're finishing the email provider connection. You can still read every AI story here for free.</p>
        <a href="#feed">Browse the latest news ↗</a>
      </div>}
    </div>
  </section>;
}
