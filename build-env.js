const fs = require('fs');
const path = require('path');

const out = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON: process.env.SUPABASE_ANON || ''
};

const content = 'window.__ENV = ' + JSON.stringify(out, null, 2) + ';\n';

const dest = path.join(__dirname, 'cornelius-website', 'js', 'env.js');

try {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
  console.log('Wrote', dest);
} catch (err) {
  console.error('Failed to write env file:', err);
  process.exit(1);
}
