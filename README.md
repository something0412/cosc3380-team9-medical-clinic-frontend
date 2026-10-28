# Medical Clinic Frontend

The website and patient/staff portal for Medical Clinic Database System (COSC 3380, Team 9).

## Stack

- **React 19 + TypeScript**, built with **Vite**
- **React Router 7** for pages
- **Tailwind CSS 4** for styling (theme colors and shadows are in `src/index.css`)
- **axios** for API calls, through the shared instance in `src/api.ts`

## Setup

```bash
npm install
```

```bash
npm run dev
```

The dev server runs at http://localhost:5173. Other scripts:

| Script | What it does |
| --- | --- |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run lint` | Run ESLint |
| `npm run preview` | Serve the built app locally |

### Backend connection

Start the backend first (`npm run dev` in `medical-clinic-backend`, port 4000). The backend only allows requests from `http://localhost:5173`, so keep the frontend on that port.

`src/api.ts` picks the backend URL:

- **Local development**: `http://localhost:4000`, or `VITE_API_URL` if you set it in a `.env` file (git-ignored).
- **Production (Vercel)**: the same site. `vercel.json` forwards `/api/*` to the deployed backend. Don't set `VITE_API_URL` in Vercel.

All requests send the login cookie (`withCredentials: true`).

## Roles and pages

| Role | Sign-in | Main pages |
| --- | --- | --- |
| Patient | `/login` (patient number or email) | Dashboard, appointments (book with the primary doctor preselected), records, billing (pay by card), forms, profile (primary doctor, contacts, insurance) |
| Doctor | `/employee/login` | Dashboard, appointments, patients and charts, visit documentation (summary, diagnoses, prescriptions, lab orders), referrals, lab orders, schedule |
| Nurse | `/employee/login` | Dashboard, Patient Appointments (filter by name, day and office), intake (vitals, notes, allergies, home medications), supplies |
| Receptionist | `/employee/login` | Dashboard, appointments (book, check in, check out, no-show), patients (register, insurance, forms, portal logins), billing |
| Lab technician | `/employee/login` | Dashboard, lab orders and results |
| Admin | `/employee/login` | Dashboard with yearly report, employees, offices, specialties, schedules and shifts, billing (invoices, refunds, fees), patients (primary doctor, password reset, activate or deactivate) |

Every portal role also has a **My Profile** page with a password change.

`src/context/AuthContext.tsx` keeps the signed-in user, and `src/layouts/RoleLayout.tsx` keeps each role inside its own pages.

## Project layout

```text
src/
  main.tsx             app entry point
  App.tsx              every route
  api.ts               shared axios instance and apiErrorMessage()
  types.ts             shared data shapes
  index.css            Tailwind import, theme colors, shadows
  context/             signed-in user (AuthContext)
  layouts/             public layout and the role layout with the sidebar
  components/          shared UI: forms, sections, tables, sidebar, reports
    admin/             admin page frame, status badges, button styles
    public/            public site pieces (header, footer, booking)
  pages/
    public/            public site and booking flow
    auth/              patient and employee sign-in
    patient/ doctor/ nurse/ receptionist/ lab/ admin/
    shared/            staff profile page
    staff/             nurse and receptionist dashboard switch
  services/            older shared API helpers (admin, booking, public)
  utils/               IDs, clinic time, print reports, small helpers
```

## PDF reports

Invoices, visit summaries and the admin yearly report print through the browser ("Save as PDF"):

- `components/PrintReport.tsx` is the report layout.
- `utils/printReport.ts` opens the print window and names the file.

Only one report can be on a page at a time.

## Deployment

The frontend deploys to **Vercel** from the `main` branch. `vercel.json` sends `/api/*` to the backend and every other path to `index.html`, so page refreshes work.
