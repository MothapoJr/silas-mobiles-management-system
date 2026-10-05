Silas Mobiles Management System
Booking, inventory, staff and invoicing platform for Silas Mobiles (Silas Projects), a Pretoria-based mobile equipment rental and event catering business. Built by The Dev-Masters for INSY7315 (Information Systems 3E, WIL).

Full requirements, architecture rationale, and diagrams live in the Task 1 documentation — this repository is Task 2 (Code & Implementation): T08 onward on the WBS. Treat the Task 1 doc as the source of truth for why; treat this repo as the source of truth for how it's actually built, and flag it if the two ever disagree.

1. Tech stack
Layer	Technology
Front-end	React 19 + Vite + Tailwind CSS 4
Back-end	Node.js 24 + Express
ORM / DB	Sequelize + pg → PostgreSQL 15 (AWS RDS) — 16-table schema in backend/src/migrations, see docs/DATABASE_SCHEMA.md
Hosting	AWS: EC2 (ASG) + ALB, CloudFront, S3, Route 53 — see infrastructure/terraform
Auth	JWT (15-min access token, HttpOnly-cookie refresh) + RBAC by role
CI/CD	GitHub Actions → AWS CodeDeploy (backend), S3 + CloudFront invalidation (frontend)
IaC	Terraform
Patterns	Observer (notifications), Factory (InvoiceFactory)
2. Repository layout
backend/                  Express API — models, migrations, seeders, services, routes
frontend/                 React 19 + Vite + Tailwind 4 SPA (role dashboards)
infrastructure/terraform/ AWS infra as code
docs/                     DATABASE_SCHEMA.md and related notes
.github/workflows/        CI (lint/test/build) and CD (deploy)
docker-compose.yml        Local dev: Postgres + migrate + backend
CONTRIBUTING.md           Gitflow, PR process, branch protection
README.md                 This overview
3. Local development
3.1 Start the stack
# Backend + database (migrations run before the API starts)
cp backend/.env.example backend/.env
docker compose up --build

# Optional demo data
docker compose run --rm migrate npm run db:seed

# Frontend (second terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
Frontend: http://localhost:5173
Backend health: http://localhost:3000/health
Running the backend outside Docker works too — set DB_HOST=localhost in backend/.env (not postgres, which only resolves inside Compose) and run npm run db:migrate yourself first.

3.2 Demo users
Password for all accounts: Demo123!

Email	Role
admin@silasmobiles.local	administrator
client@silasmobiles.local	client
staff@silasmobiles.local	staff
finance@silasmobiles.local	finance_officer
Login body: { "emailOrUsername": "...", "password": "Demo123!" } → POST /api/auth/login

Returns accessToken + user; sets HttpOnly refresh cookie.

