# Educare Re-Entry CBT

Next.js + React + Tailwind + Node.js CBT platform for the cohort-wide re-entry assessment. Responses are stored in SQLite, students are preregistered, phone login is normalized on the backend, and `/admin` is protected with `admin` / `admin` by default.

## Features

- SQLite-backed student roster, attempts, and responses
- Preregistered cohort of 13 students
- Phone-number login with backend normalization
- 3-hour timed assessment
- One-question-at-a-time interface with autosave
- Copy, cut, paste, save, print, and context menu blocking during the test
- Admin dashboard with per-student TXT answer downloads

## Run locally

```bash
npm install
npm run dev:host
```

Open `http://localhost:3000`.

## Admin credentials

- Username: `admin`
- Password: `admin`

Override them if needed:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
SESSION_SECRET=change-me
```

## Host on Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Sign in at [vercel.com](https://vercel.com) and choose **Add New… → Project**, then import the repo.
3. Leave the defaults: **Framework Preset** Next.js, **Build Command** `next build`, **Output Directory** `.next` (or leave empty).
4. Under **Environment Variables**, add the same values you use locally (at minimum `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `SESSION_SECRET`). Redeploy after changing env vars.
5. Deploy. Vercel will assign a production URL; you can add a custom domain under **Project → Settings → Domains**.

This app stores data in a **SQLite file under `data/`**. Vercel’s default serverless runtime does not provide durable disk for that file between requests, so a straight deploy may not behave like your local machine unless you move the database to a hosted service (for example [Turso](https://turso.tech/) or another managed SQL store) or run the app on a host with a persistent filesystem. For a quick public demo during development, run locally and use a tunnel, or use Vercel mainly after adapting storage.
