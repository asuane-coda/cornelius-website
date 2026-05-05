// ─── SUPABASE CONFIG ───────────────────────────────────────────────────────
// TODO: Replace with your actual Supabase project credentials
// Get these from: https://supabase.com → your project → Settings → API
const SUPABASE_URL  = 'https://vozjzeghpeeedokrxrxa.supabase.co';
const SUPABASE_ANON = 'sb_publishable_OJwRM7qIn7G6ogsuYn-Bow_EtYd8giz';

// ─── SQL to run once in Supabase SQL editor ────────────────────────────────
// CREATE TABLE blog_posts (
//   id          bigserial PRIMARY KEY,
//   title       text NOT NULL,
//   excerpt     text,
//   content     text,
//   category    text DEFAULT 'Insight',
//   published   boolean DEFAULT false,
//   created_at  timestamptz DEFAULT now(),
//   updated_at  timestamptz DEFAULT now()
// );
// ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Public read published" ON blog_posts FOR SELECT USING (published = true);
// -- For the admin panel, disable RLS temporarily or create a service-role policy.

// ─── API helpers ───────────────────────────────────────────────────────────
async function sbFetch(path, options = {}) {
  const headers = {
    'apikey': SUPABASE_ANON,
    'Authorization': `Bearer ${SUPABASE_ANON}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error ${res.status}: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

window.getPublishedPosts = async function(limit = 50) {
  return sbFetch(`blog_posts?published=eq.true&order=created_at.desc&limit=${limit}`);
};

window.getAllPosts = async function() {
  return sbFetch('blog_posts?order=created_at.desc');
};

window.getPostById = async function(id) {
  const rows = await sbFetch(`blog_posts?id=eq.${id}&limit=1`);
  return rows[0] || null;
};

window.createPost = async function(post) {
  return sbFetch('blog_posts', {
    method: 'POST',
    body: JSON.stringify(post)
  });
};

window.updatePost = async function(id, patch) {
  return sbFetch(`blog_posts?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() })
  });
};

window.deletePost = async function(id) {
  return sbFetch(`blog_posts?id=eq.${id}`, { method: 'DELETE' });
};

window.escapeHtml = function(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
};

window.formatDate = function(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
};
