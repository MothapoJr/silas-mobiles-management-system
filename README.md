Silas Mobiles Management System

Booking, inventory, staff and invoicing platform for Silas Mobiles (Silas Projects), a Pretoria-based mobile equipment rental and event catering business. Built by The Dev-Masters for INSY7315 (Information Systems 3E, WIL).

Full requirements, architecture rationale, and diagrams live in the Task 1 documentation. This repository is the source of truth for how the system is actually built. Where Task 1 and this README disagree, prefer this README and the Final Report (Task 3).

## 1. Tech stack

| Layer | Technology |
| --- | --- |
| Front-end | React 19 + Vite 7 + Tailwind CSS 4 |
| Back-end | Node.js 24 + Express |
| ORM / DB | Sequelize + pg → PostgreSQL (16-table schema in `backend/src/migrations`) |
| Auth | JWT (≈15-min access token in memory, HttpOnly-cookie refresh) + RBAC |
| Patterns | Observer (notifications), Factory (`InvoiceFactory`) |
| Testing | Jest + Supertest (backend); Vitest + React Testing Library (frontend) |
| CI | GitHub Actions path-filtered (`detect-changes` → `backend-ci` / `frontend-ci`) |
| IaC (production design) | Terraform under `infrastructure/terraform` (AWS af-south-1) |
| **EXPO live hosting** | **Vercel (frontend) → Render (API) → Neon Postgres** |

## 2. Live links

| Item | URL |
| --- | --- |
| Production app | https://silas-mobiles-management-system.vercel.app |
| API health | https://silas-mobiles-management-system.onrender.com/health |
| Repository | https://github.com/MothapoJr/silas-mobiles-management-system |
| Primary branch | `develop` |

## 3. Repository layout

```
backend/                  Express API — models, migrations, seeders, services, routes
frontend/                 React SPA (role dashboards, public equipment photos)
infrastructure/terraform/ AWS infra as code (production design)
docs/                     DATABASE_SCHEMA.md, DEPLOYMENT.md
.github/workflows/        CI and gated AWS CD
docker-compose.yml        Local dev: Postgres + migrate + backend
CONTRIBUTING.md           Gitflow and PR process
README.md                 This overview
```

## 4. Local development

```bash
# Backend + database
cp backend/.env.example backend/.env
docker compose up --build -d
docker compose run --rm migrate npm run db:seed

# Frontend (second terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- Backend health: http://localhost:3000/health  

Running the backend outside Docker: set `DB_HOST=localhost` and `DB_USERNAME` (not `DB_USER`) in `backend/.env`, then migrate before start.

## 5. Demo users

Password for all accounts: `Demo123!`  
**Rotate or delete after the EXPO — the site is public.**

| Email | Role |
| --- | --- |
| admin@silasmobiles.local | administrator |
| client@silasmobiles.local | client |
| staff@silasmobiles.local | staff |
| finance@silasmobiles.local | finance_officer |

Login body: `{ "emailOrUsername": "...", "password": "Demo123!" }` → `POST /api/auth/login`

## 6. What is implemented

### 6.1 Backend

- **Auth** — login, refresh (cookie), logout, `/; JWT + `requireAuth` / `requireRole`
- **Client** — profile, catalogue, quotes, bookings (cancel emits Observer event)
- **Admin** — bookings list/approve/reject; equipment & services; **staff list; assignments list; assign staff** (`POST /api/admin/assignments`)
- **Staff** — assignments, status updates, issue reporting, profile/availability
- **Notifications** — Observer bus, list/mark-read, SES stub on booking status change
- **Finance** — invoices list/get/create (`InvoiceFactory`), record payment, summary

### 6.2 Front-end dashboards

| Role | Route | Tabs |
| --- | --- | --- |
| Client | `/client` | Catalogue (with photos), Quotes, Bookings, **Notifications**, Profile |
| Administrator | `/admin` | Bookings, **Assignments**, Equipment, Services |
| Staff | `/staff` | Assignments, Issues, Profile |
| Finance Officer | `/finance` | Invoices, Create, Summary |

### 6.3 Design patterns in code

- **Observer** — booking status change → notification service → client Notifications tab  
- **Factory** — `InvoiceFactory` builds standard, partial and credit invoices  

## 7. Admin assign-staff API

| Method | Path | Body / query |
| --- | --- | --- |
| GET | `/api/admin/staff` | optional `?availability=` |
| GET | `/api/admin/assignments` | optional `?status=` `&bookingId=` |
| POST | `/api/admin/assignments` | `{ staffId, bookingId, assignmentRole? }` |

Only **confirmed** or **active** bookings can receive assignments. Duplicate active assignment of the same staff to the same booking returns 409.

## 8. Finance module (summary)

| Tab | Behaviour |
| --- | --- |
| Invoices | All / Unpaid / Partial / Paid filters; Record payment with paid confirmation step |
| Create | Booking ID, type (standard / partial / credit), amount for partial/credit |
| Summary | Counts and totals by payment status |

## 9. Deployment note (EXPO vs production design)

The **live demo** uses free-tier hosting for speed:

```
Browser ──HTTPS──► Vercel (React) ──/api/* rewrite──► Render (Express) ──TLS──► Neon Postgres
```

Task 1 and Terraform still describe **AWS** (EC2, RDS Multi-AZ, CloudFront, WAF, SES, af-south-1) as the production target. AWS CD is opt-in via `AWS_CD_ENABLED` so GitHub checks stay clean when AWS is not provisioned.

Render environment essentials: `DB_HOST`, `DB_PORT`, `DB_NAME`, **`DB_USERNAME`**, `DB_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN` (Vercel URL, no trailing slash), `TRUST_PROXY_HOPS=2`, `NODE_ENV=production`.

## 10. Testing

```bash
cd frontend && npm test -- --run
cd backend && npm test
```

CI is path-filtered so only changed layers run.

## 11. Git workflow

- Branches: `main` (production), `develop` (integration), `feature/*`
- Prefer small conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`
- Open PRs into `develop`; merge when CI is green  
- See `CONTRIBUTING.md`

## 12. Task 3 document pack (local / artifacts)

| Deliverable | File |
| --- | --- |
| User Guide | `Silas_Mobiles_User_Guide_Task3.docx` |
| Final Report | `Silas_Mobiles_Final_Report_Task3.docx` |
| Working pack (run sheet) | `Silas Mobiles – Task 3 Working Pack.docx` |

## 13. Human-only demo checklist

1. Open the live site ~10 minutes early to wake Render.  
2. Optional: UptimeRobot on `/health` (5-minute interval).  
3. Four-role flow: Client books → Admin approves → Admin assigns staff → Staff updates → Finance invoices.  
4. Show Client **Notifications** after approval (Observer).  
5. Pre-recorded backup video on the laptop.  
6. Do not display the demo password on the projector.  
7. Rotate demo password after the EXPO.

## 14. Team

| Member | Role | Student no. |
| --- | --- | --- |
| Tebogo Mothapo | Project Lead / Back-End | ST10047257 |
| Michael Mei | Front-End Developer | ST10145829 |
| Tayo Rahaman Kareem | Database Engineer / DevOps | ST10134563 |
| Tebogo Nkosi | Documentation / Testing | ST10443077 |
