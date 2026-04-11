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

Backend requires `backend/.env` (never committed — lives only on EC2 for prod, and locally for dev):
```
DB_HOST=localhost
DB_USER=ttu14
DB_PASS=             # rotated 2026-04 — see EC2 backend/.env for current value
DB_NAME=ttu14_db
JWT_SECRET=          # 32-char secure string
FRONTEND_URL=https://ttu14.com
```

If a secret ever lands in the repo, rotate it first, then scrub history with `git-filter-repo` and force-push. Do not assume history rewriting alone is sufficient — treat exposed secrets as compromised.

## Architecture

### Auth Flow
JWT tokens stored in `localStorage`. FastAPI dependency `get_current_user` decodes token; a separate `require_coach` dependency enforces coach-only routes.

### Data Models
`players` → `game_events` (FK `game_id`, nullable `player_id`) ← `games`
`game_events.event_type` includes `opponent_goal` (stored with null `player_id`).
`fitness` (player_id FK), `formations` (JSON positions + reserves).

### API prefix
All endpoints are under `/api/`. Frontend proxies `/api` → `http://localhost:3001` in dev (Vite config). In production Nginx on EC2 terminates TLS and reverse-proxies `/api` to Gunicorn on port 3001.

### Schema migrations
SQLAlchemy `Base.metadata.create_all()` only creates new tables — it never ALTERs existing ones. When changing a column (e.g. making `player_id` nullable, adding an enum value), run the `ALTER TABLE` / `ALTER ... MODIFY COLUMN` on MariaDB **before** deploying code that depends on the new shape. Loosen constraints first, deploy, tighten later if needed.

## Production infrastructure

- **Frontend**: Vercel Hobby tier, auto-deploys from `main` on push. Project name: `ttu14d3`. Custom domain `ttu14.com` via Cloudflare CNAME (proxied).
- **Backend + DB**: AWS EC2 (Amazon Linux 2023), Elastic IP `13.54.166.213`, domain `api.ttu14.com` via Cloudflare A record (proxied, Full-strict SSL with Cloudflare Origin Certificate installed on Nginx).
- **DNS / SSL**: Cloudflare (domain purchased there). Origin cert lives at `/etc/ssl/cloudflare/` on EC2.
- **SSH**: `ssh -i /Users/fabricio/aws/ttu14-key.pem ec2-user@13.54.166.213` — user is `ec2-user`, not `ubuntu`.
- **Backend layout on EC2**: repo cloned at `/home/ec2-user/ttu14d3/`. Python venv at `/home/ec2-user/ttu14d3/backend/venv/`.
- **Systemd unit**: `ttu14.service` (at `/etc/systemd/system/ttu14.service`) runs Gunicorn + uvicorn workers on `127.0.0.1:3001`. Restart with `sudo systemctl restart ttu14`.
- **Nginx**: `/etc/nginx/conf.d/ttu14.conf` serves static fallback and reverse-proxies `/api` → `127.0.0.1:3001`.
- **MariaDB**: runs on the same EC2 instance, bound to localhost only (port 3306 **not** exposed to the internet — do not open it in the Security Group). User `ttu14`@`localhost` against DB `ttu14_db`. Root access via `sudo mysql` (unix_socket auth) — there is no mysql root password.

## Deploying changes

**Frontend** — push to `main`. Vercel auto-builds and promotes.

**Backend** — not automated. After merging to `main`:
```bash
ssh -i /Users/fabricio/aws/ttu14-key.pem ec2-user@13.54.166.213
cd /home/ec2-user/ttu14d3 && git pull
# if requirements changed: source backend/venv/bin/activate && pip install -r backend/requirements.txt
# if models changed: run the ALTER in `sudo mysql` BEFORE restarting
sudo systemctl restart ttu14
sudo systemctl status ttu14 --no-pager    # sanity check
```

## Database access (local dev)

Do **not** open MariaDB's 3306 port on the EC2 security group. Use an SSH tunnel instead — Beekeeper Studio has one built in:
- SSH host: `13.54.166.213`, user `ec2-user`, key `/Users/fabricio/aws/ttu14-key.pem`
- DB host (over tunnel): `127.0.0.1:3306`, user `ttu14`, database `ttu14_db`

This avoids having to grant MariaDB `'ttu14'@'%'` or any wildcard host (MariaDB's host-based auth error `Host 'x.x.x.x' is not allowed` is an auth-layer check, not a network one — opening the port won't fix it).

## Git workflow

- Every change gets its own branch off `main`, and a PR — even small ones. Don't commit directly to `main`.
- Prefer squash-merge; delete the branch after merge.
- When sensitive files or unwanted history need to be removed, `git-filter-repo` is the tool (installed via `brew install git-filter-repo`). After rewriting, force-push `main` and delete any orphaned merged branches from origin — GitHub keeps orphan objects ~90 days.

## Key Features
- Interactive formations page (football pitch with free drag-and-drop player positioning + reserves)
- Per-player stats: goals, assists, cards, fitness trend aggregated from `game_events` and `fitness` tables
- Game detail timeline with opponent goals (enum `opponent_goal`, null `player_id`)
- Player detail shows full position names (RW → "Right Winger") below the position badges
