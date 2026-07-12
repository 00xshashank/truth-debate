# Multi-Agent Debate System

## Architecture
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Python 3.13, FastAPI, SQLModel (PostgreSQL), uv package manager
- **Database**: PostgreSQL 15 (Docker)
- **LLMs**: Google Gemini, Cohere (with tool calling for PubMed search)

## Development Commands

### Backend (from `/backend`)
```bash
uv sync                    # Install dependencies
uv run python main.py      # Run FastAPI server (port 8000)
uv run python -m pytest    # Run tests (if added)
```

### Frontend (from `/frontend`)
```bash
npm install                # Install dependencies
npm run dev                # Dev server (port 3000)
npm run build              # Production build
npm run lint               # ESLint
```

### Database
```bash
docker-compose up -d       # Start PostgreSQL
docker-compose down        # Stop PostgreSQL
```

## Environment Variables

### Backend (`backend/.env`)
- `POSTGRES_HOSTNAME`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `SECRET_KEY` - JWT signing key
- `GEMINI_MODEL`, `BACKUP_GEMINI_MODEL` - Default: `gemini-2.5-flash-lite`, `gemini-2.0-flash-lite`
- `COHERE_MODEL_NAME` - Cohere model

### Frontend (`frontend/.env`)
- `NEXT_PUBLIC_API_URL` - Backend URL (default: `http://localhost:8000`)

## Key Backend Entry Points
- `backend/main.py` - FastAPI app, CORS for `localhost:3000`
- `backend/chat.py` - Multi-agent debate logic (proponent/challenger/judge)
- `backend/llm/llm_client.py` - Base LLM client interface
- `backend/routers/auth.py` - JWT auth with cookies
- `backend/db.py` - SQLModel models + PostgreSQL engine

## Frontend Structure
- `app/` - Next.js App Router pages
- `components/ui/` - shadcn/ui components
- `hooks/` - Custom React hooks
- `store.ts` - Zustand state management
- `types.ts` - Shared TypeScript types

## Auth Flow
- JWT tokens in HTTP-only cookies (`access_token`)
- 7-day expiry, HS256 algorithm
- Protected routes use `current_user_from_cookie` dependency

## LLM Debate Pattern
1. Proponent argues for user query
2. Challenger argues against proponent
3. Judge decides verdict (extracts `VERDICT:` from response)
4. All three use PubMed tool (`get_open_access_papers`)

## Ports
- Frontend: 3000
- Backend: 8000
- PostgreSQL: 5432

## Notes
- Uses `uv` for Python (not pip/poetry)
- Frontend uses `@/*` path aliases
- Tailwind v4 with PostCSS plugin
- No existing test suite