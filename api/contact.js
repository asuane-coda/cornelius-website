// api/contact.js
// Vercel Serverless Function — handles contact form submissions via Mailjet
// ─────────────────────────────────────────────────────────────────────────────
// Environment variables required in Vercel dashboard:
//   MJ_APIKEY_PUBLIC   → your Mailjet API key
//   MJ_APIKEY_PRIVATE  → your Mailjet secret key

module.exports = async function handler(req, res) {
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

  if (!apiKey || !secretKey) {
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

  const payload = {
    Messages: [
      {
        From: {
          Email: 'corneliusokekehr@gmail.com', // TODO: change to a verified sender on Mailjet
          Name:  'Cornelius Okeke Website'
        },
        To: [
          {
            Email: 'corneliusokekehr@gmail.com',
            Name:  'Cornelius Okeke'
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
<p><strong>Name:</strong> ${from_name}</p>
<p><strong>Email:</strong> <a href="mailto:${from_email}">${from_email}</a></p>
<p><strong>Subject:</strong> ${subject}</p>
<hr />
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
        `.trim()
      }
    ]
  };

  try {
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method:  'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mailjet error:', errorText);
      return res.status(500).json({ error: 'Failed to send email.' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}