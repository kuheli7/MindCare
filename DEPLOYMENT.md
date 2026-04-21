# MindCare Deployment Guide

## Recommended Frontend Host
Use **Netlify** for this frontend.

Why Netlify here:
- Vite + SPA routing setup is very straightforward.
- Easy environment variable management.
- Fast deploy previews for each commit.

Vercel is also supported (config included), but Netlify is the simpler path for this project.

## Architecture
- Frontend: Static Vite build from this repo root.
- Backend: Express API on Render (Web Service).
- Database: MongoDB Atlas (or another externally reachable MongoDB).

## 1) Deploy Backend to Render

### Service settings
- Runtime: Node
- Root Directory: (leave empty, use repo root)
- Build Command: `npm install`
- Start Command: `npm run start:backend`
- Health Check Path: `/healthz`

You can also deploy via blueprint using `render.yaml`.

### Required Render environment variables
- `NODE_ENV=production`
- `MONGO_URI=<your mongo connection string>`
- `JWT_SECRET=<strong-random-secret>`
- `FRONTEND_ORIGIN=<your frontend domain>`

If you use email features, also set:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `CONTACT_RECEIVER_EMAIL`

After deploy, note your backend URL, for example:
- `https://mindcare-api.onrender.com`

## 2) Deploy Frontend to Netlify (Recommended)

### Netlify build settings
- Base directory: (leave empty)
- Build command: `npm run build:frontend`
- Publish directory: `dist`

`netlify.toml` is already added with SPA redirects.

### Netlify environment variable
- `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`

Deploy and test these routes directly in the browser:
- `/`
- `/login`
- `/admin-login`

If these open correctly after refresh, SPA redirect is working.

## 3) Optional: Deploy Frontend to Vercel

`vercel.json` is included.

### Vercel settings
- Framework preset: Vite
- Build command: `npm run build:frontend`
- Output directory: `dist`
- Env var: `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`

## 4) CORS and Cookies
- Backend CORS now supports comma-separated origins in `FRONTEND_ORIGIN`.
- If you move domains later, update `FRONTEND_ORIGIN` in Render.

## 5) Post-deploy sanity checks
- `GET <backend-url>/healthz` returns `{"status":"ok"}`
- Frontend can log in and call API endpoints successfully
- No CORS errors in browser console

## Common Failure Fixes
- 404 on frontend refresh: confirm Netlify/Vercel redirect config is active.
- CORS blocked: ensure frontend domain exactly matches an entry in `FRONTEND_ORIGIN`.
- 500 from backend: verify `MONGO_URI` and `JWT_SECRET` are set in Render.
