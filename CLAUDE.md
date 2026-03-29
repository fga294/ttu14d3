# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**ttu14d3** — Thornleigh Thunder Under 14 Division 3

A full-stack soccer team management app with role-based access (Coach = full CRUD, Parent/Player = read-only).

## Stack

- **Backend**: FastAPI + SQLAlchemy ORM + Pydantic + JWT auth, served via Gunicorn on port 3001
- **Frontend**: React + Vite + Tailwind CSS (colors: yellow `#FFD700`, blue `#0047AB`)
- **Database**: MariaDB (primary) or SQLite — configured via `.env`
- **UI libs**: TanStack Table, Recharts, React Hook Form + Zod

## Structure

```
backend/    # FastAPI app
frontend/   # React + Vite app
```

## Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload          # dev
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:3001  # prod
python seed.py                     # seed database
pytest                             # tests
pytest tests/test_players.py       # single test file
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # dev server (port 3000)
npm run build        # output to dist/
npm run lint
```

## Environment

Backend requires `backend/.env`:
```
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=ttu14_db
JWT_SECRET=          # 32-char secure string
FRONTEND_URL=http://localhost:3000
```

## Architecture

### Auth Flow
JWT tokens stored in `localStorage`. FastAPI dependency `get_current_user` decodes token; a separate `require_coach` dependency enforces coach-only routes.

### Data Models
`players` → `game_events` (FK game_id, player_id) ← `games`
`fitness` (player_id FK), `potm` (game_id + player_id FK), `messages` (approved boolean)

### API prefix
All endpoints are under `/api/`. Frontend proxies `/api` → `http://localhost:3001` in dev (Vite config), Nginx handles this in production.

### Deployment
Oracle Cloud VPS: Nginx serves React static build from `/var/www/dist`, proxies `/api` to Gunicorn on port 3001.

## Key Features
- POTM leaderboard (bar chart via Recharts)
- Per-player stats: goals, assists, fitness rating aggregated from `game_events` and `fitness` tables
- Message moderation: public sees only `approved=true`; coach can `PUT /api/messages/{id}/approve`
