import type { Metadata } from "next";
export const metadata: Metadata = { title: "Confirm your subscription | NileSignal", robots: { index: false, follow: false } };
export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main className="newsletterStandalone">
    <a href="/" className="newsletterBack">← NileSignal</a>
    <div className="newsletterStandaloneCard">
      <span className="newsletterBadge">ONE LAST STEP</span>
      <h1>Confirm your email</h1>
      <p>Click below to start receiving a short AI news digest every morning. You can unsubscribe in one click, anytime.</p>
      {typeof token === "string" && token.length < 700 ? <form method="post" action="/api/newsletter/confirm">
        <input type="hidden" name="token" value={token} />
        <button type="submit">Yes, subscribe me →</button>
      </form> : <p className="newsletterStatus error">This link is missing or invalid. Please subscribe again from the homepage.</p>}
    </div>
  </main>;
}
