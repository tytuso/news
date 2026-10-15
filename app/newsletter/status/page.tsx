import type { Metadata } from "next";
export const metadata: Metadata = { title: "Newsletter subscription | NileSignal", robots: { index: false, follow: false } };
const messages = {
  confirmed: ["You're subscribed!", "You're on the list. Your first AI briefing will arrive with the next daily send."],
  unsubscribed: ["Unsubscribed", "You will no longer receive NileSignal Daily emails. You can still read AI news on our website."],
  already: ["You're already subscribed", "This email is already on the NileSignal Daily list. You will receive the next daily briefing."],
  opted_out: ["You previously unsubscribed", "We will respect your choice not to receive emails. Contact Nile AI Solutions if you wish to rejoin."],
  expired: ["Confirmation link expired", "That link is invalid or has expired. Please request a new email from the NileSignal homepage."],
  full: ["The free list is full", "Our free email quota is currently full. You can still read every story on the website."],
  unavailable: ["Unable to confirm", "The email service is temporarily unavailable. Please try your confirmation link again."]
} as const;
export default async function StatusPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { result } = await searchParams;
  const [title, description] = messages[result as keyof typeof messages] || messages.unavailable;
  return <main className="newsletterStandalone"><a href="/" className="newsletterBack">← NileSignal</a>
    <div className="newsletterStandaloneCard"><span className="newsletterBadge">NILESIGNAL DAILY</span><h1>{title}</h1><p>{description}</p><a href="/" className="newsletterReturn">Back to the AI news →</a></div>
  </main>;
}
