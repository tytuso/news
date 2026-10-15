import type { Metadata } from "next";
import { verifyNewsletterUnsubscribeToken } from "../../../lib/newsletter";

export const metadata: Metadata = { title: "Unsubscribe | NileSignal", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = verifyNewsletterUnsubscribeToken(token);
  return <main className="newsletterStandalone">
    <a className="newsletterBack" href="/">← NileSignal</a>
    <div className="newsletterStandaloneCard">
      <span className="newsletterBadge">YOUR EMAIL PREFERENCES</span>
      <h1>Unsubscribe from NileSignal Daily</h1>
      <p>{valid
        ? "Stop receiving the daily AI news briefing? This will not affect your access to the website."
        : "This unsubscribe link is invalid. Contact hello@nileai.solutions for help."}</p>
      {valid ? <form action="/api/newsletter/unsubscribe" method="post">
        <input type="hidden" name="token" value={token} />
        <button type="submit">Confirm unsubscribe</button>
      </form> : null}
    </div>
  </main>;
}
