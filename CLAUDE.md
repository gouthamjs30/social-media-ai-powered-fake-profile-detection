# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mayajal** is an AI-powered fake profile and scam detection web application. Users submit suspicious social media profiles (Instagram, Facebook, LinkedIn, Twitter, Telegram, WhatsApp, etc.), and the system runs LLM-based or heuristic fraud analysis, producing a risk score and detailed report.

## Development Commands

### Docker (Recommended — runs all three services)
```bash
docker-compose up --build        # Build and start all services
docker-compose up -d             # Start in background
docker-compose down              # Stop all services
docker-compose logs -f backend   # Tail backend logs
```

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000   # Dev server
pytest                                       # Run tests (no tests exist yet)
```

### Frontend (React)
```bash
cd frontend
npm install
npm start     # Dev server on http://localhost:3000
npm run build # Production build
```

## Environment Configuration

Copy `backend/.env.example` to `backend/.env` and set:
- `MONGODB_URL` — defaults to `mongodb://localhost:27017`
- `DATABASE_NAME` — `mayajal`
- `SECRET_KEY` — random string for JWT signing
- `AI_PROVIDER` — one of: `gemini`, `openai`, `anthropic`, `heuristic` (default; requires no API key)
- Corresponding API key if not using heuristic: `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY`

When running via Docker Compose, environment variables are injected from `docker-compose.yml`; a local `.env` at the repo root is not required.

The frontend proxies API calls to `http://localhost:8000` in development (set in `frontend/package.json`).

## Architecture

### Backend (`backend/app/`)

Layered FastAPI application — routers call services, services use models:

```
api/        # Route handlers (auth, profiles, analysis, reports)
models/     # Pydantic schemas + Beanie ODM documents (user, profile, report)
services/   # Business logic — ai_analysis.py is the core feature
core/       # Infrastructure: database init, JWT security, demo seed data
main.py     # App factory: registers routers, CORS, startup DB connection
```

**Key file:** `backend/app/services/ai_analysis.py` — orchestrates multi-provider LLM calls (Gemini → OpenAI → Anthropic) with automatic fallback to a keyword/ratio heuristic engine. All LLM calls are async and wrapped with timeouts.

**Auth flow:** `POST /api/auth/login` returns a JWT. All protected routes use `Depends(get_current_user)` from `core/security.py`. Role-based gates (`admin`, `investigator`, `organization`, `user`) are enforced per-route.

**Database:** MongoDB via Motor (async) with Beanie ODM. Collections: `users`, `suspicious_profiles`, `fraud_reports`. Initialized on app startup in `core/database.py`.

### Frontend (`frontend/src/`)

Single-page React app:

```
pages/      # Full-page route components (Login, Dashboard, SubmitProfile, ProfileDetail, AdminPanel, Reports)
components/ # Shared UI (Layout, Logo)
services/
  api.js          # Axios instance with JWT interceptor; auto-logout on 401
  AuthContext.js  # React Context providing user state and login/logout
App.js      # Router with PrivateRoute and AdminRoute guards
```

**Auth state** lives in `AuthContext`. The Axios instance in `api.js` reads the token from `localStorage` and injects it as a `Bearer` header on every request.

### Role-Based Access

| Role | Access |
|------|--------|
| `user` | Submit profiles, view own submissions |
| `investigator` | View all profiles and reports |
| `organization` | Same as investigator |
| `admin` | Full access including stats and user management |

`AdminRoute` in the frontend grants access to `investigator`, `organization`, and `admin` roles.

## API Surface

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/profiles/submit` | User |
| GET | `/api/profiles/my` | User |
| GET | `/api/profiles/all` | Admin/Investigator |
| GET | `/api/profiles/{id}` | User |
| DELETE | `/api/profiles/{id}` | User |
| POST | `/api/analysis/analyze/{id}` | User |
| GET | `/api/analysis/stats` | Admin |
| GET | `/api/reports/profile/{id}` | User |
| GET | `/api/reports/all` | Admin/Investigator |
