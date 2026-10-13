import type { Metadata } from "next";
export const metadata: Metadata = { title: "Newsletter Privacy | NileSignal" };
export default function PrivacyPage() {
  return <main className="newsletterStandalone privacyPage"><a href="/" className="newsletterBack">← NileSignal</a>
    <div className="newsletterStandaloneCard"><span className="newsletterBadge">PRIVACY</span><h1>Your email is yours.</h1>
      <p>When you subscribe to NileSignal Daily, we collect the name and email address you provide to send a free daily AI news newsletter.</p>
      <h2>What happens to your information?</h2>
      <p>We use Brevo as our email service provider. Your contact details are stored in our newsletter audience there. We don't sell your information or use it to send unrelated messages.</p>
      <h2>Confirming and leaving</h2>
      <p>We send a confirmation email before adding you to our mailing list. Every daily email includes an unsubscribe link, managed by Brevo. You can also request removal of your contact data at <a href="mailto:info@nileai.solutions">info@nileai.solutions</a>.</p>
      <h2>How often will we email you?</h2>
      <p>Approximately once daily, when there are recent AI stories to share. We may also send the one-time confirmation email you request.</p>
      <p>Last updated October 13, 2026.</p>
    </div>
  </main>;
}
