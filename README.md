# Typeform Clone

A functional clone of Typeform: drag-and-drop form builder, published shareable links, an animated one-question-at-a-time respondent experience, and a results/response dashboard.

> Status: backend in progress. This README is being filled in as the project is built — see [JOURNAL.md](JOURNAL.md) for the running log of decisions.

## Tech Stack

- **Frontend:** Next.js (TypeScript, App Router), Tailwind CSS, shadcn/ui, Framer Motion, @dnd-kit
- **Backend:** FastAPI, SQLModel (SQLAlchemy + Pydantic)
- **Database:** SQLite

## Setup

_Coming soon — backend setup instructions land once the backend is complete._

## Architecture Overview

_Coming soon._

## Database Schema

_Coming soon — see `backend/app/models.py` once written, or [JOURNAL.md](JOURNAL.md) for the design rationale._

## API Overview

_Coming soon._

## Assumptions

- No real creator authentication — a single default creator is seeded and assumed logged-in, per the assignment's allowance to simplify auth.
- No database migrations (Alembic) — schema is created via `SQLModel.metadata.create_all()` on startup. Acceptable at this scale; would introduce migrations for a longer-lived schema.
