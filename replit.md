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
1. **Authentication** - Replit Auth with session management
2. **Upload & Ingestion** - LinkedIn ZIP/CSV parsing for positions, education, skills, connections
3. **Feature Engineering** - Computes 9 career factors (internship count, brand score, skill density, education tier, seniority progression, network size, recency, consistency)
4. **Scoring Engine** - Weighted composite scoring per career track; weights fetched dynamically from DB (career_tracks + track_weights tables)
5. **Dynamic Career Tracks** - Tracks stored in `career_tracks` table (slug, name, description, is_active); weights stored in `track_weights` with FK to `career_tracks.id`; frontend fetches tracks via `GET /api/tracks`
6. **Dashboard** - Trading-app style with large score, delta pill, sparkline chart, time period selector, factor breakdown, recommendations
7. **Leaderboard** - Anonymous rankings by track with percentile bands
8. **Theme System** - Light/dark mode toggle with system preference detection, stored in localStorage ("ca-theme")

## Project Structure
```
client/src/
  App.tsx              - Main app with auth routing + ThemeProvider
  pages/
    landing.tsx        - Landing page (unauthenticated)
    upload.tsx         - File upload page
    select-track.tsx   - Career track selection
    dashboard.tsx      - Score dashboard (trading-app style)
    leaderboard.tsx    - Anonymous leaderboard
  components/
    app-header.tsx     - Minimal navigation header with theme toggle
    theme-toggle.tsx   - Light/dark/system toggle component
    segmented-control.tsx - Reusable segmented control component
    delta-pill.tsx     - Score change indicator pill
    sparkline-chart.tsx - Synthetic sparkline with seeded PRNG
    ui/                - Shadcn components
  hooks/
    use-auth.ts        - Auth hook
  lib/
    queryClient.ts     - React Query config
    auth-utils.ts      - Auth utilities
    theme.tsx          - ThemeProvider with localStorage persistence

server/
  index.ts             - Express server entry
  routes.ts            - All API routes
  storage.ts           - Database operations
  db.ts                - Database connection
  parser.ts            - LinkedIn CSV/ZIP parsing
  scoring.ts           - Feature computation, scoring, recommendations
  seed.ts              - Database seeding
  replit_integrations/auth/ - Replit Auth integration

shared/
  schema.ts            - Drizzle schemas & TypeScript types
  models/auth.ts       - Auth models (users, sessions)
```

## API Routes
- `GET /api/tracks` - Get all active career tracks (dynamic, from DB)
- `POST /api/upload` - Upload LinkedIn data (multipart form)
- `POST /api/score` - Compute score for selected track
- `GET /api/score` - Get latest score
- `GET /api/features` - Get computed features
- `GET /api/leaderboard/:track` - Get leaderboard for a track
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Start login flow
- `GET /api/logout` - Logout

## Design
- Monkeytype-inspired minimalist aesthetic
- Both light and dark mode supported via CSS class toggle ("dark" on html element)
- Roboto Mono font throughout for monospace coding feel
- Neutral, warm-toned palette with lots of whitespace and subtle borders
- Trading-app style dashboard with sparkline chart, delta pills, segmented time controls
- Theme stored in localStorage under key "ca-theme" (values: "light", "dark", "system")
- Inline script in index.html prevents flash-of-wrong-theme on load

## User Preferences
- Lowercase text throughout the UI
- Clean, minimal typography with tracking-wide
- No loud colors; neutral and premium feel
