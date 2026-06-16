// api/newsletter.js
// Vercel Serverless Function — handles newsletter signups via Mailjet
// ─────────────────────────────────────────────────────────────────────────────
// Environment variables required in Vercel dashboard:
//   MJ_APIKEY_PUBLIC   → your Mailjet API key
//   MJ_APIKEY_PRIVATE  → your Mailjet secret key

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  const apiKey    = process.env.MJ_APIKEY_PUBLIC;
  const secretKey = process.env.MJ_APIKEY_PRIVATE;

  if (!apiKey || !secretKey) {
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

  // 1 — Notify Cornelius of the new subscriber
  const notifyPayload = {
    Messages: [
      {
        From: {
          Email: 'corneliusokekehr@gmail.com', // TODO: change to verified Mailjet sender
          Name:  'Cornelius Okeke Website'
        },
        To: [
          {
            Email: 'corneliusokekehr@gmail.com',
            Name:  'Cornelius Okeke'
          }
        ],
        Subject: `New newsletter subscriber: ${email}`,
        TextPart: `You have a new newsletter subscriber.\n\nEmail: ${email}\n\nThey signed up from corneliusokeke.com`,
        HTMLPart: `
<h3>New Newsletter Subscriber</h3>
<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
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
          Email: 'corneliusokekehr@gmail.com', // TODO: change to verified Mailjet sender
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

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}