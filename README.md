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
| Patient | `/login` (email) | Dashboard, appointments (book with the primary doctor preselected, cancel with an "are you sure" pop-up, referral status), records, billing (pay by card), forms, profile (primary doctor, contacts, insurance) |
| Doctor | `/login` (email) | Dashboard, appointments, patients and charts, visit documentation (summary, diagnoses, prescriptions, lab orders), referrals (send with a reason, approve or deny as the primary doctor), lab orders, schedule |
| Nurse | `/login` (email) | Dashboard, Patient Appointments (filter by name, day and office), intake (vitals, notes, allergies, home medications; editable only on the visit day at the nurse's office after check-in), supplies |
| Receptionist | `/login` (email) | Dashboard, appointments (book, check in, check out; visits that pass without a check-in become No Show automatically), patients (register, insurance, forms, portal logins), billing |
| Lab technician | `/login` (email) | Dashboard, lab orders and results |
| Admin | `/login` (email) | Dashboard with yearly report, employees, offices, specialties, schedules and shifts, billing (invoices, refunds, fees), patients (primary doctor, password reset, activate or deactivate), **Reports** (3 data reports) |

Every portal role also has a **My Profile** page with a password change.

`src/context/AuthContext.tsx` keeps the signed-in user, and `src/layouts/RoleLayout.tsx` keeps each role inside its own pages.

## Referrals

1. A doctor who has seen the patient writes a referral to a specialist with a **reason**.
2. It goes to the **patient's primary doctor**, who approves it or denies it with a reason. If the primary doctor wrote it, it's approved right away.
3. Once approved, the patient or the front desk can book that specialist. Specialists that need a referral can't be booked without one.

The patient only sees each referral's status, not the reasons.

## Admin reports

The admin **Reports** page (`/admin/reports`) has 3 reports, each with its own page:

| Report | Question it answers |
| --- | --- |
| Missed Appointments | Where are no-shows and cancellations coming from, and which patients should we follow up with? |
| Unpaid Balances | Who owes the clinic money, how long has it been unpaid, and is it patients or insurance that's behind? |
| Schedule Utilization | How full is each doctor's schedule compared to the time slots they offer? |

Every report has a time period filter (weekly, monthly, quarterly, yearly or a custom range), filters for its topic (office, doctor, specialty, patient and more), tables you can sort by clicking a column header, a search box, and **Download PDF**. Filters are saved in the page link, so a filtered report can be bookmarked.

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
    admin/             admin page frame, status badges, button styles, report period picker and sortable table
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

Invoices, visit summaries, the admin yearly report and the 3 admin reports print through the browser ("Save as PDF"):

- `components/PrintReport.tsx` is the report layout.
- `utils/printReport.ts` opens the print window and names the file.

Only one report can be on a page at a time.

## Deployment

The frontend deploys to **Vercel** from the `main` branch. `vercel.json` sends `/api/*` to the backend and every other path to `index.html`, so page refreshes work.
