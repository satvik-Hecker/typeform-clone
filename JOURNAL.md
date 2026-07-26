# Build Journal

Running log of decisions made while building this project — what was done, why, and how. Kept honest and dated so the reasoning behind each choice is traceable later (including for the evaluation interview).

---

## 2026-07-26 — Research & planning

**What:** Read the assignment PDF closely, searched for existing Typeform-clone repos, form-builder schema write-ups, `@dnd-kit`, Framer Motion transition patterns, FastAPI+SQLModel project structure, and FastAPI/Next.js deployment options (Render/Railway + Vercel). Wrote up a full plan: DB schema, API surface, backend folder layout, execution order.

**Why:** The brief explicitly rewards database design, API design, and code modularity, and explicitly penalizes copying an existing repo. So the research goal was to absorb *patterns* (what fields a form/question/response schema typically needs, what libraries are the current standard for drag-and-drop and animated transitions) without lifting any code, then design the schema and API myself from scratch.

**How / key decisions:**
- **FastAPI + SQLModel**, not Django. SQLModel combines the SQLAlchemy ORM model and the Pydantic validation schema in one place, which cuts boilerplate for a schema this size, and FastAPI's automatic OpenAPI docs help "explain the API" during evaluation.
- **Normalized schema, no EAV.** Research consistently flagged Entity-Attribute-Value (jamming every question type's data into one generic `value` column/JSON blob) as an anti-pattern for exactly this kind of form-builder data. Instead: a `question_options` join table for choice-type questions, and a small set of typed nullable columns on `answers` (`value_text` / `value_number` / `value_bool` / `selected_option_id`) so summary stats are a plain `GROUP BY`, not JSON parsing.
- **SQLite must not go on Vercel.** Vercel serverless functions have an ephemeral filesystem — a SQLite file written there disappears between invocations. Confirmed this before deciding on the deploy target. Backend → **Render** (has a persistent disk on it's free/starter tier); frontend → **Vercel** (standard Next.js host).
- **No Alembic migrations.** For a project this size, `SQLModel.metadata.create_all()` at startup plus a seed script is enough, and saves setup time better spent on the builder/respondent UI. Documented as a deliberate simplification (would add Alembic if this were a long-lived production schema).
- **Frontend stack (for the later pass):** Next.js App Router + TypeScript + Tailwind + shadcn/ui (accessible unstyled primitives, themed to match Typeform rather than looking like a component-library demo) + Framer Motion for the one-question-at-a-time transitions + `@dnd-kit` (confirmed as the current accessible standard, superseding `react-beautiful-dnd`) for question reordering.
- **git initialized now**, committing incrementally per logical chunk (scaffold → models → routers → seed) rather than one giant commit, so the history itself documents the build order.

Full plan detail: schema, API routes, folder structure — see the plan this journal entry accompanies (also mirrored into README.md's architecture section once written).

---

## 2026-07-26 — Backend built and smoke-tested

**What:** Built the full FastAPI backend per the plan: `models.py` (6 tables), `schemas.py` (request/response DTOs), `validation.py` (server-side answer validation), four routers (`forms`, `questions`, `public`, `responses`), `main.py` wiring, `seed.py`, and a `Dockerfile` for Render. Installed deps into a local `.venv`, ran the seed script, started the server, and drove every endpoint by hand with `curl`/Python before calling it done — the brief specifically warns that type-checking isn't the same as verifying the feature works, so an API is only "done" once it's been exercised end-to-end, not just once it imports cleanly.

**Why:** "Works when I read it" isn't the same as "works" — same principle either way, checking the real behavior instead of assuming the code is correct because it looks right.

**How / what I tested:**
- `GET /api/forms` → correct `response_count` per form via an outer-joined `COUNT`.
- Full respondent journey against `customer-feedback`: start → PUT invalid email (got the expected `422`) → PUT a valid answer per question → `submit` (got the thank-you message back). Then a second run confirmed `submit` correctly rejects with `422` when a required question (`What's your name?`) was never answered — this is the server independently re-validating required-ness at submit time, not trusting the client's step-by-step navigation.
- `GET /api/forms/{id}/summary` → correct choice counts, yes/no counts, and rating average/min/max, computed straight off the normalized columns with no JSON parsing — validates the schema design decision from the previous entry.
- CSV export, publish-with-no-questions guard (400), duplicate (copies questions + options with fresh slug), and reorder all behaved as designed.
- Found and fixed a real bug while testing question editing: `PATCH /forms/{id}/questions/{qid}` threw a 500 (`Instance has been deleted... Use make_transient()`) whenever a request replaced a question's options. Root cause: the code deleted the old `QuestionOption` rows, flushed, added the new ones, and then called `session.add(question)` again — but `question` was already attached to the session (it came from `session.get()`), so that redundant `add()` made SQLAlchemy cascade through the question's still-cached `.options` relationship collection, which pointed at objects that no longer existed. Fix was to just delete the redundant `session.add(question)` call — SQLAlchemy already tracks attribute changes on objects that are attached to the session, no re-add needed. Left a comment in `questions.py` explaining why that line is intentionally absent, since removing a line that "should" be there for symmetry with the other routers is the kind of thing a future edit could accidentally reintroduce.
- Also caught (before it became a bug worth chasing) that a mojibake-looking em dash in a form title over `curl | python -m json.tool` was purely a Windows console rendering artifact — confirmed the actual bytes in SQLite and the actual codepoints in the JSON response were correct UTF-8 (`U+2014`) the whole time, so no fix was needed there.
- Along the way, switched every `datetime.utcnow()` call to a shared timezone-aware `utcnow()` helper in `models.py` (Python 3.13 deprecates the naive version).

Backend is fully functional and re-seedable (`python -m app.seed`, run from `backend/`). Next up: the Next.js frontend (builder → respondent flow → results), then deployment.

---
