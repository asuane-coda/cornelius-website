// ─── SUPABASE CONFIG ───────────────────────────────────────────────────────
// Get these from: https://supabase.com → your project → Settings → API
const SUPABASE_URL  = 'https://vozjzeghpeeedokrxrxa.supabase.co';
const SUPABASE_ANON = 'sb_publishable_OJwRM7qIn7G6ogsuYn-Bow_EtYd8giz';

// Initialize Supabase Client
// We use sbClient to avoid name collision with the global 'supabase' library object
const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── Auth Helpers ──────────────────────────────────────────────────────────
window.adminLogin = async function(email, password) {
  const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

window.adminLogout = async function() {
  const { error } = await sbClient.auth.signOut();
  if (error) throw error;
};

window.getAdminSession = async function() {
  const { data: { session } } = await sbClient.auth.getSession();
  return session;
};

// ─── API helpers ───────────────────────────────────────────────────────────
window.getPublishedPosts = async function(limit = 50) {
  const { data, error } = await sbClient
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
};

window.getAllPosts = async function() {
  const { data, error } = await sbClient
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

window.getPostById = async function(id) {
  const { data, error } = await sbClient
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

window.createPost = async function(post) {
  const { data, error } = await sbClient
    .from('blog_posts')
    .insert([post])
    .select();
  
  if (error) throw error;
  return data;
};

window.updatePost = async function(id, patch) {
  const { data, error } = await sbClient
    .from('blog_posts')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data;
};

window.deletePost = async function(id) {
  const { error } = await sbClient
    .from('blog_posts')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
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
