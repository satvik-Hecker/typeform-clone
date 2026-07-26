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

## 2026-07-27 — Frontend built end-to-end, then redesigned against real Typeform screenshots

**What:** Built the full Next.js frontend in small, individually-verified commits (per the user's explicit request for frequent commits, unlike the backend's two big ones): scaffold (Next 16 + Tailwind v4 + shadcn/ui + fonts) → typed API client/hooks → dashboard (CRUD, toasts) → builder shell (sidebar + drag-drop reorder + add-question menu) → question editor with autosave → the public respondent flow (the assignment's hardest piece) → live preview (reusing the respondent component) → results (table, detail drawer, summary stats, CSV export). Then, after the user supplied two real Typeform screenshots (dashboard workspace view, builder canvas view), redesigned the dashboard and builder to match those specifically rather than a generic approximation.

**Why:** Two reasons the user gave directly: (1) commit frequently this time — the backend's two-commit history didn't show the incremental reasoning the way a per-feature commit log does; (2) "visually and functionally feel like a modern Typeform" is graded, and a resemblance built from memory/screenshots-in-training-data is weaker evidence than one built by looking at the actual reference images the user provided.

**How / key decisions:**
- **Checked Next.js 16's own bundled docs before writing route code.** `create-next-app` generated an `AGENTS.md` warning that this version has real breaking changes from older training data (async `params`/`searchParams` as Promises, Turbopack on by default, `middleware` renamed to `proxy`). Read `node_modules/next/dist/docs/.../upgrading/version-16.md` first rather than assuming prior Next.js knowledge still applied — avoided writing dynamic routes with the old synchronous `params` API.
- **shadcn/ui now generates Base UI components, not Radix** (`@base-ui/react`, "base-nova" style) — different prop names in a few places (`render` instead of `asChild`/`Slot`, `delay` instead of `delayDuration` on Tooltip, `nativeButton={false}` needed when a `Button` renders as an `<a>`). Checked each primitive's actual `.d.ts` rather than guessing from memory of the older Radix-based shadcn.
- **RespondentFlow takes a `mode: "live" | "preview"` prop** so the live public page and the builder's "Preview" modal are the *same component* — preview mode just skips the start/upsert/submit network calls. Avoids maintaining two versions of the hardest piece of UI.
- **Every non-trivial feature was verified with headless Chromium (Playwright), not just `tsc`/`next build`.** Installed Playwright into the scratchpad (not the project) since it's a verification tool, not a project dependency. This caught two real bugs that type-checking couldn't:
  1. **Stale-closure bug in auto-advance.** Choice/rating/yes-no questions call `onChange` then `setTimeout(onAdvance, 350)`. `onAdvance` was `goNext`, a `useCallback` depending on `answers` — so the timer captured whichever `goNext` closure existed *before* the state update, and fired with the pre-selection answer, incorrectly showing "required" on a question the user had just answered. Fixed by routing the call through a ref kept fresh every render (`goNextRef.current()`), so the timer always invokes the latest version regardless of when it fires.
  2. **Toolbar layout bug after reuse.** `AddQuestionMenu`'s trigger button had a hardcoded `w-full justify-center`, fine for its original spot at the bottom of the sidebar. Once the builder was restructured to put "Add content" in a horizontal toolbar (matching the reference screenshot), that `w-full` expanded to fill the whole toolbar row and pushed Design/Preview/Settings off-screen. Only visible in an actual rendered screenshot, not in the type-checker.
- **Also caught, mid-testing, that a form's question order had gotten scrambled** — traced it to *test-script* mouse interactions near drag handles, not a code bug; confirmed this by deliberately simulating a real drag (mouse down → multiple intermediate moves → up) with Playwright and checking the resulting `order_index` via the API, which came back correct. Reseeded to fix the data; no code changed.
- **Redesign pass** (after the user's screenshots): added a workspace top bar, List/Grid toggle backed by real data (extracted the dropdown-menu + rename/delete dialogs out of `FormCard` into a shared `FormActionsMenu` so the new table row and the existing grid card don't duplicate mutation logic), and restructured the builder from one center panel into sidebar → toolbar+canvas → right settings panel, matching the reference layout. Added `FormSettingsDialog` (thank-you message, a single accent-color theme setting, and a "Coming soon" tab for logic jumps/integrations/collaboration/payment+file-upload — explicit placeholders per the spec) and wired dark mode (`next-themes`, already installed but unused until now) into both top bars.
- **Every reseed-worthy test run was followed by `python -m app.seed`** before moving to the next feature, so the delivered demo data stays exactly what `seed.py` produces, not whatever state my own testing left behind.

Both frontend and backend are feature-complete against the assignment's core requirements as of this entry. Remaining: a final pass checking every checklist item in the assignment PDF explicitly, and deployment (Render for backend, Vercel for frontend — not yet done).

---
