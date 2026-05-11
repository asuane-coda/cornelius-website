// ─── ADMIN SEED SCRIPT ──────────────────────────────────────────────────
// This script creates the initial admin user in your Supabase project.
// 
// Usage:
// 1. Install dependencies: npm install @supabase/supabase-js
// 2. Run script: node scripts/seed-admin.js
// ────────────────────────────────────────────────────────────────────────

const { createClient } = require('@supabase/supabase-js');

// TODO: Replace with your actual Supabase project credentials
// Use the SERVICE_ROLE_KEY from Settings -> API (Keep this key secret!)
const SUPABASE_URL = 'https://vozjzeghpeeedokrxrxa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const adminEmail = 'admin@example.com'; // Change this
const adminPassword = 'Cornelius@HR2026'; // Change this

async function seedAdmin() {
  console.log('Seeding admin user...');

  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true
  });

  if (error) {
    console.error('Error creating admin user:', error.message);
  } else {
    console.log('Admin user created successfully!');
    console.log('Email:', data.user.email);
  }
}

seedAdmin();
