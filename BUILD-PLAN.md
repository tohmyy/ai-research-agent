# Build Plan: AI Content Research and Publishing Agent

Companion to `TDD.md` (architecture) and `ui-design-spec.md` (UI). This document sequences implementation into vertical-slice phases: each phase ships a working end-to-end piece of the pipeline (UI + Next.js API + FastAPI + database), so progress can be demoed and checked against the PRD's test scenarios as it lands, rather than in one big-bang build at the end.

Build order is solo/sequential — one phase at a time, in order. No phase should be started before the previous phase's verification passes.

## Phase 0 — Scaffolding & Foundations

**Goal:** an empty but running skeleton of every piece, with no real pipeline logic yet.

- Initialize the Next.js app (TypeScript, Tailwind CSS, shadcn/ui). Wire the design tokens from `ui-design-spec.md` §4 into `globals.css` and `tailwind.config.ts` exactly as specified (colors, type scale, spacing, radius).
- Build the application shell per UI spec §11–13: collapsible sidebar with the 5 nav items (Dashboard, Content Requests, Research, Review, Publishing) plus Settings, sticky top bar, all routes pointing to empty placeholder pages.
- Integrate Better Auth into Next.js with email + password sign-in and a Postgres adapter pointed at Supabase. Gate every shell route behind a session.
- Scaffold the FastAPI project with a `/health` endpoint.
- Provision the Supabase project, enable the `pgvector` extension, and run a migration creating every table from `TDD.md` §3 (`users`/`sessions` via Better Auth, `content_requests`, `research_jobs`, `sources`, `source_chunks`, `content_plans`, `article_drafts`, `draft_sources`, `evaluations`, `channel_content`, `approvals`, `publishing_queue`, `notifications`) — even tables unused until later phases.
- Add every env var from `TDD.md` §12 to local config (`ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`, `VOYAGE_API_KEY`, `SUPABASE_URL`/`SUPABASE_SERVICE_KEY`, `LINKEDIN_ACCESS_TOKEN`, `X_API_KEY`/`X_API_SECRET`/`X_ACCESS_TOKEN`, `SENDGRID_API_KEY`, `BETTER_AUTH_SECRET`), present but unused where not yet needed.

**Verification:** Next.js app runs locally; a user can sign up/log in via Better Auth; the sidebar navigates between empty pages; `GET /health` on FastAPI returns 200; every table from the schema exists in Supabase.

## Phase 1 — Content Request Intake (walking skeleton)

**Goal:** prove the full Next.js ↔ FastAPI ↔ Supabase wiring works end to end before any real AI logic exists.

- Build the New Content Request page (UI spec §19–21): raw idea (required), target audience (required), supporting material (optional), source URL (optional, validated), additional instructions (optional). Inline validation per §21; no generic "Something went wrong" messages.
- Next.js API route creates a `content_requests` row (status `submitted`, `created_by` = session user) and calls a FastAPI trigger endpoint `POST /pipeline/start`. For this phase only, the endpoint is a stub: it immediately writes a `research_jobs` row with `status = succeeded` — no real research yet — so the request → trigger → status-write → UI-refresh loop is proven before real logic is added.
- Build the Dashboard (UI spec §15–17): header + CTA, four summary cards (Active Requests, Awaiting Review, Scheduled, Published) reading live counts from Supabase, a "Recent Content Requests" list, empty publishing-queue and recent-activity sections (real content arrives in later phases).

**Verification:** submitting a request creates a row and the dashboard reflects it without a manual refresh (poll or refetch). No PRD scenario fully passes yet, but the intake half of scenarios 1 and 2 does — both raw-idea and URL requests are accepted and stored correctly.

## Phase 2 — Research & Retrieval (RAG)

**Goal:** replace the Phase 1 stub with real research.

- FastAPI research module: Firecrawl search for idea-only requests, Firecrawl scrape for URL-based requests; clean extracted content; extract metadata (title, author, published date); deduplicate; rank by relevance. Write results to `sources` (including sources considered but not used, with `included=false`).
- RAG module: chunk source text, generate Voyage AI embeddings, store in `source_chunks.embedding` (pgvector). Similarity search is implemented here but exercised starting in Phase 3.
- Real `research_jobs` stage/status/error tracking replaces the Phase 1 stub, with a timestamp per step (searching → extracting → analyzing → building context).
- Research workspace UI (§22–27): live activity timeline (§23) with expandable step details ("12 sources discovered," "8 extracted"); two-column source list + source detail panel (§25–27) showing title, domain, publish date, excerpt, key findings, and an external "View Source" link; research failure state with Retry (§24).

**Verification:** PRD scenario 1 (raw idea → relevant sources found) and scenario 2 (URL → source content actually extracted and visible) pass. Deliberately submitting a broken URL produces a clear, retryable failure in the UI — an early instance of scenario 8.

## Phase 3 — Planning & Multi-Option Generation

**Goal:** turn research into selectable article options.

- FastAPI generation module: build a content plan (`content_plans` — angle, outline, keywords, section depth) from the retrieved context, then generate multiple full article options (`article_drafts`, one row per option with `variant_label` set) via Claude structured outputs, following `assets/seo-best-practices.md` (primary keyword in title and first 100 words, H1/H2/H3 structure, short paragraphs, 2–3 relevant links).
- Populate `draft_sources` for every draft — the record of which sources/chunks fed it.
- Article Options UI (§30–31): option cards showing title, angle/summary, source count, estimated length — no AI quality score on the cards (§30.2); Preview and Select actions; the source-grounding component (§28), "Grounded in N sources · Forbes · McKinsey · +2 · View all sources."