4. What is implemented (Task 2 / Part 2)
4.1 Infrastructure & platform
AWS stack as Terraform (infrastructure/terraform)
Monorepo scaffold, Gitflow (main + develop), CI and CD pipelines
PostgreSQL schema — 16 tables, Sequelize models, migrations, seeders
docs/DATABASE_SCHEMA.md — ERD relationships explained
4.2 Backend APIs
Auth — login, refresh (HttpOnly cookie), logout, /me; JWT + requireAuth / requireRole
Client — profile, equipment/services catalogue, quotes, bookings (cancel emits notification)
Admin — bookings list/approve/reject, equipment & services management
Staff — assignments, status updates, issue reporting, profile/availability
Notifications — Observer bus, list/mark-read, SES stub on booking status change
Finance — invoices list/get/create, record payment, summary totals (InvoiceFactory)
4.3 Front-end role dashboards
Landing page + login; ProtectedRoute by role
Client — catalogue, quotes, bookings, profile
Admin — bookings, equipment, services
Staff — assignments, issues, profile (with unit tests)
Finance — invoices (filter + record payment with paid confirmation), create invoice (standard / partial / credit), summary by payment status (with unit tests)
4.4 Design patterns in code
Observer — booking status changes → notification service (registerObservers() on boot)
Factory — InvoiceFactory creates standard, partial, and credit invoices from booking context
5. Finance module (UI + API)
Finance officer surface (merged via PR #13 into develop):

Tab	Behaviour
Invoices	List with All / Unpaid / Partial / Paid filters. Record payment panel: status chips + optional method. Marking Paid requires a second confirmation step.
Create	Booking ID, type (standard / partial / credit), amount (partial/credit only), optional payment method and due-in-days.
Summary	Counts and totalAmount by status plus overall.
API helpers live in frontend/src/services/api.js. Tests: frontend/src/pages/FinanceHome.test.jsx.

API contracts (summary):

GET /api/finance/invoices?paymentStatus= → array of invoices
POST /api/finance/invoices body: { bookingId, type?, amount?, paymentMethod?, dueInDays? }
PATCH /api/finance/invoices/:id/pay body: { paymentStatus, paymentMethod? }
GET /api/finance/reports/summary → { byStatus: { unpaid|partial|paid: { count, totalAmount } }, overall: { count, totalAmount } }
6. Cloud architecture & deployment
Cloud architecture (services, network segregation, protocols, diagrams) is a Task 1 documentation deliverable. This repository implements that design via Terraform and GitHub Actions CD.

Local development: Docker Compose (Postgres + migrate + backend)
CD: develop → staging, main → production (OIDC to AWS)
No additional cloud design work is required for Part 2 coding marks beyond what is already in infrastructure/terraform and the Task 1 pack
See infrastructure/terraform/README.md for deployment steps Terraform cannot automate (domain delegation, SES production access, alarm email confirmation).

7. Auth behaviour (quick reference)
Method	Path	Notes
POST	/api/auth/login	emailOrUsername + password → accessToken + user; sets refresh cookie
POST	/api/auth/refresh	Cookie → new accessToken
POST	/api/auth/logout	Clears refresh cookie
GET	/api/auth/me	Bearer required
Middleware:

requireAuth — attaches req.user { id, roleType, ... }
requireRole('client' | 'administrator' | 'staff' | 'finance_officer') — RBAC
Access tokens expire in ~15 minutes — re-login if you see Invalid or expired access token.

8. Testing
Backend: Jest + Supertest (CI runs against a Postgres service)
Frontend: Vitest + React Testing Library
Notable suites: StaffHome.test.jsx, FinanceHome.test.jsx (mocked API + AuthContext)
CI is path-filtered: frontend-ci / backend-ci via detect-changes
cd frontend && npm test -- --run
cd backend && npm test
9. Git workflow
Branches: main (production), develop (integration), feature/* for work
Prefer small conventional commits: feat:, fix:, test:, docs:, security:, chore:
Open PRs into develop; merge when CI is green
See CONTRIBUTING.md for branch protection and review expectations
10. Notable merged work
Item	Description
PR #13	Finance dashboard — invoices, payments, create, summary + tests
Staff UI	Assignments, issues, profile (T19)
Admin UI	Bookings approve/reject, equipment & services (T18)
Client UI	Catalogue, quotes, bookings, profile (T17)
Auth UI	Login, landing, ProtectedRoute (T16)
Finance API	InvoiceFactory, list/create/pay/summary
APIs T11–T15	Auth, Client, Admin, Staff, Notifications
T08–T10	Terraform, monorepo/CI/CD, PostgreSQL schema
11. Human-only demo checklist
These cannot be automated in the repo — complete them for the presentation:

Record the demonstration video (all four role logins + key flows)
Capture live screenshots of each dashboard
Ensure GitHub commit history is visible on the remote
Fill student name/number on the official rubric document
Rehearse explaining Observer, Factory, JWT refresh, and RBAC
12. Links
Repository: https://github.com/MothapoJr/silas-mobiles-management-system
Primary integration branch: develop
CONTRIBUTING.md — branching and PR process
docs/DATABASE_SCHEMA.md — schema and relationships
infrastructure/terraform/README.md — deploy notes