# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: App Router pages (`admin`, `guest`, root) plus API route at `src/app/api/search/route.ts` for YouTube search; global styles live in `src/app/globals.css`.
- `src/pages/api/socket.ts`: Socket.IO server for room lifecycle, queue updates, and playback events; shares in-memory state via `src/lib/store.ts`.
- `src/components`: UI building blocks grouped by role (`host`, `admin`, `guest`) and shared widgets like `Queue.tsx` and `YoutubePlayer.tsx`.
- `src/hooks` and `src/types`: Custom hooks and shared TypeScript contracts for rooms, songs, and sockets.
- `public`: Static assets; keep large media out of Git.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server at `http://localhost:3000` (App Router + legacy API routes).
- `npm run build`: Production build; catches missing env vars and type issues.
- `npm run start`: Serve the production build locally.
- `npm run lint`: ESLint with Next.js rules; run before commits. Use `npm run lint -- --fix` for autofixes.

## Coding Style & Naming Conventions
- TypeScript-first; prefer typed props and reuse shared types from `src/types`.
- Components and hooks are PascalCase; files follow the component/hook name (e.g., `Queue.tsx`, `useSocket.ts`).
- Keep socket event names stable (`create_room`, `add_to_queue`, etc.) and co-locate related handlers with their emitting UI.
- Follow `eslint.config.mjs`; 2-space indent and semicolons are standard.
- Keep App Router UI in `src/app`; keep server logic (Socket.IO, search proxy) in API routes to avoid leaking secrets.

## Testing Guidelines
- Planned automation: Vitest + React Testing Library + jsdom; add dev deps and `npm test` script, run alongside lint before PRs.
- Co-locate specs as `*.test.ts(x)` next to the subject; mock socket and YouTube network calls.
- Manual smoke: run `npm run dev`, create a room as host, join as guest/admin, add/move/play songs, and confirm queue/announcement events propagate.
- Guard real YouTube calls with `YOUTUBE_API_KEY`/`NEXT_PUBLIC_YOUTUBE_API_KEY`; mock results are returned when absent.

## Commit & Pull Request Guidelines
- Use short, imperative commits with a type prefix seen in history (`feat:`, `fix:`, `chore:`, `docs:`); add a scope when helpful (e.g., `feat(host): manual start`).
- Keep PRs focused: description of intent, key changes, testing notes, and screenshots/GIFs for UI updates (host/admin/guest views).
- Link issues or tickets when available and call out any config/env changes (`YOUTUBE_API_KEY`, socket path `/api/socket-io`).