**Verification:** both a raw-idea request and a URL-based request each produce multiple relevant, source-grounded article options; selecting one advances `content_requests.status` to `selected`.

## Phase 4 — Evaluation & Revision Loop

**Goal:** self-evaluate and auto-revise before a human ever sees the draft.

- FastAPI evaluation module: a Claude structured-output call scored against `assets/content-evaluation-rubric.md`'s exact criteria, writing `evaluations` (overall status, per-criterion notes, unsupported/weak claims, recommended changes).
- Revision module: on `revise`, automatically generate one revised draft chained via `article_drafts.parent_draft_id`, then re-evaluate — capped at 2 automatic cycles to avoid infinite loops. Still `revise`/`reject` after the cap is left for the human reviewer rather than looping further.
- Evaluation UI (§42–44): collapsed by default ("Evaluation complete — Show Evaluation"), expands to overall + per-criterion scores, Strengths and Needs Improvement lists; framed as "AI Evaluation," never as an absolute quality measure (§44).
- Version History component (§54–55): every version listed with type (Initial Generation / AI Revision / Human Revision), timestamp, and score; View and Compare actions.

**Verification:** PRD scenario 4 — a deliberately weak draft gets automatically revised, and the full version + evaluation history remains visible and accurate afterward.

## Phase 5 — Human Review Workspace

**Goal:** the reviewer can read, edit, and decide.

- Two-column Review workspace (§46–48): article editor on the left; Evaluation, Sources, Version History, and AI Assistant panels on the right, sticky while the article scrolls.
- Standard rich-text editing (headings, bold/italic, links, lists, quotes, undo/redo, word count) plus AI-assisted actions (Improve, Rewrite, Shorten, Expand, Change Tone) using the Current → Proposed → Accept/Reject pattern from §33–35 and §80 — AI edits never silently overwrite content.
- Approve / Request Revision / Reject actions (§49–52), each writing to `approvals` with `reviewer_id` set to the authenticated Better Auth user (not free text) and a required reason for revision/rejection.
- Publishing Gate (§53): "Publishing unavailable — Content must be approved before it can be published" shown until `approved`; the same check is enforced again in the Next.js API layer, not just the UI.

**Verification:** PRD scenario 5 — no content reaches an approved state without an explicit, attributable reviewer action, and attempting to publish pre-approval is blocked at both the UI and the API.

## Phase 6 — Channel Adaptation

**Goal:** adapt the approved article into LinkedIn, X, and newsletter content before final publishing approval (per `TDD.md` §7 and UI spec §36, adaptation happens before the reviewer signs off on what will actually be published).

- FastAPI channel adaptation endpoints, one per channel, each using `assets/channel-formatting-rules.md` as the system-prompt contract (PAS structure + CTA for LinkedIn, hook-first single-idea for X, subject line + skimmable body + CTA for the newsletter). Each adapted piece is run through the Phase 4 evaluation module before reaching review.
- Channel tabs and previews (§37–41): distinct LinkedIn, X, and Newsletter preview components, each clearly labeled as a preview (not a pixel-for-pixel replica), with platform-specific styling isolated to these components per §4.42 (no app-wide "LinkedIn blue" token).
- Channel content reuses the Phase 5 review pattern (Approve / Request Revision / Reject) for its own sign-off.

**Verification:** PRD scenario 6 — LinkedIn, X, and newsletter outputs are each visibly following their platform's formatting rules, and channel content cannot be approved without going through the same review flow as the article.

## Phase 7 — Publishing, Scheduling & Notifications

**Goal:** approved content actually goes out — or is queued/scheduled — and people are told.

- `Publisher` interface in FastAPI (`LinkedInPublisher`, `XPublisher`, `EmailPublisher`), each wrapping one real integration (LinkedIn API `w_member_social`, X API v2 tweet creation, SendGrid for the newsletter send).
- `publishing_queue` read/write from Next.js (enqueue only after the approval gate); APScheduler inside FastAPI polling for due `scheduled` items and dispatching to the matching `Publisher`.
- Publishing Queue UI (§56–59): table with Content/Channel/Status/Scheduled/Created/Actions columns; Publish Now and Schedule flows with confirmation dialogs (§60–61) that show the target channel and a content preview; publishing progress states and success/failure outcomes (§62–64), with technical error details hidden by default but expandable and copyable.
- Notification service (SendGrid): emails fired on review-ready, published, and publish-failed events, each attempt logged to `notifications`.

**Verification:** PRD scenario 7 — approved content ends up published, scheduled, or visibly queued, never silently dropped. Revoking a publishing credential on purpose proves the failure surfaces clearly and is retryable.

## Phase 8 — Failure Handling Pass & End-to-End Testing

**Goal:** close the loop on PRD scenario 8 across every stage and produce the submission deliverables.

- Sweep every stage — research, retrieval, generation, evaluation, the approval gate, publishing, notifications — to confirm each failure mode writes a structured, human-readable error that the UI surfaces per `ui-design-spec.md` §63–64 and §68, not just the happy path exercised so far.
- Deliberately induce one failure per stage (invalid URL, forced API timeout, a draft that still fails evaluation after the revision cap, a revoked publishing credential) and confirm each is debuggable from the UI alone, without reading server logs.
- Run all 8 PRD test scenarios end to end and complete the testing evidence table.
- Assemble the content sample pack: the original input, the generated article, the LinkedIn/X/newsletter outputs, and the source list, all from one real run.
- Write the one-page usage document and record the Loom walkthrough.

**Verification:** every row of the testing evidence table is checked off against a real run of the deployed app; the sample pack and one-pager are produced from actual output, not mocked content.
