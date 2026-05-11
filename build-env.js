const fs = require('fs');
const path = require('path');

const out = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON: process.env.SUPABASE_ANON || ''
};

const dest = path.join(__dirname, 'cornelius-website', 'js', 'env.js');

// If no env vars provided and a local env file already exists, don't overwrite it.
if (!out.SUPABASE_URL && !out.SUPABASE_ANON && fs.existsSync(dest)) {
  console.log('No environment variables provided; keeping existing', dest);
  process.exit(0);
}

const content = 'window.__ENV = ' + JSON.stringify(out, null, 2) + ';\n';

try {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
  console.log('Wrote', dest);
} catch (err) {
  console.error('Failed to write env file:', err);
  process.exit(1);
}
