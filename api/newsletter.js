// api/newsletter.js
// Vercel Serverless Function — handles newsletter signups via Mailjet
// ─────────────────────────────────────────────────────────────────────────────
// Environment variables required in Vercel dashboard:
//   MJ_APIKEY_PUBLIC   → your Mailjet API key
//   MJ_APIKEY_PRIVATE  → your Mailjet secret key

const { hasSupabaseAdmin, supabaseRequest } = require('./_supabase');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function storeSubscriber(email) {
  if (!hasSupabaseAdmin()) {
    console.error('NEWSLETTER_STORAGE_SKIPPED: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return false;
  }

  await supabaseRequest('/rest/v1/newsletter_subscribers?on_conflict=email', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({
      email,
      status: 'subscribed',
      source: 'website'
    })
  });

  return true;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  const apiKey    = process.env.MJ_APIKEY_PUBLIC;
  const secretKey = process.env.MJ_APIKEY_PRIVATE;
  const fromEmail = process.env.MAIL_FROM_EMAIL || 'corneliusokekehr@gmail.com';
  const fromName  = process.env.MAIL_FROM_NAME || 'Cornelius Okeke Website';
  const toEmail   = process.env.MAIL_TO_EMAIL || 'corneliusokekehr@gmail.com';
  const toName    = process.env.MAIL_TO_NAME || 'Cornelius Okeke';

  let stored = false;
  try {
    stored = await storeSubscriber(email);
  } catch (err) {
    console.error('NEWSLETTER_STORAGE_ERROR:', err.message);
  }

  if (!apiKey || !secretKey) {
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

  // 1 — Notify Cornelius of the new subscriber
  const notifyPayload = {
    Messages: [
      {
        From: {
          Email: fromEmail,
          Name:  fromName
        },
        To: [
          {
            Email: toEmail,
            Name:  toName
          }
        ],
        Subject: `New newsletter subscriber: ${email}`,
        TextPart: `You have a new newsletter subscriber.\n\nEmail: ${email}\n\nThey signed up from corneliusokeke.com`,
        HTMLPart: `
<h3>New Newsletter Subscriber</h3>
<p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
<p>They signed up from <a href="https://corneliusokeke.com">corneliusokeke.com</a></p>
        `.trim()
      }
    ]
  };

  // 2 — Send a welcome email to the new subscriber
  const welcomePayload = {
    Messages: [
      {
        From: {
          Email: fromEmail,
          Name:  'Cornelius Okeke'
        },
        To: [
          {
            Email: email
          }
        ],
        Subject: `Welcome to the HR Revolution`,
        HTMLPart: `
<p>Hi there,</p>
<p>Thank you for subscribing to my weekly HR insights.</p>
<p>Every week I share practical, honest content on HR, employee rights, hiring, and the future of work in Nigeria — no fluff, no jargon.</p>
<p>Watch your inbox.</p>
<br/>
<p>— Cornelius Chinazam Okeke, ACIPM</p>
<p>HR People & Systems Architect</p>
<p><a href="https://corneliusokeke.com">corneliusokeke.com</a></p>
        `.trim()
      }
    ]
  };

  try {
    // Send both emails
    const [notifyRes, welcomeRes] = await Promise.all([
      fetch('https://api.mailjet.com/v3.1/send', {
        method:  'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify(notifyPayload)
      }),
      fetch('https://api.mailjet.com/v3.1/send', {
        method:  'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify(welcomePayload)
      })
    ]);

    if (!notifyRes.ok || !welcomeRes.ok) {
      const err1 = await notifyRes.text();
      const err2 = await welcomeRes.text();
      console.error('Mailjet errors:', err1, err2);
      return res.status(500).json({ error: 'Failed to process subscription.' });
    }

    return res.status(200).json({ success: true, stored });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
