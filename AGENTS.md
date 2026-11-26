<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Frontend & Integration Architecture

- Keep the TriageAgent frontend as a TanStack Start + TanStack Router + TanStack Query + shadcn/ui application connected to the FastAPI backend (`http://127.0.0.1:8000` via Vite `/api` proxy in development).
- Keep shared display types (`src/features/triage/model.ts`), backend-to-display mappers (`src/features/triage/mappers.ts`), and illustrative fixtures (`src/features/triage/demo-data.ts`) separate from screen components. Do not silently fall back to demo data when live API requests fail.

### Authentication & Role-Based Access

- **Supabase Auth:** `src/lib/supabase.ts` initializes the browser client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (never use secret/service-role keys in frontend code). Browser storage and URL session detection are gated behind `typeof window !== "undefined"` for TanStack Start SSR compatibility.
- **Session & Profile:** `src/lib/auth-context.tsx` (`AuthProvider`) subscribes to `supabase.auth.onAuthStateChange` and retrieves trusted `role` and `full_name` from `public.profiles` (`src/lib/auth-helpers.ts`). Never trust `user_metadata.role`.
- **Route Protection:** `src/components/protected-route.tsx` (`ProtectedRoute`) guards `/employee/*` (`employee`) and `/admin/*` (`admin`, `support`, while keeping `/admin/login` public). Admin-only routes (`/admin/dashboard`, `/admin/activity`) restrict access to `admin`.

### FastAPI Integration & TanStack Query Hooks

- `src/lib/api/client.ts` (`apiFetch`) retrieves the current Supabase session token (refreshing if near expiry) and attaches `Authorization: Bearer <token>` to all backend requests.
- `src/lib/api/types.ts`, `query-keys.ts`, `tickets.ts`, and `messages.ts` provide typed hooks (`useTickets`, `useTicket`, `useCreateTicket`, `useTicketMessages`, `useSendTicketMessage`, `useAnalyzeTicket`) with query invalidation.

### Role Workflows & Unsupported / Preview-Only Features

- **Employee (`/employee/*`):** Live dashboard, ticket list/filtering, ticket creation (`POST /api/v1/tickets`), ticket details, messaging, and AI triage analysis (`POST /api/v1/tickets/{id}/analyze`).
- **Support (`/admin/tickets`, `/admin/escalations`, `/admin/ticket/$id`, `/admin/profile`):** Live support ticket queue, escalated tickets (derived client-side from `status === "ESCALATED"`), ticket conversations, support replies, and AI analysis.
- **Admin (`/admin/dashboard`, `/admin/tickets`, `/admin/escalations`, `/admin/ticket/$id`, `/admin/activity`, `/admin/profile`):** Full operations overview with live ticket statistics and charts, plus support workflows.
- **Preview-Only / Unsupported Features:**
  - **Agent Activity (`/admin/activity`):** Explicitly labeled as preview-only using `demoAgentRuns` (no live `agent-runs` backend endpoint yet).
  - **Ticket assignment, ticket status updates, escalation management endpoints, and feedback submission:** Not yet supported by backend endpoints and intentionally omitted/disabled rather than simulated.

### Environment Variables & Local Development

- **Frontend (`D:\ticket_agent\frontend\ticket-orbit-workbench\.env.local`, see `.env.local.example`):**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_API_BASE_URL` (optional; defaults to relative `/api` Vite proxy)
- **Backend (`D:\ticket_agent\backend\.env`, see `.env.example`):**
  - `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`
- **Run Backend:** `cd D:\ticket_agent\backend` → `uv run uvicorn triage_agent_backend.main:app --reload`
- **Run Frontend:** `cd D:\ticket_agent\frontend\ticket-orbit-workbench` → `bun run dev`

### Testing & Verification Commands

- **Frontend unit tests:** `bun run test`
- **TypeScript typecheck:** `bunx tsc --noEmit`
- **ESLint (targeted files):** `bunx eslint <file...>`
- **Frontend production build:** `bun run build`
- **Backend test suite:** `cd D:\ticket_agent\backend` → `uv run pytest`
