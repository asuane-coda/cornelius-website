Vercel deployment notes
-----------------------

1. Set these Environment Variables in the Vercel Project settings:
   - `SUPABASE_URL` — your Supabase project URL (from Supabase → Settings → API)
   - `SUPABASE_ANON` — your Supabase anon/public key

2. Vercel will run `npm run vercel-build` during the build phase which executes `build-env.js` and writes `cornelius-website/js/env.js`.

3. The site is served from the `cornelius-website` folder. `vercel.json` rewrites requests to that folder.

4. For local development, create `cornelius-website/js/env.js` manually with the following shape:

```js
window.__ENV = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON: 'sb_publishable_...'
};
```

5. After deployment, verify pages that use Supabase are working and that no secret values are committed to the repo.
