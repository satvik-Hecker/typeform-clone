# Typeform Clone

A functional clone of Typeform: drag-and-drop form builder, published shareable links, an animated one-question-at-a-time respondent experience, and a results/response dashboard.

> Status: backend and frontend both complete and smoke-tested locally. See [JOURNAL.md](JOURNAL.md) for the running log of decisions. Not yet deployed.

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
- **Bonus features implemented**: dark mode (next-themes, toggle in both top bars), a per-form accent color (Settings → Theme) applied to the respondent view's progress bar/OK button/selected-answer states, CSV export, and partial-response tracking (a `responses` row is created when a respondent *starts*, not just on submit, so incomplete fills show up as "Partial" in the results table and count toward the completion-rate stat).

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
| `forms` | A form owned by a creator. | `status` (draft/published), `slug` (public share id, generated at creation), `theme`, `thank_you_message`, `published_at` |
| `questions` | Ordered questions on a form. | `type` (one of the 8 required types), `required`, `order_index`, `min_value`/`max_value` (number & rating range), `placeholder` |
| `question_options` | Choices for `multiple_choice` / `dropdown` questions. | `label`, `order_index` |
| `responses` | One row per respondent attempt — created when they **start**, not just when they finish, so partial fills are visible. | `started_at`, `submitted_at` (null until done), `is_complete` |
| `answers` | One row per question answered in a response. | `value_text` / `value_number` / `value_bool` / `selected_option_id` — exactly one populated, chosen by the question's type |

The `answers` table maps question type → storage column: `short_text`/`long_text`/`email` → `value_text`; `number`/`rating` → `value_number`; `yes_no` → `value_bool`; `multiple_choice`/`dropdown` → `selected_option_id` (FK into `question_options`).

Full definitions: [`backend/app/models.py`](backend/app/models.py).

## API Overview

All creator-side routes are under `/api/forms`; respondent-facing routes (no auth) are under `/api/public`. Full interactive docs at `/docs` once the server is running.

**Forms (creator)**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/forms` | List forms with status + response count |
| POST | `/api/forms` | Create a form |
| GET | `/api/forms/{id}` | Full form + questions (builder view) |
| PATCH | `/api/forms/{id}` | Update title/description/theme/thank-you message |
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
- "Theme customization" is scoped to a single accent color (applied to the respondent view's progress bar, OK button, and selected-answer states) rather than full font/background/layout theming — the assignment lists custom themes as a bonus, not a core requirement.
- The dashboard's workspace chrome (single "My workspace", one creator avatar, Contacts/Automations/Integrations/Brand kit/Invite) mirrors Typeform's real UI for visual fidelity but is intentionally not backed by real multi-workspace or team functionality, consistent with the assignment's explicit allowance to mock team collaboration and integrations.
