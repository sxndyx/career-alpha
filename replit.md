# CareerAlpha

## Overview
CareerAlpha is a career analytics platform where users upload their official LinkedIn data export (ZIP or CSV), and the system parses the data and computes a Career Alpha Score based on weighted factors aligned to specific career tracks: Software Engineering, Investment Banking/Corporate Finance, and Asset Management.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Drizzle ORM)
- **Auth**: Replit Auth (OpenID Connect)
- **Routing**: wouter (client-side)
- **State**: TanStack React Query

## Key Features
1. **Authentication** - Replit Auth with session management; auth_identities table links provider to user
2. **Upload & Ingestion** - LinkedIn ZIP/CSV parsing for positions, education, skills, connections
3. **Feature Engineering** - Computes 9 career factors; company/school scores loaded from DB (company_scores, school_scores tables); consistency score uses actual date gaps/tenure
4. **Scoring Engine** - Weights fetched dynamically from DB per career track; computeScore/generateRecommendations accept weights as params
5. **Dynamic Career Tracks** - Tracks stored in `career_tracks` table (slug, name, description, is_active); weights stored in `track_weights` with FK to `career_tracks.id`; frontend fetches via `GET /api/tracks`
6. **Score History** - Real score_history table; graph shows actual historical data (no synthetic data); only inserts when score or percentile changes meaningfully
7. **Profile Overrides** - user_profile_config table stores per-user overrides (exclude roles, internship override, tier overrides); computeFeatures merges overrides without mutating source data
8. **Dashboard** - Trading-app style; sparkline uses real score history; empty state when no history; delta computed from real data
9. **Leaderboard** - Rankings by track with percentile bands; shows display_name if user opted in (showOnLeaderboard=true), else "anonymous"
10. **Theme System** - Light/dark mode toggle with system preference detection, stored in localStorage ("ca-theme")
11. **Settings Page** - /settings page for display name, leaderboard opt-in toggle, daily email update toggle; links to Profile Adjustments
12. **Profile Adjustments** - /profile-config page; per-position include/exclude toggles, internship count override, company/school tier overrides
13. **Daily Email Updates** - node-cron job at 8 AM ET; sends Resend email when score changes for users with dailyUpdatesEnabled=true; RESEND_API_KEY env var required

## Database Tables
- `users`, `sessions` — auth (from Replit integration)
- `positions`, `education`, `skills`, `connections` — parsed LinkedIn data
- `computed_features` — feature vector per user
- `scores` — latest score per user per track
- `score_history` — append-only score history per user per track
- `career_tracks` — dynamic track definitions (slug, name, description, is_active)
- `track_weights` — weights per track (FK to career_tracks)
- `company_scores` — company name keys → prestige scores (seeded, ~91 entries)
- `school_scores` — school name keys → prestige scores (seeded, ~65 entries)
- `user_profile_config` — per-user overrides (jsonb)
- `auth_identities` — provider identity links (provider, provider_user_id, user_id)

## Project Structure
```
client/src/
  App.tsx              - Main app with auth routing + ThemeProvider
  pages/
    landing.tsx        - Landing page (unauthenticated)
    upload.tsx         - File upload page
    select-track.tsx   - Career track selection (fetches from /api/tracks)
    dashboard.tsx      - Score dashboard; real score history chart
    leaderboard.tsx    - Leaderboard (shows display_name if opted in, else anonymous)
    settings.tsx       - User settings (display name, leaderboard toggle, daily email toggle)
    profile-config.tsx - Profile adjustments (position toggles, internship override, tier overrides)
  components/
    app-header.tsx     - Minimal navigation header with theme toggle
    theme-toggle.tsx   - Light/dark/system toggle component
    segmented-control.tsx - Reusable segmented control component
    delta-pill.tsx     - Score change indicator pill
    sparkline-chart.tsx - Real data chart (empty state when no history)
    ui/                - Shadcn components
  hooks/
    use-auth.ts        - Auth hook
  lib/
    queryClient.ts     - React Query config
    auth-utils.ts      - Auth utilities
    theme.tsx          - ThemeProvider with localStorage persistence

server/
  index.ts             - Express server entry; starts daily job
  routes.ts            - All API routes
  storage.ts           - Database operations
  db.ts                - Database connection
  parser.ts            - LinkedIn CSV/ZIP parsing
  scoring.ts           - Feature computation, scoring, recommendations
  seed.ts              - Database seeding (tracks, company/school scores, sample data)
  email.ts             - Resend email sending (score update emails)
  daily-job.ts         - node-cron job (8 AM ET); recomputes scores, sends emails on change
  replit_integrations/auth/ - Replit Auth integration

shared/
  schema.ts            - Drizzle schemas & TypeScript types
  models/auth.ts       - Auth models (users, sessions)
```

## API Routes
- `GET /api/tracks` - Get all active career tracks (dynamic, from DB)
- `POST /api/upload` - Upload LinkedIn data (multipart form)
- `POST /api/score` - Compute score for selected track; saves to score_history on change
- `GET /api/score` - Get latest score
- `GET /api/score-history?track=<slug>` - Get ordered score history for a track
- `GET /api/features` - Get computed features
- `GET /api/positions` - Get user's parsed positions (for profile config UI)
- `GET /api/education` - Get user's parsed education (for profile config UI)
- `GET /api/leaderboard/:track` - Get leaderboard with user names (shows display_name if opted in)
- `GET /api/profile-config` - Get user profile overrides
- `PUT /api/profile-config` - Update user profile overrides
- `GET /api/settings` - Get user settings (displayName, showOnLeaderboard, dailyUpdatesEnabled, email)
- `PUT /api/settings` - Update user settings
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Start login flow
- `GET /api/logout` - Logout

## Scoring Architecture
- `computeFeatures(positions, education, skills, connections, companyScores, schoolScores, overrides?)` — pure function; loads company/school scores from DB before calling
- `computeScore(features, weights)` — pure function; weights passed in from DB
- `generateRecommendations(breakdown, weights)` — pure function
- `computePercentile(userScore, allScores)` — uses (below + 0.5 * equal) / total formula

## Design
- Monkeytype-inspired minimalist aesthetic
- Both light and dark mode supported via CSS class toggle ("dark" on html element)
- Roboto Mono font throughout for monospace coding feel
- Neutral, warm-toned palette with lots of whitespace and subtle borders
- Trading-app style dashboard with real score history chart, delta pills, segmented time controls
- Theme stored in localStorage under key "ca-theme" (values: "light", "dark", "system")
- Inline script in index.html prevents flash-of-wrong-theme on load

## User Preferences
- Lowercase text throughout the UI
- Clean, minimal typography with tracking-wide
- No loud colors; neutral and premium feel
- No synthetic/fake data anywhere — empty states shown when no real data exists
