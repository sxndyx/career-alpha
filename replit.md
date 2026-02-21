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
4. **Scoring Engine** - Weighted composite scoring per career track (SWE, Finance, Asset Management)
5. **Dashboard** - Score gauge, factor breakdown chart, recommendations, raw feature values
6. **Leaderboard** - Anonymous rankings by track with percentile bands

## Project Structure
```
client/src/
  App.tsx              - Main app with auth routing
  pages/
    landing.tsx        - Landing page (unauthenticated)
    upload.tsx         - File upload page
    select-track.tsx   - Career track selection
    dashboard.tsx      - Score dashboard
    leaderboard.tsx    - Anonymous leaderboard
  components/
    app-header.tsx     - Navigation header
    ui/                - Shadcn components
  hooks/
    use-auth.ts        - Auth hook
  lib/
    queryClient.ts     - React Query config
    auth-utils.ts      - Auth utilities

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
- `POST /api/upload` - Upload LinkedIn data (multipart form)
- `POST /api/score` - Compute score for selected track
- `GET /api/score` - Get latest score
- `GET /api/features` - Get computed features
- `GET /api/leaderboard/:track` - Get leaderboard for a track
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Start login flow
- `GET /api/logout` - Logout

## Design
- Dark theme by default (class="dark" on html element)
- Inter font for body, Playfair Display for headings, JetBrains Mono for code/numbers
- Minimal, professional aesthetic with subtle gradients and animations
