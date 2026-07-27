# Typeform Clone

A functional clone of Typeform: drag-and-drop form builder, published shareable links, an animated one-question-at-a-time respondent experience, and a results/response dashboard.

> Status: backend and frontend both complete, deployed, and smoke-tested against the live deployment. See [JOURNAL.md](JOURNAL.md) for the running log of decisions.

## Demo

| | Link |
|---|---|
| **Live app** | https://typeform-clone-liard.vercel.app |
| **Live API** | https://typeform-clone-backend-sh77.onrender.com (interactive docs at `/docs`) |
| **Source** | https://github.com/satvik-Hecker/typeform-clone |

The live app is seeded with the same sample data described below, so it's usable immediately — no signup, no setup. Note the [database caveat](#know-before-you-deploy-the-database-resets-on-restart): it's SQLite on a free-tier host with an ephemeral disk, so it resets to the seed data on every redeploy/restart (see [Deployment](#deployment)).

## UI Design

The goal was for this to look and feel like Typeform, not a generic multi-step form — the builder's 3-column layout (page list → live canvas → settings panel), the toolbar iconography, the conversational one-question-at-a-time respondent flow, the dashboard's workspace chrome, and small details like the required-field asterisk styling and the "publish edits" split button were all modeled directly on Typeform's actual product, not approximated from memory. Where a real Typeform feature was out of scope (see the **Placeholders** bullet under [Architecture Overview](#architecture-overview)), the surrounding UI chrome for it still exists — it's wired to a "coming soon" toast/badge instead of being deleted, so the app's overall shape still matches Typeform's rather than looking like it's missing pieces.

## Tech Stack

- **Frontend:** Next.js 16 (TypeScript, App Router), Tailwind CSS v4, shadcn/ui (Base UI primitives), Framer Motion, @dnd-kit, TanStack Query, next-themes
- **Backend:** FastAPI, SQLModel (SQLAlchemy + Pydantic)
- **Database:** SQLite

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # Windows Git Bash; use .venv/bin/activate on macOS/Linux
pip install -r requirements.txt

cp .env.example .env            # defaults are fine for local dev

python -m app.seed               # creates typeform.db and loads sample data
uvicorn app.main:app --reload    # http://127.0.0.1:8000
```

Interactive API docs: http://127.0.0.1:8000/docs

**Sample data** (`app/seed.py`) — the app is usable immediately after seeding, no manual setup:
- *Customer Feedback Survey* — **published**, 6 questions spanning short text, email, rating, multiple choice, yes/no, and long text, with **6 existing responses** (5 complete, 1 partial).
- *Job Application — Product Designer* — **published**, 7 questions covering the remaining types (number, dropdown), with **5 existing responses** (4 complete, 1 partial).
- *Event Registration (draft)* — **draft** status with no responses, so the dashboard shows both statuses and an empty results view.

Every form also gets a welcome and thank-you page automatically (see [Database Schema](#database-schema)). The same data is also what boots up automatically on a fresh deploy — see `seed_if_empty()` in [Deployment](#deployment).

Re-running `python -m app.seed` wipes and reloads all sample data — safe to run as often as you like in development.

### Frontend

Requires the backend running first (see above) so `NEXT_PUBLIC_API_URL` has something to talk to.

```bash
cd frontend
npm install

cp .env.example .env.local       # NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

npm run dev                       # http://localhost:3000
```

Visiting `http://localhost:3000` redirects to `/forms` (the dashboard). Seeded forms are immediately visible; open one to reach the builder, or copy a published form's link (`/f/{slug}`) to try the respondent flow.

## Deployment

Backend on [Render](https://render.com), frontend on [Vercel](https://vercel.com) — both have free tiers and the repo is already set up for this pairing.

### Backend (Render)

1. Push this repo to GitHub, then in Render: **New > Blueprint**, point it at the repo. It picks up [`render.yaml`](render.yaml) at the root automatically and builds `backend/Dockerfile`.
2. Render will prompt for the `CORS_ORIGINS` env var during setup — leave it as-is for now (or set it to `http://localhost:3000`); you'll come back and set it to your real frontend URL in step 6.
3. Deploy, then note the service's URL (`https://<something>.onrender.com`).

### Frontend (Vercel)

4. In Vercel: **Add New > Project**, import the same repo, and set **Root Directory** to `frontend` (this is a single-repo monorepo, not two separate repos — Vercel needs to be told which subfolder to build).
5. Add an environment variable `NEXT_PUBLIC_API_URL` = `https://<your-render-url>/api`, then deploy. Note the resulting Vercel URL.

### Wire them together

6. Back in Render's dashboard, set `CORS_ORIGINS` to your Vercel URL (e.g. `https://your-app.vercel.app`) and let it redeploy. Without this, the browser will block every request from the deployed frontend with a CORS error.

### Know before you deploy: the database resets on restart

The database is SQLite — a single file on disk (see [Assumptions](#assumptions) for why). Render's free tier (and most free PaaS tiers generally) uses an **ephemeral filesystem**, so that file — and anything collected in it — disappears on every restart, redeploy, or scale-to-zero spin-down. The app already accounts for this: on startup it seeds a default creator and demo forms automatically if the database is empty (see `seed_if_empty()` in `app/seed.py`), so a fresh deploy always boots into a working demo rather than a blank, broken instance. This is fine for demoing the project, but **any real responses collected between restarts will not persist**. If that matters for your use case, the two real fixes are a Render persistent disk (paid) or swapping SQLite for a hosted Postgres instance (Render's free tier includes one) — neither is set up here, since the assignment's scope explicitly allows this kind of simplification.

## Architecture Overview

- **FastAPI + SQLModel**: SQLModel combines the SQLAlchemy ORM model and the Pydantic validation schema in one class, which keeps the table definitions in `app/models.py` short. Where the API shape genuinely differs from the storage shape (nested question options, computed `response_count`, joined answer labels), separate Pydantic DTOs live in `app/schemas.py`.
- **No auth**: per the assignment's allowance to simplify creator auth, every creator-side request acts as a single seeded default creator (`DEFAULT_CREATOR_ID = 1` in `app/routers/forms.py`). The respondent-facing `/api/public/*` routes require no auth at all, by design — anyone with a published form's link can fill it in.
- **Routers, one per concern**: `forms.py` (form CRUD, publish/unpublish, duplicate), `questions.py` (question CRUD, reorder), `public.py` (respondent flow: start a response, submit answers, finish), `responses.py` (creator-side results: list, detail, per-question summary stats, CSV export).
- **Validation lives server-side too** (`app/validation.py`): required-ness, email format, and number/rating range checks are re-verified on the server independent of whatever the frontend already checked, since a request can always bypass the UI.
- **No migrations**: schema is created via `SQLModel.metadata.create_all()` on startup rather than Alembic — a deliberate simplification appropriate for this project's scope (see Assumptions).

### Frontend

- **Routes** (`frontend/app/`): `/forms` (dashboard), `/forms/[formId]` (builder — Edit tab), `/forms/[formId]/results` (Results tab, shares a layout/top bar with the builder), `/f/[slug]` (public respondent flow, no auth, no shared chrome).
- **Builder is a 3-column layout**: `QuestionSidebar` (left, drag-and-drop reorder via `@dnd-kit`) → toolbar (Add content / Design / desktop-mobile preview toggle / Preview / Settings) + `QuestionCanvas` (center, an inline-editable live preview of the selected question) → `QuestionSettingsPanel` (right, type/required/placeholder/min-max/options) — modeled directly on Typeform's own builder layout.
- **The respondent flow is one component reused twice**: `RespondentFlow` (`components/respondent/`) takes a `mode: "live" | "preview"` prop. The public `/f/[slug]` page uses `mode="live"` (calls the real start/answer/submit API); the builder's "Preview" button opens the exact same component in a dialog with `mode="preview"` (no network calls, resets on close) — so what a creator previews is pixel-for-pixel what a respondent sees, not a separate mock.
- **Client-side validation mirrors the backend** (`lib/validate-answer.ts` mirrors `backend/app/validation.py`) for instant feedback, but every answer still round-trips through the real API — the server remains the source of truth.
- **State**: TanStack Query for all server state (forms/questions/responses), scoped query keys per form so a question edit only invalidates that form's cache. Free-text field edits (title, description, placeholder) autosave via a 600ms debounce; required/type/option changes save immediately.
- **Placeholders**: per the assignment's explicit allowance, "Contacts"/"Automations" (dashboard nav), "Integrations"/"Brand kit" (top bar), "Invite" (team collaboration), and a Settings-dialog tab listing logic jumps, integrations, collaboration, and payment/file-upload questions are all wired to a "coming soon" toast/badge rather than removed — they exist in the UI (matching Typeform's real layout) without pretending to be functional.
- **Bonus features implemented**:
  - **Dark mode** (`next-themes`, toggle in both top bars).
  - **Custom themes**: the toolbar's Design button opens 5 named presets (Modern Dark, Minimal Editorial, Swiss Design, Futuristic AI, Bento Modern), each pairing a heading/body font (Geist, Instrument Serif, Manrope, and Fontshare's Clash Display/General Sans, loaded in `app/layout.tsx`) with an accent color — applied to the respondent view's progress bar, OK button, selected-answer states, and both heading/body fonts (`lib/theme.ts`).
  - **CSV export**, from both the Summary and Responses tabs.
  - **Partial-response tracking / completion rate**: a `responses` row is created when a respondent *starts*, not just on submit, so incomplete fills show up as "Partial" in the results table and count toward the completion-rate stat.
  - **"Generate test response"** (Results → Responses tab): fills out and submits a form exactly like a real respondent would, through the same public API, with plausible random answers per question type — useful for seeing what results look like before sharing the real link.

## Database Schema

Normalized relational design; deliberately **not** an EAV (entity-attribute-value) model, so that summary stats are a plain `GROUP BY` rather than JSON parsing.

```
creators ──< forms ──< questions ──< question_options
                │            │
                │            └──< answers >── responses
                └──< responses
```

| Table | Purpose | Key columns |
|---|---|---|
| `creators` | A single seeded row stands in for real auth. | `email`, `name` |
| `forms` | A form owned by a creator. | `status` (draft/published), `slug` (public share id, generated at creation), `theme`, `published_at` |
| `questions` | Ordered questions/pages on a form. | `type` (the 8 required question types, plus `welcome`/`thank_you` — see below), `required`, `order_index`, `min_value`/`max_value` (number & rating range), `placeholder` |
| `question_options` | Choices for `multiple_choice` / `dropdown` questions. | `label`, `order_index` |
| `responses` | One row per respondent attempt — created when they **start**, not just when they finish, so partial fills are visible. | `started_at`, `submitted_at` (null until done), `is_complete` |
| `answers` | One row per question answered in a response. | `value_text` / `value_number` / `value_bool` / `selected_option_id` — exactly one populated, chosen by the question's type |

The `answers` table maps question type → storage column: `short_text`/`long_text`/`email` → `value_text`; `number`/`rating` → `value_number`; `yes_no` → `value_bool`; `multiple_choice`/`dropdown` → `selected_option_id` (FK into `question_options`).

**Welcome/thank-you screens are `questions` rows, not `forms` columns.** They started as `Form.welcome_title` / `Form.thank_you_message` fields, but were promoted to two extra `QuestionType` values (`welcome`, `thank_you`) so they're reorderable, editable, and rendered the same way as any other page instead of living behind a separate settings form. They're excluded from required-checks, answer submission, and results/export via a `NON_ANSWERABLE_TYPES` set (`backend/app/models.py`); every form gets exactly one of each at creation time and can't gain a duplicate or lose them to a type change (enforced in `app/routers/questions.py`).

Full definitions: [`backend/app/models.py`](backend/app/models.py).

## API Overview

All creator-side routes are under `/api/forms`; respondent-facing routes (no auth) are under `/api/public`. Full interactive docs at `/docs` once the server is running.

**Forms (creator)**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/forms` | List forms with status + response count |
| POST | `/api/forms` | Create a form |
| GET | `/api/forms/{id}` | Full form + questions (builder view) |
| PATCH | `/api/forms/{id}` | Update title/description/theme |
| DELETE | `/api/forms/{id}` | Delete a form (cascades questions/responses) |
| POST | `/api/forms/{id}/duplicate` | Copy a form + its questions/options |
| POST | `/api/forms/{id}/publish` | Publish (400 if it has no questions) |
| POST | `/api/forms/{id}/unpublish` | Revert to draft |

**Questions (creator)**
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/forms/{id}/questions` | Add a question (with options, for choice types) |
| PATCH | `/api/forms/{id}/questions/{qid}` | Edit a question; passing `options` replaces the set |
| DELETE | `/api/forms/{id}/questions/{qid}` | Delete a question |
| PUT | `/api/forms/{id}/questions/reorder` | Reorder — body: `{"ordered_ids": [...]}` |

**Results (creator)**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/forms/{id}/responses` | List submissions |
| GET | `/api/forms/{id}/responses/{rid}` | One response in full |
| GET | `/api/forms/{id}/responses/export` | CSV export |
| GET | `/api/forms/{id}/summary` | Per-question aggregates (choice counts, yes/no counts, avg/min/max) |

**Respondent flow (public, no auth)**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/public/forms/{slug}` | Fetch a published form's definition (404 if not published) |
| POST | `/api/public/forms/{slug}/responses` | Start a response, returns `response_id` |
| PUT | `/api/public/responses/{rid}/answers/{qid}` | Upsert one answer as the respondent advances |
| POST | `/api/public/responses/{rid}/submit` | Finish — server checks all required questions are answered |

## Assumptions

- No real creator authentication — a single default creator is seeded and assumed logged-in, per the assignment's allowance to simplify auth.
- No database migrations (Alembic) — schema is created via `SQLModel.metadata.create_all()` on startup. Acceptable at this scale; would introduce migrations for a longer-lived schema.
- A form's public `slug` is generated at creation time (not only at publish time), so a draft form already has a stable future URL.
- "Theme customization" is scoped to 5 named presets (accent color + heading/body font pairing each) rather than freeform per-property theming (custom hex picker, arbitrary font upload, background images) — the assignment lists custom themes as a bonus, not a core requirement, and presets give real visual variety without an open-ended color/font picker UI.
- The dashboard's workspace chrome (single "My workspace", one creator avatar, Contacts/Automations/Integrations/Brand kit/Invite) mirrors Typeform's real UI for visual fidelity but is intentionally not backed by real multi-workspace or team functionality, consistent with the assignment's explicit allowance to mock team collaboration and integrations.
