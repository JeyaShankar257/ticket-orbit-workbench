# TriageAgent Frontend & Integration Roadmap

- [x] Replace the starter screen with a polished support workspace and responsive employee/admin navigation.
- [x] Add ticket, escalation, activity, and profile views with shared ticket types and separate demo fixtures.
- [x] Configure backend CORS and Vite `/api` proxy for local development (`http://127.0.0.1:8000`).
- [x] Integrate SSR-safe Supabase Authentication (`AuthProvider`, `profiles.role` verification, login/register, and `ProtectedRoute` guards).
- [x] Implement typed TanStack Query API hooks (`useTickets`, `useTicket`, `useCreateTicket`, `useTicketMessages`, `useSendTicketMessage`, `useAnalyzeTicket`) using `apiFetch`.
- [x] Connect Employee workflow screens (dashboard, ticket list, ticket creation, ticket details, messaging, AI analysis, profile) to live backend APIs.
- [x] Connect Admin and Support workflow screens (operations dashboard, support queue, derived `ESCALATED` queue, ticket conversations, profile, role-filtered `TriageShell`) to live backend APIs.
- [ ] Future: Add backend endpoints for `agent_runs` telemetry (`/admin/activity` is currently preview-only), ticket assignment, ticket status updates, and resolution feedback persistence.