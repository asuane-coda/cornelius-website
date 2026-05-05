# Cornelius Okeke Website — Setup Guide

## File Structure

```
cornelius-website/
├── index.html          Home page
├── about.html          About page
├── insights.html       Blog / Insights (with admin editor)
├── work-with-me.html   Services page
├── contact.html        Contact form
├── css/
│   └── style.css       All shared styles
├── js/
│   ├── main.js         Nav, hamburger, toast utility
│   └── supabase-config.js  Database helpers (configure here)
└── SETUP.md            This file
```

---

## Step 1 — Supabase (Blog Database)

1. Go to https://supabase.com and create a free account + new project.

2. In your project, go to **SQL Editor** and run this once:

```sql
CREATE TABLE blog_posts (
  id          bigserial PRIMARY KEY,
  title       text NOT NULL,
  excerpt     text,
  content     text,
  category    text DEFAULT 'Insight',
  published   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published"
  ON blog_posts FOR SELECT
  USING (published = true);

-- Allow admin writes (use service role key for production)
CREATE POLICY "Allow all writes"
  ON blog_posts FOR ALL
  USING (true)
  WITH CHECK (true);
```

3. Go to **Settings → API** and copy:
   - Project URL (looks like `https://abcdef.supabase.co`)
   - Anon/public key

4. Open `js/supabase-config.js` and replace:
```js
const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY';
```

---

## Step 2 — EmailJS (Contact Form + Newsletter)

1. Go to https://emailjs.com and create a free account.

2. Add an **Email Service** (Gmail works — connect corneliusokekehr@gmail.com).
   Copy the **Service ID**.

3. Create two **Email Templates**:

### Template 1 — Contact Form
- Template ID: e.g. `contact_form`
- Subject: `New enquiry: {{subject}}`
- Body:
```
From: {{from_name}} ({{from_email}})
Subject: {{subject}}

{{message}}
```

### Template 2 — Newsletter Signup
- Template ID: e.g. `newsletter_signup`
- Subject: `New subscriber: {{subscriber_email}}`
- Body:
```
New newsletter subscriber: {{subscriber_email}}
```

4. Go to **Account → API Keys** and copy your **Public Key**.

5. Replace these placeholders in the HTML files:

**In `contact.html`** (2 places):
```js
emailjs.init('YOUR_EMAILJS_PUBLIC_KEY');
emailjs.send('YOUR_SERVICE_ID', 'YOUR_CONTACT_TEMPLATE_ID', ...);
```

**In `index.html`** (2 places):
```js
emailjs.init('YOUR_EMAILJS_PUBLIC_KEY');
emailjs.send('YOUR_SERVICE_ID', 'YOUR_NEWSLETTER_TEMPLATE_ID', ...);
```

---

## Step 3 — Deploy to GitHub Pages

1. Create a GitHub repository (public or private).
2. Push all files to the `main` branch.
3. Go to **Settings → Pages → Source** → select `main` branch, `/ (root)`.
4. Site goes live at `https://yourusername.github.io/repo-name/`.

### Custom Domain (corneliusokeke.com)
1. In GitHub Pages settings, add custom domain: `corneliusokeke.com`
2. At your domain registrar (Namecheap, GoDaddy, etc.), add these DNS records:
   - Type A → `185.199.108.153`
   - Type A → `185.199.109.153`
   - Type A → `185.199.110.153`
   - Type A → `185.199.111.153`
   - Type CNAME → `www` → `yourusername.github.io`
3. Wait up to 24 hours for DNS propagation.
4. Enable **Enforce HTTPS** in GitHub Pages settings.

---

## Using the Blog Admin

On the Insights page, a gold pencil button (✎) appears in the bottom-right corner.

- Click it to open the **Admin Panel**
- **All Posts tab** — see all posts, publish/unpublish, edit, or delete
- **New Post tab** — write and save new posts
- Posts saved as **Published** appear immediately on the site
- Posts saved as **Draft** are hidden from visitors

> **Security note:** For a live site, protect the admin panel with a password
> or move it to a separate admin page. The current setup is fine for a personal
> site where only Cornelius uses the computer.

---

## Checklist Before Going Live

- [ ] Supabase URL and anon key set in `js/supabase-config.js`
- [ ] Supabase SQL table created
- [ ] EmailJS public key added to `contact.html` and `index.html`
- [ ] EmailJS service ID and template IDs added
- [ ] Tested contact form sends email
- [ ] Tested newsletter signup sends email
- [ ] Tested blog: created a post, published it, viewed it
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS enforced
