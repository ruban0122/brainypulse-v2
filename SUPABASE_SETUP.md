# Supabase Setup Guide for BrainyPulse

Follow these steps to connect your BrainyPulse app to Supabase.

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Choose your organization, set a project name (e.g. `brainypulse`), and set a strong database password.
4. Select your region and click **Create new project**.

---

## 2. Run the Database Migration

1. In your Supabase dashboard, navigate to **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open the file `supabase/migrations/20260604_init.sql` from this project.
4. Copy the entire contents and paste it into the SQL Editor.
5. Click **Run**.

This will create:
- `public.profiles` table (linked to `auth.users` via foreign key)
- `public.scores` table (normalized score storage)
- Performance indexes on `scores(tool_type, score_value desc)`
- Row Level Security policies on both tables
- A database trigger `on_auth_user_created` that auto-creates a profile row whenever a new user signs up

---

## 3. Configure Authentication

1. Go to **Authentication > Providers** in your Supabase dashboard.
2. **Email** provider is enabled by default. No changes needed for email/password auth.
3. *(Optional)* Under **Authentication > URL Configuration**, set:
   - **Site URL**: `https://brainypulse.com` (or `http://localhost:3000` for local dev)
   - **Redirect URLs**: Add `https://brainypulse.com/**` and `http://localhost:3000/**`

---

## 4. Get Your API Keys

1. Go to **Project Settings > API** in your Supabase dashboard.
2. Copy the following values:
   - **Project URL** (e.g. `https://xyzxyzxyz.supabase.co`)
   - **`anon` / `public` key** (safe to expose in the browser)

---

## 5. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Never** use the `service_role` key in `.env.local` or any client-side code.
> The `anon` key is safe for browser exposure because Row Level Security (RLS) is enforced.

---

## 6. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and test the following:

- **Sign Up** → creates a user in `auth.users` AND a profile in `public.profiles` (via the trigger)
- **Login** → returns a session, displays email in the navbar
- **Play any test** → score is saved to `public.scores` after the game ends (requires login)
- **Leaderboard** → fetches top 10 for each tool type from `public.scores`

---

## 7. Verify Tables in Supabase

Go to **Table Editor** and confirm:

| Table | Expected Columns |
|-------|-----------------|
| `profiles` | `id`, `username`, `avatar_url`, `updated_at` |
| `scores` | `id`, `user_id`, `tool_type`, `score_value`, `accuracy`, `created_at` |

---

## 8. Run Daily Pulse Migration

1. Open the **SQL Editor** in your Supabase dashboard.
2. Paste and run the contents of `supabase/migrations/20260604_daily.sql`.
3. This creates the `daily_scores` table, RLS policies, and indexes.

### `daily_scores` schema
| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | PK |
| `user_id` | uuid | references `profiles(id)` |
| `challenge_date` | date | UTC date of the challenge |
| `reaction_ms` | numeric | raw reaction time in ms |
| `typing_wpm` | numeric | raw WPM |
| `maths_correct` | numeric | raw correct answers |
| `memory_rounds` | numeric | raw rounds reached |
| `reaction_points` | integer | 0–1000 normalised |
| `typing_points` | integer | 0–1000 normalised |
| `maths_points` | integer | 0–1000 normalised |
| `memory_points` | integer | 0–1000 normalised |
| `composite_score` | integer | sum of 4 × 0–1000 = max 4000 |

Unique constraint on `(user_id, challenge_date)` prevents more than one submission per day.

---

## 9. Deploy to Production (Vercel)

1. Push your code to GitHub.
2. Import the repo on [vercel.com](https://vercel.com).
3. In the Vercel dashboard, go to **Settings > Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy.
5. Update the **Site URL** and **Redirect URLs** in your Supabase Auth settings to your production domain.

---

## Security Notes

- RLS is enabled on both tables. Scores can only be inserted by the authenticated user matching `user_id`.
- The `handle_new_user` trigger runs as `security definer` so it can write to `public.profiles` even though users don't have a direct INSERT policy on their own row during signup.
- The `profiles` INSERT policy (`auth.uid() = id`) covers manual profile creation if the trigger fails.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code or `.env.local` for frontend apps.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Scores not saving | Ensure user is logged in and `NEXT_PUBLIC_SUPABASE_*` env vars are set |
| Profile not created after signup | Verify the `on_auth_user_created` trigger exists in **Database > Triggers** |
| Leaderboard empty | Play a test while logged in; the leaderboard requires at least one score entry |
| Auth redirect loop | Check **Site URL** in Supabase Auth settings matches your app URL |
