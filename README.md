# Apoyo Web

Public marketing website for **Apoyo**, the City of Dasmariñas digital social-welfare assistance platform. Visitors learn about programs, requirements, and the organization. They **do not log in here**. Applications happen in the **mobile app**. Casework happens in **Apoyo Admin**.

This README documents **this site** and the **whole Apoyo stack**, so the repository can stand alone in a thesis defense.

Sibling repositories:

| Repo | Role | GitHub |
|------|------|--------|
| **Apoyo-Admin** | Postgres, Auth, Storage, Edge Functions, staff UI | https://github.com/Jewel-190/Apoyo-Admin |
| **Apoyo-Web** (this repo) | Public SPA | https://github.com/Jewel-190/Apoyo-Web |
| **Apoyo-Mobile** | Citizen app + face-verification Docker stack | https://github.com/Jewel-190/Apoyo-Mobile |

---

## 1. What Apoyo is (defense one-liner)

Apoyo is a **self-hosted, three-application system**:

- **Mobile** — registered voters apply for assistance (MPIN login, ID + face verification, document upload).
- **Web** (this repo) — the public face of the program (Home, Services, About, Legal).
- **Admin** — line staff and superadmins process cases, manage CMS, voters, and settings.

Data lives on a **Windows office PC**. The internet reaches it only through a **Cloudflare Tunnel**. Paid vendors: **Cloudflare**, **Resend**, **Hostinger**.

---

## 2. Whole-system architecture

```
                    Internet (HTTPS)
                           |
                    Cloudflare Tunnel
                    apoyo-dasma
                           |
          +----------------+----------------+
          |                |                |
   www.apoyo-dasma    admin.apoyo-dasma   api.apoyo-dasma
   .online            .online             .online
          |                |                |
     nginx :4173      nginx :4174      Kong :54321
     THIS SITE        Admin SPA        Local Supabase
                                       Auth + Postgres
                                       Storage + Edge
                                              |
                                    Face verifier :8090
                                    (NOT public)
```

This site is served at **https://www.apoyo-dasma.online** (and the apex domain). It calls **https://api.apoyo-dasma.online** with the **public anon key only** (`persistSession: false` — no citizen login on the website).

---

## 3. Whole-system technology stack

| Layer | Technology | Role |
|-------|------------|------|
| Public site | **React 19**, **Vite 7**, **React Router 7**, **Tailwind CSS 4**, **react-icons** | This repository |
| Staff console | React 19 + Vite 7 + Tailwind 4 + lucide-react + SheetJS | Apoyo-Admin |
| Citizen app | **Expo 54**, React Native 0.81, expo-router, SecureStore, Camera | Apoyo-Mobile |
| API / DB | **Supabase local**: PostgreSQL 17, GoTrue, PostgREST, Storage, Deno Edge Functions, Kong | Apoyo-Admin `supabase/` |
| Face / ID | CompreFace, DeepFace, MediaPipe, EasyOCR, FastAPI | Apoyo-Mobile `deploy/face-verification` |
| Hosting | Docker Desktop, nginx, Cloudflare Tunnel, Resend SMTP, Hostinger registrar | Office Windows PC |

**Why a separate website?** Staff tools and citizen PII stay off the public marketing surface. The site can be cached, CMS-edited, and themed without giving visitors an auth session.

---

## 4. What this website does

| Page | Route | Content source |
|------|-------|----------------|
| Home | `/` | Superadmin Web CMS (`web_content.home` + `global`) |
| Services | `/services` | **Live catalog** from Postgres (active categories/services/requirements) plus CMS overlays (facility photos, map, visit link) |
| About | `/about` | CMS (`web_content.about`); contact channels reused conceptually by mobile Contact Us |
| Legal | `/legal/:slug` | Platform `settings` (legal copy); slugs such as terms-and-conditions, user-acceptance |

Primary navigation (**Home, Services, About Us**) is **hardcoded** so CMS cannot hide or rename the product IA. Favicon and navbar mark stay Apoyo.

**Not in this app:** applicant login, file upload, case review, face capture.

---

## 5. How this site talks to the backend

### 5.1 Marketing + legal — Edge Function `web`

```
Browser  →  GET https://api.apoyo-dasma.online/functions/v1/web
         →  headers: apikey + Authorization Bearer (anon key)
         →  JSON: { pages: { global, home, services, about }, legal }
```

- Implemented in **Apoyo-Admin** `supabase/functions/web`.
- Table `web_content` is **not** selected by anon RLS; the function uses the service role.
- Superadmin CMS (Admin app) POSTs `cms.list` / `cms.save` to the **same** function with a staff JWT and `is_superadmin()`.
- Client cache: stale-while-revalidate in `localStorage` (`apoyo.webContent.v1`).
- HTML from CMS is passed through **`sanitizeCmsHtml`** and links through **`safeHref`** before render.

### 5.2 Assistance catalog — PostgREST + RLS

`publicCatalog.js` reads:

- `assistance_categories`
- `assistance_services`
- `assistance_requirements`
- `assistance_requirement_tips`

Filters: **active** rows only. Policies allow `anon` and `authenticated` **read** of active catalog. Writes are superadmin via Admin edge functions.

---

## 6. This repository layout

```
src/
  App.jsx                 BrowserRouter
  pages/                  HomePage, ServicesPage, AboutPage, LegalPage
  shared/content/         WebContentContext, rich text
  shared/lib/             webApi, publicCatalog, sanitizeHtml, safeHref, supabaseClient
  shared/ui/              Layout, Navbar, Footer, ContentImage
```

Env (public only):

```
VITE_SUPABASE_URL=https://api.apoyo-dasma.online
VITE_SUPABASE_ANON_KEY=<anon or publishable key>
```

Copy `.env.example` → `.env.local`. Never put `service_role` here.

---

## 7. Production serving

Built inside Docker (`ApoyoAdmin/deploy/docker/spa.Dockerfile`), image `apoyo-web:local`, published as **`127.0.0.1:4173`**. nginx:

- SPA fallback `try_files` → `index.html`
- long-cache hashed `/assets/`
- security headers (HSTS, CSP, nosniff, frame deny, COOP)

Cloudflare Tunnel maps `www.apoyo-dasma.online` and `apoyo-dasma.online` to that port. TLS is at Cloudflare, not on nginx.

Start the full homelab from **Apoyo-Admin**:

```powershell
.\deploy\scripts\Start-Apoyo.ps1
```

---

## 8. Security (this site)

- No persisted auth session.
- Anon key only.
- CMS HTML stripped of scripts, event handlers, and dangerous URLs.
- CSP allows `connect-src` to HTTPS (the API) and OpenStreetMap embeds for facility maps.
- Camera/mic/geolocation Permissions-Policy disabled on the marketing origin.

---

## 9. How a defense question maps to code

| Question | Point to |
|----------|----------|
| Who edits the homepage? | Superadmin → Content Management → Web in Apoyo-Admin; stored in `web_content`; served by function `web` |
| Why can visitors see programs? | RLS policies on active catalog tables; `publicCatalog.js` |
| Where is the database? | Apoyo-Admin `supabase/migrations/` |
| How is the site on the internet without a cloud host? | nginx on the office PC + Cloudflare Tunnel |

Same API as mobile and admin: **`https://api.apoyo-dasma.online`**.
