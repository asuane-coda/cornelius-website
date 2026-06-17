// api/contact.js
// Vercel Serverless Function — handles contact form submissions via Mailjet
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

async function storeContactSubmission(submission) {
  if (!hasSupabaseAdmin()) {
    console.error('CONTACT_STORAGE_SKIPPED: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return false;
  }

  await supabaseRequest('/rest/v1/contact_submissions', {
    method: 'POST',
    body: JSON.stringify({
      name: submission.from_name,
      email: submission.from_email,
      subject: submission.subject,
      message: submission.message,
      status: 'new'
    })
  });

  return true;
}

module.exports = async function handler(req, res) {
  console.log('API_CONTACT_CALLED', { method: req.method });

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { from_name, from_email, subject, message } = req.body;

  // Basic validation
  if (!from_name || !from_email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const apiKey    = process.env.MJ_APIKEY_PUBLIC;
  const secretKey = process.env.MJ_APIKEY_PRIVATE;
  const fromEmail = process.env.MAIL_FROM_EMAIL || 'corneliusokekehr@gmail.com';
  const fromName  = process.env.MAIL_FROM_NAME || 'Cornelius Okeke Website';
  const toEmail   = process.env.MAIL_TO_EMAIL || 'corneliusokekehr@gmail.com';
  const toName    = process.env.MAIL_TO_NAME || 'Cornelius Okeke';

  let stored = false;
  try {
    stored = await storeContactSubmission({ from_name, from_email, subject, message });
  } catch (err) {
    console.error('CONTACT_STORAGE_ERROR:', err.message);
  }

  if (!apiKey || !secretKey) {
    console.error('MAILJET_CONFIG_ERROR: Missing keys');
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

  const payload = {
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
        ReplyTo: {
          Email: from_email,
          Name:  from_name
        },
        Subject: `New enquiry: ${subject}`,
        TextPart: `
Name:    ${from_name}
Email:   ${from_email}
Subject: ${subject}

Message:
${message}
        `.trim(),
        HTMLPart: `
<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> ${escapeHtml(from_name)}</p>
<p><strong>Email:</strong> <a href="mailto:${escapeHtml(from_email)}">${escapeHtml(from_email)}</a></p>
<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
<hr />
<p><strong>Message:</strong></p>
<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        `.trim()
      }
    ]
  };

  try {
    console.log('SENDING_TO_MAILJET', { from_email, subject });
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method:  'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify(payload)
    });

    const status = response.status;
    const responseText = await response.text();

    if (!response.ok) {
      console.error('MAILJET_API_ERROR:', status, responseText);
      return res.status(500).json({ error: 'Failed to send email.', details: responseText });
    }

    console.log('MAILJET_SUCCESS', responseText);
    return res.status(200).json({ success: true, stored, raw: responseText });

  } catch (err) {
    console.error('SERVER_EXCEPTION:', err);
    return res.status(500).json({ error: 'Server error. Please try again.', message: err.message });
  }
}
