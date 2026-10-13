# NileSignal — AI news without the noise

**Live site:** https://signal.nileai.solutions

NileSignal is a free mobile-first AI news reader built with Next.js. It collects RSS feeds from AI labs, researchers, developers and African technology publishers.

## Daily email newsletter
The free daily email briefing uses **Brevo Marketing Campaigns**, not promotional content sent via transactional email. It includes 5 recent stories, brief context and original links, with Brevo's native unsubscribe link.

- Name/email signup, explicit consent, and one-time email confirmation before adding the subscriber to the mailing list
- Email is stored in a dedicated **Brevo contact list**, not in your website's database
- Native unsubscribe page managed by Brevo, no login required
- Free newsletter audience capped at **200 subscribed contacts** to leave room below Brevo Free's 300 sends/day for opt-in confirmations
- Vercel Cron invokes GET /api/cron/daily-news at **06:00 UTC daily (09:00 Africa/Kampala)**; Hobby schedules are approximate within the hour
- Campaign name includes UTC date, and duplicates are checked before creation, preventing most accidental double sending
- If no recent news or subscribers exist, no campaign is sent
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
6. Test signup with your own email, confirm it, and verify the contact appears in the right Brevo list.

**No email is sent until Brevo is configured.** Email quota and account-review restrictions apply. Signup endpoint has a honeypot and best-effort instance-local throttling; for heavy traffic, add a durable rate limiter or Cloudflare Turnstile.

### Privacy
Brevo stores names and email addresses only after confirmation. Subscribers can unsubscribe through each campaign's built-in unsubscribe link or contact info@nileai.solutions. See /privacy.

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
