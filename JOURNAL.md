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
