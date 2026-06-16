// Sends a one-off email campaign to active newsletter subscribers.

const { hasSupabaseAdmin, supabaseRequest, verifyAdminToken } = require('./_supabase');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlFromText(text) {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function sendMailjetMessages(messages, credentials) {
  const response = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ Messages: messages })
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Mailjet returned ${response.status}`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyAdminToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!hasSupabaseAdmin()) {
    return res.status(500).json({ error: 'Subscriber storage is not configured.' });
  }

  const apiKey = process.env.MJ_APIKEY_PUBLIC;
  const secretKey = process.env.MJ_APIKEY_PRIVATE;
  const fromEmail = process.env.MAIL_FROM_EMAIL || 'corneliusokekehr@gmail.com';
  const fromName = process.env.MAIL_FROM_NAME || 'Cornelius Okeke';

  if (!apiKey || !secretKey) {
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  const subject = String(req.body.subject || '').trim();
  const message = String(req.body.message || '').trim();

  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required.' });
  }

  try {
    const subscribers = await supabaseRequest(
      '/rest/v1/newsletter_subscribers?select=email&status=eq.subscribed&order=created_at.desc',
      { method: 'GET', headers: { Prefer: '' } }
    );

    const emails = Array.from(new Set((subscribers || []).map(row => row.email).filter(Boolean)));
    if (!emails.length) {
      return res.status(400).json({ error: 'There are no active subscribers yet.' });
    }

    const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
    const html = htmlFromText(message);
    let sent = 0;

    for (const group of chunk(emails, 40)) {
      const messages = group.map(email => ({
        From: { Email: fromEmail, Name: fromName },
        To: [{ Email: email }],
        Subject: subject,
        TextPart: message,
        HTMLPart: html
      }));

      await sendMailjetMessages(messages, credentials);
      sent += group.length;
    }

    return res.status(200).json({ success: true, sent });
  } catch (err) {
    console.error('CAMPAIGN_ERROR:', err);
    return res.status(500).json({ error: 'Failed to send campaign.', message: err.message });
  }
};
