# NileSignal — AI news without the noise

**Live site:** https://signal.nileai.solutions

NileSignal is a free mobile-first AI news reader built with Next.js. It collects RSS feeds from AI labs, researchers, developers and African technology publishers.

## Daily email newsletter
The free daily email briefing uses **Brevo Marketing Campaigns**, not promotional content sent via transactional email. It features up to 10 important recent stories (depending on availability), concise context, clear source links, and a prominent footer link to signal.nileai.solutions, with Brevo's native unsubscribe link.

- Name/email signup with explicit, unchecked-by-default consent; contacts are added immediately to Brevo List #5 without a confirmation email
- Email is stored in a dedicated **Brevo contact list**, not in your website's database
- Native unsubscribe page managed by Brevo, no login required
- Free newsletter audience capped at **200 subscribed contacts** to remain below Brevo Free's current 300 emails/day allowance
- Vercel Cron invokes GET /api/cron/daily-news at **06:00 UTC daily (09:00 Africa/Kampala)**; Hobby schedules are approximate within the hour
- Campaign uses the Uganda local date, and duplicates are checked before creation, preventing most accidental double sending
- If no recent news or subscribers exist, no campaign is sent; the story selector uses the last 72 hours, prioritizes estimated impact, and limits any one publisher to two stories
- When the email provider is not configured, the UI displays a clear **coming soon** state rather than a broken form

### Activate the newsletter
1. Create a free Brevo account and verify a sending domain/sender matching the sender email.
2. In Brevo Contacts, create a list called **NileSignal Daily**. Copy its numeric List ID.
3. Under Vercel > NileSignal > Settings > Environment Variables (production), add:
   - BREVO_API_KEY = your Brevo API key (sensitive / encrypted)
   - BREVO_LIST_ID = numeric list ID
   - BREVO_FROM_EMAIL = verified sender email, for example info@nileai.solutions
4. Ensure NEWSLETTER_SECRET and CRON_SECRET exist (both must be long, random secrets and never added to client-side variables).
5. Redeploy production so the new variables are available; after deployment the signup form automatically becomes active.
6. Test signup using your own email and check that it appears in the right Brevo list immediately. A confirmation email is not sent.

**No confirmation email is sent during signup.** Email quota and account-review restrictions still apply to the daily newsletter. Single opt-in has greater risk of invalid or malicious signups than double opt-in; the form uses explicit consent, a honeypot, and best-effort instance-local throttling. Before promoting heavily on YouTube, add durable rate limits and a bot challenge (for example Cloudflare Turnstile) to guard deliverability.

### Privacy
Brevo stores names and email addresses as soon as the visitor explicitly consents and clicks Subscribe; no email verification is performed. Subscribers can unsubscribe through each campaign's built-in unsubscribe link or contact info@nileai.solutions. See /privacy.

### Preview before sending
Visit https://signal.nileai.solutions/newsletter/preview to view a browser rendering of the same email template and selected stories **without sending any messages**. For an actual delivery test, create a draft campaign in Brevo and use its **Send test** action to one chosen email address. A preview does not prove deliverability; check the first scheduled campaign in Brevo after 9 AM Uganda time.

## Reader features
- 20 source feeds configured; each fetched independently
- Recent AI news, headline deduplication, and cached snapshots that refresh on-demand within about 15 minutes
- Brief rule-based impact labels and topic classification, *not* a paid LLM
- Search, publisher selector, bookmarks saved to the browser, dark mode, mobile sharing, RSS/PWA
- JSON feed: /api/feed; RSS: /api/rss; health check: /api/health
- GitHub Action checks the site's feed every six hours and opens an issue if it goes down.

## Development
npm install
npm run dev
npm run build

## Editorial note
News descriptions are publisher metadata; impact labels and short explanations are automated estimates, not verified analysis. Some RSS sources may block access or be unavailable.
