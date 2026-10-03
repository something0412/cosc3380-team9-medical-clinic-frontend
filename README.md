# Medical Clinic — Frontend

React + TypeScript app (Vite). Deliberately minimal: no router, no state
management library, no UI component library. Plain `.tsx` files, `useState`,
`useEffect`, and plain CSS. This is a teaching skeleton — read it top to
bottom before adding a new feature, and copy its patterns rather than
inventing new ones.

## Stack

- **React 19 + TypeScript**, via Vite
- **axios** for API calls (a shared instance, see `src/api.ts`) — not the
  native `fetch`
- Plain CSS (`src/index.css`, `src/App.css`) — no Tailwind/CSS framework

## Setup

```bash
npm install
npm run dev       # starts the Vite dev server, default http://localhost:5173
npm run build     # tsc -b && vite build → dist/
npm run lint       # eslint .
npm run preview   # serve the production build locally
```

The backend must be running separately (see `../medical-clinic-backend`) for
any tab except the static placeholder content to work. By default the app
calls `http://localhost:4000`. To point at a different backend, create a
`.env` with:

```sh
VITE_API_URL=http://your-backend-host:port
```

(Vite only exposes env vars prefixed with `VITE_` to browser code — see
`src/api.ts`.)

## Project layout

```text
src/
  main.tsx              # React entry point
  App.tsx               # the three tabs live here (Patients, Appointments, Template)
  api.ts                # shared axios instance + base URL
  types.ts              # shared TypeScript interfaces for API data shapes
  components/
    Tabs.tsx            # generic, reusable tab bar component
```

## What's actually working right now

`App.tsx` renders three tabs via the reusable `Tabs` component
(`src/components/Tabs.tsx`):

- **Patients** — fetches `GET /api/patients` on mount and renders a table.
  Has `loading` and `error` state, handled with `useEffect` + an inner
  `async` function + `try/catch/finally` (not `.then()`/`.catch()` chains —
  that's a deliberate style choice, keep using try/catch for new async
  effects). The `Patient` shape (`src/types.ts`) matches exactly what
  `GET /api/patients` returns: `patientId`, `firstName`, `lastName`, `dob`,
  `phone`, `email`, `isActive`.
- **Appointments** — placeholder only. There's no backend route for this
  yet.
- **Template** — a button that calls `GET /api/template` and dumps the raw
  JSON response on the page. Exists purely to prove the frontend can reach
  the backend; it's not a model for a real feature.

## How to add a new tab/feature (e.g. appointments)

1. Add the shape of the data to `src/types.ts` (match the backend's response
   exactly — don't invent fields the backend doesn't send).
2. Add a typed fetch function if you want one, or call `api.get(...)` from
   `src/api.ts` directly (see how `PatientsTab` does it in `App.tsx`).
3. Copy `PatientsTab` in `App.tsx`: a `useState` for the data, a `loading`
   flag, an `error` message, a `useEffect` with an inner `async` function
   wrapped in `try/catch/finally`, and render branches for loading/error/
   success.
4. Add it to the `tabs` array passed to `<Tabs />` in the `App` component.
   Don't modify `Tabs.tsx` itself — it's generic and knows nothing about
   patients/appointments/etc.
