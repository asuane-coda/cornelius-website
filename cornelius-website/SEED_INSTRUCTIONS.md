# Supabase Auth Setup & Admin Seeding

I have upgraded the admin panel to use **Supabase Auth** instead of a hardcoded password. This provides real security and session management.

## 1. Supabase SQL Setup
Run the following SQL in your **Supabase Dashboard -> SQL Editor** to enable Row Level Security (RLS) and allow authenticated admins to manage posts:

```sql
-- 1. Enable RLS on blog_posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- 2. Allow anyone to read PUBLISHED posts
DROP POLICY IF EXISTS "Public read published" ON blog_posts;
CREATE POLICY "Public read published" ON blog_posts 
FOR SELECT USING (published = true);

-- 3. Allow AUTHENTICATED users (admins) to do everything
DROP POLICY IF EXISTS "Admin full access" ON blog_posts;
CREATE POLICY "Admin full access" ON blog_posts 
FOR ALL USING (auth.role() = 'authenticated');
```

## 2. Seed Admin User
Since this is a static site, you need to create your first admin account manually or via a script.

### Option A: Via Supabase Dashboard (Recommended)
1. Go to **Authentication -> Users**.
2. Click **Add User** -> **Create new user**.
3. Enter your email and password.
4. Uncheck "Send invitation email" to create it immediately.

### Option B: Via Seed Script
If you prefer using the provided script:
1. Open `scripts/seed-admin.js`.
2. Replace `YOUR_SERVICE_ROLE_KEY` with your project's **service_role** key (found in Settings -> API).
3. Update the `adminEmail` and `adminPassword` variables.
4. Run:
   ```bash
   npm install @supabase/supabase-js
   node scripts/seed-admin.js
   ```

## 3. Deployment Note
After creating your user, remember to:
- Delete the `scripts/` folder before deploying (or ensure it's not accessible).
- Update `SUPABASE_URL` and `SUPABASE_ANON` in `js/supabase-config.js` if they differ.
