# QueueZero — Frontend

React 19 + Vite + Tailwind CSS v4 + GSAP. Talks to the QueueZero backend over REST (HTTP-only cookie auth) and Socket.IO.

## Setup

```bash
cp .env.example .env   # VITE_API_URL, VITE_SOCKET_URL
npm install
npm run dev            # http://localhost:3000
npm run build
```

The backend `CLIENT_URL` must match the dev origin (default `http://localhost:3000`) for cookies and Socket.IO CORS.

Admins can manage registered user and staff roles and assign staff to departments from the Staff page. Admin accounts are not editable there. Staff see queues belonging to their assigned departments and can operate them from the staff queue console.

## Structure

- `src/index.css` — design tokens (`@theme`), theme variables, type scale, texture utilities
- `src/motion/` — GSAP registration, duration/ease tokens, reduced-motion helper
- `src/components/{ui,motion,queue,layout,shared}` — design system and product components
- `src/context/` — Auth, Theme, Socket (single connection owner), Toast
- `src/hooks/` — `useQueueSocket`, `useQueueOverview`
- `src/pages/` — public (landing, auth), user, staff, admin

## Theming

`<html data-theme="dark|light">` is the single source of truth. CSS variables (`--qz-*`) change per theme, Tailwind color tokens read them, and the `dark:` variant is bound to the same attribute.
