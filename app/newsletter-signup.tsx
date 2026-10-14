"use client";
import { useState, type FormEvent } from "react";

export default function NewsletterSignup({ enabled }: { enabled: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || busy || !consent) return;
    setBusy(true);
    setMessage(null);
    const company = String(new FormData(event.currentTarget).get("company") || "");
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, consent, company })
      });
      const result = await response.json() as { message?: string; error?: string };
      setMessage({
        ok: response.ok,
        text: result.message || result.error || (response.ok ? "Check your email to confirm." : "Please try again.")
      });
      if (response.ok) { setName(""); setEmail(""); setConsent(false); }
    } catch {
      setMessage({ ok: false, text: "Couldn't connect. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="newsletterSection" id="newsletter" aria-labelledby="newsletter-title">
      <div className="newsletterCompact">
        <h2 className="newsletterCompactTitle" id="newsletter-title">Get AI news daily.</h2>
        <div className="newsletterCompactContent">
          <>
            <form className="newsletterForm" onSubmit={subscribe}>
              <div className="newsletterFields">
                <input id="nl-name" name="name" type="text" autoComplete="given-name"
                  aria-label="Your name" placeholder="Your name" value={name} disabled={!enabled}
                  maxLength={80} minLength={2} required onChange={(event) => setName(event.target.value)} />
                <input id="nl-email" name="email" type="email" autoComplete="email"
                  aria-label="Email address" placeholder="Email address" value={email} disabled={!enabled}
                  maxLength={254} required onChange={(event) => setEmail(event.target.value)} />
              </div>
              <button className="newsletterSubscribe" type="submit" disabled={!enabled || busy || !consent}>
                {busy ? "Sending…" : "Subscribe →"}
              </button>
              <div className="newsletterHoneypot" aria-hidden="true">
                <label htmlFor="nl-company">Company</label>
                <input id="nl-company" name="company" type="text" autoComplete="off" tabIndex={-1} />
              </div>
              <label className="newsletterConsent">
                <input type="checkbox" checked={consent} disabled={!enabled} onChange={(event) => setConsent(event.target.checked)} required />
                <span>Send me daily AI news. Unsubscribe anytime. <a href="/privacy" onClick={(event) => event.stopPropagation()}>Privacy</a></span>
              </label>
              {message ? <p role="status" className={message.ok ? "newsletterStatus ok" : "newsletterStatus error"}>{message.text}</p> : null}
            </form>
            {!enabled ? <p className="newsletterUnavailable" role="status">Email signup is temporarily unavailable.</p> : null}
          </>
        </div>
      </div>
    </section>
  );
}
