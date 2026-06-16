Vercel deployment notes
-----------------------

1. Set these Environment Variables in the Vercel Project settings:
   - `SUPABASE_URL` — your Supabase project URL (from Supabase → Settings → API)
   - `SUPABASE_ANON` — your Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` — server-only Supabase service role key for storing contact/subscriber records
   - `MJ_APIKEY_PUBLIC` — Mailjet API key
   - `MJ_APIKEY_PRIVATE` — Mailjet secret key
   - `MAIL_FROM_EMAIL` — a Mailjet verified sender address, ideally on a verified domain
   - `MAIL_TO_EMAIL` — Cornelius' receiving inbox

2. Vercel will run `npm run vercel-build` during the build phase which executes `build-env.js` and writes `cornelius-website/js/env.js`.

3. The site is served from the `cornelius-website` folder. `vercel.json` rewrites requests to that folder.

4. For local development, create `cornelius-website/js/env.js` manually with the following shape:

```js
window.__ENV = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON: 'sb_publishable_...'
};
```

5. After deployment, verify pages that use Supabase are working and that no secret values are committed to the repo.

6. Create the storage tables used by the admin dashboard:

```sql
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id bigserial PRIMARY KEY,
  email text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'subscribed',
  source text DEFAULT 'website',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read subscribers"
  ON newsletter_subscribers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins read contact submissions"
  ON contact_submissions FOR SELECT
  USING (auth.role() = 'authenticated');
```
