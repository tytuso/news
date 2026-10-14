"use client";

import { useState, type FormEvent } from "react";

export default function NewsletterSignup({ enabled }: { enabled: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || busy || !consent) return;

    setBusy(true);
    setMessage(null);
    setReceipt(null);
    setDeliveryMessage(null);
    const company = String(new FormData(event.currentTarget).get("company") || "");
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, consent, company })
      });
      const result = await response.json() as { message?: string; error?: string; status?: string; receipt?: string };
      if (response.ok && result.status === "confirmation_requested" && result.receipt) setReceipt(result.receipt);
      setMessage({
        ok: response.ok,
        text: result.message || result.error || (response.ok ? "Check your inbox to confirm." : "Please try again.")
      });
      if (response.ok && result.status !== "confirmation_recent") {
        setName("");
        setEmail("");
        setConsent(false);
      }
    } catch {
      setMessage({ ok: false, text: "Couldn't connect. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  async function checkDelivery() {
    if (!receipt || checking) return;
    setChecking(true);
    try {
      const response = await fetch("/api/newsletter/delivery-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt })
      });
      const result = await response.json() as { state?: string; message?: string; error?: string };
      setDeliveryMessage(result.message || result.error || "No new status available.");
    } catch {
      setDeliveryMessage("We couldn't reach Brevo to check delivery. Try again later.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="newsletterSection" id="newsletter" aria-labelledby="newsletter-title">
      <div className="newsletterGlow" aria-hidden="true" />
      <div className="newsletterPulse" aria-hidden="true"><span /><span /><span /></div>
      <div className="newsletterInner">
        <div className="newsletterPitch">
          <div className="newsletterEyebrow"><span className="newsletterEyebrowDot" aria-hidden="true" /> NILESIGNAL DAILY</div>
          <h2 id="newsletter-title">AI news.<br /><span>Delivered daily.</span></h2>
          <p>5 stories worth knowing. One free email every morning.</p>
          <div className="newsletterFreeLabel"><span aria-hidden="true">✦</span> Free, always.</div>
        </div>

        <div className="newsletterSignupCard">
          <form className="newsletterForm" onSubmit={subscribe}>
            <div className="newsletterFields">
              <label className="newsletterInputGroup" htmlFor="nl-name">
                <span>Your name</span>
                <input id="nl-name" name="name" type="text" autoComplete="given-name"
                  placeholder="Enter your name" value={name} disabled={!enabled}
                  maxLength={80} minLength={2} required onChange={(event) => setName(event.target.value)} />
              </label>
              <label className="newsletterInputGroup" htmlFor="nl-email">
                <span>Email address</span>
                <input id="nl-email" name="email" type="email" autoComplete="email"
                  placeholder="you@example.com" value={email} disabled={!enabled}
                  maxLength={254} required onChange={(event) => setEmail(event.target.value)} />
              </label>
            </div>

            <div className="newsletterHoneypot" aria-hidden="true">
              <label htmlFor="nl-company">Company</label>
              <input id="nl-company" name="company" type="text" autoComplete="off" tabIndex={-1} />
            </div>

            <label className="newsletterConsent">
              <input type="checkbox" checked={consent} disabled={!enabled}
                onChange={(event) => setConsent(event.target.checked)} required />
              <span>Send me daily AI news. <a href="/privacy">Privacy</a> · Unsubscribe anytime.</span>
            </label>

            <button className="newsletterSubscribe" type="submit" disabled={!enabled || busy || !consent}>
              <span>{busy ? "Sending…" : "Subscribe for free"}</span>
              {!busy && <span aria-hidden="true">↗</span>}
            </button>

            {message ? <p role="status" className={message.ok ? "newsletterStatus ok" : "newsletterStatus error"}>{message.text}</p> : null}
            {receipt ? <div className="newsletterDelivery">
              <button type="button" onClick={checkDelivery} disabled={checking}>
                {checking ? "Checking Brevo…" : "Check email delivery status ↗"}
              </button>
              {deliveryMessage ? <p role="status">{deliveryMessage}</p> : null}
            </div> : null}
            {!enabled && <p role="status" className="newsletterUnavailable">Email signup is temporarily unavailable.</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
